import apiClient from "./client";
import {
  BulkMemberImportRequest,
  BulkMemberImportResponse,
  MemberListResponse,
  MemberOnboardRequest,
  MemberOnboardResponse,
  MemberDetailResponse,
  MemberStatusUpdateRequest,
  MembershipRenewRequest,
  MemberUpdateRequest,
  MemberHealthRecordsResponse,
  MemberHealthRecordsUpdateRequest,
  MemberListParams,
  MembershipHistoryResponse,
} from "@/types/api";

export const membersApi = {
  /**
   * List all members of the current gym with optional search and filters
   */
  list: async (params: MemberListParams = {}): Promise<MemberListResponse> => {
    const { page = 1, page_size = 20, search, status, plan_id } = params;
    const { data } = await apiClient.get<MemberListResponse>("/members/my-members", {
      params: { page, page_size, search, status, plan_id },
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
   * Bulk import members from CSV
   */
  bulkImport: async (payload: BulkMemberImportRequest): Promise<BulkMemberImportResponse> => {
    const { data } = await apiClient.post<BulkMemberImportResponse>("/members/bulk-import", payload);
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

  /**
   * Renew member's membership
   */
  renewMembership: async (userId: string, payload: MembershipRenewRequest): Promise<MemberDetailResponse> => {
    const { data } = await apiClient.post<MemberDetailResponse>(`/members/${userId}/membership/renew`, payload);
    return data;
  },

  /**
   * Update member details
   */
  update: async (userId: string, payload: MemberUpdateRequest): Promise<MemberDetailResponse> => {
    const { data } = await apiClient.patch<MemberDetailResponse>(`/members/${userId}`, payload);
    return data;
  },

  /**
   * Delete member
   */
  delete: async (userId: string): Promise<void> => {
    await apiClient.delete(`/members/${userId}`);
  },

  /**
   * Get member health records
   */
  getHealthRecords: async (userId: string): Promise<MemberHealthRecordsResponse> => {
    const { data } = await apiClient.get<MemberHealthRecordsResponse>(`/members/${userId}/health-records`);
    return data;
  },

  /**
   * Update member health records
   */
  updateHealthRecords: async (
    userId: string,
    payload: MemberHealthRecordsUpdateRequest
  ): Promise<MemberHealthRecordsResponse> => {
    const { data } = await apiClient.put<MemberHealthRecordsResponse>(
      `/members/${userId}/health-records`,
      payload
    );
    return data;
  },

  /**
   * Get member's membership history
   */
  getMembershipHistory: async (userId: string): Promise<MembershipHistoryResponse> => {
    const { data } = await apiClient.get<MembershipHistoryResponse>(
      `/members/${userId}/membership-history`
    );
    return data;
  },

  /**
   * Get member's membership audit history (timeline of changes)
   */
  getMembershipAuditHistory: async (userId: string): Promise<any> => {
    const { data } = await apiClient.get(
      `/members/${userId}/membership-audit-history`
    );
    return data;
  },
};
