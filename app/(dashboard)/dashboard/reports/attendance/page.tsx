"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAttendanceReport } from "@/lib/hooks/use-reports";
import { Users, TrendingUp, Calendar, UserCheck } from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
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
        <h1 className="text-3xl font-bold tracking-tight gradient-text">Attendance Report</h1>
        <p className="text-muted-foreground mt-1">
          Track daily check-ins and visitor trends across your gym
        </p>
      </div>

      {/* Date Range Selector */}
      <div
        className="rounded-xl p-6"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg" style={{ background: "rgba(139, 92, 246, 0.1)" }}>
            <Calendar className="h-4 w-4" style={{ color: "#8b5cf6" }} />
          </div>
          <div>
            <h2 className="font-semibold">Date Range</h2>
            <p className="text-sm text-muted-foreground">Choose a custom range or use quick filters</p>
          </div>
        </div>
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
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Check-ins */}
        <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="h-1 stat-bar-blue" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Total Check-ins</span>
              <div className="p-2 rounded-lg" style={{ background: "rgba(59, 130, 246, 0.1)" }}>
                <UserCheck className="h-4 w-4" style={{ color: "#3b82f6" }} />
              </div>
            </div>
            <div className="text-3xl font-bold">{report.total_check_ins}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {report.daily_breakdown.length} days
            </p>
          </div>
        </div>

        {/* Unique Visitors */}
        <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="h-1 stat-bar-green" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Unique Visitors</span>
              <div className="p-2 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                <Users className="h-4 w-4" style={{ color: "#10b981" }} />
              </div>
            </div>
            <div className="text-3xl font-bold">{report.unique_visitors}</div>
            <p className="text-xs text-muted-foreground mt-1">Different members visited</p>
          </div>
        </div>

        {/* Avg Daily Check-ins */}
        <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="h-1 stat-bar-purple" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Avg Daily</span>
              <div className="p-2 rounded-lg" style={{ background: "rgba(139, 92, 246, 0.1)" }}>
                <TrendingUp className="h-4 w-4" style={{ color: "#8b5cf6" }} />
              </div>
            </div>
            <div className="text-3xl font-bold">{report.avg_daily_check_ins.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">Check-ins per day</p>
          </div>
        </div>

        {/* Peak Day */}
        <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="h-1 stat-bar-amber" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Peak Day</span>
              <div className="p-2 rounded-lg" style={{ background: "rgba(245, 158, 11, 0.1)" }}>
                <Calendar className="h-4 w-4" style={{ color: "#f59e0b" }} />
              </div>
            </div>
            <div className="text-3xl font-bold">{peakDay?.check_in_count || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {peakDay
                ? new Date(peakDay.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Daily Breakdown Chart */}
      <div
        className="rounded-xl p-6"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg" style={{ background: "rgba(59, 130, 246, 0.1)" }}>
            <TrendingUp className="h-4 w-4" style={{ color: "#3b82f6" }} />
          </div>
          <div>
            <h2 className="font-semibold">Daily Check-in Trends</h2>
            <p className="text-sm text-muted-foreground">
              Check-ins and unique visitors over the selected period
            </p>
          </div>
        </div>
        {dailyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 16% 14%)" />
              <XAxis
                dataKey="date"
                angle={-45}
                textAnchor="end"
                height={80}
                interval={Math.floor(dailyData.length / 10)}
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
                contentStyle={{
                  background: "hsl(222 18% 8%)",
                  border: "1px solid hsl(222 16% 14%)",
                  borderRadius: "8px",
                  color: "hsl(210 20% 90%)",
                }}
              />
              <Legend
                wrapperStyle={{ color: "hsl(215 14% 48%)", fontSize: 12 }}
              />
              <Bar dataKey="check_ins" fill="#3b82f6" name="Check-ins" radius={[2, 2, 0, 0]} />
              <Line
                type="monotone"
                dataKey="unique_visitors"
                stroke="#10b981"
                strokeWidth={2}
                name="Unique Visitors"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[340px] text-muted-foreground">
            No attendance data for the selected period
          </div>
        )}
      </div>

      {/* Insights */}
      {report.total_check_ins > 0 && (
        <div
          className="rounded-xl p-6"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
              <TrendingUp className="h-4 w-4" style={{ color: "#10b981" }} />
            </div>
            <h2 className="font-semibold">Insights</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#3b82f6" }} />
              <p className="text-sm text-muted-foreground">
                On average, each unique visitor checked in{" "}
                <span className="font-semibold text-foreground">
                  {(report.total_check_ins / report.unique_visitors).toFixed(1)} times
                </span>{" "}
                during this period.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#10b981" }} />
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
          </div>
        </div>
      )}
    </div>
  );
}
