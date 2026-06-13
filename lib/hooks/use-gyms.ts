import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { gymsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth-store";
import { GymCreateRequest, PaginationParams } from "@/types/api";

// Query key factory
export const gymsKeys = {
  all: ["gyms"] as const,
  myGyms: (params?: PaginationParams) => [...gymsKeys.all, "my-gyms", params] as const,
  current: () => [...gymsKeys.all, "current"] as const,
};

// Hook to get user's gyms
export function useMyGyms(
  params?: PaginationParams,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: gymsKeys.myGyms(params),
    queryFn: () => gymsApi.getMyGyms(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: options.enabled ?? true,
  });
}

// Hook to create a new gym for the current user
export function useCreateGym() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GymCreateRequest) => gymsApi.createGym(payload),
    onSuccess: () => {
      // Invalidate all my-gyms queries (prefix match covers all param variants)
      queryClient.invalidateQueries({ queryKey: [...gymsKeys.all, "my-gyms"] });
    },
  });
}

// Hook for gym onboarding
export function useGymOnboard() {
  const router = useRouter();

  return useMutation({
    mutationFn: gymsApi.onboard,
    onSuccess: async (data) => {
      // Email already verified during registration (pre-reg OTP) — go straight to login
      router.push(`/login?email=${encodeURIComponent(data.owner.email)}`);
    },
  });
}

// Hook to get current gym info
export function useCurrentGym() {
  const { gymContext } = useAuthStore();

  return useQuery({
    queryKey: gymsKeys.current(),
    queryFn: gymsApi.getCurrentGymPublicInfo,
    enabled: !!gymContext,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
