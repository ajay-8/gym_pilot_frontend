import apiClient from "./client";
import type { StaffListResponse, StaffListParams } from "@/types/api";

export const staffApi = {
  list: (params: StaffListParams = {}) =>
    apiClient
      .get<StaffListResponse>("/members/gym-staff", { params })
      .then((r) => r.data),
};
