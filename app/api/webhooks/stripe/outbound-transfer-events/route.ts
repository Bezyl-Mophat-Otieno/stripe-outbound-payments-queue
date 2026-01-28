import { transactions, TransactionStatus } from '@/db/schema/transactions';
import { env } from '@/env';
import { db } from '@/lib/db';
import { stripeService } from '@/lib/services/stripe-service-v2';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const header = request.headers.get('stripe-signature');
    const rawBody = await request.text();
    const secret = env.STRIPE_WEBHOOK_SECRET;
    if (!header || !rawBody) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }
    const params = {
      header,
      payload: rawBody,
      secret,
    };

    let validatedStripeEvent;

    try {
      validatedStripeEvent = await stripeService.verifyStripeEvent(params);
    } catch (error) {
      console.error('Webhook error:', error);
      return NextResponse.json({ success: false, message: 'Bad request' }, { status: 400 });
    }

    const outboundTransfer = await stripeService.parsedOutboundPayment(
      validatedStripeEvent?.related_object?.id
    );
    let outboundPaymentStatus: TransactionStatus;

    switch (validatedStripeEvent.type) {
      case 'v2.money_management.outbound_transfer.canceled':
        outboundPaymentStatus = 'canceled';
        break;
      case 'v2.money_management.outbound_transfer.failed':
        outboundPaymentStatus = 'failed';
        break;
      case 'v2.money_management.outbound_payment.posted':
        outboundPaymentStatus = 'posted';
        break;
      case 'v2.money_management.outbound_payment.returned':
        outboundPaymentStatus = 'returned';
        break;
      default:
        outboundPaymentStatus = 'created';
    }
    await db
      .update(transactions)
      .set({ status: outboundPaymentStatus })
      .where(eq(transactions.id, outboundTransfer.metadata.transactionId));

    return NextResponse.json(
      { success: true, message: 'Stripe Outbound Event Recieved Successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ status: 200 });
  }
}
