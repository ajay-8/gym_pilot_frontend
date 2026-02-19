import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { leadsApi } from "../api/leads";
import {
  LeadCreateRequest,
  LeadUpdateRequest,
  LeadNoteAddRequest,
  LeadMarkLostRequest,
  LeadConvertRequest,
  LeadListParams,
} from "@/types/api";
import { useAuth } from "./use-auth";

export const leadKeys = {
  all: ["leads"] as const,
  lists: () => [...leadKeys.all, "list"] as const,
  list: (gymId: string | undefined, params: LeadListParams) =>
    [...leadKeys.lists(), gymId, params] as const,
  details: () => [...leadKeys.all, "detail"] as const,
  detail: (gymId: string | undefined, id: string) =>
    [...leadKeys.details(), gymId, id] as const,
};

export function useLeads(params: LeadListParams = {}) {
  const { gymContext } = useAuth();

  return useQuery({
    queryKey: leadKeys.list(gymContext?.gym_id, params),
    queryFn: () => leadsApi.list(params),
    enabled: !!gymContext?.gym_id,
  });
}

export function useLeadDetail(leadId: string, enabled = true) {
  const { gymContext } = useAuth();

  return useQuery({
    queryKey: leadKeys.detail(gymContext?.gym_id, leadId),
    queryFn: () => leadsApi.get(leadId),
    enabled: enabled && !!gymContext?.gym_id && !!leadId,
  });
}

export function useLeadCreate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LeadCreateRequest) => leadsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["reports", "dashboard"] });
    },
  });
}

export function useLeadUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, payload }: { leadId: string; payload: LeadUpdateRequest }) =>
      leadsApi.update(leadId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.setQueryData(leadKeys.detail(undefined, data.id), data);
    },
  });
}

export function useLeadDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leadId: string) => leadsApi.delete(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["reports", "dashboard"] });
    },
  });
}

export function useLeadAddNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, payload }: { leadId: string; payload: LeadNoteAddRequest }) =>
      leadsApi.addNote(leadId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.setQueryData(leadKeys.detail(undefined, data.id), data);
    },
  });
}

export function useLeadMarkLost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, payload }: { leadId: string; payload: LeadMarkLostRequest }) =>
      leadsApi.markLost(leadId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.setQueryData(leadKeys.detail(undefined, data.id), data);
    },
  });
}

export function useLeadConvert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, payload }: { leadId: string; payload: LeadConvertRequest }) =>
      leadsApi.convert(leadId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.setQueryData(leadKeys.detail(undefined, data.id), data);
      // Invalidate members + dashboard since a new member was created
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["reports", "dashboard"] });
    },
  });
}
