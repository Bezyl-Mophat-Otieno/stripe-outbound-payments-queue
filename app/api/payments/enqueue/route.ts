import { enqueueSchema, stripePaymentsQueue } from '@/db/schema/stripe-payments-queue.';
import { db } from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
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

    const body = await request.json();
    const validatedPayload = enqueueSchema.parse(body);

    const [enqueued] = await db
      .insert(stripePaymentsQueue)
      .values({ metadata: validatedPayload })
      .returning();
    if (!enqueued)
      return NextResponse.json(
        { success: false, message: 'Failed to enqueue the payment' },
        { status: 400 }
      );

    return NextResponse.json(
      {
        success: true,
        message: 'Payment successfully Queued for processing.',
        data: { queueId: enqueued.queueId },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Enqueueing error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong while enqueueing the payment' },
      { status: 500 }
    );
  }
}
