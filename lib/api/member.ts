import apiClient from "./client";
import type {
  CheckInListResponse,
  MemberDashboardSummary,
  MembershipListResponse,
  MyMembershipsParams,
  MyPaymentsParams,
  MySessionsParams,
  PTPackagePurchaseListParams,
  PTPackagePurchaseListResponse,
  PaymentListResponse,
  PTSessionListResponse,
} from "@/types/api";

export const memberApi = {
  getDashboardSummary: () =>
    apiClient
      .get<MemberDashboardSummary>("/members/me/summary")
      .then((r) => r.data),

  getMyMemberships: (params: MyMembershipsParams = {}) =>
    apiClient
      .get<MembershipListResponse>("/memberships/my-memberships", { params })
      .then((r) => r.data),

  getMyPTPurchases: (params: PTPackagePurchaseListParams = {}) =>
    apiClient
      .get<PTPackagePurchaseListResponse>("/pt/purchases/my-purchases", { params })
      .then((r) => r.data),

  getMyPTSessions: (params: MySessionsParams = {}) =>
    apiClient
      .get<PTSessionListResponse>("/pt/sessions/my-sessions", { params })
      .then((r) => r.data),

  getMyCheckIns: (params: MyMembershipsParams = {}) =>
    apiClient
      .get<CheckInListResponse>("/check-ins/my-history", { params })
      .then((r) => r.data),

  getMyPayments: (params: MyPaymentsParams = {}) =>
    apiClient
      .get<PaymentListResponse>("/payments/my-payments", { params })
      .then((r) => r.data),
};
