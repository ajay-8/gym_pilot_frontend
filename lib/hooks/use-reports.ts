import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";
import { useAuth } from "./use-auth";

// Query keys
export const reportsKeys = {
  all: ["reports"] as const,
  dashboard: (gymId?: string) => [...reportsKeys.all, "dashboard", gymId] as const,
};

// Hook to get dashboard stats
export function useDashboard() {
  const { gymContext } = useAuth();

  return useQuery({
    queryKey: reportsKeys.dashboard(gymContext?.gym_id),
    queryFn: reportsApi.getDashboard,
    enabled: !!gymContext?.gym_id, // Only fetch if gym is selected
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}
