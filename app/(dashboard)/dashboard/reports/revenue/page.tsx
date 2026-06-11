"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRevenueAnalytics } from "@/lib/hooks/use-reports";
import { IndianRupee, TrendingUp, CreditCard, RotateCcw } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  cash: "#10b981",
  upi: "#3b82f6",
  card: "#8b5cf6",
  bank_transfer: "#f59e0b",
  other: "#6b7280",
};

const darkTooltipStyle = {
  contentStyle: {
    background: "hsl(222 18% 8%)",
    border: "1px solid hsl(222 16% 14%)",
    borderRadius: "8px",
    color: "hsl(210 20% 90%)",
  },
};

// Returns start of the Indian financial year for a given date (April 1).
function getFYStart(d: Date): Date {
  const month = d.getMonth(); // 0-indexed; March = 2, April = 3
  const year = month >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return new Date(year, 3, 1); // April 1
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function RevenueAnalyticsPage() {
  const [dateRange, setDateRange] = useState<"fy" | "30d" | "90d" | "last_fy">("30d");

  const getDateParams = () => {
    const today = new Date();
    if (dateRange === "30d") {
      const from = new Date(today);
      from.setDate(from.getDate() - 30);
      return { date_from: toDateStr(from), date_to: toDateStr(today) };
    }
    if (dateRange === "90d") {
      const from = new Date(today);
      from.setDate(from.getDate() - 90);
      return { date_from: toDateStr(from), date_to: toDateStr(today) };
    }
    if (dateRange === "fy") {
      // This financial year: April 1 of current FY to today
      return { date_from: toDateStr(getFYStart(today)), date_to: toDateStr(today) };
    }
    if (dateRange === "last_fy") {
      // Previous complete financial year: April 1 (last FY) to March 31 (end of last FY)
      const thisStart = getFYStart(today);
      const lastStart = new Date(thisStart.getFullYear() - 1, 3, 1);
      const lastEnd = new Date(thisStart.getFullYear(), 2, 31); // March 31
      return { date_from: toDateStr(lastStart), date_to: toDateStr(lastEnd) };
    }
    return undefined;
  };

  const { data: analytics, isLoading, error } = useRevenueAnalytics(getDateParams());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading revenue analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>Failed to load revenue analytics. Please try again.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!analytics) return null;

  const paymentMethodData = analytics.by_payment_method.map((item) => ({
    name: item.payment_method.replace("_", " ").toUpperCase(),
    value: item.total_amount,
    count: item.transaction_count,
    percentage: item.percentage_of_total,
    color: PAYMENT_METHOD_COLORS[item.payment_method] || PAYMENT_METHOD_COLORS.other,
  }));

  // Build year-on-year chart data — one column per FY month (Apr…Mar), one line per FY
  const FY_MONTHS = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];
  const FY_COLORS = ["#10b981","#8b5cf6","#3b82f6","#f59e0b","#ec4899","#06b6d4"];
  const fyList = [...new Set((analytics.fy_trend ?? []).map(d => d.fy))].sort();
  const fyChartData = FY_MONTHS.map((abbr, i) => {
    const entry: Record<string, string | number | null> = { month: abbr, month_in_fy: i + 1 };
    fyList.forEach(fy => {
      const found = (analytics.fy_trend ?? []).find(d => d.fy === fy && d.month_abbr === abbr);
      entry[fy] = found ? Number(found.revenue) : null;
    });
    return entry;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight gradient-text">Revenue Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Revenue breakdown by payment method and monthly trends
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["fy", "30d", "90d", "last_fy"] as const).map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(range)}
            >
              {range === "fy" ? "This FY" : range === "30d" ? "Last 30 Days" : range === "90d" ? "Last 90 Days" : "Last FY"}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total Revenue */}
        <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="h-1 stat-bar-green" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <div className="p-2 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                <IndianRupee className="h-4 w-4" style={{ color: "#10b981" }} />
              </div>
            </div>
            <div className="text-3xl font-bold">₹{analytics.total_revenue.toLocaleString("en-IN")}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {dateRange === "fy" ? "This financial year" : dateRange === "last_fy" ? "Last financial year" : `Last ${dateRange}`}
            </p>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="h-1 stat-bar-purple" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Total Transactions</span>
              <div className="p-2 rounded-lg" style={{ background: "rgba(139, 92, 246, 0.1)" }}>
                <CreditCard className="h-4 w-4" style={{ color: "#8b5cf6" }} />
              </div>
            </div>
            <div className="text-3xl font-bold">{analytics.total_transactions}</div>
            <p className="text-xs text-muted-foreground mt-1">Payment transactions</p>
          </div>
        </div>

        {/* Total Refunded */}
        <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="h-1 stat-bar-amber" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Refunded Amount</span>
              <div className="p-2 rounded-lg" style={{ background: "rgba(249, 115, 22, 0.1)" }}>
                <RotateCcw className="h-4 w-4" style={{ color: "#f97316" }} />
              </div>
            </div>
            <div className="text-3xl font-bold" style={{ color: "#f97316" }}>
              ₹{Number(analytics.total_refunded).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Refunded in this period</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie Chart */}
        <div className="rounded-xl p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
              <IndianRupee className="h-4 w-4" style={{ color: "#10b981" }} />
            </div>
            <div>
              <h2 className="font-semibold">Revenue by Payment Method</h2>
              <p className="text-sm text-muted-foreground">Distribution across payment methods</p>
            </div>
          </div>
          {paymentMethodData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}
                  outerRadius={90}
                  dataKey="value"
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  {...darkTooltipStyle}
                  formatter={(value: number | undefined) => `₹${(value ?? 0).toLocaleString("en-IN")}`}
                />
                <Legend wrapperStyle={{ color: "hsl(215 14% 48%)", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-muted-foreground">
              No payment data available
            </div>
          )}
        </div>

        {/* Payment Method Details */}
        <div className="rounded-xl p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg" style={{ background: "rgba(139, 92, 246, 0.1)" }}>
              <CreditCard className="h-4 w-4" style={{ color: "#8b5cf6" }} />
            </div>
            <div>
              <h2 className="font-semibold">Payment Method Details</h2>
              <p className="text-sm text-muted-foreground">Detailed breakdown by method</p>
            </div>
          </div>
          <div className="space-y-4">
            {paymentMethodData.map((item, index) => (
              <div key={index} className="flex items-center justify-between pb-4 border-b border-border last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.count} transaction{item.count === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">₹{item.value.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-muted-foreground">
                    {Number(item.percentage).toFixed(1)}% of total
                  </p>
                </div>
              </div>
            ))}
            {paymentMethodData.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No payment data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Year-on-Year Revenue */}
      <div className="rounded-xl p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
            <TrendingUp className="h-4 w-4" style={{ color: "#10b981" }} />
          </div>
          <div>
            <h2 className="font-semibold">Year-on-Year Revenue</h2>
            <p className="text-sm text-muted-foreground">Monthly revenue compared across financial years (Apr → Mar)</p>
          </div>
        </div>
        {fyList.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={fyChartData}>
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
                tickFormatter={(v: number) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
              />
              <Tooltip
                {...darkTooltipStyle}
                formatter={(value) =>
                  value != null ? `₹${Number(value).toLocaleString("en-IN")}` : "—"
                }
              />
              <Legend wrapperStyle={{ color: "hsl(215 14% 48%)", fontSize: 12 }} />
              {fyList.map((fy, i) => (
                <Line
                  key={fy}
                  type="monotone"
                  dataKey={fy}
                  stroke={FY_COLORS[i % FY_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No trend data available
          </div>
        )}
      </div>
    </div>
  );
}
