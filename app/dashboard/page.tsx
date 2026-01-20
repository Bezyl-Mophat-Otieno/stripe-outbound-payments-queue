'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogOut, User, Mail } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">S</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="gap-2 border-border hover:bg-muted bg-transparent"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Welcome Card */}
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="text-3xl">Welcome, {user.fullName}! 👋</CardTitle>
            <CardDescription>You're now logged in with JWT authentication</CardDescription>
          </CardHeader>
        </Card>

        {/* User Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Full Name
                </label>
                <p className="text-lg font-medium text-foreground">{user.fullName}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  User ID
                </label>
                <p className="text-sm font-mono text-foreground break-all">{user.id}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Email
                </label>
                <p className="text-lg font-medium text-foreground">{user.email}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Info */}
        <Card className="mt-6 border-0 shadow-md">
          <CardHeader>
            <CardTitle>Authentication Features</CardTitle>
            <CardDescription>This app includes the following JWT features</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span className="text-foreground">
                  <strong>JWT Access Tokens:</strong> Short-lived tokens (15 minutes) for secure API requests
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span className="text-foreground">
                  <strong>Token Refresh:</strong> Automatic token refresh when tokens expire
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span className="text-foreground">
                  <strong>Secure Storage:</strong> Tokens stored in localStorage with client-side interceptors
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span className="text-foreground">
                  <strong>Protected Routes:</strong> Backend API middleware validates all incoming tokens
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span className="text-foreground">
                  <strong>Drizzle ORM:</strong> Type-safe database queries with PostgreSQL
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
