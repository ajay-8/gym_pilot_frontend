import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { membersApi } from "../api/members";
import {
  MemberOnboardRequest,
  MemberStatusUpdateRequest,
  MemberHealthRecordsUpdateRequest,
  PaginationParams,
} from "@/types/api";
import { useAuth } from "./use-auth";

// Query keys
export const memberKeys = {
  all: ["members"] as const,
  lists: () => [...memberKeys.all, "list"] as const,
  list: (gymId: string | undefined, params: PaginationParams) =>
    [...memberKeys.lists(), gymId, params] as const,
  details: () => [...memberKeys.all, "detail"] as const,
  detail: (gymId: string | undefined, id: string) =>
    [...memberKeys.details(), gymId, id] as const,
  healthRecords: (gymId: string | undefined, id: string) =>
    [...memberKeys.all, "health-records", gymId, id] as const,
};

/**
 * Hook to fetch paginated list of members
 */
export function useMembers(params: PaginationParams = {}) {
  const { gymContext } = useAuth();

  return useQuery({
    queryKey: memberKeys.list(gymContext?.gym_id, params),
    queryFn: () => membersApi.list(params),
    enabled: !!gymContext?.gym_id, // Only fetch if gym is selected
  });
}

/**
 * Hook to fetch member details
 */
export function useMemberDetail(userId: string, enabled = true) {
  const { gymContext } = useAuth();

  return useQuery({
    queryKey: memberKeys.detail(gymContext?.gym_id, userId),
    queryFn: () => membersApi.getDetail(userId),
    enabled: enabled && !!gymContext?.gym_id,
  });
}

/**
 * Hook to onboard a new member
 */
export function useMemberOnboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MemberOnboardRequest) => membersApi.onboard(payload),
    onSuccess: () => {
      // Invalidate members list to refetch with new member
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
      // Also invalidate dashboard to update member count
      queryClient.invalidateQueries({ queryKey: ["reports", "dashboard"] });
    },
  });
}

/**
 * Hook to update member status
 */
export function useMemberStatusUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: MemberStatusUpdateRequest }) =>
      membersApi.updateStatus(userId, payload),
    onSuccess: () => {
      // Invalidate all member details and lists for current gym
      queryClient.invalidateQueries({ queryKey: memberKeys.details() });
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
      // Also invalidate dashboard to update stats
      queryClient.invalidateQueries({ queryKey: ["reports", "dashboard"] });
    },
  });
}

/**
 * Hook to fetch member health records
 */
export function useMemberHealthRecords(userId: string, enabled = true) {
  const { gymContext } = useAuth();

  return useQuery({
    queryKey: memberKeys.healthRecords(gymContext?.gym_id, userId),
    queryFn: () => membersApi.getHealthRecords(userId),
    enabled: enabled && !!gymContext?.gym_id,
  });
}

/**
 * Hook to update member health records
 */
export function useMemberHealthRecordsUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: MemberHealthRecordsUpdateRequest }) =>
      membersApi.updateHealthRecords(userId, payload),
    onSuccess: (_, variables) => {
      // Invalidate health records query
      queryClient.invalidateQueries({ queryKey: memberKeys.healthRecords(undefined, variables.userId) });
    },
  });
}
