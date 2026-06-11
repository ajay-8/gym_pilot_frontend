import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";
import { useAuth } from "./use-auth";

// Query keys
export const reportsKeys = {
  all: ["reports"] as const,
  dashboard: (gymId?: string) => [...reportsKeys.all, "dashboard", gymId] as const,
  attendance: (gymId?: string, dateFrom?: string, dateTo?: string) =>
    [...reportsKeys.all, "attendance", gymId, dateFrom, dateTo] as const,
  membership: (gymId?: string) => [...reportsKeys.all, "membership", gymId] as const,
  revenue: (gymId?: string, dateFrom?: string, dateTo?: string) =>
    [...reportsKeys.all, "revenue", gymId, dateFrom, dateTo] as const,
  leadAnalytics: (gymId?: string, dateFrom?: string, dateTo?: string) =>
    [...reportsKeys.all, "lead-analytics", gymId, dateFrom, dateTo] as const,
  revenueAnalytics: (gymId?: string, dateFrom?: string, dateTo?: string) =>
    [...reportsKeys.all, "revenue-analytics", gymId, dateFrom, dateTo] as const,
  memberAnalytics: (gymId?: string, dateFrom?: string, dateTo?: string) =>
    [...reportsKeys.all, "member-analytics", gymId, dateFrom, dateTo] as const,
};

// Hook to get dashboard stats
export function useDashboard() {
  const { gymContext } = useAuth();

  return useQuery({
    queryKey: reportsKeys.dashboard(gymContext?.gym_id),
    queryFn: reportsApi.getDashboard,
    enabled: !!gymContext?.gym_id, // Only fetch if gym is selected
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook to get attendance report
export function useAttendanceReport(params: { date_from: string; date_to: string }) {
  const { gymContext } = useAuth();

  return useQuery({
    queryKey: reportsKeys.attendance(gymContext?.gym_id, params.date_from, params.date_to),
    queryFn: () => reportsApi.getAttendanceReport(params),
    enabled: !!gymContext?.gym_id && !!params.date_from && !!params.date_to,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get membership report
export function useMembershipReport() {
  const { gymContext } = useAuth();

  return useQuery({
    queryKey: reportsKeys.membership(gymContext?.gym_id),
    queryFn: reportsApi.getMembershipReport,
    enabled: !!gymContext?.gym_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get revenue report
export function useRevenueReport(params: { date_from: string; date_to: string }) {
  const { gymContext } = useAuth();

  return useQuery({
    queryKey: reportsKeys.revenue(gymContext?.gym_id, params.date_from, params.date_to),
    queryFn: () => reportsApi.getRevenueReport(params),
    enabled: !!gymContext?.gym_id && !!params.date_from && !!params.date_to,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get lead analytics
export function useLeadAnalytics(params?: { date_from?: string; date_to?: string }) {
  const { gymContext } = useAuth();

  return useQuery({
    queryKey: reportsKeys.leadAnalytics(gymContext?.gym_id, params?.date_from, params?.date_to),
    queryFn: () => reportsApi.getLeadAnalytics(params),
    enabled: !!gymContext?.gym_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get revenue analytics
export function useRevenueAnalytics(params?: { date_from?: string; date_to?: string }) {
  const { gymContext } = useAuth();

  return useQuery({
    queryKey: reportsKeys.revenueAnalytics(gymContext?.gym_id, params?.date_from, params?.date_to),
    queryFn: () => reportsApi.getRevenueAnalytics(params),
    enabled: !!gymContext?.gym_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get member analytics
export function useMemberAnalytics(params?: { date_from?: string; date_to?: string }) {
  const { gymContext } = useAuth();

  return useQuery({
    queryKey: reportsKeys.memberAnalytics(gymContext?.gym_id, params?.date_from, params?.date_to),
    queryFn: () => reportsApi.getMemberAnalytics(params),
    enabled: !!gymContext?.gym_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
