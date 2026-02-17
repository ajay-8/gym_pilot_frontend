import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { membershipPlansApi } from "../api/membership-plans";
import {
  MembershipPlanCreateRequest,
  MembershipPlanUpdateRequest,
  PaginationParams,
} from "@/types/api";
import { useAuth } from "./use-auth";

// Query keys
export const membershipPlanKeys = {
  all: ["membership-plans"] as const,
  lists: () => [...membershipPlanKeys.all, "list"] as const,
  list: (gymId: string | undefined, params: PaginationParams & { include_inactive?: boolean }) =>
    [...membershipPlanKeys.lists(), gymId, params] as const,
  details: () => [...membershipPlanKeys.all, "detail"] as const,
  detail: (gymId: string | undefined, id: string) =>
    [...membershipPlanKeys.details(), gymId, id] as const,
};

/**
 * Hook to fetch paginated list of membership plans
 */
export function useMembershipPlans(
  params: PaginationParams & { include_inactive?: boolean } = {},
  enabled = true
) {
  const { gymContext } = useAuth();

  return useQuery({
    queryKey: membershipPlanKeys.list(gymContext?.gym_id, params),
    queryFn: () => membershipPlansApi.list(params),
    enabled: enabled && !!gymContext?.gym_id,
  });
}

/**
 * Hook to fetch membership plan details
 */
export function useMembershipPlanDetail(planId: string, enabled = true) {
  const { gymContext } = useAuth();

  return useQuery({
    queryKey: membershipPlanKeys.detail(gymContext?.gym_id, planId),
    queryFn: () => membershipPlansApi.getDetail(planId),
    enabled: enabled && !!gymContext?.gym_id && !!planId,
  });
}

/**
 * Hook to create a new membership plan
 */
export function useMembershipPlanCreate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MembershipPlanCreateRequest) => membershipPlansApi.create(payload),
    onSuccess: () => {
      // Invalidate plans list to refetch with new plan
      queryClient.invalidateQueries({ queryKey: membershipPlanKeys.lists() });
    },
  });
}

/**
 * Hook to update a membership plan
 */
export function useMembershipPlanUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, payload }: { planId: string; payload: MembershipPlanUpdateRequest }) =>
      membershipPlansApi.update(planId, payload),
    onSuccess: () => {
      // Invalidate all plan details and lists
      queryClient.invalidateQueries({ queryKey: membershipPlanKeys.details() });
      queryClient.invalidateQueries({ queryKey: membershipPlanKeys.lists() });
    },
  });
}

/**
 * Hook to delete a membership plan
 */
export function useMembershipPlanDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => membershipPlansApi.delete(planId),
    onSuccess: () => {
      // Invalidate plans list
      queryClient.invalidateQueries({ queryKey: membershipPlanKeys.lists() });
    },
  });
}
