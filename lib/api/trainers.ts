import apiClient from "./client";
import type {
  GymTrainerContractResponse,
  GymTrainerContractListResponse,
  GymTrainerContractOnboardRequest,
  GymTrainerContractOnboardResponse,
  GymTrainerContractUpdateRequest,
  GymTrainerContractListParams,
  TrainerPerformanceResponse,
  CommissionSummaryResponse,
  CommissionListResponse,
  CommissionResponse,
  CommissionListParams,
  MarkCommissionPaidRequest,
  TrainerProfileResponse,
  TrainerProfileUpdateRequest,
  TrainerPublicProfile,
  AvailabilityUpdateRequest,
  ScheduleResponse,
} from "@/types/api";

export const trainersApi = {
  list: (gymId: string, params: GymTrainerContractListParams = {}) =>
    apiClient
      .get<GymTrainerContractListResponse>(`/trainers/gyms/${gymId}/trainers`, { params })
      .then((r) => r.data),

  get: (gymId: string, trainerId: string) =>
    apiClient
      .get<GymTrainerContractResponse>(`/trainers/gyms/${gymId}/trainers/${trainerId}`)
      .then((r) => r.data),

  create: (gymId: string, payload: GymTrainerContractOnboardRequest) =>
    apiClient
      .post<GymTrainerContractOnboardResponse>(`/trainers/gyms/${gymId}/trainers`, payload)
      .then((r) => r.data),

  update: (gymId: string, trainerId: string, payload: GymTrainerContractUpdateRequest) =>
    apiClient
      .put<GymTrainerContractResponse>(`/trainers/gyms/${gymId}/trainers/${trainerId}`, payload)
      .then((r) => r.data),

  offboard: (gymId: string, trainerId: string) =>
    apiClient
      .delete(`/trainers/gyms/${gymId}/trainers/${trainerId}`)
      .then((r) => r.data),

  getPerformance: (gymId: string, trainerId: string) =>
    apiClient
      .get<TrainerPerformanceResponse>(
        `/trainers/gyms/${gymId}/trainers/${trainerId}/performance`
      )
      .then((r) => r.data),

  getCommissionSummary: (gymId: string, trainerId: string) =>
    apiClient
      .get<CommissionSummaryResponse>(
        `/trainers/gyms/${gymId}/trainers/${trainerId}/commissions/summary`
      )
      .then((r) => r.data),

  getCommissions: (gymId: string, trainerId: string, params: CommissionListParams = {}) =>
    apiClient
      .get<CommissionListResponse>(
        `/trainers/gyms/${gymId}/trainers/${trainerId}/commissions`,
        { params }
      )
      .then((r) => r.data),

  markCommissionPaid: (gymId: string, commissionId: string, payload: MarkCommissionPaidRequest = {}) =>
    apiClient
      .post<CommissionResponse>(
        `/trainers/gyms/${gymId}/commissions/${commissionId}/mark-paid`,
        payload
      )
      .then((r) => r.data),

  // ── Trainer Portal (self-view) ─────────────────────────────────────────────

  getMyProfile: () =>
    apiClient
      .get<TrainerProfileResponse>("/trainers/profile")
      .then((r) => r.data),

  updateMyProfile: (payload: TrainerProfileUpdateRequest) =>
    apiClient
      .put<TrainerProfileResponse>("/trainers/profile", payload)
      .then((r) => r.data),

  getMe: (gymId: string) =>
    apiClient
      .get<GymTrainerContractResponse>(`/trainers/gyms/${gymId}/trainers/me`)
      .then((r) => r.data),

  updateAvailability: (gymId: string, trainerId: string, payload: AvailabilityUpdateRequest) =>
    apiClient
      .put(`/trainers/gyms/${gymId}/trainers/${trainerId}/availability`, payload)
      .then((r) => r.data),

  getSchedule: (gymId: string, trainerId: string, dateFrom: string, dateTo: string) =>
    apiClient
      .get<ScheduleResponse>(`/trainers/gyms/${gymId}/trainers/${trainerId}/schedule`, {
        params: { date_from: dateFrom, date_to: dateTo },
      })
      .then((r) => r.data),

  getPublicProfile: (gymId: string, trainerId: string) =>
    apiClient
      .get<TrainerPublicProfile>(`/trainers/gyms/${gymId}/trainers/${trainerId}/public`)
      .then((r) => r.data),
};
