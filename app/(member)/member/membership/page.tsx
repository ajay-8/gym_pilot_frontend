"use client";

import { useState } from "react";
import { useMyMemberships } from "@/lib/hooks/use-member-portal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, parseISO, differenceInDays } from "date-fns";
import { CreditCard, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const variants: Record<string, { label: string; color: string }> = {
    active:    { label: "Active",    color: "#10b981" },
    expired:   { label: "Expired",   color: "#ef4444" },
    cancelled: { label: "Cancelled", color: "#6b7280" },
    frozen:    { label: "Frozen",    color: "#3b82f6" },
    suspended: { label: "Suspended", color: "#f59e0b" },
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MembershipPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyMemberships({ page, page_size: 10 });

  const activeMembership = data?.items.find((m) => m.status === "active");

  return (
    <div className="space-y-6">
      {/* ── Active Membership Card ─────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Current Membership</h2>
        {isLoading ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">Loading…</CardContent></Card>
        ) : activeMembership ? (
          <Card style={{ border: "1px solid rgba(59,130,246,0.2)", background: "rgba(59,130,246,0.04)" }}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(59,130,246,0.12)" }}
                >
                  <CreditCard className="h-5 w-5" style={{ color: "#3b82f6" }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        {activeMembership.plan?.name ?? "Membership Plan"}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Plan ID: {activeMembership.plan_id ?? "—"}</p>
                    </div>
                    {statusBadge(activeMembership.status)}
                  </div>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Start Date</p>
                      <p className="font-medium text-foreground">
                        {format(parseISO(activeMembership.start_date), "dd MMM yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Expiry</p>
                      <p className="font-medium text-foreground">
                        {activeMembership.end_date
                          ? format(parseISO(activeMembership.end_date), "dd MMM yyyy")
                          : "Lifetime"}
                      </p>
                    </div>
                    {activeMembership.end_date && (
                      <div>
                        <p className="text-xs text-muted-foreground">Days Left</p>
                        <p
                          className="font-semibold"
                          style={{
                            color: differenceInDays(parseISO(activeMembership.end_date), new Date()) <= 7
                              ? "#ef4444"
                              : differenceInDays(parseISO(activeMembership.end_date), new Date()) <= 30
                              ? "#f59e0b"
                              : "#10b981",
                          }}
                        >
                          {Math.max(0, differenceInDays(parseISO(activeMembership.end_date), new Date()))}d
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Amount Paid</p>
                      <p className="font-medium text-foreground">
                        {activeMembership.amount_paid
                          ? `₹${parseFloat(activeMembership.amount_paid).toLocaleString("en-IN")}`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card style={{ border: "1px solid rgba(239,68,68,0.15)" }}>
            <CardContent className="flex items-center gap-3 py-5">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">No active membership</p>
                <p className="text-xs text-muted-foreground">Contact your gym admin to renew.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Membership History ─────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Membership History</h2>
        <Card>
          {isLoading ? (
            <CardContent className="py-10 text-center text-sm text-muted-foreground">Loading…</CardContent>
          ) : !data || data.items.length === 0 ? (
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No membership records found.
            </CardContent>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                      {["Plan", "Status", "Start Date", "End Date", "Amount Paid"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((m) => (
                      <tr
                        key={m.id}
                        style={{ borderBottom: "1px solid hsl(var(--border))" }}
                        className="hover:bg-white/3 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {m.plan?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3">{statusBadge(m.status)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {format(parseISO(m.start_date), "dd MMM yyyy")}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {m.end_date ? format(parseISO(m.end_date), "dd MMM yyyy") : "Lifetime"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {m.amount_paid
                            ? `₹${parseFloat(m.amount_paid).toLocaleString("en-IN")}`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data.total_pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                  <p className="text-xs text-muted-foreground">
                    Page {data.page} of {data.total_pages} &middot; {data.total} records
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
    </div>
  );
}
