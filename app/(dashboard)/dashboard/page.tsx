"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Users, Zap, Calendar, TrendingUp, CreditCard, AlertCircle,
  ArrowUpRight, ArrowDownRight, ChevronRight,
  Activity, DollarSign, UserPlus, Send,
} from "lucide-react";
import {
  useDashboard, useRevenueAnalytics, useMemberAnalytics, useMembershipReport,
} from "@/lib/hooks/use-reports";
import { AddMemberDialog } from "@/components/members/add-member-dialog";
import { AddEditPlanDialog } from "@/components/membership-plans/add-edit-plan-dialog";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtMonth(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("default", { month: "short" });
}


function daysUntil(d: string): number {
  return Math.ceil((new Date(d + "T23:59:59").getTime() - Date.now()) / 86400000);
}

function fmtINR(n: number) {
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(1) + "k";
  return "₹" + n.toLocaleString("en-IN");
}

function fmtINRFull(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function ChartTooltip({ active, payload, label, prefix = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-2.5 py-1.5 text-xs shadow-lg"
      style={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }}>
      <p className="font-semibold text-foreground mb-0.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {prefix}{typeof p.value === "number" ? p.value.toLocaleString("en-IN") : p.value}
        </p>
      ))}
    </div>
  );
}

const PLAN_COLORS = ["#10b981", "#8b5cf6", "#f59e0b", "#3b82f6", "#ec4899"];
const axisTick = { fill: "#6b7280", fontSize: 10 };
const gridColor = "hsl(var(--border))";

function Skeleton({ w = "w-full", h = "h-4" }: { w?: string; h?: string }) {
  return <div className={`${w} ${h} rounded animate-pulse bg-muted`} />;
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [expiryDays, setExpiryDays] = useState<7 | 14 | 30>(7);

  const { data: dash, isLoading, dataUpdatedAt } = useDashboard();
  const { data: memberData } = useMemberAnalytics();
  const { data: revenueData } = useRevenueAnalytics();
  const { data: membershipReport } = useMembershipReport();

  // Revenue % change
  const revChangePct = dash && Number(dash.revenue_last_month) > 0
    ? ((Number(dash.revenue_this_month) - Number(dash.revenue_last_month)) / Number(dash.revenue_last_month)) * 100
    : null;

  // Retention metrics
  const totalTracked = (dash?.active_memberships_count ?? 0) + (dash?.expired_memberships_count ?? 0) + (dash?.cancelled_memberships_count ?? 0);
  const retentionPct = totalTracked > 0 ? Math.round((dash?.active_memberships_count ?? 0) / totalTracked * 100) : 0;
  const churnPct = totalTracked > 0 ? Math.round((dash?.expired_memberships_count ?? 0) / totalTracked * 100) : 0;

  // Expiring breakdown
  const exp7 = membershipReport?.expiring_in_7d ?? 0;
  const exp14 = membershipReport?.expiring_in_14d ?? 0;
  const exp30 = membershipReport?.expiring_in_30d ?? 0;
  const expDonutData = [
    { name: "7 Days", value: exp7, color: "#ef4444" },
    { name: "7-15 Days", value: Math.max(0, exp14 - exp7), color: "#f59e0b" },
    { name: "15-30 Days", value: Math.max(0, exp30 - exp14), color: "#3b82f6" },
  ];

  // Member growth chart (last 6 months)
  const memberGrowthData = (memberData?.monthly_growth ?? []).slice(-6).map((d) => ({
    month: fmtMonth(d.month),
    active: d.total_active,
    new: d.new_members,
  }));

  // Growth % (latest vs previous month)
  const growthPct = (() => {
    const arr = memberData?.monthly_growth ?? [];
    if (arr.length < 2) return null;
    const prev = arr[arr.length - 2]?.total_active || 0;
    const curr = arr[arr.length - 1]?.total_active || 0;
    return prev > 0 ? Math.round((curr - prev) / prev * 100) : null;
  })();

  // Revenue trend chart (last 6 months)
  const revTrendData = (revenueData?.monthly_trend ?? []).slice(-6).map((d) => ({
    month: fmtMonth(d.month),
    revenue: Number(d.total_revenue),
  }));

  // Membership distribution donut
  const distData = (memberData?.by_membership_type ?? []).map((d, i) => ({
    name: d.plan_name,
    value: d.active_count,
    pct: Math.round(Number(d.percentage)),
    color: PLAN_COLORS[i % PLAN_COLORS.length],
  }));

  // Revenue split (new vs renewals — approximate by count proportion)
  const totalCount = (dash?.new_members_this_month ?? 0) + (dash?.renewals_this_month ?? 0);
  const totalRev = Number(dash?.revenue_this_month ?? 0);
  const newRev = totalCount > 0 ? Math.round(totalRev * ((dash?.new_members_this_month ?? 0) / totalCount)) : 0;
  const renewalRev = totalCount > 0 ? Math.round(totalRev * ((dash?.renewals_this_month ?? 0) / totalCount)) : 0;
  const maxRev = Math.max(newRev, renewalRev, 1);

  // Retention delta vs last month
  const retentionDelta = dash?.active_last_month_count != null
    ? (dash.active_memberships_count ?? 0) - dash.active_last_month_count
    : null;

  // Last updated timestamp
  const lastUpdatedStr = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="space-y-6">

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
        {lastUpdatedStr && (
          <p className="text-[11px] text-muted-foreground">Updated {lastUpdatedStr}</p>
        )}
      </div>

      {/* ── Row 1: 5 KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">

        {/* 1 — Active Members */}
        <Link href="/dashboard/members" className="block">
          <div className="rounded-2xl p-4 h-full transition-transform hover:-translate-y-0.5"
            style={{ background: "hsl(var(--card))", border: "1px solid rgba(16,185,129,0.35)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(16,185,129,0.18)" }}>
                <Users className="h-4 w-4" style={{ color: "#10b981" }} />
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40" />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active Members</p>
            {isLoading ? <Skeleton h="h-8" w="w-16 mt-1" /> : (
              <p className="text-3xl font-bold text-foreground leading-tight mt-0.5">{dash?.active_memberships_count ?? 0}</p>
            )}
            <p className="text-xs mt-1 text-muted-foreground">
              <span className="font-semibold" style={{ color: "#10b981" }}>+{dash?.new_members_this_month ?? 0}</span> new this month
              {(dash?.new_members_this_month ?? 0) > 0 && (
                <span className="text-muted-foreground/60"> of {dash?.active_memberships_count ?? 0}</span>
              )}
            </p>
            {memberGrowthData.length > 0 && (
              <div className="mt-2 -mb-1">
                <ResponsiveContainer width="100%" height={36}>
                  <AreaChart data={memberGrowthData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="kpi1Grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="active" stroke="#10b981" strokeWidth={1.5} fill="url(#kpi1Grad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </Link>

        {/* 2 — Check-Ins Today */}
        <Link href="/dashboard/reports/attendance" className="block">
          <div className="rounded-2xl p-4 h-full transition-transform hover:-translate-y-0.5"
            style={{ background: "hsl(var(--card))", border: "1px solid rgba(59,130,246,0.35)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(59,130,246,0.18)" }}>
                <Zap className="h-4 w-4" style={{ color: "#3b82f6" }} />
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40" />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Check-Ins Today</p>
            {isLoading ? <Skeleton h="h-8" w="w-20 mt-1" /> : (
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-bold text-foreground leading-tight">{dash?.check_ins_today ?? 0}</span>
                <span className="text-base text-muted-foreground">/ {dash?.active_memberships_count ?? 0}</span>
              </div>
            )}
            {(() => {
              const total = Math.max(dash?.active_memberships_count ?? 1, 1);
              const attendancePct = Math.min(100, Math.round(((dash?.check_ins_today ?? 0) / total) * 100));
              const vsYesterday = (dash?.check_ins_today ?? 0) - (dash?.check_ins_yesterday ?? 0);
              return (
                <>
                  <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${attendancePct}%`, background: "#3b82f6" }} />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-muted-foreground">{attendancePct}% attendance</p>
                    {(dash?.check_ins_yesterday ?? 0) > 0 && (
                      <p className={`text-[10px] font-semibold ${vsYesterday >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {vsYesterday >= 0 ? "+" : ""}{vsYesterday} vs yesterday
                      </p>
                    )}
                  </div>
                </>
              );
            })()}
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="font-semibold text-foreground">{dash?.checked_in_now ?? 0}</span> currently inside
            </p>
          </div>
        </Link>

        {/* 3 — Expiring Soon */}
        <div className="rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
          style={{ background: "hsl(var(--card))", border: "1px solid rgba(245,158,11,0.35)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,158,11,0.18)" }}>
              <Calendar className="h-4 w-4" style={{ color: "#f59e0b" }} />
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40" />
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Expiring Soon</p>
          <div className="flex items-center gap-2 mt-0.5">
            {isLoading ? <Skeleton h="h-8" w="w-12" /> : (
              <span className="text-3xl font-bold text-foreground leading-tight">{exp30}</span>
            )}
            {exp7 > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(239,68,68,0.18)", color: "#ef4444" }}>
                {exp7} in 7d
              </span>
            )}
          </div>
          {exp30 > 0 ? (
            <div className="flex items-center gap-2 mt-2">
              <div style={{ width: 54, height: 54, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expDonutData.filter(d => d.value > 0)} cx="50%" cy="50%"
                      innerRadius={15} outerRadius={25} dataKey="value" stroke="none">
                      {expDonutData.filter(d => d.value > 0).map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-0.5 flex-1">
                {[
                  { label: "7 Days", val: exp7, color: "#ef4444" },
                  { label: "7-15 Days", val: Math.max(0, exp14 - exp7), color: "#f59e0b" },
                  { label: "15-30 Days", val: Math.max(0, exp30 - exp14), color: "#3b82f6" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex items-center gap-1 text-[10px]">
                    <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-bold text-foreground ml-auto">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs mt-2 font-medium" style={{ color: "#10b981" }}>All memberships healthy</p>
          )}
        </div>

        {/* 4 — Monthly Revenue */}
        <Link href="/dashboard/reports/revenue" className="block">
          <div className="rounded-2xl p-4 h-full transition-transform hover:-translate-y-0.5"
            style={{ background: "hsl(var(--card))", border: "1px solid rgba(59,130,246,0.35)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(59,130,246,0.18)" }}>
                <TrendingUp className="h-4 w-4" style={{ color: "#3b82f6" }} />
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40" />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Monthly Revenue</p>
            {isLoading ? <Skeleton h="h-8" w="w-24 mt-1" /> : (
              <p className="text-2xl font-bold text-foreground leading-tight mt-0.5">
                {fmtINRFull(Number(dash?.revenue_this_month ?? 0))}
              </p>
            )}
            {revChangePct !== null ? (
              <p className={`text-xs mt-1 flex items-center gap-0.5 ${revChangePct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {revChangePct >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(revChangePct).toFixed(1)}% vs last month
              </p>
            ) : (
              <p className="text-xs mt-1 text-muted-foreground">No prior month data</p>
            )}
            <div className="mt-2 space-y-1.5">
              {[
                { label: "New", value: newRev, color: "#3b82f6" },
                { label: "Renewals", value: renewalRev, color: "#10b981" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center gap-2 text-[10px]">
                  <span className="text-muted-foreground w-12 flex-shrink-0">{label}</span>
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.round((value / maxRev) * 100)}%`, background: color }} />
                  </div>
                  <span className="text-muted-foreground flex-shrink-0">{fmtINR(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </Link>

        {/* 5 — Payments Pending */}
        <div className="rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
          style={{ background: "hsl(var(--card))", border: "1px solid rgba(239,68,68,0.3)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.18)" }}>
              <CreditCard className="h-4 w-4" style={{ color: "#ef4444" }} />
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40" />
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Payments Pending</p>
          <p className="text-3xl font-bold text-foreground leading-tight mt-0.5">—</p>
          <p className="text-xs mt-1 flex items-center gap-0.5 text-red-400">
            <AlertCircle className="h-3 w-3" /> Coming soon
          </p>
          <button
            className="mt-3 w-full py-1.5 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: "#ef4444" }}
          >
            Collect Now
          </button>
        </div>
      </div>

      {/* ── Row 2: Today's Summary | Member Growth | Revenue Trend ─────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Today's Summary */}
        <div className="rounded-2xl p-6"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Today&apos;s Summary</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Classes", value: "—", sub: "Scheduled", icon: Calendar, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
              { label: "Trainers", value: "—", sub: "On Duty", icon: Users, color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
              { label: "Revenue Today", value: fmtINRFull(Number(dash?.revenue_today ?? 0)), sub: "", icon: DollarSign, color: "#10b981", bg: "rgba(16,185,129,0.12)" },
              { label: "New Leads", value: dash?.leads_today_count !== undefined ? String(dash.leads_today_count) : "—", sub: "", icon: UserPlus, color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
            ].map(({ label, value, sub, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-xl p-3" style={{ background: bg }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className="h-3.5 w-3.5" style={{ color }} />
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </div>
                <p className="text-base font-bold leading-tight" style={{ color }}>{value}</p>
                {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Member Growth */}
        <div className="rounded-2xl p-6"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Member Growth</h3>
              <p className="text-[10px] text-muted-foreground">Last 6 Months</p>
            </div>
            {growthPct !== null && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
                +{growthPct}% Growth
              </span>
            )}
          </div>
          {memberGrowthData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">No member data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={148}>
              <AreaChart data={memberGrowthData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="active" name="Active Members" stroke="#10b981" strokeWidth={2}
                  fill="url(#growthGrad)" dot={{ fill: "#10b981", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue Trend */}
        <div className="rounded-2xl p-6"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">Revenue Trend</h3>
            <span className="text-[10px] text-muted-foreground">Last 6 Months</span>
          </div>
          {revTrendData.length === 0 ? (
            <div className="relative h-[148px]">
              <div className="absolute inset-0 flex items-end gap-1 px-1 pb-5">
                {[35, 55, 42, 68, 50, 80].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-sm opacity-[0.07]"
                    style={{ height: `${h}%`, background: "#10b981" }} />
                ))}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <p className="text-xs font-medium text-muted-foreground">No revenue data yet</p>
                <p className="text-[10px] text-muted-foreground/60">Assign memberships to start tracking</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={148}>
              <BarChart data={revTrendData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} width={36}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip prefix="₹" />} />
                <Bar dataKey="revenue" name="Revenue" radius={[3, 3, 0, 0]}>
                  {revTrendData.map((_, i) => (
                    <Cell key={i} fill={
                      i === revTrendData.length - 1 ? "#f59e0b"
                      : i % 3 === 0 ? "#10b981"
                      : i % 3 === 1 ? "#3b82f6"
                      : "#8b5cf6"
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Row 3: Membership Distribution | Upcoming Renewals | Quick Actions ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Membership Distribution */}
        <div className="rounded-2xl p-6"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <h3 className="text-sm font-semibold text-foreground mb-5">Membership Distribution</h3>
          {distData.length === 0 ? (
            <div className="h-28 flex items-center justify-center text-xs text-muted-foreground">No plan data yet</div>
          ) : (
            <div className="flex items-center gap-5">
              {/* Donut */}
              <div style={{ width: 140, height: 140, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distData} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                      dataKey="value" stroke="none" paddingAngle={2}>
                      {distData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend — whitespace-based, no dividers */}
              <div className="flex-1 min-w-0 space-y-3">
                {distData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-xs font-semibold text-foreground flex-1 truncate">{d.name}</span>
                    <span className="text-xs font-bold flex-shrink-0" style={{ color: "#06b6d4" }}>{d.pct}%</span>
                    <span className="text-[11px] text-muted-foreground flex-shrink-0">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Upcoming Renewals */}
        <div className="rounded-2xl p-6"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Upcoming Renewals</h3>
            <Link href="/dashboard/members/renewals" className="text-xs font-semibold flex items-center gap-0.5"
              style={{ color: "#10b981" }}>
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {/* Day filter tabs */}
          <div className="flex items-center gap-1.5 mb-4">
            {([7, 14, 30] as const).map((d) => (
              <button key={d}
                onClick={() => setExpiryDays(d)}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all"
                style={expiryDays === d
                  ? { background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.35)" }
                  : { background: "transparent", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }
                }>
                {d}d
              </button>
            ))}
          </div>
          {(() => {
            const filtered = (dash?.expiring_soon_members ?? [])
              .filter(m => daysUntil(String(m.end_date)) <= expiryDays);
            if (filtered.length === 0) {
              return (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No memberships expiring in {expiryDays} days
                </div>
              );
            }
            return (
              <div className="max-h-[280px] overflow-y-auto divide-y" style={{ borderColor: "hsl(var(--border)/0.5)" }}>
                {filtered.map((m, idx) => {
                  const days = daysUntil(String(m.end_date));
                  const urgent = days <= 3;
                  const planColor = PLAN_COLORS[idx % PLAN_COLORS.length];
                  return (
                    <div key={m.participant_id}
                      className="flex items-center gap-3 py-3 hover:bg-muted/20 transition-colors rounded-lg px-1">
                      {/* Avatar */}
                      <div className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                        style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}>
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      {/* Name */}
                      <p className="text-xs font-semibold text-foreground truncate flex-1 min-w-0">{m.name}</p>
                      {/* Plan badge */}
                      <span className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md hidden sm:inline-block"
                        style={{ background: `${planColor}22`, color: planColor, border: `1px solid ${planColor}44` }}>
                        {m.plan_name ?? "—"}
                      </span>
                      {/* Days remaining */}
                      <span className="flex-shrink-0 text-[11px] font-bold w-16 text-right"
                        style={{ color: urgent ? "#ef4444" : "#f59e0b" }}>
                        {days <= 0 ? "Expired" : days === 1 ? "1 day" : `${days}d`}
                      </span>
                      {/* Remind */}
                      <button
                        className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-opacity hover:opacity-80"
                        style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>
                        <Send className="h-2.5 w-2.5" />
                        <span>Remind</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl p-6"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Add Member", icon: UserPlus, color: "#10b981", bg: "rgba(16,185,129,0.12)", onClick: () => setShowAddMember(true) },
              { label: "Create Plan", icon: CreditCard, color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", onClick: () => setShowAddPlan(true) },
              { label: "Schedule Class", icon: Calendar, color: "#f59e0b", bg: "rgba(245,158,11,0.12)", onClick: undefined },
              { label: "Add Payment", icon: DollarSign, color: "#3b82f6", bg: "rgba(59,130,246,0.12)", onClick: undefined },
              { label: "Attendance", icon: Activity, color: "#ec4899", bg: "rgba(236,72,153,0.12)", href: "/dashboard/reports/attendance" },
              { label: "Send Notice", icon: Send, color: "#06b6d4", bg: "rgba(6,182,212,0.12)", onClick: undefined },
            ].map(({ label, icon: Icon, color, bg, onClick, href }: any) => {
              const tile = (
                <div className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer"
                  style={{ background: bg, border: `1px solid ${color}22` }}
                  onClick={onClick}>
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <p className="text-[10px] font-medium text-foreground text-center leading-tight">{label}</p>
                </div>
              );
              return href
                ? <Link key={label} href={href}>{tile}</Link>
                : <div key={label}>{tile}</div>;
            })}
          </div>
        </div>
      </div>

      {/* ── Row 4: Retention & Churn | Recent Activity | Goal Progress ───────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Retention & Churn */}
        <div className="rounded-2xl p-6"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <h3 className="text-sm font-semibold text-foreground mb-5">Retention &amp; Churn</h3>
          {totalTracked === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Add members to see metrics</p>
          ) : (
            <div className="space-y-6">
              {[
                { label: "Retention Rate", value: retentionPct, color: "#10b981", grad: "linear-gradient(90deg,#10b981,#34d399)" },
                { label: "Churn Rate", value: churnPct, color: "#ef4444", grad: "linear-gradient(90deg,#ef4444,#f87171)" },
              ].map(({ label, value, color, grad }, idx) => (
                <div key={label}>
                  {idx > 0 && <div className="mb-6" style={{ height: "1px", background: "hsl(var(--border))" }} />}
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-[11px] text-muted-foreground">{label}</span>
                  </div>
                  <p className="text-3xl font-bold mb-1" style={{ color }}>{value}%</p>
                  {label === "Retention Rate" && retentionDelta !== null && (
                    <p className={`text-[10px] font-semibold mb-2 ${retentionDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {retentionDelta >= 0 ? "+" : ""}{retentionDelta} vs last month
                    </p>
                  )}
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: grad }} />
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground">Based on active vs expired memberships</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl p-6"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h3>
          {(() => {
            const items = [
              (dash?.check_ins_today ?? 0) > 0 && {
                icon: Zap, color: "#3b82f6", bg: "rgba(59,130,246,0.12)",
                text: `${dash!.check_ins_today} check-in${dash!.check_ins_today !== 1 ? "s" : ""} recorded today`,
                sub: `${dash!.checked_in_now} currently inside`,
                href: "/dashboard/reports/attendance",
              },
              Number(dash?.revenue_today ?? 0) > 0 && {
                icon: DollarSign, color: "#10b981", bg: "rgba(16,185,129,0.12)",
                text: `${fmtINRFull(Number(dash!.revenue_today))} collected today`,
                sub: "from new memberships starting today",
                href: "/dashboard/reports/revenue",
              },
              (dash?.new_members_this_month ?? 0) > 0 && {
                icon: Users, color: "#3b82f6", bg: "rgba(59,130,246,0.12)",
                text: `${dash!.new_members_this_month} new member${dash!.new_members_this_month !== 1 ? "s" : ""} joined this month`,
                sub: `${dash!.renewals_this_month} renewal${dash!.renewals_this_month !== 1 ? "s" : ""} this month`,
                href: "/dashboard/members",
              },
              (dash?.expiring_memberships_7d ?? 0) > 0 && {
                icon: AlertCircle, color: "#f59e0b", bg: "rgba(245,158,11,0.12)",
                text: `${dash!.expiring_memberships_7d} membership${dash!.expiring_memberships_7d !== 1 ? "s" : ""} expiring this week`,
                sub: "action recommended",
                href: "/dashboard/members",
              },
            ].filter(Boolean) as { icon: any; color: string; bg: string; text: string; sub: string; href: string }[];

            if (items.length === 0) {
              return <div className="py-8 text-center text-xs text-muted-foreground">No activity yet today</div>;
            }
            return (
              <div className="space-y-1">
                {items.map((item) => (
                  <Link key={item.text} href={item.href}
                    className="flex items-center gap-3 py-2.5 px-1 rounded-xl hover:bg-muted/30 transition-colors border-b last:border-0"
                    style={{ borderColor: "hsl(var(--border)/0.4)" }}>
                    <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
                      <item.icon className="h-3.5 w-3.5" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{item.text}</p>
                      <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Goal Progress */}
        <div className="rounded-2xl p-6"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Goal Progress</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Monthly Revenue</p>
          <p className="text-lg font-bold text-foreground mt-0.5">
            {fmtINRFull(Number(dash?.revenue_this_month ?? 0))}
          </p>
          <div className="mt-4 mb-1.5 h-2.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
            <div className="h-full rounded-full"
              style={{ width: totalRev > 0 ? "100%" : "0%", background: "linear-gradient(90deg,#10b981,#34d399)" }} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-4">
            <span>{fmtINRFull(Number(dash?.revenue_this_month ?? 0))}</span>
            <span>This month</span>
          </div>
          <Link href="/dashboard/reports/revenue"
            className="block w-full py-2.5 rounded-xl text-xs font-semibold text-center transition-opacity hover:opacity-80"
            style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>
            View Reports
          </Link>
        </div>
      </div>

      <AddMemberDialog open={showAddMember} onOpenChange={setShowAddMember} />
      <AddEditPlanDialog open={showAddPlan} onOpenChange={setShowAddPlan} plan={null} />
    </div>
  );
}
