"use client";

import { useMyCommissionSummary, useMyCommissions } from "@/lib/hooks/use-trainer-portal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Clock, CheckCircle2, Loader2 } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(val: string | number | undefined) {
  return `$${Number(val ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function SummaryCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  sub,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
            <Icon className="h-5 w-5" style={{ color: iconColor }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CommissionsPage() {
  const { data: summary, isLoading: loadingSummary } = useMyCommissionSummary();
  const { data: commissions, isLoading: loadingList } = useMyCommissions({ per_page: 100 });

  const items = commissions?.commissions ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Commissions</h2>
        <p className="text-sm text-muted-foreground mt-1">Your earnings and payment status</p>
      </div>

      {/* Summary Cards */}
      {loadingSummary ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            title="Total Earned"
            value={fmt(summary?.total_earnings)}
            icon={DollarSign}
            iconColor="#10b981"
            iconBg="rgba(16,185,129,0.12)"
            sub="All time"
          />
          <SummaryCard
            title="Pending"
            value={fmt(summary?.total_pending)}
            icon={Clock}
            iconColor="#f59e0b"
            iconBg="rgba(245,158,11,0.12)"
            sub="Awaiting payment"
          />
          <SummaryCard
            title="Paid Out"
            value={fmt(summary?.total_paid)}
            icon={CheckCircle2}
            iconColor="#3b82f6"
            iconBg="rgba(59,130,246,0.12)"
            sub="Received so far"
          />
        </div>
      )}

      {/* Commissions Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Commission Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingList ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <DollarSign className="h-8 w-8 text-muted-foreground opacity-30 mb-2" />
              <p className="text-sm text-muted-foreground">No commission records yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                    {["Date", "Session", "Base Amount", "Rate", "Commission", "Status"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((c: any, i: number) => {
                    const isPaid = c.status === "paid";
                    return (
                      <tr
                        key={c.id ?? i}
                        className="hover:bg-white/[0.02] transition-colors"
                        style={{ borderBottom: "1px solid hsl(var(--border)/0.5)" }}
                      >
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {c.created_at ? fmtDate(c.created_at) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-foreground font-mono">
                            {c.session_id ? c.session_id.slice(0, 8) + "..." : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground">{fmt(c.base_amount)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {c.commission_rate ? `${(Number(c.commission_rate) * 100).toFixed(0)}%` : "—"}
                        </td>
                        <td className="px-4 py-3 font-semibold" style={{ color: "#10b981" }}>
                          {fmt(c.commission_amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={
                              isPaid
                                ? { background: "rgba(16,185,129,0.12)", color: "#34d399" }
                                : { background: "rgba(245,158,11,0.12)", color: "#fbbf24" }
                            }
                          >
                            {c.status ?? "pending"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Commission payments are processed by your gym administrator
      </p>
    </div>
  );
}
