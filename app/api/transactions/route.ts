import { NewTransaction, transactions } from '@/db/schema/transactions';
import { users } from '@/db/schema/users';
import { db } from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';

const transactionCreateSchema = z.object({
  email: z.email(),
  amount: z.number(),
  currency: z.enum(['usd', 'kes']),
});

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
    const validatedPayload = transactionCreateSchema.parse(body);
    const [user] = await db.select().from(users).where(eq(users.email, validatedPayload.email));
    if (!user?.stripeAccountId)
      return NextResponse.json(
        { success: false, message: 'User not found or user lacks a stripeAccountId' },
        { status: 404 }
      );

    const newTransaction: NewTransaction = {
      userId: user.id,
      amount: validatedPayload.amount,
      currency: validatedPayload.currency,
    };

    const [transaction] = await db.insert(transactions).values(newTransaction).returning();

    if (!transaction)
      return NextResponse.json(
        { success: false, message: 'Failed to create a transaction' },
        { status: 400 }
      );

    return NextResponse.json(
      {
        success: true,
        message: 'Transaction created successfully',
        data: { transaction },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error('Transaction creation error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
