"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memberApi } from "../api/member";
import { paymentsApi } from "../api/payments";
import { ptApi } from "../api/pt";
import { trainersApi } from "../api/trainers";
import type {
  MyMembershipsParams,
  MyPaymentsParams,
  MySessionsParams,
  PTPackageBrief,
  PTPackagePurchaseListParams,
} from "@/types/api";
import { useAuth } from "./use-auth";

// ── Query keys ─────────────────────────────────────────────────────────────────

export const memberPortalKeys = {
  all: ["member-portal"] as const,
  dashboard: (gymId: string | undefined) =>
    [...memberPortalKeys.all, "dashboard", gymId] as const,
  memberships: (gymId: string | undefined, params: MyMembershipsParams) =>
    [...memberPortalKeys.all, "memberships", gymId, params] as const,
  purchases: (gymId: string | undefined, params: PTPackagePurchaseListParams) =>
    [...memberPortalKeys.all, "purchases", gymId, params] as const,
  sessions: (gymId: string | undefined, params: MySessionsParams) =>
    [...memberPortalKeys.all, "sessions", gymId, params] as const,
  checkIns: (gymId: string | undefined, params: MyMembershipsParams) =>
    [...memberPortalKeys.all, "check-ins", gymId, params] as const,
  payments: (gymId: string | undefined, params: MyPaymentsParams) =>
    [...memberPortalKeys.all, "payments", gymId, params] as const,
  trainers: (gymId: string | undefined) =>
    [...memberPortalKeys.all, "trainers", gymId] as const,
  trainerProfile: (gymId: string | undefined, trainerId: string) =>
    [...memberPortalKeys.all, "trainer-profile", gymId, trainerId] as const,
};

// ── Hooks ──────────────────────────────────────────────────────────────────────

export function useMemberDashboard() {
  const { gymContext } = useAuth();
  const gymId = gymContext?.gym_id;

  return useQuery({
    queryKey: memberPortalKeys.dashboard(gymId),
    queryFn: memberApi.getDashboardSummary,
    enabled: !!gymId,
    staleTime: 2 * 60 * 1000, // 2 min
  });
}

export function useMyMemberships(params: MyMembershipsParams = {}) {
  const { gymContext } = useAuth();
  const gymId = gymContext?.gym_id;

  return useQuery({
    queryKey: memberPortalKeys.memberships(gymId, params),
    queryFn: () => memberApi.getMyMemberships(params),
    enabled: !!gymId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMyPTPurchases(params: PTPackagePurchaseListParams = {}) {
  const { gymContext } = useAuth();
  const gymId = gymContext?.gym_id;

  return useQuery({
    queryKey: memberPortalKeys.purchases(gymId, params),
    queryFn: () => memberApi.getMyPTPurchases(params),
    enabled: !!gymId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useMyPTSessions(params: MySessionsParams = {}) {
  const { gymContext } = useAuth();
  const gymId = gymContext?.gym_id;

  return useQuery({
    queryKey: memberPortalKeys.sessions(gymId, params),
    queryFn: () => memberApi.getMyPTSessions(params),
    enabled: !!gymId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useMyCheckIns(params: MyMembershipsParams = {}) {
  const { gymContext } = useAuth();
  const gymId = gymContext?.gym_id;

  return useQuery({
    queryKey: memberPortalKeys.checkIns(gymId, params),
    queryFn: () => memberApi.getMyCheckIns(params),
    enabled: !!gymId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useMyPayments(params: MyPaymentsParams = {}) {
  const { gymContext } = useAuth();
  const gymId = gymContext?.gym_id;

  return useQuery({
    queryKey: memberPortalKeys.payments(gymId, params),
    queryFn: () => memberApi.getMyPayments(params),
    enabled: !!gymId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGymTrainers() {
  const { gymContext } = useAuth();
  const gymId = gymContext?.gym_id;

  return useQuery({
    queryKey: memberPortalKeys.trainers(gymId),
    queryFn: () => trainersApi.list(gymId!, { status: "active", per_page: 50 }),
    enabled: !!gymId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTrainerPublicProfile(trainerId: string | null) {
  const { gymContext } = useAuth();
  const gymId = gymContext?.gym_id;

  return useQuery({
    queryKey: memberPortalKeys.trainerProfile(gymId, trainerId ?? ""),
    queryFn: () => trainersApi.getPublicProfile(gymId!, trainerId!),
    enabled: !!gymId && !!trainerId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Complete PT package purchase flow:
 *   1. Create payment order (mock/Razorpay)
 *   2. Verify payment (auto-verifies in mock mode)
 *   3. Purchase the PT package
 *
 * Returns the PTPackagePurchaseResponse on success.
 */
export function useBuyPTPackage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ pkg }: { pkg: PTPackageBrief }) => {
      const amount = parseFloat(pkg.price);

      // Step 1: Create payment order
      const order = await paymentsApi.createOrder({
        amount,
        currency: pkg.currency || "INR",
        description: `PT Package: ${pkg.name}`,
      });

      if (order.key_id !== "mock_key_id") {
        // Real Razorpay is enabled — this hook cannot open the Razorpay widget.
        // Use CheckoutDialog (trainers/page.tsx) for real payment flows.
        throw new Error("Real payment gateway requires the checkout dialog. Use CheckoutDialog instead.");
      }

      // Mock mode: backend auto-verifies any non-empty signature
      await paymentsApi.verifyPayment({
        order_id: order.order_id,
        payment_id: `mock_pay_${Date.now()}`,
        signature: `mock_sig_${Date.now()}`,
      });

      // Step 3: Purchase the package (uses internal DB payment_id from step 1)
      const purchase = await ptApi.purchasePackage(pkg.id, {
        payment_id: order.payment_id,
      });

      return purchase;
    },
    onSuccess: () => {
      // Invalidate member portal queries so dashboard/sessions/payments refresh
      qc.invalidateQueries({ queryKey: memberPortalKeys.all });
    },
  });
}
