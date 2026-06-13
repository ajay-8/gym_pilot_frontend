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

  // Verify email with OTP (post-creation flow)
  verifyEmail: async (payload: { user_id: string; otp: string }): Promise<void> => {
    await apiClient.post("/auth/verify-email", payload);
  },

  // Resend email verification OTP — returns user_id if the account exists and is unverified
  resendVerificationOTP: async (email: string): Promise<{ user_id: string | null }> => {
    const { data } = await apiClient.post("/auth/resend-verification-otp", { email });
    return data;
  },

  // Pre-registration OTP: send before account exists
  sendPreRegOTP: async (email: string): Promise<void> => {
    await apiClient.post("/auth/send-pre-registration-otp", { email });
  },

  // Pre-registration OTP: verify
  verifyPreRegOTP: async (email: string, otp: string): Promise<void> => {
    await apiClient.post("/auth/verify-pre-registration-otp", { email, otp });
  },

  // Check if email and phone are available for registration
  checkAvailability: async (payload: { email: string; phone?: string }): Promise<{
    email_available: boolean;
    phone_available: boolean;
    can_proceed: boolean;
  }> => {
    const { data } = await apiClient.post("/auth/check-availability", payload);
    return data;
  },
};
