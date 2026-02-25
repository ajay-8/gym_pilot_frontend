"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trainersApi } from "../api/trainers";
import { ptApi } from "../api/pt";
import type {
  TrainerProfileUpdateRequest,
  AvailabilityUpdateRequest,
  PTPackageCreateRequest,
  PTPackageUpdateRequest,
  PTPackageListParams,
  PTSessionCancelRequest,
  PTSessionCompleteRequest,
  PTSessionCreateRequest,
  PTSessionListParams,
  CommissionListParams,
} from "@/types/api";
import { useAuth } from "./use-auth";

// ── Query keys ─────────────────────────────────────────────────────────────────

export const trainerPortalKeys = {
  all: ["trainer-portal"] as const,
  me: (gymId: string | undefined) => [...trainerPortalKeys.all, "me", gymId] as const,
  profile: () => [...trainerPortalKeys.all, "profile"] as const,
  schedule: (gymId: string | undefined, trainerId: string, dateFrom: string, dateTo: string) =>
    [...trainerPortalKeys.all, "schedule", gymId, trainerId, dateFrom, dateTo] as const,
  commissionSummary: (gymId: string | undefined, trainerId: string) =>
    [...trainerPortalKeys.all, "commission-summary", gymId, trainerId] as const,
  commissions: (gymId: string | undefined, trainerId: string, params: CommissionListParams) =>
    [...trainerPortalKeys.all, "commissions", gymId, trainerId, params] as const,
  performance: (gymId: string | undefined, trainerId: string) =>
    [...trainerPortalKeys.all, "performance", gymId, trainerId] as const,
  packages: (params: PTPackageListParams) =>
    [...trainerPortalKeys.all, "packages", params] as const,
  sessions: (params: PTSessionListParams) =>
    [...trainerPortalKeys.all, "sessions", params] as const,
};

// ── GymTrainerContract self-resolution ─────────────────────────────────────────────────

/**
 * Fetches the authenticated trainer's GymTrainerContract record for the current gym.
 * This resolves the gym_trainer_id needed by all other trainer-scoped endpoints.
 */
export function useMyGymTrainerContract() {
  const { gymContext } = useAuth();
  const gymId = gymContext?.gym_id;

  return useQuery({
    queryKey: trainerPortalKeys.me(gymId),
    queryFn: () => trainersApi.getMe(gymId!),
    enabled: !!gymId,
    staleTime: 5 * 60 * 1000, // 5 min — trainer record rarely changes
  });
}

// ── Trainer Profile ───────────────────────────────────────────────────────────

export function useMyTrainerProfile() {
  return useQuery({
    queryKey: trainerPortalKeys.profile(),
    queryFn: () => trainersApi.getMyProfile(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TrainerProfileUpdateRequest) =>
      trainersApi.updateMyProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainerPortalKeys.profile() });
    },
  });
}

// ── Availability & Schedule ───────────────────────────────────────────────────

export function useUpdateAvailability() {
  const queryClient = useQueryClient();
  const { gymContext } = useAuth();
  const gymId = gymContext?.gym_id;

  return useMutation({
    mutationFn: ({
      trainerId,
      payload,
    }: {
      trainerId: string;
      payload: AvailabilityUpdateRequest;
    }) => trainersApi.updateAvailability(gymId!, trainerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainerPortalKeys.me(gymId) });
    },
  });
}

export function useMySchedule(dateFrom: string, dateTo: string) {
  const { gymContext } = useAuth();
  const gymId = gymContext?.gym_id;
  const { data: gymTrainer } = useMyGymTrainerContract();
  const trainerId = gymTrainer?.id;

  return useQuery({
    queryKey: trainerPortalKeys.schedule(gymId, trainerId ?? "", dateFrom, dateTo),
    queryFn: () => trainersApi.getSchedule(gymId!, trainerId!, dateFrom, dateTo),
    enabled: !!gymId && !!trainerId && !!dateFrom && !!dateTo,
  });
}

// ── Commissions ───────────────────────────────────────────────────────────────

export function useMyCommissionSummary() {
  const { gymContext } = useAuth();
  const gymId = gymContext?.gym_id;
  const { data: gymTrainer } = useMyGymTrainerContract();
  const trainerId = gymTrainer?.id;

  return useQuery({
    queryKey: trainerPortalKeys.commissionSummary(gymId, trainerId ?? ""),
    queryFn: () => trainersApi.getCommissionSummary(gymId!, trainerId!),
    enabled: !!gymId && !!trainerId,
  });
}

export function useMyCommissions(params: CommissionListParams = {}) {
  const { gymContext } = useAuth();
  const gymId = gymContext?.gym_id;
  const { data: gymTrainer } = useMyGymTrainerContract();
  const trainerId = gymTrainer?.id;

  return useQuery({
    queryKey: trainerPortalKeys.commissions(gymId, trainerId ?? "", params),
    queryFn: () => trainersApi.getCommissions(gymId!, trainerId!, params),
    enabled: !!gymId && !!trainerId,
  });
}

export function useMyPerformance() {
  const { gymContext } = useAuth();
  const gymId = gymContext?.gym_id;
  const { data: gymTrainer } = useMyGymTrainerContract();
  const trainerId = gymTrainer?.id;

  return useQuery({
    queryKey: trainerPortalKeys.performance(gymId, trainerId ?? ""),
    queryFn: () => trainersApi.getPerformance(gymId!, trainerId!),
    enabled: !!gymId && !!trainerId,
  });
}

// ── PT Packages ───────────────────────────────────────────────────────────────

export function useMyPackages(params: PTPackageListParams = {}) {
  const { data: profile } = useMyTrainerProfile();

  const queryParams: PTPackageListParams = {
    ...params,
    trainer_profile_id: profile?.id,
  };

  return useQuery({
    queryKey: trainerPortalKeys.packages(queryParams),
    queryFn: () => ptApi.listPackages(queryParams),
    enabled: !!profile?.id,
  });
}

export function useCreatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PTPackageCreateRequest) => ptApi.createPackage(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...trainerPortalKeys.all, "packages"] });
    },
  });
}

export function useUpdatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PTPackageUpdateRequest }) =>
      ptApi.updatePackage(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...trainerPortalKeys.all, "packages"] });
    },
  });
}

export function useDeletePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ptApi.deletePackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...trainerPortalKeys.all, "packages"] });
    },
  });
}

// ── PT Sessions ───────────────────────────────────────────────────────────────

export function useMySessions(params: PTSessionListParams = {}) {
  return useQuery({
    queryKey: trainerPortalKeys.sessions(params),
    queryFn: () => ptApi.listMySessions(params),
  });
}

export function useCancelSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: PTSessionCancelRequest }) =>
      ptApi.cancelSession(id, payload ?? {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...trainerPortalKeys.all, "sessions"] });
    },
  });
}

export function useCompleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: PTSessionCompleteRequest }) =>
      ptApi.completeSession(id, payload ?? {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...trainerPortalKeys.all, "sessions"] });
    },
  });
}

export function useMarkNoShow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ptApi.markNoShow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...trainerPortalKeys.all, "sessions"] });
    },
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PTSessionCreateRequest) => ptApi.createSession(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...trainerPortalKeys.all, "sessions"] });
      queryClient.invalidateQueries({ queryKey: [...trainerPortalKeys.all, "schedule"] });
    },
  });
}
