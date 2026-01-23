'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { StripeSetupModal } from '@/components/stripe-setup-modal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, isStripeOnboarded } = useAuth();
  const [showStripeModal, setShowStripeModal] = useState(!isStripeOnboarded);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

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
          <div className="max-w-6xl">
            {/* Welcome Card */}
            <Card className="mb-6 border-0 shadow-lg bg-linear-to-br from-primary/5 to-accent/5">
              <CardHeader>
                <CardTitle className="text-3xl">Welcome, {user.fullName}!</CardTitle>
                <CardDescription>
                  You&apos;re logged in with secure JWT authentication
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Quick Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Account Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Full Name
                    </label>
                    <p className="text-foreground">{user.fullName}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Email
                    </label>
                    <p className="text-foreground">{user.email}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Stripe Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {user.stripeAccountId ? (
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Account Active
                      </label>
                      <p className="text-green-600 font-medium">Connected</p>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Status
                      </label>
                      <p className="text-amber-600 font-medium">Pending Setup</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Stripe Setup Modal */}
      <StripeSetupModal isOpen={showStripeModal} onOpenChange={setShowStripeModal} />
    </div>
  );
}
