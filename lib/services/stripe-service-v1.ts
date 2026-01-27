import Stripe from 'stripe';
import { env } from '@/env';

export interface StripeAccountSetupParams {
  email: string;
  country: 'US';
  business_type: 'individual' | 'company';
}

class StripeService {
  private readonly stripe: Stripe;

  constructor() {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }

    this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    });
  }

  /**
   * Create a Stripe Connected Account
   */
  async createConnectedAccount(params: StripeAccountSetupParams): Promise<Stripe.Account> {
    return await this.stripe.accounts.create({
      type: 'express',
      email: params.email,
      country: params.country,
      business_type: params.business_type,
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
    });
  }

  /**
   * Create onboarding / update link
   */
  async createAccountLink(accountId: string, type: 'onboarding' | 'update') {
    return await this.stripe.accountLinks.create({
      account: accountId,
      type: type === 'onboarding' ? 'account_onboarding' : 'account_update',
      refresh_url: `${env.BASE_URL}/dashboard?expired=true`,
      return_url: `${env.BASE_URL}/dashboard?success=true`,
    });
  }

  /**
   * Check if account is payout-ready
   */
  async isAccountReady(accountId: string): Promise<boolean> {
    const account = await this.stripe.accounts.retrieve(accountId);

    return account.payouts_enabled === true && account.charges_enabled === true;
  }

  /**
   * Transfer funds from platform to connected account
   */
  async transferToAccount(params: {
    amount: number;
    currency: string;
    destinationAccountId: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Transfer> {
    return await this.stripe.transfers.create({
      amount: params.amount,
      currency: params.currency,
      destination: params.destinationAccountId,
      description: params.description,
      metadata: params.metadata,
    });
  }

  /**
   * Payout funds from connected account to bank
   */
  async payoutToBank(params: {
    amount: number;
    currency: string;
    connectedAccountId: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Payout> {
    return await this.stripe.payouts.create(
      {
        amount: params.amount,
        currency: params.currency,
        metadata: params.metadata,
      },
      {
        stripeAccount: params.connectedAccountId,
      }
    );
  }
  /**
   *
   * Transfer → Payout
   */
  async payUser(params: {
    amount: number;
    currency: string;
    connectedAccountId: string;
    description?: string;
  }) {
    await this.transferToAccount({
      amount: params.amount,
      currency: params.currency,
      destinationAccountId: params.connectedAccountId,
      description: params.description,
    });

    return await this.payoutToBank({
      amount: params.amount,
      currency: params.currency,
      connectedAccountId: params.connectedAccountId,
    });
  }
}

export const stripeService = new StripeService();
