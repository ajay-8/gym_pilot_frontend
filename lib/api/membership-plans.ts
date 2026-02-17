import apiClient from "./client";
import {
  MembershipPlanListResponse,
  MembershipPlanResponse,
  MembershipPlanCreateRequest,
  MembershipPlanUpdateRequest,
  PaginationParams,
} from "@/types/api";

export const membershipPlansApi = {
  /**
   * List all membership plans for the current gym
   */
  list: async (
    params: PaginationParams & { include_inactive?: boolean } = {}
  ): Promise<MembershipPlanListResponse> => {
    const { page = 1, page_size = 20, include_inactive = false } = params;
    const { data } = await apiClient.get<MembershipPlanListResponse>("/membership-plans", {
      params: { page, page_size, include_inactive },
    });
    return data;
  },

  /**
   * Get membership plan details
   */
  getDetail: async (planId: string): Promise<MembershipPlanResponse> => {
    const { data } = await apiClient.get<MembershipPlanResponse>(`/membership-plans/${planId}`);
    return data;
  },

  /**
   * Create a new membership plan
   */
  create: async (payload: MembershipPlanCreateRequest): Promise<MembershipPlanResponse> => {
    const { data } = await apiClient.post<MembershipPlanResponse>("/membership-plans", payload);
    return data;
  },

  /**
   * Update an existing membership plan
   */
  update: async (
    planId: string,
    payload: MembershipPlanUpdateRequest
  ): Promise<MembershipPlanResponse> => {
    const { data } = await apiClient.patch<MembershipPlanResponse>(
      `/membership-plans/${planId}`,
      payload
    );
    return data;
  },

  /**
   * Delete a membership plan
   */
  delete: async (planId: string): Promise<void> => {
    await apiClient.delete(`/membership-plans/${planId}`);
  },
};
