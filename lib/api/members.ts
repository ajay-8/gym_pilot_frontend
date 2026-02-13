import apiClient from "./client";
import {
  MemberListResponse,
  MemberOnboardRequest,
  MemberOnboardResponse,
  MemberDetailResponse,
  MemberStatusUpdateRequest,
  PaginationParams,
} from "@/types/api";

export const membersApi = {
  /**
   * List all members of the current gym
   */
  list: async (params: PaginationParams = {}): Promise<MemberListResponse> => {
    const { page = 1, page_size = 20 } = params;
    const { data } = await apiClient.get<MemberListResponse>("/members/my-members", {
      params: { page, page_size },
    });
    return data;
  },

  /**
   * Onboard a new member to the current gym
   */
  onboard: async (payload: MemberOnboardRequest): Promise<MemberOnboardResponse> => {
    const { data } = await apiClient.post<MemberOnboardResponse>("/members/onboard", payload);
    return data;
  },

  /**
   * Get detailed information about a specific member
   */
  getDetail: async (userId: string): Promise<MemberDetailResponse> => {
    const { data} = await apiClient.get<MemberDetailResponse>(`/members/${userId}`);
    return data;
  },

  /**
   * Update member status (activate/suspend)
   */
  updateStatus: async (userId: string, payload: MemberStatusUpdateRequest): Promise<MemberDetailResponse> => {
    const { data } = await apiClient.patch<MemberDetailResponse>(`/members/${userId}/status`, payload);
    return data;
  },
};
