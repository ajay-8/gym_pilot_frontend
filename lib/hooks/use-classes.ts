import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { classesApi } from "../api/classes";
import type {
  GymClassCreateRequest,
  GymClassUpdateRequest,
  GymClassListParams,
  ClassSessionCreateRequest,
  ClassSessionUpdateRequest,
  ClassSessionCancelRequest,
  ClassSessionListParams,
} from "@/types/api";

export const classKeys = {
  all: ["classes"] as const,
  classDefs: () => [...classKeys.all, "defs"] as const,
  classDef: (params: GymClassListParams) => [...classKeys.classDefs(), params] as const,
  classDetail: (id: string) => [...classKeys.all, "def", id] as const,
  sessions: () => [...classKeys.all, "sessions"] as const,
  session: (params: ClassSessionListParams) => [...classKeys.sessions(), params] as const,
  sessionDetail: (id: string) => [...classKeys.all, "session", id] as const,
  sessionBookings: (sessionId: string) => [...classKeys.all, "bookings", sessionId] as const,
  myBookings: (params: object) => [...classKeys.all, "my-bookings", params] as const,
};

// ── Class Definitions ──────────────────────────────────────────────────────

export function useGymClasses(params: GymClassListParams = {}) {
  return useQuery({
    queryKey: classKeys.classDef(params),
    queryFn: () => classesApi.listClasses(params),
  });
}

export function useGymClassCreate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GymClassCreateRequest) => classesApi.createClass(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.classDefs() });
    },
  });
}

export function useGymClassUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, payload }: { classId: string; payload: GymClassUpdateRequest }) =>
      classesApi.updateClass(classId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.classDefs() });
    },
  });
}

export function useGymClassDelete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) => classesApi.deleteClass(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.classDefs() });
    },
  });
}

// ── Sessions ───────────────────────────────────────────────────────────────

export function useClassSessions(params: ClassSessionListParams = {}) {
  return useQuery({
    queryKey: classKeys.session(params),
    queryFn: () => classesApi.listSessions(params),
  });
}

export function useSessionBookings(sessionId: string | null) {
  return useQuery({
    queryKey: classKeys.sessionBookings(sessionId ?? ""),
    queryFn: () => classesApi.listSessionBookings(sessionId!),
    enabled: !!sessionId,
  });
}

export function useClassSessionCreate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClassSessionCreateRequest) => classesApi.createSession(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.sessions() });
    },
  });
}

export function useClassSessionUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: string; payload: ClassSessionUpdateRequest }) =>
      classesApi.updateSession(sessionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.sessions() });
    },
  });
}

export function useClassSessionCancel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: string; payload?: ClassSessionCancelRequest }) =>
      classesApi.cancelSession(sessionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.sessions() });
    },
  });
}
