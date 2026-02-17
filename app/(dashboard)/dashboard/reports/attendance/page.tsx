"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAttendanceReport } from "@/lib/hooks/use-reports";
import { Users, TrendingUp, Calendar, UserCheck } from "lucide-react";
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
  ComposedChart,
} from "recharts";

export default function AttendanceReportPage() {
  // Default to last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo.toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(today.toISOString().split("T")[0]);

  const { data: report, isLoading, error } = useAttendanceReport({
    date_from: dateFrom,
    date_to: dateTo,
  });

  const handleQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - days);

    setDateFrom(start.toISOString().split("T")[0]);
    setDateTo(end.toISOString().split("T")[0]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading attendance report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>Failed to load attendance report. Please try again.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  // Prepare data for daily breakdown chart
  const dailyData = report.daily_breakdown.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    check_ins: item.check_in_count,
    unique_visitors: item.unique_visitors,
  }));

  // Find peak day
  const peakDay = report.daily_breakdown.reduce(
    (max, item) => (item.check_in_count > max.check_in_count ? item : max),
    report.daily_breakdown[0]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance Report</h1>
        <p className="text-muted-foreground mt-1">
          Track daily check-ins and visitor trends across your gym
        </p>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Date Range</CardTitle>
          <CardDescription>Choose a custom date range or use quick filters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date-from">From Date</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  max={dateTo}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-to">To Date</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  min={dateFrom}
                  max={today.toISOString().split("T")[0]}
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => handleQuickRange(7)}>
                Last 7 Days
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickRange(30)}>
                Last 30 Days
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickRange(90)}>
                Last 90 Days
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.total_check_ins}</div>
            <p className="text-xs text-muted-foreground">
              Across {report.daily_breakdown.length} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.unique_visitors}</div>
            <p className="text-xs text-muted-foreground">Different members visited</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Check-ins</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.avg_daily_check_ins.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Per day average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Peak Day</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{peakDay?.check_in_count || 0}</div>
            <p className="text-xs text-muted-foreground">
              {peakDay
                ? new Date(peakDay.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Check-in Trends</CardTitle>
          <CardDescription>
            Daily check-ins and unique visitors over the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={Math.floor(dailyData.length / 10)}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="check_ins" fill="#3b82f6" name="Check-ins" />
                <Line
                  type="monotone"
                  dataKey="unique_visitors"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Unique Visitors"
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              No attendance data for the selected period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Breakdown Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Check-ins by Day</CardTitle>
          <CardDescription>Bar chart showing daily check-in volume</CardDescription>
        </CardHeader>
        <CardContent>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={Math.floor(dailyData.length / 10)}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="check_ins" fill="#10b981" name="Daily Check-ins" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      {report.total_check_ins > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
              <p className="text-sm text-muted-foreground">
                On average, each unique visitor checked in{" "}
                <span className="font-semibold text-foreground">
                  {(report.total_check_ins / report.unique_visitors).toFixed(1)} times
                </span>{" "}
                during this period.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
              <p className="text-sm text-muted-foreground">
                The busiest day had{" "}
                <span className="font-semibold text-foreground">{peakDay?.check_in_count}</span>{" "}
                check-ins, which is{" "}
                <span className="font-semibold text-foreground">
                  {((peakDay?.check_in_count || 0) / report.avg_daily_check_ins).toFixed(1)}x
                </span>{" "}
                the daily average.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
