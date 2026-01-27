import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/services/stripe-service-v2';
import { z } from 'zod';
import { verifyAccessToken } from '@/lib/jwt';

const FinancialAccountSetupSchema = z.object({
  storage: z.object({
    holds_currencies: z.array(z.string()),
  }),
  display_name: z.string().min(1, 'Display name is required'),
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
    const validatedRequestBody = FinancialAccountSetupSchema.parse(body);

    const account = await stripeService.createFinancialAccount({
      ...validatedRequestBody,
      type: 'storage',
    });

    if (!account.id) {
      throw new Error('Failed to create a financial account');
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Stripe Financial Account Created Successfully',
        data: { stripeAccountId: account.id },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Stripe] Account setup error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to setup Stripe account' },
      { status: 500 }
    );
  }
}
