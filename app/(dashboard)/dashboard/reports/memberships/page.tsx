"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

// Color palette for charts
const STATUS_COLORS = {
  active: "#10b981", // green-500
  expired: "#f59e0b", // amber-500
  cancelled: "#ef4444", // red-500
  frozen: "#6366f1", // indigo-500
};

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];

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

  if (!report) {
    return null;
  }

  // Prepare data for status pie chart
  const statusData = [
    { name: "Active", value: report.by_status.active, color: STATUS_COLORS.active },
    { name: "Expired", value: report.by_status.expired, color: STATUS_COLORS.expired },
    { name: "Cancelled", value: report.by_status.cancelled, color: STATUS_COLORS.cancelled },
    { name: "Frozen", value: report.by_status.frozen, color: STATUS_COLORS.frozen },
  ].filter((item) => item.value > 0);

  // Prepare data for plan distribution bar chart
  const planData = report.by_plan.map((item, index) => ({
    name: item.plan_name,
    count: item.active_count,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  // Prepare data for monthly trend line chart
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
        <h1 className="text-3xl font-bold tracking-tight">Membership Report</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive overview of membership status, distribution, and trends
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Memberships</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMemberships}</div>
            <p className="text-xs text-muted-foreground">All time memberships</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.by_status.active}</div>
            <p className="text-xs text-muted-foreground">
              {totalMemberships > 0
                ? `${((report.by_status.active / totalMemberships) * 100).toFixed(1)}% of total`
                : "No memberships"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expiring in 7 Days</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{report.expiring_in_7d}</div>
            <p className="text-xs text-muted-foreground">Urgent: needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expiring in 30 Days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.expiring_in_30d}</div>
            <p className="text-xs text-muted-foreground">Plan renewal campaigns</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Membership Status Breakdown</CardTitle>
            <CardDescription>Distribution of memberships by status</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No membership data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Active Members by Plan</CardTitle>
            <CardDescription>Distribution of active memberships across plans</CardDescription>
          </CardHeader>
          <CardContent>
            {planData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={planData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No active memberships
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Membership Growth</CardTitle>
          <CardDescription>New memberships created over the last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="new_memberships"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="New Memberships"
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

      {/* Expiring Memberships Alert */}
      {report.expiring_in_7d > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-semibold">{report.expiring_in_7d}</span> membership
            {report.expiring_in_7d === 1 ? "" : "s"} expiring in the next 7 days.{" "}
            {report.expiring_in_14d - report.expiring_in_7d > 0 && (
              <>
                Additionally, <span className="font-semibold">{report.expiring_in_14d - report.expiring_in_7d}</span>{" "}
                more will expire within 14 days.
              </>
            )}{" "}
            Consider reaching out for renewal.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
