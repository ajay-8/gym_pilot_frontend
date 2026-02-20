import apiClient from "./client";
import type { GymResponse, GymUpdateRequest } from "@/types/api";

export const gymApi = {
  getCurrent: () =>
    apiClient
      .get<GymResponse>("/gyms/current-gym-admin-details")
      .then((r) => r.data),

  update: (payload: GymUpdateRequest) =>
    apiClient
      .patch<GymResponse>("/gyms/update-current-gym-details", payload)
      .then((r) => r.data),
};
