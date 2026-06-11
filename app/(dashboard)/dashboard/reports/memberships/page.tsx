"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMembershipReport } from "@/lib/hooks/use-reports";
import { Users, TrendingUp, AlertCircle, Calendar } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
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

const STATUS_COLORS = {
  active: "#10b981",
  expired: "#f59e0b",
  cancelled: "#ef4444",
  frozen: "#6366f1",
};

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];

const darkTooltipStyle = {
  contentStyle: {
    background: "hsl(222 18% 8%)",
    border: "1px solid hsl(222 16% 14%)",
    borderRadius: "8px",
    color: "hsl(210 20% 90%)",
  },
};

export default function MembershipReportPage() {
  const { data: report, isLoading, error } = useMembershipReport();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading membership report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>Failed to load membership report. Please try again.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!report) return null;

  const statusData = [
    { name: "Active", value: report.by_status.active, color: STATUS_COLORS.active },
    { name: "Expired", value: report.by_status.expired, color: STATUS_COLORS.expired },
    { name: "Cancelled", value: report.by_status.cancelled, color: STATUS_COLORS.cancelled },
    { name: "Frozen", value: report.by_status.frozen, color: STATUS_COLORS.frozen },
  ].filter((item) => item.value > 0);

  const planData = report.by_plan.map((item, index) => ({
    name: item.plan_name,
    count: item.active_count,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const trendData = report.monthly_trend.map((item) => ({
    month: item.month,
    new_memberships: item.new_count,
  }));

  const totalMemberships =
    report.by_status.active +
    report.by_status.expired +
    report.by_status.cancelled +
    report.by_status.frozen;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight gradient-text">Membership Report</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive overview of membership status, distribution, and trends
        </p>
      </div>

      {/* Expiry Alert */}
      {report.expiring_in_7d > 0 && (
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.3)" }}
        >
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: "#f59e0b" }} />
          <p className="text-sm">
            <span className="font-semibold" style={{ color: "#f59e0b" }}>{report.expiring_in_7d}</span>{" "}
            membership{report.expiring_in_7d === 1 ? "" : "s"} expiring in the next 7 days.
            {report.expiring_in_14d - report.expiring_in_7d > 0 && (
              <> Additionally,{" "}
                <span className="font-semibold" style={{ color: "#f59e0b" }}>
                  {report.expiring_in_14d - report.expiring_in_7d}
                </span>{" "}
                more within 14 days.
              </>
            )}{" "}
            <span className="text-muted-foreground">Consider reaching out for renewal.</span>
          </p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total */}
        <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="h-1 stat-bar-blue" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Total Memberships</span>
              <div className="p-2 rounded-lg" style={{ background: "rgba(59, 130, 246, 0.1)" }}>
                <Users className="h-4 w-4" style={{ color: "#3b82f6" }} />
              </div>
            </div>
            <div className="text-3xl font-bold">{totalMemberships}</div>
            <p className="text-xs text-muted-foreground mt-1">All time memberships</p>
          </div>
        </div>

        {/* Active */}
        <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="h-1 stat-bar-green" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Active Now</span>
              <div className="p-2 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                <TrendingUp className="h-4 w-4" style={{ color: "#10b981" }} />
              </div>
            </div>
            <div className="text-3xl font-bold">{report.by_status.active}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalMemberships > 0
                ? `${((report.by_status.active / totalMemberships) * 100).toFixed(1)}% of total`
                : "No memberships"}
            </p>
          </div>
        </div>

        {/* Expiring 7d */}
        <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="h-1 stat-bar-amber" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Expiring in 7 Days</span>
              <div className="p-2 rounded-lg" style={{ background: "rgba(245, 158, 11, 0.1)" }}>
                <AlertCircle className="h-4 w-4" style={{ color: "#f59e0b" }} />
              </div>
            </div>
            <div className="text-3xl font-bold" style={{ color: report.expiring_in_7d > 0 ? "#f59e0b" : undefined }}>
              {report.expiring_in_7d}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Urgent: needs attention</p>
          </div>
        </div>

        {/* Expiring 30d */}
        <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="h-1 stat-bar-amber" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Expiring in 30 Days</span>
              <div className="p-2 rounded-lg" style={{ background: "rgba(245, 158, 11, 0.1)" }}>
                <Calendar className="h-4 w-4" style={{ color: "#f59e0b" }} />
              </div>
            </div>
            <div className="text-3xl font-bold">{report.expiring_in_30d}</div>
            <p className="text-xs text-muted-foreground mt-1">Plan renewal campaigns</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Pie Chart */}
        <div className="rounded-xl p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
              <Users className="h-4 w-4" style={{ color: "#10b981" }} />
            </div>
            <div>
              <h2 className="font-semibold">Membership Status Breakdown</h2>
              <p className="text-sm text-muted-foreground">Distribution by status</p>
            </div>
          </div>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={90}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...darkTooltipStyle} />
                <Legend wrapperStyle={{ color: "hsl(215 14% 48%)", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-muted-foreground">
              No membership data available
            </div>
          )}
        </div>

        {/* Plan Distribution Bar Chart */}
        <div className="rounded-xl p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg" style={{ background: "rgba(59, 130, 246, 0.1)" }}>
              <TrendingUp className="h-4 w-4" style={{ color: "#3b82f6" }} />
            </div>
            <div>
              <h2 className="font-semibold">Active Members by Plan</h2>
              <p className="text-sm text-muted-foreground">Distribution across plans</p>
            </div>
          </div>
          {planData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={planData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 16% 14%)" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
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
                <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-muted-foreground">
              No active memberships
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="rounded-xl p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
            <TrendingUp className="h-4 w-4" style={{ color: "#10b981" }} />
          </div>
          <div>
            <h2 className="font-semibold">Monthly Membership Growth</h2>
            <p className="text-sm text-muted-foreground">New memberships over the last 12 months</p>
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
              <Line
                type="monotone"
                dataKey="new_memberships"
                stroke="#10b981"
                strokeWidth={2}
                name="New Memberships"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[280px] text-muted-foreground">
            No trend data available
          </div>
        )}
      </div>
    </div>
  );
}
