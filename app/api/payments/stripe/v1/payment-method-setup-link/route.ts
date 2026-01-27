import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { stripeService } from '@/lib/services/stripe-service-v1';
import { verifyAccessToken } from '@/lib/jwt';

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

    const userId = jwtPayload.userId;
    // Get user from database
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.stripeAccountId) {
      return NextResponse.json(
        { success: true, message: 'Stripe account not found' },
        { status: 404 }
      );
    }
    // Generate account link for payment method setup (account_update type)
    const paymentMethodLink = await stripeService.createAccountLink(user.stripeAccountId, 'update');

    return NextResponse.json({
      success: true,
      message: 'Successfully generated a payment method setup link',
      data: { paymentMethodLink },
    });
  } catch (error) {
    console.error('[Stripe] Payment method setup link error:', error);
    return NextResponse.json(
      { success: true, message: 'Failed to generate payment method setup link' },
      { status: 500 }
    );
  }
}
