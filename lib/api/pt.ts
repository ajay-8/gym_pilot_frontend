import apiClient from "./client";
import type {
  PTClientListParams,
  PTClientListResponse,
  PTPackageCreateRequest,
  PTPackageListParams,
  PTPackageListResponse,
  PTPackagePurchaseCreateRequest,
  PTPackagePurchaseResponse,
  PTPackageResponse,
  PTPackageUpdateRequest,
  PTSessionCancelRequest,
  PTSessionCompleteRequest,
  PTSessionCreateRequest,
  PTSessionListParams,
  PTSessionListResponse,
  PTSessionLogRequest,
  PTSessionResponse,
  PTSessionUpdateRequest,
} from "@/types/api";

export const ptApi = {
  // ── PT Packages (trainer-owned globally, no gym_id needed) ──────────────────

  createPackage: (payload: PTPackageCreateRequest) =>
    apiClient
      .post<PTPackageResponse>("/pt/packages", payload)
      .then((r) => r.data),

  listPackages: (params: PTPackageListParams = {}) =>
    apiClient
      .get<PTPackageListResponse>("/pt/packages", { params })
      .then((r) => r.data),

  getPackage: (id: string) =>
    apiClient
      .get<PTPackageResponse>(`/pt/packages/${id}`)
      .then((r) => r.data),

  updatePackage: (id: string, payload: PTPackageUpdateRequest) =>
    apiClient
      .patch<PTPackageResponse>(`/pt/packages/${id}`, payload)
      .then((r) => r.data),

  deletePackage: (id: string) =>
    apiClient
      .delete(`/pt/packages/${id}`)
      .then((r) => r.data),

  // ── PT Sessions ──────────────────────────────────────────────────────────────

  createSession: (payload: PTSessionCreateRequest) =>
    apiClient
      .post<PTSessionResponse>("/pt/sessions", payload)
      .then((r) => r.data),

  listMySessions: (params: PTSessionListParams = {}) =>
    apiClient
      .get<PTSessionListResponse>("/pt/sessions/my-sessions", { params })
      .then((r) => r.data),

  getSession: (id: string) =>
    apiClient
      .get<PTSessionResponse>(`/pt/sessions/${id}`)
      .then((r) => r.data),

  updateSession: (id: string, payload: PTSessionUpdateRequest) =>
    apiClient
      .patch<PTSessionResponse>(`/pt/sessions/${id}`, payload)
      .then((r) => r.data),

  cancelSession: (id: string, payload: PTSessionCancelRequest = {}) =>
    apiClient
      .post(`/pt/sessions/${id}/cancel`, payload)
      .then((r) => r.data),

  completeSession: (id: string, payload: PTSessionCompleteRequest = {}) =>
    apiClient
      .post<PTSessionResponse>(`/pt/sessions/${id}/complete`, payload)
      .then((r) => r.data),

  logSession: (payload: PTSessionLogRequest) =>
    apiClient
      .post<PTSessionResponse>("/pt/sessions/log", payload)
      .then((r) => r.data),

  markNoShow: (id: string) =>
    apiClient
      .post(`/pt/sessions/${id}/no-show`)
      .then((r) => r.data),

  // ── Clients (trainer's client roster) ────────────────────────────────────────

  listMyClients: (params: PTClientListParams = {}) =>
    apiClient
      .get<PTClientListResponse>("/pt/clients", { params })
      .then((r) => r.data),

  purchasePackage: (packageId: string, payload: PTPackagePurchaseCreateRequest) =>
    apiClient
      .post<PTPackagePurchaseResponse>(`/pt/packages/${packageId}/purchase`, payload)
      .then((r) => r.data),
};
