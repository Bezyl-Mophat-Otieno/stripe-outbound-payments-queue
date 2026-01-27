import { verifyAccessToken } from '@/lib/jwt';
import { stripeService } from '@/lib/services/stripe-service-v2';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stripeAccountId: string }> }
) {
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
    const { stripeAccountId } = await params;

    if (!stripeAccountId) {
      return NextResponse.json({ error: 'stripeAccountId is required' }, { status: 400 });
    }
    const hasPaymentSetup = await stripeService.verifyPaymentSetup(stripeAccountId);
    if (!hasPaymentSetup)
      return NextResponse.json(
        { success: false, message: 'User is yet to setup his/her payment details' },
        { status: 404 }
      );

    return NextResponse.json(
      {
        success: true,
        message: 'User payment details have been sucessfully setup',
        data: { hasPaymentSetup },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Stripe] Check payment status error:', error);
    return NextResponse.json({ error: 'Failed to check payment status' }, { status: 500 });
  }
}
