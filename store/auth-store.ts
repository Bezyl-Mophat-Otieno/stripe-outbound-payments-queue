'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/db/schema/users'

interface AuthState {
  // state
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  // Actions
  setUser: (user: User) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      isAdmin: false,

      setUser: (user: User) => {
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        })
      },

      clearUser: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)