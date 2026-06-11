import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi, gymsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth-store";

// Query key factory
export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

/** Map gym context roles to the correct portal route. */
export function resolvePortalRoute(roles: string[]): string {
  const isAdmin = roles.some((r) => ["owner", "admin", "staff"].includes(r));
  const isTrainer = roles.includes("trainer");
  const isMember = roles.includes("member");
  const portalCount = [isAdmin, isTrainer, isMember].filter(Boolean).length;
  if (portalCount > 1) return "/select-gym?portal=choose";
  if (isTrainer) return "/trainer/dashboard";
  if (isMember) return "/member/dashboard";
  return "/dashboard";
}

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
  const { setAuth, setGymContext, updateAccessToken } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string; rememberMe?: boolean }) =>
      authApi.login({ email, password }),
    onSuccess: async (data, variables) => {
      const rememberMe = variables.rememberMe ?? true;

      // Clear any persisted gym context from previous session
      setGymContext(null);

      // Store access token and fetch user info
      setAuth({ id: "", email: "" } as any, data.access_token, rememberMe);
      const userInfo = await authApi.getMe();
      setAuth(userInfo.user, data.access_token);
      queryClient.invalidateQueries({ queryKey: authKeys.all });

      // Skip gym selector when user belongs to exactly one gym
      const gymsData = await gymsApi.getMyGyms({ page: 1, page_size: 2 });
      if (gymsData.total === 1) {
        const sessionData = await authApi.setSessionGym({ gym_id: gymsData.items[0].id });
        updateAccessToken(sessionData.access_token);
        const freshUser = await authApi.getMe();
        if (freshUser.gym_context) setGymContext(freshUser.gym_context);
        queryClient.invalidateQueries({ queryKey: authKeys.all });
        queryClient.invalidateQueries({ queryKey: ["reports"] });
        queryClient.invalidateQueries({ queryKey: ["members"] });
        router.push(resolvePortalRoute(freshUser.gym_context?.roles ?? []));
      } else {
        router.push("/select-gym"); // 0 or 2+ gyms
      }
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
      router.push(resolvePortalRoute(userInfo.gym_context?.roles ?? []));
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
