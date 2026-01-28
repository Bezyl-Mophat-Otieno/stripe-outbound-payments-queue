import { env } from '@/env';
import { stripeService } from '@/lib/services/stripe-service-v2';
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

    console.log(validatedStripeEvent.created);

    switch (validatedStripeEvent.type) {
      case 'v2.money_management.outbound_payment.created':
        console.log(`Payment to shopper created successfully at ${validatedStripeEvent.created}`);
        break;
      case 'v2.money_management.outbound_transfer.canceled':
        console.log(`Payment to shopper has been canceled at ${validatedStripeEvent.created}`);

        break;
      case 'v2.money_management.outbound_transfer.failed':
        console.log(`Payment to shopper has failed at ${validatedStripeEvent.created}`);

        break;
      case 'v2.money_management.outbound_payment.posted':
        console.log(`Payment to shopper has been posted at ${validatedStripeEvent.created}`);
        break;
    }

    return NextResponse.json(
      { success: true, message: 'Event Recieved Successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ status: 200 });
  }
}
