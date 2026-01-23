'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/db/schema/users';

interface AuthState {
  // state
  user: User | null;
  isAuthenticated: boolean;
  isStripeOnboarded: boolean;
  isLoading: boolean;
  // Actions
  updateLoggedInUser: (user: User) => void;
  setLoggedInUser: (user: User) => void;
  clearLoggedInUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isStripeOnboarded: false,
      isLoading: true,
      isAdmin: false,

      setLoggedInUser: (user: User) => {
        set({
          user,
          isAuthenticated: true,
          isStripeOnboarded: Boolean(user.stripeAccountId),
          isLoading: false,
        });
      },

      updateLoggedInUser: (user: User) => {
        set({ ...get(), user });
      },
      clearLoggedInUser: () => {
        set({
          user: null,
          isAuthenticated: false,
          isStripeOnboarded: false,
          isLoading: false,
        });
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
);
