"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRevenueAnalytics } from "@/lib/hooks/use-reports";
import { DollarSign, TrendingUp, CreditCard } from "lucide-react";
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

export default function RevenueAnalyticsPage() {
  const [dateRange, setDateRange] = useState<"all" | "30d" | "90d" | "1y">("30d");

  const getDateParams = () => {
    if (dateRange === "all") return undefined;
    const today = new Date();
    const daysBack = dateRange === "30d" ? 30 : dateRange === "90d" ? 90 : 365;
    const dateFrom = new Date(today);
    dateFrom.setDate(dateFrom.getDate() - daysBack);
    return {
      date_from: dateFrom.toISOString().split("T")[0],
      date_to: today.toISOString().split("T")[0],
    };
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
    avg: item.avg_transaction_value,
    percentage: item.percentage_of_total,
    color: PAYMENT_METHOD_COLORS[item.payment_method] || PAYMENT_METHOD_COLORS.other,
  }));

  const monthlyData = analytics.monthly_trend.map((item) => ({
    month: item.month,
    revenue: item.total_revenue,
    transactions: item.transaction_count,
    avg_value: item.avg_transaction_value,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Revenue Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Revenue breakdown by payment method and monthly trends
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "30d", "90d", "1y"] as const).map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(range)}
            >
              {range === "all" ? "All Time" : range === "30d" ? "Last 30 Days" : range === "90d" ? "Last 90 Days" : "Last Year"}
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
                <DollarSign className="h-4 w-4" style={{ color: "#10b981" }} />
              </div>
            </div>
            <div className="text-3xl font-bold">₹{analytics.total_revenue.toLocaleString("en-IN")}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {dateRange === "all" ? "All time revenue" : `Last ${dateRange}`}
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

        {/* Avg Transaction */}
        <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="h-1 stat-bar-blue" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Avg Transaction</span>
              <div className="p-2 rounded-lg" style={{ background: "rgba(59, 130, 246, 0.1)" }}>
                <TrendingUp className="h-4 w-4" style={{ color: "#3b82f6" }} />
              </div>
            </div>
            <div className="text-3xl font-bold">₹{analytics.avg_transaction_value.toLocaleString("en-IN")}</div>
            <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie Chart */}
        <div className="rounded-xl p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
              <DollarSign className="h-4 w-4" style={{ color: "#10b981" }} />
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
                    Avg: ₹{item.avg.toLocaleString("en-IN")}
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

      {/* Monthly Revenue Trend */}
      <div className="rounded-xl p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
            <TrendingUp className="h-4 w-4" style={{ color: "#10b981" }} />
          </div>
          <div>
            <h2 className="font-semibold">Monthly Revenue Trend</h2>
            <p className="text-sm text-muted-foreground">Revenue and transaction trends over time</p>
          </div>
        </div>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 16% 14%)" />
              <XAxis
                dataKey="month"
                tick={{ fill: "hsl(215 14% 48%)", fontSize: 11 }}
                axisLine={{ stroke: "hsl(222 16% 14%)" }}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: "hsl(215 14% 48%)", fontSize: 11 }}
                axisLine={{ stroke: "hsl(222 16% 14%)" }}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "hsl(215 14% 48%)", fontSize: 11 }}
                axisLine={{ stroke: "hsl(222 16% 14%)" }}
                tickLine={false}
              />
              <Tooltip
                {...darkTooltipStyle}
                formatter={(value: number | undefined, name: string | undefined) => {
                  const v = value ?? 0;
                  if (name === "revenue" || name === "avg_value") {
                    return `₹${v.toLocaleString("en-IN")}`;
                  }
                  return v;
                }}
              />
              <Legend wrapperStyle={{ color: "hsl(215 14% 48%)", fontSize: 12 }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                name="Revenue"
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="transactions"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Transactions"
                dot={false}
              />
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
