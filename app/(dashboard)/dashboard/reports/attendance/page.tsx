"use client";

import { useState } from "react";
import { useAttendanceReport } from "@/lib/hooks/use-reports";
import { Users, TrendingUp, Calendar, UserCheck, Activity, Loader2 } from "lucide-react";
import {
  ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const axisTick = { fill: "#6b7280", fontSize: 10 };
const gridColor = "hsl(var(--border))";

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-xl"
      style={{ background: "hsl(222 20% 9%)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-bold text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AttendanceReportPage() {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo.toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(today.toISOString().split("T")[0]);
  const [activeRange, setActiveRange] = useState<number | null>(30);

  const { data: report, isLoading } = useAttendanceReport({ date_from: dateFrom, date_to: dateTo });

  const handleQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    setDateFrom(start.toISOString().split("T")[0]);
    setDateTo(end.toISOString().split("T")[0]);
    setActiveRange(days);
  };

  const dailyData = (report?.daily_breakdown ?? []).map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    "Check-ins": item.check_in_count,
    "Unique Visitors": item.unique_visitors,
  }));

  const peakDay = report?.daily_breakdown.reduce(
    (max, item) => (item.check_in_count > max.check_in_count ? item : max),
    report.daily_breakdown[0]
  );

  const maxCheckIn = Math.max(...dailyData.map(d => d["Check-ins"]), 1);
  const yDomain = [0, Math.max(Math.ceil(maxCheckIn * 1.25), 5)];

  const QUICK_RANGES = [7, 14, 30, 90];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight gradient-text">Attendance Report</h1>
        <p className="text-muted-foreground mt-1 text-sm">Track daily check-ins and visitor trends</p>
      </div>

      {/* Date range card */}
      <div className="rounded-2xl p-5"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
          {/* Date inputs */}
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">From</p>
              <input type="date" value={dateFrom} max={dateTo}
                onChange={(e) => { setDateFrom(e.target.value); setActiveRange(null); }}
                className="px-3 py-2 rounded-xl text-sm outline-none text-foreground"
                style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">To</p>
              <input type="date" value={dateTo} min={dateFrom} max={today.toISOString().split("T")[0]}
                onChange={(e) => { setDateTo(e.target.value); setActiveRange(null); }}
                className="px-3 py-2 rounded-xl text-sm outline-none text-foreground"
                style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }} />
            </div>
          </div>
          {/* Quick range chips */}
          <div className="flex gap-2 flex-wrap">
            {QUICK_RANGES.map((d) => (
              <button key={d} onClick={() => handleQuickRange(d)}
                className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={activeRange === d
                  ? { background: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.35)" }
                  : { background: "transparent", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }
                }>
                {d === 7 ? "7 Days" : d === 14 ? "14 Days" : d === 30 ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !report ? null : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Check-ins", value: report.total_check_ins, icon: UserCheck, color: "#3b82f6", border: "rgba(59,130,246,0.35)", bg: "rgba(59,130,246,0.12)", sub: `over ${report.daily_breakdown.length} days` },
              { label: "Unique Visitors", value: report.unique_visitors, icon: Users, color: "#10b981", border: "rgba(16,185,129,0.35)", bg: "rgba(16,185,129,0.12)", sub: "different members" },
              { label: "Avg Daily", value: report.avg_daily_check_ins.toFixed(1), icon: TrendingUp, color: "#8b5cf6", border: "rgba(139,92,246,0.35)", bg: "rgba(139,92,246,0.12)", sub: "check-ins / day" },
              { label: "Peak Day", value: peakDay?.check_in_count ?? 0, icon: Activity, color: "#f59e0b", border: "rgba(245,158,11,0.35)", bg: "rgba(245,158,11,0.12)", sub: peakDay ? new Date(peakDay.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—" },
            ].map(({ label, value, icon: Icon, color, border, bg, sub }) => (
              <div key={label} className="rounded-2xl p-4"
                style={{ background: "hsl(var(--card))", border: `1px solid ${border}` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="text-3xl font-bold leading-tight mt-0.5" style={{ color }}>{value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="rounded-2xl p-5"
            style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(59,130,246,0.12)" }}>
                <Calendar className="h-4 w-4" style={{ color: "#3b82f6" }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Daily Check-in Trends</h2>
                <p className="text-[11px] text-muted-foreground">Check-ins and unique visitors over the selected period</p>
              </div>
              {/* Legend */}
              <div className="ml-auto flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "#3b82f6" }} />
                  <span className="text-[10px] text-muted-foreground">Check-ins</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 rounded-full" style={{ background: "#10b981" }} />
                  <span className="text-[10px] text-muted-foreground">Unique Visitors</span>
                </div>
              </div>
            </div>

            {dailyData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                No attendance data for the selected period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={dailyData} margin={{ top: 4, right: 8, bottom: 24, left: -8 }}
                  barCategoryGap="35%">
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="date" tick={axisTick} axisLine={false} tickLine={false}
                    angle={dailyData.length > 14 ? -35 : 0}
                    textAnchor={dailyData.length > 14 ? "end" : "middle"}
                    height={dailyData.length > 14 ? 48 : 24}
                    interval={Math.max(0, Math.floor(dailyData.length / 12) - 1)} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false}
                    allowDecimals={false} domain={yDomain} width={28} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)", radius: 4 }} />
                  <Bar dataKey="Check-ins" fill="url(#barGrad)" radius={[4, 4, 0, 0]} maxBarSize={48} minPointSize={2}>
                    {dailyData.map((_, i) => (
                      <Cell key={i} fill="url(#barGrad)" />
                    ))}
                  </Bar>
                  <Line type="monotone" dataKey="Unique Visitors" stroke="#10b981" strokeWidth={2}
                    dot={{ fill: "#10b981", r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#10b981" }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Insights */}
          {report.total_check_ins > 0 && report.unique_visitors > 0 && (
            <div className="rounded-2xl p-5"
              style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Insights</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)" }}>
                  <div className="h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(59,130,246,0.15)" }}>
                    <UserCheck className="h-3.5 w-3.5" style={{ color: "#3b82f6" }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Avg visits per member</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Each visitor checked in{" "}
                      <span className="font-bold text-foreground">
                        {(report.total_check_ins / report.unique_visitors).toFixed(1)}x
                      </span>{" "}
                      on average
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)" }}>
                  <div className="h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(245,158,11,0.15)" }}>
                    <Activity className="h-3.5 w-3.5" style={{ color: "#f59e0b" }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Peak day performance</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Busiest day was{" "}
                      <span className="font-bold text-foreground">
                        {((peakDay?.check_in_count ?? 0) / report.avg_daily_check_ins).toFixed(1)}x
                      </span>{" "}
                      the daily average
                    </p>
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
