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
  setAuth: (user: AuthUserResponse, accessToken: string, rememberMe?: boolean) => void;
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
      setAuth: (user, accessToken, rememberMe = true) => {
        // Store token in localStorage (remember me) or sessionStorage (session only)
        if (typeof window !== "undefined") {
          if (rememberMe) {
            localStorage.setItem("access_token", accessToken);
            sessionStorage.removeItem("access_token");
          } else {
            sessionStorage.setItem("access_token", accessToken);
            localStorage.removeItem("access_token");
          }
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
        // Remove token from both storages
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          sessionStorage.removeItem("access_token");
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
        // Preserve whichever storage the token is currently in
        if (typeof window !== "undefined") {
          if (localStorage.getItem("access_token")) {
            localStorage.setItem("access_token", accessToken);
          } else {
            sessionStorage.setItem("access_token", accessToken);
          }
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
        // Check localStorage first (remember me), then sessionStorage (session only)
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
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
