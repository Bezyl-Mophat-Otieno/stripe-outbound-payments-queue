'use client'
import { useAuthStore } from "@/store/auth-store"
import { useEffect, useState } from "react"

export const useAuth = ()=>{
const [isLoading, setIsLoading] = useState(true)
const {setLoggedInUser, clearLoggedInUser, user, isStripeOnboarded, updateLoggedInUser} = useAuthStore()

async function fetchProfile(token: string) {
    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLoggedInUser(data.user)
      } else if (response.status === 401) {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const newToken = await refreshAccessToken(refreshToken)
          if (newToken) {
            fetchProfile(newToken)
            return
          }
        }
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      }
    } catch (error) {
      console.error('[v0] Profile fetch error:', error)
    } finally {
      setIsLoading(false)
    }
  }

     async function refreshAccessToken(refreshToken: string): Promise<string | null> {
        try {
        const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
            'x-refresh-token': refreshToken,
            },
        })

        if (response.ok) {
            const data = await response.json()
            const newToken = data.accessToken || response.headers.get('x-access-token')
            if (newToken) {
            localStorage.setItem('accessToken', newToken)
            return newToken
            }
        }
        } catch (error) {
        console.error('[v0] Token refresh error:', error)
        }
        return null
    }

    async function login(email: string, password: string) {
        setIsLoading(true)
        try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Login failed')
        }

        const data = await response.json()
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        setLoggedInUser(data.user)
        } finally {
        setIsLoading(false)
        }
    }

    async function signup(fullName: string, email: string, password: string) {
        setIsLoading(true)
        try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, password }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Signup failed')
        }

        const data = await response.json()
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        setLoggedInUser(data.user)
        } finally {
        setIsLoading(false)
        }
    }

    function logout() {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        clearLoggedInUser()
    }
    
    useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('accessToken')
    if (token) {
        fetchProfile(token)
    } else {
        setIsLoading(false)
    }
    }, [])

    return {
        user,
        updateLoggedInUser,
        isStripeOnboarded,
        isLoading,
        signup,
        login,
        logout
    }
}