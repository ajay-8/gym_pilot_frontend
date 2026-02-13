import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { membersApi } from "../api/members";
import {
  MemberOnboardRequest,
  MemberStatusUpdateRequest,
  PaginationParams,
} from "@/types/api";

// Query keys
export const memberKeys = {
  all: ["members"] as const,
  lists: () => [...memberKeys.all, "list"] as const,
  list: (params: PaginationParams) => [...memberKeys.lists(), params] as const,
  details: () => [...memberKeys.all, "detail"] as const,
  detail: (id: string) => [...memberKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated list of members
 */
export function useMembers(params: PaginationParams = {}) {
  return useQuery({
    queryKey: memberKeys.list(params),
    queryFn: () => membersApi.list(params),
  });
}

/**
 * Hook to fetch member details
 */
export function useMemberDetail(userId: string, enabled = true) {
  return useQuery({
    queryKey: memberKeys.detail(userId),
    queryFn: () => membersApi.getDetail(userId),
    enabled,
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
    onSuccess: (_, variables) => {
      // Invalidate member detail
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(variables.userId) });
      // Invalidate members list
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}
