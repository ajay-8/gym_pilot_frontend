import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trainersApi } from "../api/trainers";
import type {
  GymTrainerCreateRequest,
  GymTrainerUpdateRequest,
  GymTrainerListParams,
} from "@/types/api";
import { useAuth } from "./use-auth";

export const trainerKeys = {
  all: ["trainers"] as const,
  lists: () => [...trainerKeys.all, "list"] as const,
  list: (gymId: string | undefined, params: GymTrainerListParams) =>
    [...trainerKeys.lists(), gymId, params] as const,
  detail: (gymId: string | undefined, trainerId: string) =>
    [...trainerKeys.all, "detail", gymId, trainerId] as const,
  performance: (gymId: string | undefined, trainerId: string) =>
    [...trainerKeys.all, "performance", gymId, trainerId] as const,
  commissionSummary: (gymId: string | undefined, trainerId: string) =>
    [...trainerKeys.all, "commission-summary", gymId, trainerId] as const,
};

export function useTrainers(params: GymTrainerListParams = {}) {
  const { gymContext } = useAuth();
  const gymId = gymContext?.gym_id;

  return useQuery({
    queryKey: trainerKeys.list(gymId, params),
    queryFn: () => trainersApi.list(gymId!, params),
    enabled: !!gymId,
  });
}

export function useTrainerPerformance(trainerId: string | null) {
  const { gymContext } = useAuth();
  const gymId = gymContext?.gym_id;

  return useQuery({
    queryKey: trainerKeys.performance(gymId, trainerId ?? ""),
    queryFn: () => trainersApi.getPerformance(gymId!, trainerId!),
    enabled: !!gymId && !!trainerId,
  });
}

export function useTrainerCommissionSummary(trainerId: string | null) {
  const { gymContext } = useAuth();
  const gymId = gymContext?.gym_id;

  return useQuery({
    queryKey: trainerKeys.commissionSummary(gymId, trainerId ?? ""),
    queryFn: () => trainersApi.getCommissionSummary(gymId!, trainerId!),
    enabled: !!gymId && !!trainerId,
  });
}

export function useTrainerCreate() {
  const queryClient = useQueryClient();
  const { gymContext } = useAuth();
  const gymId = gymContext?.gym_id;

  return useMutation({
    mutationFn: (payload: GymTrainerCreateRequest) =>
      trainersApi.create(gymId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainerKeys.lists() });
    },
  });
}

export function useTrainerUpdate() {
  const queryClient = useQueryClient();
  const { gymContext } = useAuth();
  const gymId = gymContext?.gym_id;

  return useMutation({
    mutationFn: ({
      trainerId,
      payload,
    }: {
      trainerId: string;
      payload: GymTrainerUpdateRequest;
    }) => trainersApi.update(gymId!, trainerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainerKeys.lists() });
    },
  });
}

export function useTrainerOffboard() {
  const queryClient = useQueryClient();
  const { gymContext } = useAuth();
  const gymId = gymContext?.gym_id;

  return useMutation({
    mutationFn: (trainerId: string) => trainersApi.offboard(gymId!, trainerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainerKeys.lists() });
    },
  });
}
