import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { checkInsApi } from "../api/check-ins";
import type { CheckInCreateRequest, CheckInListParams } from "@/types/api";
import { useAuth } from "./use-auth";

export const checkInKeys = {
  all: ["check-ins"] as const,
  lists: () => [...checkInKeys.all, "list"] as const,
  list: (gymId: string | undefined, params: CheckInListParams) =>
    [...checkInKeys.lists(), gymId, params] as const,
};

export function useCheckIns(params: CheckInListParams = {}) {
  const { gymContext } = useAuth();
  const gymId = gymContext?.gym_id;

  return useQuery({
    queryKey: checkInKeys.list(gymId, params),
    queryFn: () => checkInsApi.list(params),
    enabled: !!gymId,
    refetchInterval: 30_000, // auto-refresh every 30s for live view
  });
}

export function useCheckInCreate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CheckInCreateRequest) => checkInsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checkInKeys.lists() });
    },
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ checkInId, notes }: { checkInId: string; notes?: string }) =>
      checkInsApi.checkout(checkInId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checkInKeys.lists() });
    },
  });
}
