import { verifyAccessToken } from '@/lib/jwt';
import { stripeService } from '@/lib/services/stripe-service';
import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';
const AccountLinkSetupSchema = z.object({
  stripeAccountId: z.string().min(1, 'stripeAccountId is required'),
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
    const validatedBody = AccountLinkSetupSchema.parse(body);

    const accountLink = await stripeService.createOnboardingLink(validatedBody.stripeAccountId);

    if (!accountLink || !z.url().safeParse(accountLink).success)
      NextResponse.json(
        { success: false, message: 'Failed to create a stripe account link' },
        { status: 404 }
      );

    return NextResponse.json(
      { success: true, message: 'Stripe Account Link Created Successfully', data: { accountLink } },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Stripe] Account link error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate account link' },
      { status: 500 }
    );
  }
}
