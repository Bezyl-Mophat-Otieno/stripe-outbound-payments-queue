import { stripePaymentsQueue } from '@/db/schema/stripe-payments-queue.';
import { db } from '@/lib/db';
import { and, eq, gte } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function DELETE() {
  try {
    const now = new Date();
    const deletedDequeuedItems = await db
      .delete(stripePaymentsQueue)
      .where(and(gte(stripePaymentsQueue.ttl, now), eq(stripePaymentsQueue.status, 'dequeued')))
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully cleaned up dequeued items.',
        data: { deletedDequeuedItems },
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong while Dequeueing the payment' },
      { status: 500 }
    );
  }
}
