import { stripePaymentsQueue } from '@/db/schema/stripe-payments-queue.';
import { db } from '@/lib/db';
import { and, eq, gte } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function DELETE() {
  try {

    const now = new Date()
    await db.delete(stripePaymentsQueue).where(and(gte(stripePaymentsQueue.ttl, now), eq(stripePaymentsQueue.status, 'dequeued'))).returning()

    return NextResponse.json(
      { success: true, message: 'Successfully processed payments cleaned up successfully' },
      { status: 204 }
    );
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { success: false, message: 'Something went wrong while Dequeueing the payment' },
      { status: 500 }
    );
  }
}
