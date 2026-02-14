import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AuthUserResponse, GymContextResponse } from "@/types/api";

interface AuthState {
  // State
  user: AuthUserResponse | null;
  gymContext: GymContextResponse | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;

  // Actions
  setAuth: (user: AuthUserResponse, accessToken: string) => void;
  setGymContext: (gymContext: GymContextResponse | null) => void;
  clearAuth: () => void;
  updateAccessToken: (accessToken: string) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      gymContext: null,
      accessToken: null,
      isAuthenticated: false,
      _hasHydrated: false,

      // Set authentication
      setAuth: (user, accessToken) => {
        // Store token in localStorage for API client
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", accessToken);
        }

        set({
          user,
          accessToken,
          isAuthenticated: true,
        });
      },

      // Set gym context
      setGymContext: (gymContext) => {
        set({ gymContext });
      },

      // Clear authentication
      clearAuth: () => {
        // Remove token from localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
        }

        set({
          user: null,
          gymContext: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },

      // Update access token (for token refresh)
      updateAccessToken: (accessToken) => {
        // Store token in localStorage for API client
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", accessToken);
        }

        set({ accessToken });
      },

      // Set hydration status
      setHasHydrated: (hasHydrated) => {
        set({ _hasHydrated: hasHydrated });
      },
    }),
    {
      name: "gym-pilot-auth", // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Persist user, gymContext, and isAuthenticated
      partialize: (state) => ({
        user: state.user,
        gymContext: state.gymContext,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Check if we have a valid token in localStorage
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("access_token");
          if (state && token) {
            // Token exists, restore accessToken to state
            state.accessToken = token;
          } else if (state && !token) {
            // No token, clear authentication
            state.isAuthenticated = false;
            state.user = null;
            state.gymContext = null;
          }
        }
        state?.setHasHydrated(true);
      },
    }
  )
);
