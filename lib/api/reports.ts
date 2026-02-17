import apiClient from "./client";
import {
  DashboardResponse,
  AttendanceReportResponse,
  MembershipReportResponse,
  RevenueReportResponse,
  LeadAnalyticsResponse,
  RevenueAnalyticsResponse,
  MemberAnalyticsResponse,
} from "@/types/api";

export const reportsApi = {
  // Get dashboard stats
  getDashboard: async (): Promise<DashboardResponse> => {
    const { data } = await apiClient.get<DashboardResponse>("/reports/dashboard");
    return data;
  },

  // Get attendance report
  getAttendanceReport: async (params: {
    date_from: string;
    date_to: string;
  }): Promise<AttendanceReportResponse> => {
    const { data } = await apiClient.get<AttendanceReportResponse>("/reports/attendance", {
      params,
    });
    return data;
  },

  // Get membership report
  getMembershipReport: async (): Promise<MembershipReportResponse> => {
    const { data } = await apiClient.get<MembershipReportResponse>("/reports/memberships");
    return data;
  },

  // Get revenue report
  getRevenueReport: async (params: {
    date_from: string;
    date_to: string;
  }): Promise<RevenueReportResponse> => {
    const { data } = await apiClient.get<RevenueReportResponse>("/reports/revenue", {
      params,
    });
    return data;
  },

  // Get lead analytics
  getLeadAnalytics: async (params?: {
    date_from?: string;
    date_to?: string;
  }): Promise<LeadAnalyticsResponse> => {
    const { data } = await apiClient.get<LeadAnalyticsResponse>("/reports/lead-analytics", {
      params,
    });
    return data;
  },

  // Get revenue analytics
  getRevenueAnalytics: async (params?: {
    date_from?: string;
    date_to?: string;
  }): Promise<RevenueAnalyticsResponse> => {
    const { data } = await apiClient.get<RevenueAnalyticsResponse>("/reports/revenue-analytics", {
      params,
    });
    return data;
  },

  // Get member analytics
  getMemberAnalytics: async (params?: {
    date_from?: string;
    date_to?: string;
  }): Promise<MemberAnalyticsResponse> => {
    const { data } = await apiClient.get<MemberAnalyticsResponse>("/reports/member-analytics", {
      params,
    });
    return data;
  },
};
