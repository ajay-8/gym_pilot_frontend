import type {
  AmenityListResponse,
  AmenityResponse,
  GymAmenityAddRequest,
} from "@/types/api";
import apiClient from "./client";

export const amenitiesApi = {
  listAll: (params: { page?: number; page_size?: number } = {}) =>
    apiClient.get<AmenityListResponse>("/amenities", { params }).then((r) => r.data),

  listGym: () =>
    apiClient.get<AmenityResponse[]>("/amenities/gym").then((r) => r.data),

  addToGym: (payload: GymAmenityAddRequest) =>
    apiClient.post("/amenities/gym", payload).then((r) => r.data),

  removeFromGym: (amenityId: string) =>
    apiClient.delete(`/amenities/gym/${amenityId}`).then((r) => r.data),
};
