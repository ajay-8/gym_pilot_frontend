import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { APIError } from "@/types/api";

// API Base URL from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Generate a unique idempotency key
function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

// Create Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for refresh token cookies
});

// Request interceptor - Add access token and idempotency key to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get access token from localStorage
    const token = localStorage.getItem("access_token");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add idempotency key for mutation requests (POST, PUT, PATCH)
    if (config.method && ["post", "put", "patch"].includes(config.method.toLowerCase())) {
      if (config.headers && !config.headers["Idempotency-Key"]) {
        config.headers["Idempotency-Key"] = generateIdempotencyKey();
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<APIError>) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - Token expired
    // Skip refresh for auth endpoints (login, register, etc.) — those 401s are
    // credential errors, not expired-token errors. Attempting a refresh would fail
    // and then trigger window.location.href="/login", causing a page reload.
    const isAuthEndpoint = originalRequest?.url?.includes("/auth/");
    if (error.response?.status === 401 && originalRequest && !isAuthEndpoint) {
      // Try to refresh the token
      try {
        const { data } = await axios.post<{ access_token: string }>(
          `${API_BASE_URL}/auth/refresh`,
          {},
          {
            withCredentials: true, // Send refresh token cookie
          }
        );

        // Update access token
        localStorage.setItem("access_token", data.access_token);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - Clear tokens and redirect to login
        localStorage.removeItem("access_token");

        // Only redirect if we're in the browser
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const data = error.response?.data as any;
    const apiError: APIError = {
      detail: data?.detail || error.message || "An unexpected error occurred",
      status: error.response?.status,
      error_code: data?.error_code,
      message: data?.message,
    };

    return Promise.reject(apiError);
  }
);

export default apiClient;
