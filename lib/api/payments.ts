import apiClient from "./client";
import type {
  PaymentResponse,
  PaymentListResponse,
  PaymentCreateRequest,
  PaymentRefundRequest,
  PaymentReceiptResponse,
  PaymentListParams,
} from "@/types/api";

export const paymentsApi = {
  list: (params: PaymentListParams = {}) =>
    apiClient
      .get<PaymentListResponse>("/payments", { params })
      .then((r) => r.data),

  get: (paymentId: string) =>
    apiClient
      .get<PaymentResponse>(`/payments/${paymentId}`)
      .then((r) => r.data),

  create: (payload: PaymentCreateRequest) =>
    apiClient
      .post<PaymentResponse>("/payments", payload)
      .then((r) => r.data),

  refund: (paymentId: string, payload: PaymentRefundRequest = {}) =>
    apiClient
      .post<PaymentResponse>(`/payments/${paymentId}/refund`, payload)
      .then((r) => r.data),

  getReceipt: (paymentId: string) =>
    apiClient
      .get<PaymentReceiptResponse>(`/payments/${paymentId}/receipt`)
      .then((r) => r.data),
};
