"use client";

import { useState } from "react";
import { useMyPayments, useMyPTPurchases } from "@/lib/hooks/use-member-portal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, parseISO, getYear } from "date-fns";
import { Receipt, ChevronLeft, ChevronRight, DollarSign, Clock, AlertCircle } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const variants: Record<string, { label: string; color: string }> = {
    completed:  { label: "Completed",  color: "#10b981" },
    pending:    { label: "Pending",    color: "#f59e0b" },
    failed:     { label: "Failed",     color: "#ef4444" },
    refunded:   { label: "Refunded",   color: "#8b5cf6" },
    processing: { label: "Processing", color: "#3b82f6" },
  };
  const v = variants[status] ?? { label: status, color: "#6b7280" };
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: `${v.color}22`, color: v.color }}
    >
      {v.label}
    </span>
  );
}

function methodLabel(method: string) {
  const labels: Record<string, string> = {
    cash:          "Cash",
    upi:           "UPI",
    card:          "Card",
    bank_transfer: "Bank Transfer",
    other:         "Other",
  };
  return labels[method] ?? method;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyPayments({ page, page_size: 20 });

  // Build payment_id → package name map for cross-referencing
  const { data: purchasesData } = useMyPTPurchases({ page_size: 100 });
  const ptPaymentMap = new Map<string, string>(
    (purchasesData?.items ?? []).map((p) => [
      p.payment_id,
      ((p.package_snapshot as Record<string, unknown>)?.name as string) ?? "PT Package",
    ])
  );

  function paymentFor(p: { membership_id: string | null; id: string; payment_metadata: Record<string, unknown> }): string {
    if (ptPaymentMap.has(p.id)) return `PT Package: ${ptPaymentMap.get(p.id)}`;
    if (p.membership_id) return "Gym Membership";
    const desc = p.payment_metadata?.description as string | undefined;
    if (desc && !desc.includes("status code")) return desc;
    return "—";
  }

  // Summary stats from current data
  const currentYear = getYear(new Date());
  const totalThisYear = data?.items
    .filter((p) => p.status === "completed" && getYear(parseISO(p.created_at)) === currentYear)
    .reduce((sum, p) => sum + parseFloat(p.amount), 0) ?? 0;

  const lastPayment = data?.items.find((p) => p.status === "completed");
  const pendingCount = data?.items.filter((p) => p.status === "pending").length ?? 0;

  return (
    <div className="space-y-6">
      {/* ── Summary Strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: `Total Paid (${currentYear})`,
            value: `₹${totalThisYear.toLocaleString("en-IN")}`,
            icon: DollarSign,
            color: "#10b981",
          },
          {
            label: "Last Payment",
            value: lastPayment
              ? format(parseISO(lastPayment.created_at), "dd MMM yyyy")
              : "—",
            icon: Clock,
            color: "#3b82f6",
          },
          {
            label: "Pending Payments",
            value: pendingCount.toString(),
            icon: AlertCircle,
            color: pendingCount > 0 ? "#f59e0b" : "#6b7280",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${stat.color}20` }}
                >
                  <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Payments Table ────────────────────────────────────────────── */}
      <Card>
        {isLoading ? (
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Loading…</CardContent>
        ) : !data || data.items.length === 0 ? (
          <CardContent className="py-12 text-center">
            <Receipt className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No payment records found.</p>
          </CardContent>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                    {["Date", "Receipt", "For", "Method", "Amount", "Status"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((p) => (
                    <tr
                      key={p.id}
                      style={{ borderBottom: "1px solid hsl(var(--border))" }}
                      className="hover:bg-white/3 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {format(parseISO(p.created_at), "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-foreground">
                        {p.receipt_number}
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground max-w-[180px]">
                        {paymentFor(p)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {methodLabel(p.payment_method)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        ₹{parseFloat(p.amount).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">{statusBadge(p.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.total_pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                <p className="text-xs text-muted-foreground">
                  Page {data.page} of {data.total_pages} &middot; {data.total} payments
                </p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
