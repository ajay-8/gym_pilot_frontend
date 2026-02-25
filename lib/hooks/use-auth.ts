import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth-store";

// Query key factory
export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

// Hook to get current user
export function useCurrentUser() {
  const { user, isAuthenticated } = useAuthStore();

  const query = useQuery({
    queryKey: authKeys.me(),
    queryFn: authApi.getMe,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user: query.data?.user ?? user,
    gymContext: query.data?.gym_context,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

// Hook for login
export function useLogin() {
  const router = useRouter();
  const { setAuth, setGymContext } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      // Clear any persisted gym context from previous session
      // This ensures user must select gym again and get fresh token with gym_id
      setGymContext(null);

      // Store access token
      setAuth({ id: "", email: "" } as any, data.access_token);

      // Fetch user info
      const userInfo = await authApi.getMe();
      setAuth(userInfo.user, data.access_token);

      // Always redirect to gym selection after login
      // This ensures user explicitly selects gym and gets fresh token with gym_id
      router.push("/select-gym");

      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}

// Hook for logout
export function useLogout() {
  const router = useRouter();
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      // Clear auth state
      clearAuth();

      // Clear all queries
      queryClient.clear();

      // Redirect to login
      router.push("/login");
    },
  });
}

// Hook to set gym session
export function useSetGymSession() {
  const router = useRouter();
  const { setGymContext, updateAccessToken } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.setSessionGym,
    onSuccess: async (data) => {
      // Update access token with gym context
      updateAccessToken(data.access_token);

      // Fetch updated user info
      const userInfo = await authApi.getMe();
      if (userInfo.gym_context) {
        setGymContext(userInfo.gym_context);
      }

      // Invalidate all queries to fetch fresh data for new gym
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });

      // Role-based routing
      const roles = userInfo.gym_context?.roles ?? [];
      const isTrainer = roles.includes("trainer");
      const isAdmin = roles.some((r) => ["owner", "admin", "staff"].includes(r));

      if (isTrainer && isAdmin) {
        // Dual-role: let user choose which portal to enter
        router.push("/select-gym?portal=choose");
      } else if (isTrainer) {
        router.push("/trainer/dashboard");
      } else {
        router.push("/dashboard");
      }
    },
  });
}

// Hook to check authentication status
export function useAuth() {
  const { user, gymContext, isAuthenticated, _hasHydrated } = useAuthStore();

  return {
    user,
    gymContext,
    isAuthenticated,
    hasGymContext: !!gymContext,
    hasHydrated: _hasHydrated,
  };
}
