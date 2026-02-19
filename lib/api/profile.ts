import apiClient from "./client";
import type {
  UserProfileResponse,
  UserProfileUpdateRequest,
  ChangePasswordRequest,
} from "@/types/api";

export const profileApi = {
  get: () =>
    apiClient.get<UserProfileResponse>("/users/me").then((r) => r.data),

  update: (payload: UserProfileUpdateRequest) =>
    apiClient
      .patch<UserProfileResponse>("/users/me", payload)
      .then((r) => r.data),

  changePassword: (payload: ChangePasswordRequest) =>
    apiClient
      .post<{ message: string }>("/users/me/change-password", payload)
      .then((r) => r.data),
};
