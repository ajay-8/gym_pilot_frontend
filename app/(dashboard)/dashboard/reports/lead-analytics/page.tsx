"use client";

import { useState, useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLeadAnalytics } from "@/lib/hooks/use-reports";
import { Users, TrendingUp, TrendingDown, Target, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const RANGE_OPTIONS = [
  { label: "Last 30 Days", days: 30 },
  { label: "Last 90 Days", days: 90 },
  { label: "Last 180 Days", days: 180 },
  { label: "Last 365 Days", days: 365 },
];

const SOURCE_COLORS: Record<string, string> = {
  walk_in: "#10b981",
  phone_inquiry: "#3b82f6",
  web_form: "#8b5cf6",
  referral: "#f59e0b",
  social_media: "#06b6d4",
  advertisement: "#ec4899",
  other: "#6b7280",
};

const LOST_REASON_COLORS = ["#ef4444", "#f59e0b", "#8b5cf6", "#3b82f6", "#6b7280"];

const darkTooltipStyle = {
  contentStyle: {
    background: "hsl(222 18% 8%)",
    border: "1px solid hsl(222 16% 14%)",
    borderRadius: "8px",
    color: "hsl(210 20% 90%)",
  },
};

function getDateRange(days: number): { date_from: string; date_to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    date_from: from.toISOString().slice(0, 10),
    date_to: to.toISOString().slice(0, 10),
  };
}

function fmtSource(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function LeadAnalyticsPage() {
  const [selectedDays, setSelectedDays] = useState(90);
  const dateRange = useMemo(() => getDateRange(selectedDays), [selectedDays]);

  const { data: analytics, isLoading, error } = useLeadAnalytics(dateRange);

  const sourceData = analytics?.by_source.map((s) => ({
    name: fmtSource(s.source),
    "Total Leads": s.total_leads,
    Converted: s.converted,
    Lost: s.lost,
    fill: SOURCE_COLORS[s.source] ?? "#6b7280",
  })) ?? [];

  const trendData = analytics?.monthly_trend.map((t) => ({
    month: t.month,
    "Total Leads": t.total_leads,
    Converted: t.converted,
    Lost: t.lost,
  })) ?? [];

  const conversionRate = analytics
    ? (analytics.overall_conversion_rate * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight gradient-text">Lead Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Conversion metrics and source breakdown
          </p>
        </div>

        {/* Date Range Selector */}
        <div
          className="flex gap-1 p-1 rounded-lg"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => setSelectedDays(opt.days)}
              className="px-3 py-1.5 text-sm rounded-md transition-all duration-150 font-medium"
              style={
                selectedDays === opt.days
                  ? { background: "rgba(16,185,129,0.15)", color: "#10b981" }
                  : { color: "hsl(215 14% 48%)" }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading lead analytics...</div>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load lead analytics. Please try again.</AlertDescription>
        </Alert>
      )}

      {analytics && (
        <>
          {/* Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="h-1 stat-bar-blue" />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Total Leads</span>
                  <div className="p-2 rounded-lg" style={{ background: "rgba(59, 130, 246, 0.1)" }}>
                    <Users className="h-4 w-4" style={{ color: "#3b82f6" }} />
                  </div>
                </div>
                <div className="text-3xl font-bold">{analytics.total_leads}</div>
                <p className="text-xs text-muted-foreground mt-1">In period</p>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="h-1 stat-bar-green" />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Converted</span>
                  <div className="p-2 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                    <TrendingUp className="h-4 w-4" style={{ color: "#10b981" }} />
                  </div>
                </div>
                <div className="text-3xl font-bold" style={{ color: "#10b981" }}>
                  {analytics.total_converted}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Became members</p>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="h-1 stat-bar-amber" />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Lost</span>
                  <div className="p-2 rounded-lg" style={{ background: "rgba(239, 68, 68, 0.1)" }}>
                    <TrendingDown className="h-4 w-4" style={{ color: "#ef4444" }} />
                  </div>
                </div>
                <div className="text-3xl font-bold" style={{ color: "#ef4444" }}>
                  {analytics.total_lost}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Dropped off</p>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="h-1 stat-bar-purple" />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <div className="p-2 rounded-lg" style={{ background: "rgba(139, 92, 246, 0.1)" }}>
                    <BarChart3 className="h-4 w-4" style={{ color: "#8b5cf6" }} />
                  </div>
                </div>
                <div className="text-3xl font-bold" style={{ color: "#8b5cf6" }}>
                  {analytics.total_active}
                </div>
                <p className="text-xs text-muted-foreground mt-1">In pipeline</p>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="h-1 stat-bar-green" />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Conv. Rate</span>
                  <div className="p-2 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                    <Target className="h-4 w-4" style={{ color: "#10b981" }} />
                  </div>
                </div>
                <div className="text-3xl font-bold" style={{ color: "#10b981" }}>
                  {conversionRate}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Lead → member</p>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Source Breakdown */}
            <div className="rounded-xl p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg" style={{ background: "rgba(59, 130, 246, 0.1)" }}>
                  <BarChart3 className="h-4 w-4" style={{ color: "#3b82f6" }} />
                </div>
                <div>
                  <h2 className="font-semibold">Leads by Source</h2>
                  <p className="text-sm text-muted-foreground">Total and converted per channel</p>
                </div>
              </div>
              {sourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sourceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 16% 14%)" />
                    <XAxis
                      dataKey="name"
                      angle={-30}
                      textAnchor="end"
                      height={60}
                      tick={{ fill: "hsl(215 14% 48%)", fontSize: 10 }}
                      axisLine={{ stroke: "hsl(222 16% 14%)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "hsl(215 14% 48%)", fontSize: 11 }}
                      axisLine={{ stroke: "hsl(222 16% 14%)" }}
                      tickLine={false}
                    />
                    <Tooltip {...darkTooltipStyle} />
                    <Legend wrapperStyle={{ color: "hsl(215 14% 48%)", fontSize: 12 }} />
                    <Bar dataKey="Total Leads" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Converted" fill="#10b981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                  No source data for this period
                </div>
              )}
            </div>

            {/* Monthly Trend */}
            <div className="rounded-xl p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                  <TrendingUp className="h-4 w-4" style={{ color: "#10b981" }} />
                </div>
                <div>
                  <h2 className="font-semibold">Monthly Lead Trend</h2>
                  <p className="text-sm text-muted-foreground">Leads, converted and lost over time</p>
                </div>
              </div>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 16% 14%)" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "hsl(215 14% 48%)", fontSize: 11 }}
                      axisLine={{ stroke: "hsl(222 16% 14%)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "hsl(215 14% 48%)", fontSize: 11 }}
                      axisLine={{ stroke: "hsl(222 16% 14%)" }}
                      tickLine={false}
                    />
                    <Tooltip {...darkTooltipStyle} />
                    <Legend wrapperStyle={{ color: "hsl(215 14% 48%)", fontSize: 12 }} />
                    <Line type="monotone" dataKey="Total Leads" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Converted" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Lost" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                  No trend data for this period
                </div>
              )}
            </div>
          </div>

          {/* Lost Reasons */}
          {analytics.lost_reasons.length > 0 && (
            <div className="rounded-xl p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg" style={{ background: "rgba(239, 68, 68, 0.1)" }}>
                  <TrendingDown className="h-4 w-4" style={{ color: "#ef4444" }} />
                </div>
                <div>
                  <h2 className="font-semibold">Why Leads Are Lost</h2>
                  <p className="text-sm text-muted-foreground">Top reasons for lead drop-off</p>
                </div>
              </div>
              <div className="space-y-3">
                {analytics.lost_reasons.map((r, index) => (
                  <div key={r.reason}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: LOST_REASON_COLORS[index % LOST_REASON_COLORS.length] }}
                        />
                        <span className="text-sm font-medium capitalize">{r.reason.replace(/_/g, " ")}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">{r.count} leads</span>
                        <span
                          className="font-semibold"
                          style={{ color: LOST_REASON_COLORS[index % LOST_REASON_COLORS.length] }}
                        >
                          {Number(r.percentage).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "hsl(var(--border))" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${r.percentage}%`,
                          background: LOST_REASON_COLORS[index % LOST_REASON_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversion by Source Table */}
          {sourceData.length > 0 && (
            <div className="rounded-xl p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                  <Target className="h-4 w-4" style={{ color: "#10b981" }} />
                </div>
                <div>
                  <h2 className="font-semibold">Conversion by Source</h2>
                  <p className="text-sm text-muted-foreground">Which channels convert best</p>
                </div>
              </div>
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid hsl(var(--border)/0.5)" }}
              >
                <div className="overflow-x-auto">
                <div className="min-w-[400px]">
                <div
                  className="grid grid-cols-5 px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase"
                  style={{ borderBottom: "1px solid hsl(var(--border)/0.5)" }}
                >
                  <span className="col-span-2">Source</span>
                  <span className="text-right">Total</span>
                  <span className="text-right">Converted</span>
                  <span className="text-right">Rate</span>
                </div>
                {analytics.by_source.map((s) => {
                  const rate = s.total_leads > 0
                    ? ((s.converted / s.total_leads) * 100).toFixed(1)
                    : "0";
                  return (
                    <div
                      key={s.source}
                      className="grid grid-cols-5 px-4 py-2.5 text-[12px] items-center"
                      style={{ borderBottom: "1px solid hsl(var(--border)/0.3)" }}
                    >
                      <div className="col-span-2 flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: SOURCE_COLORS[s.source] ?? "#6b7280" }}
                        />
                        <span className="font-medium">{fmtSource(s.source)}</span>
                      </div>
                      <span className="text-right text-muted-foreground">{s.total_leads}</span>
                      <span className="text-right font-semibold" style={{ color: "#10b981" }}>{s.converted}</span>
                      <span className="text-right font-bold" style={{ color: parseFloat(rate) >= 50 ? "#10b981" : parseFloat(rate) >= 25 ? "#f59e0b" : "#ef4444" }}>
                        {rate}%
                      </span>
                    </div>
                  );
                })}
                </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
