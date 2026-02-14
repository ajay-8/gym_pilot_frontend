import apiClient from "./client";
import { DashboardResponse } from "@/types/api";

export const reportsApi = {
  // Get dashboard stats
  getDashboard: async (): Promise<DashboardResponse> => {
    const { data } = await apiClient.get<DashboardResponse>("/reports/dashboard");
    return data;
  },
};
