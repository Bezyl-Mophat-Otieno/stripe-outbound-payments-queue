import 'server-only'

import Stripe from 'stripe'
import { env } from '@/env'

export type StripeAccountSetupParams = Stripe.V2.Core.AccountCreateParams

export type StripeAccountLinkParams = Stripe.V2.Core.AccountLinkCreateParams

export type Account = Stripe.V2.Core.Account

export type AccountLink = Stripe.V2.Core.AccountLink

type DefaultOutboundDestination = {
  id: string
  type: string
}


class StripeService {
  private readonly client: Stripe

  constructor() {
    const apiKey = env.STRIPE_SECRET_KEY
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set')
    }
    this.client = new Stripe(apiKey, {
      // @ts-ignore
      apiVersion: '2024-07-16.preview-v2',
    })
  }

  /**
   * Helper method to build refresh and return URLs
   */
  private buildUrls(
    baseUrl: string,
    accountId: string
  ): { refreshUrl: string; returnUrl: string } {
    const refreshUrl = `${baseUrl}/api/stripe/account/setup?account_id=${accountId}`
    const returnUrl = `${baseUrl}/stripe/account/success?account_id=${accountId}`

    return {
      refreshUrl,
      returnUrl,
    }
  }

  /**
   * Create a new Stripe connected account for a user
   */
  async setupAccount(
    params: StripeAccountSetupParams
  ): Promise<Account> {
    try {
      const account = await this.client.v2.core.accounts.create(params)
      return account
    } catch (error) {
      console.error('[Stripe] Error setting up account:', error)
      throw error
    }
  }

  /**
   * Generate an account link for onboarding or updating account details
   */
  async generateAccountLink(
    params: StripeAccountLinkParams
  ): Promise<AccountLink> {
    try {
      const accountLink = await this.client.v2.core.accountLinks.create(params)

      return accountLink
    } catch (error) {
      console.error('[Stripe] Error generating account link:', error)
      throw error
    }
  }

  /**
   * Create onboarding link with automatic URL building
   */
  async createOnboardingLink(
    accountId: string,
    baseUrl: string
  ): Promise<string> {
    try {
      const { refreshUrl, returnUrl } = this.buildUrls(baseUrl, accountId)

      const accountLink = await this.generateAccountLink({
        account: accountId,
        use_case: {
            type: 'account_onboarding',
            account_onboarding: {
                refresh_url: refreshUrl,
                return_url: returnUrl,
                configurations: ['recipient']
            }
        }
      })

      return accountLink.url
    } catch (error) {
      console.error('[Stripe] Error creating onboarding link:', error)
      throw error
    }
  }

  /**
   * Create account update link with automatic URL building
   */
  async createUpdateLink(
    accountId: string,
    baseUrl: string
  ): Promise<string> {
    try {
      const { refreshUrl, returnUrl } = this.buildUrls(baseUrl, accountId)

      const accountLink = await this.generateAccountLink({
        account: accountId,
        use_case: {
            type: 'account_update',
            account_update: {
                refresh_url: refreshUrl,
                return_url: returnUrl,
                configurations: ['recipient']
            }
        }
       })

      return accountLink.url
    } catch (error) {
      console.error('[Stripe] Error creating update link:', error)
      throw error
    }
  }

  /**
   * Verify if an account setup is complete including payment setup.
   */
  async verifyPaymentSetup(accountId: string): Promise<boolean> {
    try {
    const headers = {
    headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/json",
        "Stripe-Version": env.STRIPE_API_VERSION,
    },
    };
      const response = await fetch(
        `https://api.stripe.com/v2/accounts/${accountId}`,headers,
      );

      const data = await response.json() as Account & {
          configuration?: {
            recipient?: {
            default_outbound_destination?: DefaultOutboundDestination
            }
          }
      }

      const hasPaymentSetup = !!(data.configuration?.recipient?.default_outbound_destination &&  
                              typeof data.configuration?.recipient?.default_outbound_destination  == 'object')

      return hasPaymentSetup

    } catch (error) {
      console.error('[Stripe] Error verifying account setup:', error)
      throw error
    }
  }

  /**
   * Get account details
   */
  async getAccountDetails(accountId: string): Promise<Account> {
    try {
      const account = await this.client.v2.core.accounts.retrieve(accountId)
      return account
    } catch (error) {
      console.error('[Stripe] Error retrieving account details:', error)
      throw error
    }
  }


  /**
   * Delete a connected account
   */
  async deleteAccount(accountId: string): Promise<void> {
    try {
      await this.client.v2.core.accounts.close(accountId, {applied_configurations: ['recipient']})
    } catch (error) {
      console.error('[Stripe] Error deleting account:', error)
      throw error
    }
  }

  /**
   * Get the Stripe client instance for advanced operations
   */
  getClient(): Stripe {
    return this.client
  }
}

// Export a singleton instance
export const stripeService = new StripeService()
