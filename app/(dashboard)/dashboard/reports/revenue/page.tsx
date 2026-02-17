"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRevenueAnalytics } from "@/lib/hooks/use-reports";
import { DollarSign, TrendingUp, CreditCard, Calendar } from "lucide-react";
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

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  cash: "#10b981", // green
  upi: "#3b82f6", // blue
  card: "#8b5cf6", // purple
  bank_transfer: "#f59e0b", // amber
  other: "#6b7280", // gray
};

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];

export default function RevenueAnalyticsPage() {
  const [dateRange, setDateRange] = useState<"all" | "30d" | "90d" | "1y">("30d");

  // Calculate date range params
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

  if (!analytics) {
    return null;
  }

  // Prepare data for payment method pie chart
  const paymentMethodData = analytics.by_payment_method.map((item) => ({
    name: item.payment_method.replace("_", " ").toUpperCase(),
    value: item.total_amount,
    count: item.transaction_count,
    avg: item.avg_transaction_value,
    percentage: item.percentage_of_total,
    color: PAYMENT_METHOD_COLORS[item.payment_method] || PAYMENT_METHOD_COLORS.other,
  }));

  // Prepare data for monthly trend
  const monthlyData = analytics.monthly_trend.map((item) => ({
    month: item.month,
    revenue: item.total_revenue,
    transactions: item.transaction_count,
    avg_value: item.avg_transaction_value,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Revenue Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Revenue breakdown by payment method and monthly trends
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={dateRange === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange("all")}
          >
            All Time
          </Button>
          <Button
            variant={dateRange === "30d" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange("30d")}
          >
            Last 30 Days
          </Button>
          <Button
            variant={dateRange === "90d" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange("90d")}
          >
            Last 90 Days
          </Button>
          <Button
            variant={dateRange === "1y" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange("1y")}
          >
            Last Year
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{analytics.total_revenue.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground">
              {dateRange === "all" ? "All time revenue" : `Last ${dateRange}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_transactions}</div>
            <p className="text-xs text-muted-foreground">Payment transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Transaction Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{analytics.avg_transaction_value.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Method Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Payment Method</CardTitle>
            <CardDescription>Distribution of revenue across payment methods</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentMethodData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No payment data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method Details Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method Details</CardTitle>
            <CardDescription>Detailed breakdown of each payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentMethodData.map((item, index) => (
                <div key={index} className="flex items-center justify-between pb-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.count} transaction{item.count === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{item.value.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-muted-foreground">
                      Avg: ₹{item.avg.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Trend Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue Trend</CardTitle>
          <CardDescription>Revenue and transaction trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === "revenue" || name === "avg_value") {
                      return `₹${value.toLocaleString("en-IN")}`;
                    }
                    return value;
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Revenue"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="transactions"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Transactions"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No trend data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
