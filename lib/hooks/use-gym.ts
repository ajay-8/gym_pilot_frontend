import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gymApi } from "../api/gym";
import type { GymUpdateRequest } from "@/types/api";

export const gymKeys = {
  current: ["gym", "current"] as const,
};

export function useCurrentGym() {
  return useQuery({
    queryKey: gymKeys.current,
    queryFn: () => gymApi.getCurrent(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGymUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GymUpdateRequest) => gymApi.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gymKeys.current });
    },
  });
}
