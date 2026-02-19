import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentsApi } from "../api/payments";
import type {
  PaymentCreateRequest,
  PaymentRefundRequest,
  PaymentListParams,
} from "@/types/api";

export const paymentKeys = {
  all: ["payments"] as const,
  lists: () => [...paymentKeys.all, "list"] as const,
  list: (params: PaymentListParams) => [...paymentKeys.lists(), params] as const,
  detail: (paymentId: string) => [...paymentKeys.all, "detail", paymentId] as const,
  receipt: (paymentId: string) => [...paymentKeys.all, "receipt", paymentId] as const,
};

export function usePayments(params: PaymentListParams = {}) {
  return useQuery({
    queryKey: paymentKeys.list(params),
    queryFn: () => paymentsApi.list(params),
  });
}

export function usePayment(paymentId: string | null) {
  return useQuery({
    queryKey: paymentKeys.detail(paymentId ?? ""),
    queryFn: () => paymentsApi.get(paymentId!),
    enabled: !!paymentId,
  });
}

export function usePaymentReceipt(paymentId: string | null) {
  return useQuery({
    queryKey: paymentKeys.receipt(paymentId ?? ""),
    queryFn: () => paymentsApi.getReceipt(paymentId!),
    enabled: !!paymentId,
  });
}

export function usePaymentCreate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PaymentCreateRequest) => paymentsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
    },
  });
}

export function usePaymentRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentId,
      payload,
    }: {
      paymentId: string;
      payload?: PaymentRefundRequest;
    }) => paymentsApi.refund(paymentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
    },
  });
}
