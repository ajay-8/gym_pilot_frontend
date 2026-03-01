import apiClient from "./client";
import {
  GymCreateRequest,
  GymOnboardRequest,
  GymOnboardResponse,
  GymListResponse,
  GymResponse,
  PaginationParams,
} from "@/types/api";

export const gymsApi = {
  // Onboard a new gym (public endpoint - no auth required)
  onboard: async (payload: GymOnboardRequest): Promise<GymOnboardResponse> => {
    const { data } = await apiClient.post<GymOnboardResponse>("/gyms/onboard", payload);
    return data;
  },

  // Create a new gym for the current authenticated user (becomes owner)
  createGym: async (payload: GymCreateRequest): Promise<GymResponse> => {
    const { data } = await apiClient.post<GymResponse>("/gyms/create", payload);
    return data;
  },

  // Get all gyms for current user
  getMyGyms: async (params?: PaginationParams): Promise<GymListResponse> => {
    const { data } = await apiClient.get<GymListResponse>("/gyms/my-gyms", { params });
    return data;
  },

  // Get current gym public info
  getCurrentGymPublicInfo: async (): Promise<GymResponse> => {
    const { data } = await apiClient.get<GymResponse>("/gyms/current-gym-info");
    return data;
  },

  // Get current gym staff info
  getCurrentGymStaffInfo: async (): Promise<GymResponse> => {
    const { data } = await apiClient.get<GymResponse>("/gyms/current-gym-staff-info");
    return data;
  },

  // Get current gym admin details
  getCurrentGymAdminDetails: async (): Promise<GymResponse> => {
    const { data } = await apiClient.get<GymResponse>("/gyms/current-gym-admin-details");
    return data;
  },

  // Update current gym
  updateCurrentGym: async (payload: Partial<GymResponse>): Promise<GymResponse> => {
    const { data } = await apiClient.patch<GymResponse>(
      "/gyms/update-current-gym-details",
      payload
    );
    return data;
  },
};
