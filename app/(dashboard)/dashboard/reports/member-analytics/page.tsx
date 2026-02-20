"use client";

import { useState, useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMemberAnalytics } from "@/lib/hooks/use-reports";
import { Users, TrendingUp, TrendingDown, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

const RANGE_OPTIONS = [
  { label: "Last 30 Days", days: 30 },
  { label: "Last 90 Days", days: 90 },
  { label: "Last 180 Days", days: 180 },
  { label: "Last 365 Days", days: 365 },
];

const PLAN_COLORS = ["#10b981", "#8b5cf6", "#3b82f6", "#f59e0b", "#06b6d4", "#ec4899"];

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

export default function MemberAnalyticsPage() {
  const [selectedDays, setSelectedDays] = useState(90);

  const dateRange = useMemo(() => getDateRange(selectedDays), [selectedDays]);

  const { data: analytics, isLoading, error } = useMemberAnalytics(dateRange);

  const netGrowth = analytics
    ? analytics.total_new_members - analytics.total_churned_members
    : 0;

  const growthData = analytics?.monthly_growth.map((item) => ({
    month: item.month,
    "New Members": item.new_members,
    Churned: item.churned_members,
    "Net Growth": item.net_growth,
    "Total Active": item.total_active,
  })) ?? [];

  const planData = analytics?.by_membership_type.map((item, index) => ({
    name: item.plan_name,
    count: item.active_count,
    percentage: item.percentage,
    fill: PLAN_COLORS[index % PLAN_COLORS.length],
  })) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Member Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Growth metrics and membership type distribution
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
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

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading member analytics...</div>
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load member analytics. Please try again.</AlertDescription>
        </Alert>
      )}

      {analytics && (
        <>
          {/* Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Active */}
            <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="h-1 stat-bar-blue" />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Total Active</span>
                  <div className="p-2 rounded-lg" style={{ background: "rgba(59, 130, 246, 0.1)" }}>
                    <Users className="h-4 w-4" style={{ color: "#3b82f6" }} />
                  </div>
                </div>
                <div className="text-3xl font-bold">{analytics.total_active_members}</div>
                <p className="text-xs text-muted-foreground mt-1">Active members now</p>
              </div>
            </div>

            {/* New Members */}
            <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="h-1 stat-bar-green" />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">New Members</span>
                  <div className="p-2 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                    <TrendingUp className="h-4 w-4" style={{ color: "#10b981" }} />
                  </div>
                </div>
                <div className="text-3xl font-bold" style={{ color: "#10b981" }}>
                  +{analytics.total_new_members}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Joined in period</p>
              </div>
            </div>

            {/* Churned */}
            <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="h-1 stat-bar-amber" />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Churned</span>
                  <div className="p-2 rounded-lg" style={{ background: "rgba(239, 68, 68, 0.1)" }}>
                    <TrendingDown className="h-4 w-4" style={{ color: "#ef4444" }} />
                  </div>
                </div>
                <div className="text-3xl font-bold" style={{ color: "#ef4444" }}>
                  -{analytics.total_churned_members}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Left in period</p>
              </div>
            </div>

            {/* Net Growth */}
            <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className={`h-1 ${netGrowth >= 0 ? "stat-bar-green" : "stat-bar-amber"}`} />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Net Growth</span>
                  <div className="p-2 rounded-lg" style={{ background: netGrowth >= 0 ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)" }}>
                    <Activity className="h-4 w-4" style={{ color: netGrowth >= 0 ? "#10b981" : "#ef4444" }} />
                  </div>
                </div>
                <div className="text-3xl font-bold" style={{ color: netGrowth >= 0 ? "#10b981" : "#ef4444" }}>
                  {netGrowth >= 0 ? "+" : ""}{netGrowth}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Net change in period</p>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Monthly Growth Trend */}
            <div className="rounded-xl p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                  <TrendingUp className="h-4 w-4" style={{ color: "#10b981" }} />
                </div>
                <div>
                  <h2 className="font-semibold">Monthly Growth Trend</h2>
                  <p className="text-sm text-muted-foreground">New vs churned members per month</p>
                </div>
              </div>
              {growthData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={growthData}>
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
                    <Line
                      type="monotone"
                      dataKey="New Members"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="Churned"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="Net Growth"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      strokeDasharray="4 2"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                  No growth data for this period
                </div>
              )}
            </div>

            {/* Plan Distribution */}
            <div className="rounded-xl p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg" style={{ background: "rgba(139, 92, 246, 0.1)" }}>
                  <Users className="h-4 w-4" style={{ color: "#8b5cf6" }} />
                </div>
                <div>
                  <h2 className="font-semibold">Membership Plan Distribution</h2>
                  <p className="text-sm text-muted-foreground">Active members by plan</p>
                </div>
              </div>
              {planData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={planData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 16% 14%)" />
                    <XAxis
                      dataKey="name"
                      angle={-30}
                      textAnchor="end"
                      height={60}
                      tick={{ fill: "hsl(215 14% 48%)", fontSize: 11 }}
                      axisLine={{ stroke: "hsl(222 16% 14%)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "hsl(215 14% 48%)", fontSize: 11 }}
                      axisLine={{ stroke: "hsl(222 16% 14%)" }}
                      tickLine={false}
                    />
                    <Tooltip
                      {...darkTooltipStyle}
                      formatter={(value: number, name: string, props: { payload?: { percentage?: number } }) => [
                        `${value} (${props.payload?.percentage?.toFixed(1) ?? 0}%)`,
                        "Active Members",
                      ]}
                    />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                      {planData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                  No active memberships
                </div>
              )}
            </div>
          </div>

          {/* Total Active Trend */}
          {growthData.length > 0 && (
            <div className="rounded-xl p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg" style={{ background: "rgba(6, 182, 212, 0.1)" }}>
                  <Activity className="h-4 w-4" style={{ color: "#06b6d4" }} />
                </div>
                <div>
                  <h2 className="font-semibold">Total Active Members Over Time</h2>
                  <p className="text-sm text-muted-foreground">Cumulative active member count</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={growthData}>
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
                  <Line
                    type="monotone"
                    dataKey="Total Active"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={false}
                    fill="rgba(6, 182, 212, 0.08)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Plan Distribution Table */}
          {planData.length > 0 && (
            <div className="rounded-xl p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                  <Users className="h-4 w-4" style={{ color: "#10b981" }} />
                </div>
                <div>
                  <h2 className="font-semibold">Plan Breakdown</h2>
                  <p className="text-sm text-muted-foreground">Detailed distribution</p>
                </div>
              </div>
              <div className="space-y-3">
                {planData.map((plan, index) => (
                  <div key={plan.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: plan.fill }} />
                        <span className="text-sm font-medium">{plan.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">{plan.count} members</span>
                        <span className="font-semibold" style={{ color: plan.fill }}>
                          {plan.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "hsl(var(--border))" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${plan.percentage}%`, background: plan.fill }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
