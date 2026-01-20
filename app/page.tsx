'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Lock, RefreshCw, Shield, Zap } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-lg text-foreground">Secure Auth</span>
          </div>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-foreground hover:bg-muted">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground text-balance">
            Secure authentication made simple
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            JWT-based authentication with automatic token refresh, Drizzle ORM, and modern React patterns.
            Built with Next.js and shadcn/ui.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                Create account <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-border hover:bg-muted bg-transparent">
                Sign in
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <Lock className="w-8 h-8 text-primary mb-2" />
              <CardTitle className="text-lg">JWT Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Secure, stateless authentication with access and refresh tokens
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <RefreshCw className="w-8 h-8 text-primary mb-2" />
              <CardTitle className="text-lg">Auto Refresh</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Automatic token refresh when access tokens expire
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="w-8 h-8 text-primary mb-2" />
              <CardTitle className="text-lg">Type Safe</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Drizzle ORM with TypeScript for database queries
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <Zap className="w-8 h-8 text-primary mb-2" />
              <CardTitle className="text-lg">Modern Stack</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Next.js 16, React 19, and shadcn/ui components
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tech Stack */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-secondary/20">
          <CardHeader>
            <CardTitle>Tech Stack</CardTitle>
            <CardDescription>Built with modern technologies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[
                'Next.js 16',
                'React 19',
                'TypeScript',
                'JWT',
                'Drizzle ORM',
                'Vercel Postgres',
                'bcryptjs',
                'shadcn/ui',
              ].map((tech) => (
                <div
                  key={tech}
                  className="px-4 py-2 rounded-lg bg-background border border-border text-center font-medium text-sm text-foreground"
                >
                  {tech}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-muted-foreground text-sm">
          <p>Built with v0.app | JWT Authentication Demo</p>
        </div>
      </footer>
    </div>
  )
}
