import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { membersApi } from "../api/members";
import {
  AllParticipantsListParams,
  BulkMemberImportRequest,
  MemberOnboardRequest,
  MemberStatusUpdateRequest,
  MemberUpdateRequest,
  MembershipRenewRequest,
  MemberHealthRecordsUpdateRequest,
  MemberListParams,
} from "@/types/api";
import { useAuth } from "./use-auth";

// Query keys
export const memberKeys = {
  all: ["members"] as const,
  lists: () => [...memberKeys.all, "list"] as const,
  list: (gymId: string | undefined, params: MemberListParams) =>
    [...memberKeys.lists(), gymId, params] as const,
  details: () => [...memberKeys.all, "detail"] as const,
  detail: (gymId: string | undefined, id: string) =>
    [...memberKeys.details(), gymId, id] as const,
  healthRecords: (gymId: string | undefined, id: string) =>
    [...memberKeys.all, "health-records", gymId, id] as const,
  membershipHistory: (gymId: string | undefined, id: string) =>
    [...memberKeys.all, "membership-history", gymId, id] as const,
};

/**
 * Hook to fetch paginated list of members with search and filters
 */
export function useMembers(params: MemberListParams = {}) {
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
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["reports", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["all-participants"] });
    },
  });
}

/**
 * Hook to bulk import members
 */
export function useMemberBulkImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkMemberImportRequest) => membersApi.bulkImport(payload),
    onSuccess: () => {
      // Invalidate members list to refetch with new members
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
 * Hook to renew member's membership
 */
export function useMembershipRenew() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: MembershipRenewRequest }) =>
      membersApi.renewMembership(userId, payload),
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
 * Hook to update member details
 */
export function useMemberUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: MemberUpdateRequest }) =>
      membersApi.update(userId, payload),
    onSuccess: () => {
      // Invalidate all member details and lists
      queryClient.invalidateQueries({ queryKey: memberKeys.details() });
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}

/**
 * Hook to delete member
 */
export function useMemberDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => membersApi.delete(userId),
    onSuccess: () => {
      // Invalidate all member details and lists
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

/**
 * Hook to fetch member's membership history
 */
export function useMembershipHistory(userId: string, enabled = true) {
  const { gymContext } = useAuth();

  return useQuery({
    queryKey: memberKeys.membershipHistory(gymContext?.gym_id, userId),
    queryFn: () => membersApi.getMembershipHistory(userId),
    enabled: enabled && !!gymContext?.gym_id && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get member's membership audit history (timeline of changes from audit logs)
 */
export function useMembershipAuditHistory(userId: string, enabled = true) {
  const { gymContext } = useAuth();

  return useQuery({
    queryKey: ["members", gymContext?.gym_id, userId, "audit-history"],
    queryFn: () => membersApi.getMembershipAuditHistory(userId),
    enabled: enabled && !!gymContext?.gym_id && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch all participants at the gym regardless of role (Team & Members directory)
 */
export function useAllParticipants(params: AllParticipantsListParams = {}) {
  const { gymContext } = useAuth();

  return useQuery({
    queryKey: ["all-participants", gymContext?.gym_id, params],
    queryFn: () => membersApi.listAllParticipants(params),
    enabled: !!gymContext?.gym_id,
  });
}
