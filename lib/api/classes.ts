import apiClient from "./client";
import type {
  GymClassResponse,
  GymClassListResponse,
  GymClassCreateRequest,
  GymClassUpdateRequest,
  GymClassListParams,
  ClassSessionResponse,
  ClassSessionListResponse,
  ClassSessionCreateRequest,
  ClassSessionUpdateRequest,
  ClassSessionCancelRequest,
  ClassSessionListParams,
  BookingResponse,
  BookingListResponse,
} from "@/types/api";

export const classesApi = {
  // ── Class Definitions ────────────────────────────────────────────────────
  listClasses: (params: GymClassListParams = {}) =>
    apiClient
      .get<GymClassListResponse>("/classes", { params })
      .then((r) => r.data),

  getClass: (classId: string) =>
    apiClient
      .get<GymClassResponse>(`/classes/${classId}`)
      .then((r) => r.data),

  createClass: (payload: GymClassCreateRequest) =>
    apiClient
      .post<GymClassResponse>("/classes", payload)
      .then((r) => r.data),

  updateClass: (classId: string, payload: GymClassUpdateRequest) =>
    apiClient
      .patch<GymClassResponse>(`/classes/${classId}`, payload)
      .then((r) => r.data),

  deleteClass: (classId: string) =>
    apiClient.delete(`/classes/${classId}`).then((r) => r.data),

  // ── Sessions ─────────────────────────────────────────────────────────────
  listSessions: (params: ClassSessionListParams = {}) =>
    apiClient
      .get<ClassSessionListResponse>("/classes/sessions", { params })
      .then((r) => r.data),

  getSession: (sessionId: string) =>
    apiClient
      .get<ClassSessionResponse>(`/classes/sessions/${sessionId}`)
      .then((r) => r.data),

  createSession: (payload: ClassSessionCreateRequest) =>
    apiClient
      .post<ClassSessionResponse>("/classes/sessions", payload)
      .then((r) => r.data),

  updateSession: (sessionId: string, payload: ClassSessionUpdateRequest) =>
    apiClient
      .patch<ClassSessionResponse>(`/classes/sessions/${sessionId}`, payload)
      .then((r) => r.data),

  cancelSession: (sessionId: string, payload: ClassSessionCancelRequest = {}) =>
    apiClient
      .post<ClassSessionResponse>(`/classes/sessions/${sessionId}/cancel`, payload)
      .then((r) => r.data),

  // ── Bookings ─────────────────────────────────────────────────────────────
  listSessionBookings: (sessionId: string) =>
    apiClient
      .get<BookingResponse[]>(`/classes/sessions/${sessionId}/bookings`)
      .then((r) => r.data),

  bookSession: (sessionId: string) =>
    apiClient
      .post<BookingResponse>(`/classes/sessions/${sessionId}/bookings`, {})
      .then((r) => r.data),

  cancelBooking: (bookingId: string, reason?: string) =>
    apiClient
      .delete<BookingResponse>(`/classes/bookings/${bookingId}`, {
        data: { reason: reason ?? null },
      })
      .then((r) => r.data),

  myBookings: (params: { page?: number; page_size?: number; status?: string } = {}) =>
    apiClient
      .get<BookingListResponse>("/classes/bookings/my-bookings", { params })
      .then((r) => r.data),
};
