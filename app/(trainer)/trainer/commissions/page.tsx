"use client";

import { useMyCommissionSummary, useMyCommissions } from "@/lib/hooks/use-trainer-portal";
import type { CommissionSummaryItem } from "@/types/api";
import { DollarSign, Clock, CheckCircle2, Loader2, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtINR(val: string | number | undefined) {
  return `₹${Number(val ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

function fmtPeriod(yyyyMM: string) {
  const [y, m] = yyyyMM.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  title, value, sub, iconColor, iconBg, icon: Icon,
}: {
  title: string; value: string; sub?: string;
  iconColor: string; iconBg: string; icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
          <Icon className="h-5 w-5" style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs shadow-xl"
      style={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }}
    >
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p style={{ color: "#10b981" }}>Earnings: {fmtINR(payload[0]?.value)}</p>
      <p className="text-muted-foreground">{payload[0]?.payload?.total_sessions} session{payload[0]?.payload?.total_sessions !== 1 ? "s" : ""}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CommissionsPage() {
  const { data: summary, isLoading: loadingSummary } = useMyCommissionSummary();
  const { data: commissions, isLoading: loadingList }  = useMyCommissions({ per_page: 100 });

  const items = commissions?.commissions ?? [];

  // Sort periods chronologically for the chart
  const chartData = [...(summary?.by_period ?? [])]
    .sort((a, b) => a.period.localeCompare(b.period))
    .map((p: CommissionSummaryItem) => ({
      period: fmtPeriod(p.period),
      earnings: Number(p.total_commission),
      total_sessions: p.total_sessions,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Earnings</h2>
        <p className="text-sm text-muted-foreground mt-1">Your commission earnings and payment history</p>
      </div>

      {/* Summary Cards */}
      {loadingSummary ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Earned"
            value={fmtINR(summary?.total_earnings)}
            sub="All time"
            icon={TrendingUp}
            iconColor="#10b981"
            iconBg="rgba(16,185,129,0.12)"
          />
          <StatCard
            title="Pending Payout"
            value={fmtINR(summary?.total_pending)}
            sub="Awaiting payment from gym"
            icon={Clock}
            iconColor="#f59e0b"
            iconBg="rgba(245,158,11,0.12)"
          />
          <StatCard
            title="Paid Out"
            value={fmtINR(summary?.total_paid)}
            sub="Received so far"
            icon={CheckCircle2}
            iconColor="#3b82f6"
            iconBg="rgba(59,130,246,0.12)"
          />
        </div>
      )}

      {/* Monthly Earnings Chart */}
      {chartData.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <p className="text-sm font-semibold text-foreground mb-4">Monthly Earnings</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={32}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="earnings" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Commission Records */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        <div className="px-5 py-4" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          <p className="text-sm font-semibold text-foreground">Commission Records</p>
        </div>

        {loadingList ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <DollarSign className="h-8 w-8 text-muted-foreground opacity-25 mb-2" />
            <p className="text-sm text-muted-foreground">No commission records yet</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Commissions are recorded when your PT sessions are completed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                  {["Date", "Period", "Base Amount", "Rate", "Your Earnings", "Status"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((c, i) => {
                  const isPaid    = c.status === "paid";
                  const isCancelled = c.status === "cancelled";
                  const period    = c.commission_period
                    ? fmtPeriod(c.commission_period.slice(0, 7))
                    : "—";
                  return (
                    <tr
                      key={c.id ?? i}
                      className="hover:bg-white/[0.02] transition-colors"
                      style={{ borderBottom: "1px solid hsl(var(--border)/0.4)" }}
                    >
                      <td className="px-4 py-3 text-[11px] text-muted-foreground">
                        {c.created_at ? fmtDate(c.created_at) : "—"}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-foreground">{period}</td>
                      <td className="px-4 py-3 text-[12px] text-foreground">{fmtINR(c.base_amount)}</td>
                      <td className="px-4 py-3 text-[12px] text-muted-foreground">
                        {c.commission_rate ? `${Number(c.commission_rate).toFixed(0)}%` : "—"}
                      </td>
                      <td className="px-4 py-3 text-[12px] font-semibold" style={{ color: isCancelled ? "#6b7280" : "#10b981" }}>
                        {fmtINR(c.commission_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={
                            isPaid
                              ? { background: "rgba(59,130,246,0.12)", color: "#60a5fa" }
                              : isCancelled
                                ? { background: "rgba(239,68,68,0.1)", color: "#f87171" }
                                : { background: "rgba(245,158,11,0.12)", color: "#fbbf24" }
                          }
                        >
                          {isPaid ? "Paid" : isCancelled ? "Cancelled" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground text-center pb-2">
        Commission payments are processed by your gym administrator.
      </p>
    </div>
  );
}
