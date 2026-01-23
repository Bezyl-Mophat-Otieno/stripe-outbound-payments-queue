import Stripe from 'stripe'
import { AppError } from './app-error'

export const ERROR_CODES = {
  PAYMENT_CARD_DECLINED: 'PAYMENT_CARD_DECLINED',
  PAYMENT_RATE_LIMITED: 'PAYMENT_RATE_LIMITED',
  PAYMENT_PROVIDER_DOWN: 'PAYMENT_PROVIDER_DOWN',
  PAYMENT_INVALID_REQUEST: 'PAYMENT_INVALID_REQUEST',
  PAYMENT_FAILED: 'PAYMENT_FAILED'
} as const

export function mapStripeError(error: unknown): AppError {
  if (!(error instanceof Stripe.errors.StripeError)) {
    return new AppError()
  }

  switch (error.type) {
    case 'StripeCardError':
      return new AppError()

    case 'StripeRateLimitError':
      return new AppError()

    case 'StripeAPIError':
    case 'StripeConnectionError':
      return new AppError( )

    default:
      return new AppError()
  }
}

function getCardMessage(error: Stripe.errors.StripeCardError) {
  switch (error.decline_code) {
    case 'insufficient_funds':
      return 'Your card has insufficient funds.'
    case 'expired_card':
      return 'Your card has expired.'
    default:
      return 'Your card was declined.'
  }
}
