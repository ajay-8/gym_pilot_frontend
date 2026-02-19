import apiClient from "./client";
import type {
  CheckInResponse,
  CheckInListResponse,
  CheckInCreateRequest,
  CheckInListParams,
} from "@/types/api";

export const checkInsApi = {
  create: (payload: CheckInCreateRequest) =>
    apiClient.post<CheckInResponse>("/check-ins", payload).then((r) => r.data),

  checkout: (checkInId: string, notes?: string) =>
    apiClient
      .post<CheckInResponse>(`/check-ins/${checkInId}/checkout`, { notes: notes ?? null })
      .then((r) => r.data),

  list: (params: CheckInListParams = {}) =>
    apiClient
      .get<CheckInListResponse>("/check-ins", { params })
      .then((r) => r.data),
};
