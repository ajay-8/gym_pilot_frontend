"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Users, Zap, Calendar, TrendingUp, CreditCard, AlertCircle,
  ArrowUpRight, ArrowDownRight, ChevronRight,
  Activity, DollarSign, UserPlus, Send, RefreshCw, X, Inbox,
} from "lucide-react";
import {
  useDashboard, useRevenueAnalytics, useMemberAnalytics, useMembershipReport,
} from "@/lib/hooks/use-reports";
import { useLeadsStats } from "@/lib/hooks/use-leads";
import { AddPersonDialog, type AddPersonPayload } from "@/components/participants/add-person-dialog";
import { AddEditPlanDialog } from "@/components/membership-plans/add-edit-plan-dialog";
import { useTrainerCreate } from "@/lib/hooks/use-trainers";
import { useMemberOnboard, useMembers, useMemberRemind } from "@/lib/hooks/use-members";
import { useAuth } from "@/lib/hooks/use-auth";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtMonth(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("default", { month: "short" });
}


function daysUntil(d: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, mo, day] = d.split("-").map(Number);
  const end = new Date(y, mo - 1, day); // local midnight — avoids UTC vs local mismatch
  return Math.round((end.getTime() - today.getTime()) / 86400000);
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
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [expiryDays, setExpiryDays] = useState<7 | 14>(7);
  const [showExpiringPopup, setShowExpiringPopup] = useState(false);
  const [showLapsedPopup, setShowLapsedPopup] = useState(false);
  const [showOnLoadAlert, setShowOnLoadAlert] = useState(false);
  const [enquiryBubbleOpen, setEnquiryBubbleOpen] = useState(false);
  const alertTriggeredRef = useRef(false);
  // Track which user IDs have had a reminder sent this session (userId → "sent" | "rate_limited" | "no_phone")
  const [reminderState, setReminderState] = useState<Record<string, string>>({});
  const { mutate: sendReminder, isPending: _isReminding } = useMemberRemind();
  const { user, gymContext } = useAuth();
  const RENEWAL_MAX_DISPLAY = 4;

  const { data: dash, isLoading } = useDashboard();
  const { data: memberData } = useMemberAnalytics();
  const { data: revenueData } = useRevenueAnalytics();
  const { data: membershipReport } = useMembershipReport();
  const { data: leadStats } = useLeadsStats();
  const { data: lapsedData } = useMembers({ status: "expired", page_size: 50 });
  const trainerCreate = useTrainerCreate();
  const memberOnboard = useMemberOnboard();

  // Show on-load alert once per login-session when there are lapsed/expiring members.
  // Key = gymId + last 16 chars of access token → resets on new login AND on tab/browser close.
  useEffect(() => {
    if (isLoading || alertTriggeredRef.current) return;
    if (!gymContext?.gym_id) return; // Wait until gym context is resolved
    if (!dash) return; // Wait until dashboard data is loaded

    const tokenSuffix = typeof localStorage !== "undefined"
      ? (localStorage.getItem("access_token") ?? "").slice(-16)
      : "";
    if (!tokenSuffix) return; // Not logged in yet

    const key = `dashAlert_${gymContext.gym_id}_${tokenSuffix}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) return;

    const hasLapsed = (dash.lapsed_members_count ?? 0) > 0;
    const hasExpiring = (membershipReport?.expiring_in_7d ?? 0) > 0 || (dash.expiring_soon_members ?? []).length > 0;
    if (hasLapsed || hasExpiring) {
      alertTriggeredRef.current = true;
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem(key, "1");
      setShowOnLoadAlert(true);
    }
  }, [dash, isLoading, membershipReport, gymContext?.gym_id]);

  const handleAddPerson = async (payload: AddPersonPayload) => {
    setAddMemberError(null);
    const { first_name, last_name, email, phone, roles, trainer, member } = payload;
    try {
      const isTrainer = roles.includes("trainer");
      const nonTrainerRoles = roles.filter((r) => r !== "trainer");
      if (isTrainer) {
        await trainerCreate.mutateAsync({
          first_name, last_name, email, phone: phone || undefined,
          onboarding_date: trainer!.onboarding_date,
          weekly_availability: trainer!.weekly_availability,
        });
      }
      if (nonTrainerRoles.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mp: any = { first_name, last_name, email: email || undefined, phone, roles: nonTrainerRoles };
        if (member) { mp.plan_id = member.plan_id; mp.membership_start_date = member.membership_start_date; }
        await memberOnboard.mutateAsync(mp);
      }
      setShowAddMember(false);
    } catch (e: unknown) {
      setAddMemberError((e as { detail?: string })?.detail ?? "Failed to add person.");
    }
  };

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
    { name: "7-14 Days", value: Math.max(0, exp14 - exp7), color: "#f59e0b" },
    { name: "15-30 Days", value: Math.max(0, exp30 - exp14), color: "#3b82f6" },
  ];

  // Member growth chart (last 6 months)
  const memberGrowthData = (memberData?.monthly_growth ?? []).slice(-6).map((d) => ({
    month: fmtMonth(d.month),
    active: d.total_active,
    new: d.new_members,
  }));

  // Growth % — use net_growth of latest month vs new_members of previous month
  // (total_active is a running sum from 0, unreliable for % calc)
  const growthPct = (() => {
    const arr = memberData?.monthly_growth ?? [];
    if (arr.length < 2) return null;
    const prevNew = arr[arr.length - 2]?.new_members ?? 0;
    const currNet = arr[arr.length - 1]?.net_growth ?? 0;
    if (prevNew <= 0) return null;
    return Math.round((currNet / prevNew) * 100);
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


  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const firstName = user?.first_name ?? "there";

  return (
    <div className="space-y-6">

      {/* ── Welcome Bar ────────────────────────────────────────────────────── */}
      <div className="rounded-2xl px-6 py-4 flex items-center justify-between flex-wrap gap-3"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {greeting}, {firstName} 👋
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {gymContext?.gym_name ?? "Your Gym"} · {dateStr}
          </p>
        </div>
        {!isLoading && exp7 === 0 && (dash?.lapsed_members_count ?? 0) === 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981" }}>
            All memberships healthy
          </span>
        )}
      </div>

      {/* ── Row 1: 5 KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">

        {/* 1 — Active Members (stat card, non-clickable) */}
        <div className="rounded-2xl p-4 h-full"
          style={{ background: "hsl(var(--card))", border: "1px solid rgba(16,185,129,0.35)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(16,185,129,0.18)" }}>
              <Users className="h-4 w-4" style={{ color: "#10b981" }} />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active Members</p>
          {isLoading ? <Skeleton h="h-8" w="w-16 mt-1" /> : (
            <p className="text-3xl font-bold text-foreground leading-tight mt-0.5">{dash?.active_memberships_count ?? 0}</p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
            {(dash?.new_members_this_month ?? 0) > 0 ? (
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold" style={{ color: "#10b981" }}>+{dash?.new_members_this_month}</span> joined this month
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">No new joins this month</span>
            )}
            {(dash?.renewals_this_month ?? 0) > 0 && (
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold" style={{ color: "#f59e0b" }}>{dash?.renewals_this_month}</span> renewed
              </span>
            )}
          </div>
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

        {/* 2 — Check-Ins Today */}
        <Link href="/dashboard/reports/attendance" className="block">
          <div className="rounded-2xl p-4 h-full transition-transform hover:-translate-y-0.5"
            style={{ background: "hsl(var(--card))", border: "1px solid rgba(59,130,246,0.35)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(59,130,246,0.18)" }}>
                <Zap className="h-4 w-4" style={{ color: "#3b82f6" }} />
              </div>
              <ArrowUpRight className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.35)" }} />
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
        <button onClick={() => setShowExpiringPopup(true)} className="block w-full text-left">
        <div className="rounded-2xl p-4 h-full transition-transform hover:-translate-y-0.5 cursor-pointer"
          style={{ background: "hsl(var(--card))", border: "1px solid rgba(245,158,11,0.35)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,158,11,0.18)" }}>
              <Calendar className="h-4 w-4" style={{ color: "#f59e0b" }} />
            </div>
            <ArrowUpRight className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.35)" }} />
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
        </button>

        {/* 4 — Monthly Revenue */}
        <Link href="/dashboard/reports/revenue" className="block">
          <div className="rounded-2xl p-4 h-full transition-transform hover:-translate-y-0.5"
            style={{ background: "hsl(var(--card))", border: "1px solid rgba(59,130,246,0.35)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(59,130,246,0.18)" }}>
                <TrendingUp className="h-4 w-4" style={{ color: "#3b82f6" }} />
              </div>
              <ArrowUpRight className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.35)" }} />
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

        {/* 5 — Lapsed Members */}
        <button onClick={() => setShowLapsedPopup(true)} className="block w-full text-left">
          <div className="rounded-2xl p-4 h-full transition-transform hover:-translate-y-0.5"
            style={{ background: "hsl(var(--card))", border: "1px solid rgba(239,68,68,0.3)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.18)" }}>
                <AlertCircle className="h-4 w-4" style={{ color: "#ef4444" }} />
              </div>
              <ArrowUpRight className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.35)" }} />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Lapsed Members</p>
            {isLoading ? <Skeleton h="h-8" w="w-12 mt-1" /> : (
              <p className="text-3xl font-bold leading-tight mt-0.5" style={{ color: "#ef4444" }}>
                {dash?.lapsed_members_count ?? 0}
              </p>
            )}
            <div className="mt-2 space-y-0.5">
              {!isLoading && (dash?.lapsed_members_count ?? 0) > 0 && (
                <p className="text-[10px] text-muted-foreground">membership expired, not renewed</p>
              )}
              {!isLoading && (dash?.lapsed_members_count ?? 0) === 0 && (
                <p className="text-[10px] text-muted-foreground">No lapsed members</p>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* ── Row 2: Today's Summary | Member Growth | Revenue Trend ─────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Today's Summary */}
        <div className="rounded-2xl p-6"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Today&apos;s Summary</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "New This Month", value: isLoading ? "—" : String(dash?.new_members_this_month ?? 0), icon: UserPlus, color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
              { label: "Renewals", value: isLoading ? "—" : String(dash?.renewals_this_month ?? 0), icon: RefreshCw, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
              { label: "Revenue Today", value: isLoading ? "—" : fmtINRFull(Number(dash?.revenue_today ?? 0)), icon: DollarSign, color: "#10b981", bg: "rgba(16,185,129,0.12)" },
              { label: "New Leads", value: isLoading ? "—" : String(dash?.leads_today_count ?? 0), icon: UserPlus, color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-xl p-3" style={{ background: bg }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className="h-3.5 w-3.5" style={{ color }} />
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </div>
                <p className="text-base font-bold leading-tight" style={{ color }}>{value}</p>
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
                style={{
                  background: growthPct > 0 ? "rgba(16,185,129,0.15)" : growthPct < 0 ? "rgba(239,68,68,0.15)" : "rgba(100,116,139,0.15)",
                  color: growthPct > 0 ? "#10b981" : growthPct < 0 ? "#ef4444" : "#64748b",
                }}>
                {growthPct > 0 ? `+${growthPct}%` : `${growthPct}%`} Growth
              </span>
            )}
          </div>
          {memberGrowthData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">No member data yet</div>
          ) : (
            <div style={{ outline: "none" }}>
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
                  <Tooltip content={<ChartTooltip />} cursor={false} />
                  <Area type="monotone" dataKey="active" name="Active Members" stroke="#10b981" strokeWidth={2}
                    fill="url(#growthGrad)" dot={{ fill: "#10b981", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
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
            <div style={{ outline: "none" }}>
              <ResponsiveContainer width="100%" height={148}>
                <BarChart data={revTrendData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} width={40}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip prefix="₹" />} cursor={false} />
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
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Membership Distribution | Upcoming Renewals | Quick Actions ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Membership Distribution */}
        <div className="rounded-2xl p-6 flex flex-col"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", minHeight: "300px" }}>
          <h3 className="text-sm font-semibold text-foreground mb-5">Membership Distribution</h3>
          {distData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">No plan data yet</div>
          ) : (
            <div className="flex-1 flex flex-col justify-center gap-5">
              {/* Donut */}
              <div className="mx-auto" style={{ width: 160, height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distData} cx="50%" cy="50%" innerRadius={46} outerRadius={74}
                      dataKey="value" stroke="none" paddingAngle={2}>
                      {distData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="space-y-2.5">
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
        <div className="rounded-2xl p-6 flex flex-col"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", minHeight: "300px" }}>
          {/* Header */}
          {(() => {
            const filtered = (dash?.expiring_soon_members ?? [])
              .filter(m => daysUntil(String(m.end_date)) <= expiryDays);
            return (
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Upcoming Renewals</h3>
                {filtered.length > RENEWAL_MAX_DISPLAY && (
                  <Link href={`/dashboard/members/renewals?days=${expiryDays}`} className="text-xs font-semibold flex items-center gap-0.5"
                    style={{ color: "#10b981" }}>
                    View All <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            );
          })()}
          {/* Day filter tabs */}
          <div className="flex items-center gap-1.5 mb-4 flex-shrink-0">
            {([7, 14] as const).map((d) => (
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
          {/* List — flex-1 so it fills remaining space, scroll internally */}
          <div className="flex-1 min-h-0 flex flex-col">
            {(() => {
              const filtered = (dash?.expiring_soon_members ?? [])
                .filter(m => daysUntil(String(m.end_date)) <= expiryDays);
              if (filtered.length === 0) {
                return (
                  <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                    No memberships expiring in {expiryDays} days
                  </div>
                );
              }
              return (
                <>
                  {/* Column headers */}
                  <div className="flex items-center gap-3 pb-2 mb-1 px-1 flex-shrink-0" style={{ borderBottom: "1px solid hsl(var(--border)/0.5)" }}>
                    <div className="w-7 flex-shrink-0" />
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex-1 min-w-0">Member</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex-shrink-0 hidden sm:block w-24 text-center">Plan</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex-shrink-0 w-16 text-right">Expires</p>
                    <div className="w-[62px] flex-shrink-0" />
                  </div>
                  <div className="divide-y overflow-y-auto flex-1 min-h-0" style={{ borderColor: "hsl(var(--border)/0.5)" }}>
                    {filtered.slice(0, RENEWAL_MAX_DISPLAY).map((m, idx) => {
                      const days = daysUntil(String(m.end_date));
                      const urgent = days <= 3;
                      const planColor = PLAN_COLORS[idx % PLAN_COLORS.length];
                      return (
                        <div key={m.participant_id}
                          className="flex items-center gap-3 py-3 hover:bg-muted/20 transition-colors rounded-lg px-1">
                          <div className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                            style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}>
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <p className="text-xs font-semibold text-foreground truncate flex-1 min-w-0">{m.name}</p>
                          <span className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md hidden sm:inline-block"
                            style={{ background: `${planColor}22`, color: planColor, border: `1px solid ${planColor}44` }}>
                            {m.plan_name ?? "—"}
                          </span>
                          <span className="flex-shrink-0 text-[11px] font-bold w-16 text-right"
                            style={{ color: urgent ? "#ef4444" : "#f59e0b" }}>
                            {days <= 0 ? "Expired" : days === 1 ? "1 day" : `${days}d`}
                          </span>
                          {reminderState[m.user_id] ? (
                            <span className="flex-shrink-0 text-[10px] font-semibold px-2 py-1 rounded-lg"
                              style={{ background: "rgba(16,185,129,0.08)", color: reminderState[m.user_id] === "sent" ? "#10b981" : "#6b7280" }}>
                              {reminderState[m.user_id] === "sent" ? "Sent" : reminderState[m.user_id] === "rate_limited" ? "Already sent" : "No phone"}
                            </span>
                          ) : (
                            <button
                              onClick={() => sendReminder(m.user_id, {
                                onSuccess: (data) => setReminderState(s => ({ ...s, [m.user_id]: data.sent ? "sent" : (data.reason ?? "error") })),
                              })}
                              className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-opacity hover:opacity-80"
                              style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>
                              <Send className="h-2.5 w-2.5" />
                              <span>Remind</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl p-6 flex flex-col"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", minHeight: "300px" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="flex-1 flex items-center">
            <div className="grid grid-cols-3 gap-3 w-full">
              {[
                { label: "Add Member",     icon: UserPlus,  color: "#10b981", onClick: () => setShowAddMember(true) },
                { label: "Create Plan",    icon: CreditCard, color: "#8b5cf6", onClick: () => setShowAddPlan(true) },
                { label: "Schedule Class", icon: Calendar,   color: "#f59e0b", href: "/dashboard/classes" },
                { label: "Add Payment",    icon: DollarSign, color: "#3b82f6", href: "/dashboard/payments" },
                { label: "Attendance",     icon: Activity,   color: "#ec4899", href: "/dashboard/reports/attendance" },
                { label: "Send Notice",    icon: Send,        color: "#06b6d4", href: "/dashboard/notifications" },
              ].map(({ label, icon: Icon, color, onClick, href }: any) => {
                const tile = (
                  <div
                    className="flex flex-col items-center gap-2.5 py-4 px-2 rounded-xl transition-all hover:-translate-y-1 cursor-pointer group"
                    style={{ background: `${color}0f`, border: `1px solid ${color}28` }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 4px 20px ${color}28`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                    onClick={onClick}
                  >
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center transition-all"
                      style={{ background: `${color}22`, border: `1px solid ${color}33` }}>
                      <Icon className="h-5 w-5" style={{ color }} />
                    </div>
                    <p className="text-[11px] font-semibold text-foreground text-center leading-tight">{label}</p>
                  </div>
                );
                return href
                  ? <Link key={label} href={href}>{tile}</Link>
                  : <div key={label}>{tile}</div>;
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 4: Retention & Activity | Membership Health | Lead Pipeline ──── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start" style={{ gridAutoRows: "auto" }}>

        {/* Retention & Activity */}
        {(() => {
          const r = 30;
          const circ = 2 * Math.PI * r;
          const retFill = (retentionPct / 100) * circ;
          const churnFill = (churnPct / 100) * circ;
          return (
            <div className="rounded-2xl p-6"
              style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Retention &amp; Activity</h3>
                {retentionDelta !== null && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      background: retentionDelta >= 0 ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                      color: retentionDelta >= 0 ? "#10b981" : "#ef4444",
                    }}>
                    {retentionDelta >= 0 ? "+" : ""}{retentionDelta} vs last month
                  </span>
                )}
              </div>

              {totalTracked === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">Add members to see metrics</p>
              ) : (
                <>
                  {/* Ring + mini trend chart */}
                  <div className="flex items-center gap-4 mb-4">
                    {/* SVG Ring */}
                    <div className="relative flex-shrink-0" style={{ width: 76, height: 76 }}>
                      <svg width="76" height="76" viewBox="0 0 76 76">
                        {/* Track */}
                        <circle cx="38" cy="38" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="7" />
                        {/* Retention arc — green */}
                        <circle cx="38" cy="38" r={r} fill="none" stroke="#10b981" strokeWidth="7"
                          strokeLinecap="round"
                          strokeDasharray={`${retFill} ${circ}`}
                          transform="rotate(-90 38 38)" />
                        {/* Churn arc — red, starts after retention */}
                        <circle cx="38" cy="38" r={r} fill="none" stroke="#ef4444" strokeWidth="7"
                          strokeLinecap="round"
                          strokeDasharray={`${churnFill} ${circ}`}
                          strokeDashoffset={-retFill}
                          transform="rotate(-90 38 38)" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-base font-bold leading-none" style={{ color: "#10b981" }}>{retentionPct}%</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">retained</p>
                      </div>
                    </div>

                    {/* Mini area chart */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground mb-1">Active members · last 6 months</p>
                      {memberGrowthData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={52}>
                          <AreaChart data={memberGrowthData} margin={{ top: 2, right: 2, bottom: 0, left: -32 }}>
                            <defs>
                              <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                            <Tooltip content={<ChartTooltip />} cursor={false} />
                            <Area type="monotone" dataKey="active" name="Active Members"
                              stroke="#10b981" strokeWidth={1.5} fill="url(#retGrad)"
                              dot={{ fill: "#10b981", r: 2, strokeWidth: 0 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-[10px] text-muted-foreground py-4">No trend data yet</p>
                      )}
                    </div>
                  </div>

                  {/* Stats strip */}
                  <div className="grid grid-cols-3 gap-2 pt-3" style={{ borderTop: "1px solid hsl(var(--border)/0.5)" }}>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Check-ins</p>
                      <p className="text-sm font-bold text-foreground">{dash?.check_ins_today ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground/60">today</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">New</p>
                      <p className="text-sm font-bold" style={{ color: "#8b5cf6" }}>{dash?.new_members_this_month ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground/60">this month</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Renewals</p>
                      <p className="text-sm font-bold" style={{ color: "#3b82f6" }}>{dash?.renewals_this_month ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground/60">this month</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">{churnPct}% churn · {dash?.expired_memberships_count ?? 0} expired</p>
                </>
              )}
            </div>
          );
        })()}

        {/* Membership Health */}
        {(() => {
          const active = dash?.active_memberships_count ?? 0;
          const expired = dash?.expired_memberships_count ?? 0;
          const renewals = dash?.renewals_this_month ?? 0;
          const newM = dash?.new_members_this_month ?? 0;
          const renewalBase = renewals + newM;
          const renewalRate = renewalBase > 0 ? Math.round((renewals / renewalBase) * 100) : 0;
          const expiringSoon = exp7;
          const expiringRate = active > 0 ? Math.min(100, Math.round((expiringSoon / active) * 100)) : 0;

          return (
            <div className="rounded-2xl p-6"
              style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <h3 className="text-sm font-semibold text-foreground mb-5">Membership Health</h3>

              {active === 0 && expired === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">Add members to see metrics</p>
              ) : (
                <div className="grid grid-cols-2 gap-5">
                  {/* Renewal Rate */}
                  <div className="pl-3" style={{ borderLeft: "3px solid #10b981" }}>
                    <p className="text-[10px] text-muted-foreground mb-2">Renewal Rate</p>
                    <p className="text-3xl font-bold leading-none" style={{ color: "#10b981" }}>{renewalRate}%</p>
                    <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                      style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
                      {renewals} renewal{renewals !== 1 ? "s" : ""} this month
                    </span>
                    <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                      <div className="h-full rounded-full" style={{ width: `${renewalRate}%`, background: "linear-gradient(90deg,#10b981,#34d399)" }} />
                    </div>
                  </div>

                  {/* Expiring Soon */}
                  <div className="pl-3" style={{ borderLeft: `3px solid ${expiringSoon > 0 ? "#ef4444" : "#f59e0b"}` }}>
                    <p className="text-[10px] text-muted-foreground mb-2">Expiring in 7 Days</p>
                    <p className="text-3xl font-bold leading-none" style={{ color: expiringSoon > 0 ? "#ef4444" : "#f59e0b" }}>{expiringSoon}</p>
                    <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                      style={{
                        background: expiringSoon > 0 ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                        color: expiringSoon > 0 ? "#ef4444" : "#f59e0b",
                      }}>
                      {exp30} in 30 days
                    </span>
                    <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                      <div className="h-full rounded-full" style={{
                        width: `${expiringRate}%`,
                        background: expiringSoon > 0 ? "linear-gradient(90deg,#ef4444,#f87171)" : "hsl(var(--muted))",
                      }} />
                    </div>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground mt-4">
                {active} active · {expired} expired ·{" "}
                <Link href="/dashboard/members" className="hover:underline" style={{ color: "#10b981" }}>
                  View members →
                </Link>
              </p>
            </div>
          );
        })()}

        {/* Lead Pipeline */}
        {(() => {
          const total = leadStats?.total ?? 0;
          const overdue = leadStats?.overdue_count ?? 0;
          const converted = leadStats?.converted_count ?? 0;
          const convRate = total > 0 ? Math.round((converted / total) * 100) : 0;
          const overdueRate = total > 0 ? Math.round((overdue / total) * 100) : 0;

          return (
            <div className="rounded-2xl p-6"
              style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <h3 className="text-sm font-semibold text-foreground mb-5">Lead Pipeline</h3>

              {total === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No leads yet</p>
              ) : (
                <div className="grid grid-cols-2 gap-5">
                  {/* Conversion Rate */}
                  <div className="pl-3" style={{ borderLeft: "3px solid #10b981" }}>
                    <p className="text-[10px] text-muted-foreground mb-2">Conversion Rate</p>
                    <p className="text-3xl font-bold leading-none" style={{ color: "#10b981" }}>{convRate}%</p>
                    <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                      style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
                      {converted} of {total}
                    </span>
                    <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                      <div className="h-full rounded-full" style={{ width: `${convRate}%`, background: "linear-gradient(90deg,#10b981,#34d399)" }} />
                    </div>
                  </div>

                  {/* Overdue Follow-ups */}
                  <div className="pl-3" style={{ borderLeft: `3px solid ${overdue > 0 ? "#ef4444" : "#8b5cf6"}` }}>
                    <p className="text-[10px] text-muted-foreground mb-2">Overdue Follow-ups</p>
                    <p className="text-3xl font-bold leading-none" style={{ color: overdue > 0 ? "#ef4444" : "#8b5cf6" }}>{overdue}</p>
                    <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                      style={{
                        background: overdue > 0 ? "rgba(239,68,68,0.15)" : "rgba(139,92,246,0.15)",
                        color: overdue > 0 ? "#ef4444" : "#8b5cf6",
                      }}>
                      {leadStats?.new_count ?? 0} new leads
                    </span>
                    <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                      <div className="h-full rounded-full" style={{
                        width: `${overdueRate}%`,
                        background: overdue > 0 ? "linear-gradient(90deg,#ef4444,#f87171)" : "hsl(var(--muted))",
                      }} />
                    </div>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground mt-4">
                {total} total leads ·{" "}
                <Link href="/dashboard/leads" className="hover:underline" style={{ color: "#10b981" }}>
                  Manage leads →
                </Link>
              </p>
            </div>
          );
        })()}
      </div>

      {/* ── New Enquiries Floating Bubble ─────────────────────────────────── */}
      {(dash?.new_leads_count ?? 0) > 0 && typeof document !== "undefined" && createPortal(
        <div className="fixed bottom-6 right-6 z-[150] flex flex-col items-end gap-3">

          {/* Expanded card */}
          {enquiryBubbleOpen && (
            <div className="w-72 rounded-2xl overflow-hidden"
              style={{
                background: "hsl(222 20% 9%)",
                border: "1px solid rgba(59,130,246,0.35)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.1)",
              }}>

              {/* Blue top accent bar */}
              <div className="h-1" style={{ background: "linear-gradient(90deg,#1d4ed8,#3b82f6,#60a5fa)" }} />

              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#3b82f6" }} />
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#3b82f6" }} />
                  </span>
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">New Enquiries</span>
                  <span className="text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center"
                    style={{ background: "#3b82f6", color: "white" }}>
                    {dash!.new_leads_count}
                  </span>
                </div>
                <button onClick={() => setEnquiryBubbleOpen(false)}
                  className="h-6 w-6 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10">
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>

              {/* Lead list */}
              <div className="px-3 pb-3 space-y-2 max-h-64 overflow-y-auto">
                {(dash?.new_leads ?? []).map((lead) => {
                  const timeAgo = (() => {
                    const diff = Date.now() - new Date(lead.created_at).getTime();
                    const mins = Math.floor(diff / 60000);
                    if (mins < 60) return `${mins}m ago`;
                    const hrs = Math.floor(mins / 60);
                    if (hrs < 24) return `${hrs}h ago`;
                    return `${Math.floor(hrs / 24)}d ago`;
                  })();
                  return (
                    <div key={lead.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                      style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.15)" }}>
                      {/* Avatar */}
                      <div className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "white" }}>
                        {lead.name.charAt(0).toUpperCase()}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate leading-tight">{lead.name}</p>
                        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{lead.phone}</p>
                        {lead.plan_name && (
                          <span className="inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                            style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>
                            {lead.plan_name}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0 self-start pt-0.5">{timeAgo}</span>
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="px-3 pb-3">
                <Link href="/dashboard/leads"
                  onClick={() => setEnquiryBubbleOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
                  <Send className="h-3.5 w-3.5" />
                  Action Leads
                </Link>
              </div>
            </div>
          )}

          {/* Floating circle trigger */}
          <button onClick={() => setEnquiryBubbleOpen(o => !o)}
            className="relative flex items-center justify-center h-14 w-14 rounded-full transition-all hover:scale-110 active:scale-95"
            style={{
              background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
              boxShadow: "0 0 0 4px rgba(59,130,246,0.25), 0 8px 32px rgba(59,130,246,0.5)",
            }}>
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full animate-ping opacity-50"
              style={{ background: "rgba(59,130,246,0.6)" }} />
            {/* Icon */}
            <Inbox className="h-6 w-6 text-white relative z-10" />
            {/* Count badge */}
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white z-10"
              style={{ background: "#ef4444", boxShadow: "0 0 0 2px hsl(222 20% 9%)" }}>
              {dash!.new_leads_count}
            </span>
          </button>
        </div>,
        document.body
      )}

      {showAddMember && (
        <AddPersonDialog
          onClose={() => setShowAddMember(false)}
          onSubmit={handleAddPerson}
          isPending={trainerCreate.isPending || memberOnboard.isPending}
          error={addMemberError}
          defaultRoles={["member"]}
        />
      )}
      <AddEditPlanDialog open={showAddPlan} onOpenChange={setShowAddPlan} plan={null} />

      {/* ── On-load Alert ─────────────────────────────────────────────────── */}
      {showOnLoadAlert && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm" onClick={() => setShowOnLoadAlert(false)} />
          <div className="fixed inset-0 z-[201] flex items-end sm:items-center justify-center p-4 sm:p-6 pointer-events-none">
            <div className="w-full max-w-sm rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
              style={{ background: "hsl(222 20% 8%)", border: "1px solid hsl(var(--border))" }}>
              {/* Header */}
              <div className="flex items-start justify-between px-5 pt-5 pb-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {(dash?.lapsed_members_count ?? 0) > 0 && exp7 > 0
                      ? "Membership Alerts"
                      : (dash?.lapsed_members_count ?? 0) > 0
                      ? "Lapsed Members"
                      : "Expiring Memberships"}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {(dash?.lapsed_members_count ?? 0) > 0 && exp7 > 0
                      ? `${dash!.lapsed_members_count} lapsed · ${exp7} expiring in 7 days`
                      : (dash?.lapsed_members_count ?? 0) > 0
                      ? `${dash!.lapsed_members_count} member${dash!.lapsed_members_count !== 1 ? "s" : ""} with expired memberships`
                      : `${exp7} membership${exp7 !== 1 ? "s" : ""} expiring within the next 7 days`}
                  </p>
                </div>
                <button onClick={() => setShowOnLoadAlert(false)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0 ml-3">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Member list — show top 3 from expiring or lapsed */}
              <div className="px-5 pb-3 space-y-2">
                {(dash?.expiring_soon_members ?? []).slice(0, 3).map((m) => {
                  const days = daysUntil(m.end_date);
                  const urgent = days <= 3;
                  return (
                    <div key={m.participant_id} className="flex items-center gap-3 py-2 px-3 rounded-xl"
                      style={{ background: "hsl(var(--muted)/0.3)" }}>
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: urgent ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)", color: urgent ? "#ef4444" : "#f59e0b" }}>
                        {m.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{m.name}</p>
                        <p className="text-[10px] text-muted-foreground">{m.plan_name ?? "No plan"}</p>
                      </div>
                      <p className="text-xs font-bold flex-shrink-0"
                        style={{ color: urgent ? "#ef4444" : "#f59e0b" }}>
                        {days === 0 ? "Today" : days < 0 ? `${Math.abs(days)}d ago` : `${days === 1 ? "Tomorrow" : `${days} Days Left`}`}
                      </p>
                    </div>
                  );
                })}
                {(dash?.expiring_soon_members ?? []).length === 0 && (lapsedData?.items ?? []).slice(0, 3).map((m) => (
                  <div key={m.participant_id} className="flex items-center gap-3 py-2 px-3 rounded-xl"
                    style={{ background: "hsl(var(--muted)/0.3)" }}>
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>
                      {`${m.first_name?.[0] ?? ""}${m.last_name?.[0] ?? ""}`.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{m.first_name} {m.last_name ?? ""}</p>
                      <p className="text-[10px] text-muted-foreground">{m.email ?? m.phone ?? "—"}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>Lapsed</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="px-5 pb-5 space-y-2">
                <button
                  onClick={() => {
                    setShowOnLoadAlert(false);
                    exp7 > 0 ? setShowExpiringPopup(true) : setShowLapsedPopup(true);
                  }}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                  Send Renewal Reminders
                </button>
                <button
                  onClick={() => {
                    setShowOnLoadAlert(false);
                    exp7 > 0 ? setShowExpiringPopup(true) : setShowLapsedPopup(true);
                  }}
                  className="w-full py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  View Detailed List
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Expiring Soon Side Panel */}
      {showExpiringPopup && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm" onClick={() => setShowExpiringPopup(false)} />
          <div className="fixed inset-y-0 right-0 z-[201] flex flex-col w-full max-w-sm shadow-2xl"
            style={{ background: "hsl(var(--card))", borderLeft: "1px solid rgba(245,158,11,0.3)" }}>
            {/* Accent strip */}
            <div className="h-1 flex-shrink-0" style={{ background: "linear-gradient(90deg,#f59e0b,#fbbf24)" }} />
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: "1px solid hsl(var(--border))" }}>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <button onClick={() => setShowExpiringPopup(false)}
                    className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors">
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <span className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "#f59e0b" }}>
                    {(dash?.expiring_soon_members ?? []).length} TOTAL
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground">Expiring Memberships</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Renew subscriptions ending within 30 days.
                </p>
              </div>
            </div>
            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {(dash?.expiring_soon_members ?? []).length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-muted-foreground">No memberships expiring soon</p>
                </div>
              ) : (
                (dash?.expiring_soon_members ?? []).map((m) => {
                  const days = daysUntil(m.end_date);
                  const urgent = days <= 7;
                  const daysColor = urgent ? "#ef4444" : "#f59e0b";
                  return (
                    <div key={m.participant_id} className="rounded-2xl p-4"
                      style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{ background: urgent ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)", color: daysColor }}>
                          {m.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{m.name}</p>
                          <p className="text-[11px] text-muted-foreground">{m.plan_name ?? "No plan"}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold" style={{ color: daysColor }}>
                            {days === 0 ? "Today" : days < 0 ? `${Math.abs(days)}d overdue` : `${days} Days Left`}
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                            Expires {new Date(m.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }).toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href="/dashboard/members/renewals"
                          onClick={() => setShowExpiringPopup(false)}
                          className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                          style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                          <RefreshCw className="h-3 w-3" />
                          Renew
                        </Link>
                        {reminderState[m.user_id] ? (
                          <span className="flex items-center justify-center px-3 py-2 rounded-xl text-xs font-semibold"
                            style={{ background: "hsl(var(--muted)/0.5)", color: "hsl(var(--muted-foreground))" }}>
                            {reminderState[m.user_id] === "sent" ? "Reminded" : reminderState[m.user_id] === "rate_limited" ? "Already sent" : "No phone"}
                          </span>
                        ) : (
                          <button
                            onClick={() => sendReminder(m.user_id, {
                              onSuccess: (data) => setReminderState(s => ({ ...s, [m.user_id]: data.sent ? "sent" : (data.reason ?? "error") })),
                            })}
                            className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                            style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}>
                            <Send className="h-3 w-3" />
                            Remind
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {/* Footer */}
            {(dash?.expiring_soon_members ?? []).length > 0 && (
              <div className="px-4 py-4 flex-shrink-0" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                <Link href="/dashboard/members/renewals"
                  onClick={() => setShowExpiringPopup(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
                  <RefreshCw className="h-4 w-4" />
                  Renew All Expiring
                </Link>
              </div>
            )}
          </div>
        </>,
        document.body
      )}

      {/* Lapsed Members Side Panel */}
      {showLapsedPopup && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm" onClick={() => setShowLapsedPopup(false)} />
          <div className="fixed inset-y-0 right-0 z-[201] flex flex-col w-full max-w-sm shadow-2xl"
            style={{ background: "hsl(var(--card))", borderLeft: "1px solid rgba(239,68,68,0.3)" }}>
            {/* Accent strip */}
            <div className="h-1 flex-shrink-0" style={{ background: "linear-gradient(90deg,#ef4444,#f87171)" }} />
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: "1px solid hsl(var(--border))" }}>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <button onClick={() => setShowLapsedPopup(false)}
                    className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors">
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <span className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "#ef4444" }}>
                    {lapsedData?.total ?? 0} TOTAL
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground">Lapsed Members</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Members whose membership has expired and not renewed.
                </p>
              </div>
            </div>
            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {(lapsedData?.items ?? []).length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-muted-foreground">No lapsed members</p>
                </div>
              ) : (
                (lapsedData?.items ?? []).map((m) => (
                  <div key={m.participant_id} className="rounded-2xl p-4"
                    style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
                        {`${m.first_name?.[0] ?? ""}${m.last_name?.[0] ?? ""}`.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {m.first_name} {m.last_name ?? ""}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {m.email ?? m.phone ?? "—"}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
                          Lapsed
                        </span>
                        {m.membership_end_date && (
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">
                            Expired {new Date(m.membership_end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }).toUpperCase()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href="/dashboard/members/renewals"
                        onClick={() => setShowLapsedPopup(false)}
                        className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                        style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                        <RefreshCw className="h-3 w-3" />
                        Renew
                      </Link>
                      {reminderState[m.user_id] ? (
                        <span className="flex items-center justify-center px-3 py-2 rounded-xl text-xs font-semibold"
                          style={{ background: "hsl(var(--muted)/0.5)", color: "hsl(var(--muted-foreground))" }}>
                          {reminderState[m.user_id] === "sent" ? "Reminded" : reminderState[m.user_id] === "rate_limited" ? "Already sent" : "No phone"}
                        </span>
                      ) : (
                        <button
                          onClick={() => sendReminder(m.user_id, {
                            onSuccess: (data) => setReminderState(s => ({ ...s, [m.user_id]: data.sent ? "sent" : (data.reason ?? "error") })),
                          })}
                          className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                          style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                          <Send className="h-3 w-3" />
                          Remind
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Footer */}
            {(lapsedData?.items ?? []).length > 0 && (
              <div className="px-4 py-4 flex-shrink-0" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                <Link href="/dashboard/members/renewals"
                  onClick={() => setShowLapsedPopup(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}>
                  <RefreshCw className="h-4 w-4" />
                  Renew All Lapsed
                </Link>
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}


