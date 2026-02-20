import apiClient from "./client";
import type {
  GymTrainerResponse,
  GymTrainerListResponse,
  GymTrainerCreateRequest,
  GymTrainerUpdateRequest,
  GymTrainerListParams,
  TrainerPerformanceResponse,
  CommissionSummaryResponse,
  CommissionListResponse,
  CommissionResponse,
  CommissionListParams,
  MarkCommissionPaidRequest,
} from "@/types/api";

export const trainersApi = {
  list: (gymId: string, params: GymTrainerListParams = {}) =>
    apiClient
      .get<GymTrainerListResponse>(`/trainers/gyms/${gymId}/trainers`, { params })
      .then((r) => r.data),

  get: (gymId: string, trainerId: string) =>
    apiClient
      .get<GymTrainerResponse>(`/trainers/gyms/${gymId}/trainers/${trainerId}`)
      .then((r) => r.data),

  create: (gymId: string, payload: GymTrainerCreateRequest) =>
    apiClient
      .post<GymTrainerResponse>(`/trainers/gyms/${gymId}/trainers`, payload)
      .then((r) => r.data),

  update: (gymId: string, trainerId: string, payload: GymTrainerUpdateRequest) =>
    apiClient
      .put<GymTrainerResponse>(`/trainers/gyms/${gymId}/trainers/${trainerId}`, payload)
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
};
