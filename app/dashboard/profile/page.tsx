'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { ApiResponse } from '@/types';

interface PaymentStatus {
  paymentMethodSetup: boolean;
  setupStatus: {
    isComplete: boolean;
    charges_enabled: boolean;
    payouts_enabled: boolean;
    requirements: {
      currently_due: string[];
      eventually_due: string[];
      past_due: string[];
      pending_verification: string[];
    };
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, isStripeOnboarded } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Fetch payment status
  useEffect(() => {
    async function fetchPaymentStatus() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/payments/stripe/check-payment-status/${user?.stripeAccountId}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch payment status');
        }

        const data = await response.json();
        setPaymentStatus(data);
      } catch (err) {
        console.error('[v0] Error fetching payment status:', err);
        setError(err instanceof Error ? err.message : 'Failed to load payment status');
      } finally {
        setLoading(false);
      }
    }
    if (isStripeOnboarded) {
      fetchPaymentStatus();
    }
  }, [isStripeOnboarded, user?.stripeAccountId]);

  async function handleUpdateStripeAccount() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/payments/stripe/account-update-link', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate update link');
      }

      const accountUpdateResponse = (await response.json()) as ApiResponse;
      if (!accountUpdateResponse.success) {
        setError(accountUpdateResponse.message);
      }
      globalThis.location.href = accountUpdateResponse.data.updateLink as string;
    } catch (err) {
      console.error('[v0] Error updating account:', err);
      setError(err instanceof Error ? err.message : 'Failed to update account');
    }
  }

  async function handleSetupPaymentMethod() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/payments/stripe/payment-method-setup-link', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate payment method link');
      }

      const paymentMethodSetupResponse = (await response.json()) as ApiResponse;
      if (!paymentMethodSetupResponse.success) {
        setError(paymentMethodSetupResponse.message);
      }
      globalThis.location.href = paymentMethodSetupResponse.data.paymentMethodLink as string;
    } catch (err) {
      console.error('[v0] Error setting up payment method:', err);
      setError(err instanceof Error ? err.message : 'Failed to setup payment method');
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 sm:p-8">
          <div className="max-w-4xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Profile</h1>
              <p className="text-muted-foreground">Manage your account and Stripe settings</p>
            </div>

            {/* Error Message */}
            {error && (
              <Card className="mb-6 border-destructive/50 bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Personal Information */}
            <Card className="mb-6 border-0 shadow-md">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Full Name</label>
                  <p className="text-lg text-foreground mt-1">{user.fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Email</label>
                  <p className="text-lg text-foreground mt-1">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">User ID</label>
                  <p className="text-sm text-foreground mt-1 font-mono break-all">{user.id}</p>
                </div>
              </CardContent>
            </Card>

            {/* Stripe Account Information */}
            {user.stripeAccountId && (
              <Card className="mb-6 border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Stripe Account</CardTitle>
                    <CardDescription>Manage your connected Stripe account</CardDescription>
                  </div>
                  <Button onClick={handleUpdateStripeAccount} className="gap-2" size="sm">
                    <ArrowUpRight className="w-4 h-4" />
                    Update Details
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">
                      Account ID
                    </label>
                    <p className="text-sm text-foreground mt-1 font-mono break-all">
                      {user.stripeAccountId}
                    </p>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center space-y-2">
                        <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
                        <p className="text-sm text-muted-foreground">Loading payment status...</p>
                      </div>
                    </div>
                  ) : paymentStatus ? (
                    <>
                      {/* Setup Status */}
                      <div className="pt-4 space-y-3">
                        <label className="text-sm font-semibold text-muted-foreground">
                          Setup Status
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
                            {paymentStatus.setupStatus.charges_enabled ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                            )}
                            <div className="text-sm">
                              <p className="font-medium text-foreground">Charges Enabled</p>
                              {paymentStatus.setupStatus.charges_enabled && (
                                <p className="text-xs text-muted-foreground">Ready</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
                            {paymentStatus.setupStatus.payouts_enabled ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                            )}
                            <div className="text-sm">
                              <p className="font-medium text-foreground">Payouts Enabled</p>
                              {paymentStatus.setupStatus.payouts_enabled && (
                                <p className="text-xs text-muted-foreground">Ready</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Required Documents */}
                      {paymentStatus.setupStatus.requirements.currently_due.length > 0 && (
                        <div className="pt-4">
                          <label className="text-sm font-semibold text-muted-foreground">
                            Items Due
                          </label>
                          <ul className="mt-2 space-y-2">
                            {paymentStatus.setupStatus.requirements.currently_due.map((item) => (
                              <li
                                key={item}
                                className="text-sm text-foreground flex items-center gap-2"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Payment Method Setup */}
                      {!paymentStatus.paymentMethodSetup && (
                        <div className="pt-4">
                          <Button
                            onClick={handleSetupPaymentMethod}
                            variant="outline"
                            className="w-full bg-transparent"
                          >
                            Setup Payment Method
                          </Button>
                        </div>
                      )}
                    </>
                  ) : null}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
