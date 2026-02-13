import apiClient from "./client";
import {
  LoginRequest,
  AccessTokenResponse,
  AuthMeResponse,
  SetSessionGymRequest,
  PasswordResetRequestSchema,
  PasswordResetConfirmSchema,
} from "@/types/api";

export const authApi = {
  // Login
  login: async (credentials: LoginRequest): Promise<AccessTokenResponse> => {
    const { data } = await apiClient.post<AccessTokenResponse>("/auth/login", credentials);
    return data;
  },

  // Refresh access token
  refresh: async (): Promise<AccessTokenResponse> => {
    const { data } = await apiClient.post<AccessTokenResponse>("/auth/refresh");
    return data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  // Logout all sessions
  logoutAllSessions: async (): Promise<void> => {
    await apiClient.post("/auth/logout-all-sessions");
  },

  // Get current user
  getMe: async (): Promise<AuthMeResponse> => {
    const { data } = await apiClient.get<AuthMeResponse>("/auth/me");
    return data;
  },

  // Set gym session context
  setSessionGym: async (payload: SetSessionGymRequest): Promise<AccessTokenResponse> => {
    const { data } = await apiClient.post<AccessTokenResponse>(
      "/auth/set-session-gym",
      payload
    );
    return data;
  },

  // Request password reset
  requestPasswordReset: async (payload: PasswordResetRequestSchema): Promise<void> => {
    await apiClient.post("/auth/password-reset/request", payload);
  },

  // Confirm password reset
  confirmPasswordReset: async (payload: PasswordResetConfirmSchema): Promise<void> => {
    await apiClient.post("/auth/password-reset/confirm", payload);
  },
};
