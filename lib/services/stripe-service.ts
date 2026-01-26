import 'server-only';

import Stripe from 'stripe';
import { env } from '@/env';

export interface StripeAccountSetupParams {
  name: string;
  email: string;
  legal_entity_data: {
    business_type: 'individual' | 'business' | 'company';
    country: string;
  };
  configuration: {
    recipient_data: {
      features: {
        bank_accounts: {
          local: {
            requested: boolean;
          };
        };
      };
    };
  };
}

export interface StripeFinancialAccountParams {
  type: 'storage';
  storage: {
    holds_currencies: string[];
  };
  display_name: string;
}

export interface StripeFinancialAccount {
  id: string;
  object: string;
  balance: {
    available: {
      usd: {
        value: number;
        currency: string;
      };
    };
    inbound_pending: {
      usd: {
        value: number;
        currency: string;
      };
    };
    outbound_pending: {
      usd: {
        value: number;
        currency: string;
      };
    };
  };
  country: string;
  created: string;
  display_name: string;
  livemode: boolean;
  metadata: null;
  status: 'pending' | 'closed' | 'open';
  storage: {
    holds_currencies: string[];
  };
  type: string;
}

export interface StripeOutboundPaymentParams {
  from: {
    financial_account: string;
    currency: 'usd';
  };
  to: {
    recipient: string;
    currency: 'usd';
  };
  delivery_options: {
    bank_account: 'automatic' | 'local' | 'wire';
  };
  amount: {
    value: number;
    currency: 'usd';
  };
  recipient_notification: {
    setting: 'none' | 'configured';
  };
  description: string;
  metadata: Record<string, any>;
}

export interface StripeOutboundPayment {
  id: string;
  object: string;
  from: {
    financial_account: string;
    debited: {
      value: number;
      currency: 'usd';
    };
  };
  to: {
    credited: {
      value: number;
      currency: 'usd';
    };
    recipient: string;
    payout_method: string;
  };
  delivery_options: {
    bank_account: 'automatic' | 'local' | 'wire';
  };
  amount: {
    value: number;
    currency: 'usd';
  };
  statement_descriptor: string;
  cancelable: boolean;
  description: string;
  status: string;
  status_transitions: {};
  receipt_url: string;
  created: string;
  expected_arrival_date: string;
  recipient_notification: {
    setting: 'none' | 'configured';
  };
  livemode: boolean;
}

export type StripeAccountLinkParams = Stripe.V2.Core.AccountLinkCreateParams;

export interface Account {
  id: string;
  object: string;
  applied_configurations: string[];
  configuration?: Record<string, any>;
  created: string;
  legal_entity_data: Record<string, any>;
  email: string;
  metadata?: Record<string, any>;
  name: string;
  requirements: Record<string, any>;
  livemode: boolean;
}

export interface AccountLink {
  object: string;
  account: string;
  created: string;
  expires_at: string;
  url: string;
  use_case: {
    account_onboarding: {
      configurations: Record<string, any>[];
      refresh_url: string;
      return_url: string;
    };
    type: 'account_onboarding' | 'account_update';
  };
  livemode: boolean;
}

type DefaultOutboundDestination = {
  id: string;
  type: string;
};

class StripeService {
  private readonly client: Stripe;

  constructor() {
    const apiKey = env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    this.client = new Stripe(apiKey, {
      // @ts-ignore
      apiVersion: '2024-07-16.preview-v2',
    });
  }

  private readonly stripeHeaders = {
    Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
    'Content-Type': 'application/json',
    'Stripe-Version': env.STRIPE_API_VERSION,
  };

  /**
   * Create a new Stripe connected account for a user
   */
  async setupAccount(params: StripeAccountSetupParams): Promise<Account> {
    try {
      const data = await fetch(`${env.STRIPE_BASE_URL}/accounts`, {
        method: 'POST',
        headers: this.stripeHeaders,
        body: JSON.stringify(params),
      });
      const jsonResponse = await data.json();
      return jsonResponse;
    } catch (error) {
      console.error('[Stripe] Error setting up account:', error);
      throw error;
    }
  }

  /**
   * Generate an account link for onboarding or updating account details
   */
  async generateAccountLink(params: StripeAccountLinkParams): Promise<AccountLink> {
    try {
      const data = await fetch(`${env.STRIPE_BASE_URL}/account_links`, {
        method: 'POST',
        body: JSON.stringify(params),
        headers: this.stripeHeaders,
      });
      const jsonResponse = await data.json();
      return jsonResponse;
    } catch (error) {
      console.error('[Stripe] Error generating account link:', error);
      throw error;
    }
  }

  /**
   * Create onboarding link with automatic URL building
   */
  async createOnboardingLink(accountId: string): Promise<string> {
    try {
      const refreshUrl = `${env.BASE_URL}/dashboard?expired=true`;
      const returnUrl = `${env.BASE_URL}/dashboard?success=true`;
      const accountLink = await this.generateAccountLink({
        account: accountId,
        use_case: {
          type: 'account_onboarding',
          account_onboarding: {
            refresh_url: refreshUrl,
            return_url: returnUrl,
            configurations: ['recipient'],
          },
        },
      });

      return accountLink.url;
    } catch (error) {
      console.error('[Stripe] Error creating onboarding link:', error);
      throw error;
    }
  }

  /**
   * Create account update link with automatic URL building
   */
  async createUpdateLink(accountId: string): Promise<string> {
    try {
      const refreshUrl = `${env.BASE_URL}/dashboard/profile?expired=true`;
      const returnUrl = `${env.BASE_URL}/dashboard/profile?success=true`;

      const accountLink = await this.generateAccountLink({
        account: accountId,
        use_case: {
          type: 'account_update',
          account_update: {
            refresh_url: refreshUrl,
            return_url: returnUrl,
            configurations: ['recipient'],
          },
        },
      });

      return accountLink.url;
    } catch (error) {
      console.error('[Stripe] Error creating update link:', error);
      throw error;
    }
  }

  /**
   * Verify if an account setup is complete including payment setup.
   */
  async verifyPaymentSetup(accountId: string): Promise<boolean> {
    try {
      const params = {
        include: 'configuration.recipient_data',
      };
      const url = new URL(`${env.STRIPE_BASE_URL}/accounts/${accountId}`);
      const searchParams = new URLSearchParams(params);
      url.search = searchParams.toString();
      const response = await fetch(url, { method: 'GET', headers: this.stripeHeaders });

      const data = (await response.json()) as Account & {
        configuration?: {
          recipient_data?: {
            default_outbound_destination?: DefaultOutboundDestination;
          };
        };
      };
      return !!data.configuration?.recipient_data?.default_outbound_destination?.id;
    } catch (error) {
      console.error('[Stripe] Error verifying account setup:', error);
      throw error;
    }
  }

  /**
   * Create a financial account
   */
  async createFinancialAccount(
    params: StripeFinancialAccountParams
  ): Promise<StripeFinancialAccount> {
    try {
      const data = await fetch(`${env.STRIPE_BASE_URL}/money_management/financial_accounts`, {
        method: 'POST',
        body: JSON.stringify(params),
        headers: this.stripeHeaders,
      });
      const jsonResponse = await data.json();
      return jsonResponse;
    } catch (error) {
      console.error('[Stripe] Error creating a financial account', error);
      throw error;
    }
  }

  /**
   * Make an outbound payment
   */
  async makePayment(
    params: StripeOutboundPaymentParams,
    key: string
  ): Promise<StripeOutboundPayment> {
    try {
      const data = await fetch(`${env.STRIPE_BASE_URL}/money_management/outbound_payments`, {
        method: 'POST',
        body: JSON.stringify(params),
        headers: { ...this.stripeHeaders, 'Idempotency-Key': key },
      });
      const jsonResponse = await data.json();
      return jsonResponse;
    } catch (error) {
      console.error('[Stripe] Error Making an outbound payment', error);
      throw error;
    }
  }

  /**
   * Get account details
   */
  async getAccountDetails(accountId: string): Promise<Account> {
    try {
      const data = await fetch(`${env.STRIPE_BASE_URL}/account/${accountId}`, {
        headers: this.stripeHeaders,
      });
      const jsonResponse = await data.json();
      return jsonResponse;
    } catch (error) {
      console.error('[Stripe] Error retrieving account details:', error);
      throw error;
    }
  }

  /**
   * Delete a connected account
   */
  async deleteAccount(accountId: string): Promise<void> {
    try {
      await this.client.v2.core.accounts.close(accountId, {
        applied_configurations: ['recipient'],
      });
    } catch (error) {
      console.error('[Stripe] Error deleting account:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const stripeService = new StripeService();
