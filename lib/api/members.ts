import apiClient from "./client";
import {
  MemberOnboardRequest,
  MemberListResponse,
  PaginationParams,
} from "@/types/api";

export const membersApi = {
  // Onboard a new member
  onboard: async (payload: MemberOnboardRequest): Promise<{ user_id: string }> => {
    const { data } = await apiClient.post("/members/onboard", payload);
    return data;
  },

  // List members
  listMembers: async (params?: PaginationParams): Promise<MemberListResponse> => {
    const { data } = await apiClient.get<MemberListResponse>("/members/my-members", {
      params,
    });
    return data;
  },

  // Get member details
  getMemberDetails: async (userId: string): Promise<any> => {
    const { data } = await apiClient.get(`/members/${userId}`);
    return data;
  },

  // Update member status
  updateMemberStatus: async (
    userId: string,
    status: string
  ): Promise<void> => {
    await apiClient.patch(`/members/${userId}/status`, { status });
  },
};
