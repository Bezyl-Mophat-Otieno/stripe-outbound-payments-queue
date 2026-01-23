'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { ApiResponse } from '@/types'

type StripeSetupState = 'initializing' | 'creating_account' | 'account_created' | 'error' | 'redirecting'

export function StripeSetupModal({ isOpen, onOpenChange }: { readonly isOpen: boolean; readonly onOpenChange: (open: boolean) => void }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, updateLoggedInUser } = useAuth()
    const [state, setState] = useState<StripeSetupState>('initializing')
    const [error, setError] = useState<string>('')
    const [countdown, setCountdown] = useState(5)

    // Handle redirect from Stripe
    useEffect(() => {
        const success = searchParams.get('success')
        const expired = searchParams.get('expired')

        if (success === 'true') {
            setState('account_created')
            const timer = setTimeout(async () => {
                onOpenChange(false)
                router.push('/dashboard')
            }, 2000)
            return () => clearTimeout(timer)
        }

        if (expired === 'true') {
            setState('error')
            setError('Your Stripe session expired. Please retry.')
        }
    }, [searchParams, onOpenChange, router])

    // Create Stripe account on modal open
    useEffect(() => {
        if (!isOpen || !user || state !== 'initializing') return

        const createAccount = async () => {
            try {
                setState('creating_account')
                const token = localStorage.getItem('accessToken')

                const setupResponse = await fetch('/api/payments/stripe/account-setup', {
                    method: 'POST',
                    body: JSON.stringify({ fullName: user.fullName, email: user.email }),
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                const accountCreation = await setupResponse.json() as ApiResponse

                if (!accountCreation.success) {
                    setError(accountCreation.message)
                }
                const stripeAccountId = accountCreation.data.stripeAccountId as string
                updateLoggedInUser({ ...user, stripeAccountId: stripeAccountId })
                // Generate account link
                const linkResponse = await fetch('/api/payments/stripe/account-link', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        stripeAccountId: stripeAccountId,
                    }),
                })

                if (!linkResponse.ok) {
                    throw new Error('Failed to generate account link')
                }

                const accountLinkCreation = await linkResponse.json() as ApiResponse

                if (!accountLinkCreation.success) {
                    setError(accountLinkCreation.message)
                }
                const accountLink = accountLinkCreation.data.accountLink as string
                setState('account_created')
                // Start countdown
                const countdownInterval = setInterval(() => {
                    setCountdown((prev) => {
                        if (prev <= 1) {
                            clearInterval(countdownInterval)
                            setState('redirecting')
                            globalThis.location.href = accountLink
                            return 0
                        }
                        return prev - 1
                    })
                }, 1000)

                return () => clearInterval(countdownInterval)
            } catch (err) {
                console.error('[v0] Stripe setup error:', err)
                setState('error')
                setError(err instanceof Error ? err.message : 'Failed to setup Stripe account')
            }
        }

        createAccount()
    }, [isOpen, user, state, updateLoggedInUser])

    const handleRetry = () => {
        setState('initializing')
        setError('')
        setCountdown(5)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Complete Your Stripe Setup</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    {state === 'initializing' && (
                        <>
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            <p className="text-center text-sm text-muted-foreground">Initializing Stripe setup...</p>
                        </>
                    )}

                    {state === 'creating_account' && (
                        <>
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            <p className="text-center text-sm text-muted-foreground">Creating your Stripe account...</p>
                        </>
                    )}

                    {state === 'account_created' && countdown > 0 && (
                        <>
                            <CheckCircle2 className="w-12 h-12 text-green-500" />
                            <div className="text-center space-y-2">
                                <p className="text-sm font-medium text-foreground">Stripe account created successfully!</p>
                                <p className="text-xs text-muted-foreground">
                                    Redirecting you to Stripe in {countdown} second{countdown !== 1 ? 's' : ''}...
                                </p>
                            </div>
                        </>
                    )}

                    {state === 'redirecting' && (
                        <>
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            <p className="text-center text-sm text-muted-foreground">Redirecting to Stripe...</p>
                        </>
                    )}

                    {state === 'error' && (
                        <>
                            <AlertCircle className="w-12 h-12 text-destructive" />
                            <div className="text-center space-y-3">
                                <p className="text-sm font-medium text-foreground">{error}</p>
                                <Button onClick={handleRetry} className="w-full">
                                    Retry Setup
                                </Button>
                            </div>
                        </>
                    )}
                </div>

                {/* Prevent closing */}
                {state !== 'error' && (
                    <div className="text-xs text-center text-muted-foreground">
                        Please do not close this window
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
