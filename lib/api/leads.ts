import apiClient from "./client";
import {
  LeadCreateRequest,
  LeadUpdateRequest,
  LeadNoteAddRequest,
  LeadMarkLostRequest,
  LeadConvertRequest,
  LeadListParams,
  LeadListResponse,
  LeadResponse,
  LeadStatsResponse,
} from "@/types/api";

export const leadsApi = {
  stats: async (): Promise<LeadStatsResponse> => {
    const { data } = await apiClient.get<LeadStatsResponse>("/leads/stats");
    return data;
  },

  list: async (params: LeadListParams = {}): Promise<LeadListResponse> => {
    const { page = 1, per_page = 25, status, source, search } = params;
    const { data } = await apiClient.get<LeadListResponse>("/leads", {
      params: { page, per_page, status: status || undefined, source: source || undefined, search: search || undefined },
    });
    return data;
  },

  create: async (payload: LeadCreateRequest): Promise<LeadResponse> => {
    const { data } = await apiClient.post<LeadResponse>("/leads", payload);
    return data;
  },

  get: async (leadId: string): Promise<LeadResponse> => {
    const { data } = await apiClient.get<LeadResponse>(`/leads/${leadId}`);
    return data;
  },

  update: async (leadId: string, payload: LeadUpdateRequest): Promise<LeadResponse> => {
    const { data } = await apiClient.put<LeadResponse>(`/leads/${leadId}`, payload);
    return data;
  },

  delete: async (leadId: string): Promise<void> => {
    await apiClient.delete(`/leads/${leadId}`);
  },

  addNote: async (leadId: string, payload: LeadNoteAddRequest): Promise<LeadResponse> => {
    const { data } = await apiClient.post<LeadResponse>(`/leads/${leadId}/notes`, payload);
    return data;
  },

  markLost: async (leadId: string, payload: LeadMarkLostRequest): Promise<LeadResponse> => {
    const { data } = await apiClient.post<LeadResponse>(`/leads/${leadId}/mark-lost`, payload);
    return data;
  },

  convert: async (leadId: string, payload: LeadConvertRequest): Promise<LeadResponse> => {
    const { data } = await apiClient.post<LeadResponse>(`/leads/${leadId}/convert`, payload);
    return data;
  },
};
