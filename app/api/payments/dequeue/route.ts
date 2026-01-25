import { EnqueuedStripeItem, stripePaymentsQueue } from '@/db/schema/stripe-payments-queue.';
import { env } from '@/env';
import { db } from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { StripeOutboundPaymentParams, stripeService } from '@/lib/services/stripe-service';
import { and, eq, inArray, ne, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    // Decode JWT to get user ID
    const jwtPayload = verifyAccessToken(token);
    if (!jwtPayload)
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const claimedWork = await db.transaction(async (tx) => {
    const result = await tx.execute(sql`
      SELECT *
      FROM ${stripePaymentsQueue}
      WHERE queue_status = 'enqueued'
        AND retries < 3
      ORDER BY created_at
      LIMIT ${env.STRIPE_BATCH_SIZE}
      FOR UPDATE SKIP LOCKED
    `);

    const rows = result.rows as unknown as EnqueuedStripeItem[];

    if (rows.length === 0) return [];

    const ids = rows.map(r => r.queueId);

    await tx
      .update(stripePaymentsQueue)
      .set({
        status: 'processing',
        updatedAt: new Date(),
      })
      .where(inArray(stripePaymentsQueue.queueId, ids));

    return rows;
  });

  console.log('claiming work from stripe queue', claimedWork);


    const sentToStripe = await Promise.all(claimedWork.map((item) => sendPayment(item)));
    const stats = sentToStripe.reduce(
      (acc, item) => {
        if (item.success) {
          acc.successes++;
        } else {
          acc.failures++;
        }
        return acc;
      },
      { successes: 0, failures: 0 }
    );
    return NextResponse.json({
      success: true,
      message: `${stats.successes} Payments sent to stripe for processing.${stats.failures} Payments failed to be sent out to stripe for processing`,
    });
  } catch (error) {
    console.error('Dnqueueing error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong while Dequeueing the payment' },
      { status: 500 }
    );
  }
}

const sendPayment = async (
  item: EnqueuedStripeItem
): Promise<{ success: boolean; queueId: string; message?: string }> => {
  const maxRetries = Number(env.MAX_TRANSIENT_ERROR_RETRIES);
  let attempt = 0;
  let errorMsg = '';
  while (attempt <= maxRetries) {
    try {
      const payload: StripeOutboundPaymentParams = {
        from: {
          financial_account: item.metadata.from,
          currency: 'usd',
        },
        to: {
          recipient: item.metadata.to,
          currency: 'usd',
        },
        delivery_options: {
          bank_account: 'automatic',
        },
        amount: {
          value: item.metadata.amount,
          currency: 'usd',
        },
        recipient_notification: {
          setting: 'none',
        },
        description: 'string',
        metadata: {},
      };


      const outboundPayment = await stripeService.makePayment(payload, item.queueId);
  
      if (!outboundPayment.id) {
        throw new Error('Failed to create an outbound payment');
      }
      const now = new Date();
      const ttl = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      await db
        .update(stripePaymentsQueue)
        .set({ updatedAt: now, ttl, stripeOutboundId: outboundPayment.id, status: 'dequeued' })
        .where(eq(stripePaymentsQueue.queueId, item.queueId));
      return { success: Boolean(outboundPayment.id), queueId: item.queueId };
    } catch (error) {
      console.log(error)
      attempt++;
      errorMsg =
        (error as Error).message ?? 'Something went wrong while processing stripe outbound payment';

      await db
        .update(stripePaymentsQueue)
        .set({
          retries: attempt,
          lastFailureMessage: errorMsg,
          status: attempt >= maxRetries ? 'failed' : 'processing',
        })
        .where(eq(stripePaymentsQueue.queueId, item.queueId));
    }
  }

  return { success: false, queueId: item.queueId, message: errorMsg };
};
