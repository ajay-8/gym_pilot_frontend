"use client";

import { useMemberDashboard } from "@/lib/hooks/use-member-portal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { differenceInDays, format, parseISO } from "date-fns";
import {
  CreditCard,
  Dumbbell,
  TrendingUp,
  Zap,
  CalendarClock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const variants: Record<string, { label: string; color: string }> = {
    active:    { label: "Active",    color: "#10b981" },
    expired:   { label: "Expired",   color: "#ef4444" },
    cancelled: { label: "Cancelled", color: "#6b7280" },
    frozen:    { label: "Frozen",    color: "#3b82f6" },
    suspended: { label: "Suspended", color: "#f59e0b" },
  };
  const v = variants[status] ?? { label: status, color: "#6b7280" };
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ background: `${v.color}22`, color: v.color }}
    >
      {v.label}
    </span>
  );
}

function sessionModeBadge(mode: string) {
  const colors: Record<string, string> = {
    in_person: "#10b981",
    online:    "#3b82f6",
    hybrid:    "#8b5cf6",
  };
  const labels: Record<string, string> = {
    in_person: "In Person",
    online:    "Online",
    hybrid:    "Hybrid",
  };
  const color = colors[mode] ?? "#6b7280";
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: `${color}22`, color }}
    >
      {labels[mode] ?? mode}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MemberDashboardPage() {
  const { data, isLoading } = useMemberDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="h-7 w-7 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#3b82f6", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!data) return null;

  const membership = data.active_membership;

  // Days remaining on membership
  const daysRemaining = membership?.end_date
    ? differenceInDays(parseISO(membership.end_date), new Date())
    : null;

  // Progress bar (0-100) for days remaining
  let daysProgress = 100;
  if (membership?.start_date && membership.end_date) {
    const total = differenceInDays(parseISO(membership.end_date), parseISO(membership.start_date));
    const used = differenceInDays(new Date(), parseISO(membership.start_date));
    daysProgress = total > 0 ? Math.max(0, Math.min(100, Math.round(((total - used) / total) * 100))) : 0;
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Welcome back, {data.first_name || "Member"}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here&apos;s an overview of your gym activity.
        </p>
      </div>

      {/* ── Membership Card ───────────────────────────────────────────── */}
      {membership ? (
        <Card style={{ border: "1px solid rgba(59,130,246,0.2)", background: "rgba(59,130,246,0.04)" }}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(59,130,246,0.12)" }}
                >
                  <CreditCard className="h-5 w-5" style={{ color: "#3b82f6" }} />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    {membership.plan?.name ?? "Membership"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {membership.start_date
                      ? `Since ${format(parseISO(membership.start_date), "dd MMM yyyy")}`
                      : ""}
                  </p>
                </div>
              </div>
              {statusBadge(membership.status)}
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="font-medium text-foreground">
                  {membership.start_date
                    ? format(parseISO(membership.start_date), "dd MMM yyyy")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expiry Date</p>
                <p className="font-medium text-foreground">
                  {membership.end_date
                    ? format(parseISO(membership.end_date), "dd MMM yyyy")
                    : "Lifetime"}
                </p>
              </div>
              {daysRemaining !== null && (
                <div>
                  <p className="text-xs text-muted-foreground">Days Remaining</p>
                  <p
                    className="font-semibold"
                    style={{ color: daysRemaining <= 7 ? "#ef4444" : daysRemaining <= 30 ? "#f59e0b" : "#10b981" }}
                  >
                    {daysRemaining >= 0 ? `${daysRemaining}d` : "Expired"}
                  </p>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {membership.end_date && (
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Membership validity</span>
                  <span>{daysProgress}% remaining</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${daysProgress}%`,
                      background: daysProgress > 30 ? "#3b82f6" : daysProgress > 10 ? "#f59e0b" : "#ef4444",
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card style={{ border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.04)" }}>
          <CardContent className="flex items-center gap-3 py-5">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">No active membership</p>
              <p className="text-xs text-muted-foreground">Contact your gym admin to get started.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Stats Strip ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Check-ins This Month",
            value: data.check_ins_this_month,
            icon: TrendingUp,
            color: "#10b981",
          },
          {
            label: "Upcoming Sessions",
            value: data.upcoming_pt_sessions,
            icon: CalendarClock,
            color: "#3b82f6",
          },
          {
            label: "PT Credits Available",
            value: data.active_pt_credits,
            icon: Zap,
            color: "#8b5cf6",
          },
        ].map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground leading-snug">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${stat.color}20` }}
                >
                  <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Active PT Packages ────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Active PT Packages</h3>
            <Link href="/member/sessions" className="text-xs" style={{ color: "#3b82f6" }}>
              View all →
            </Link>
          </div>
          {data.active_packages.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Dumbbell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No active PT packages</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {data.active_packages.map((pkg) => {
                const creditsUsed = pkg.sessions_total - pkg.sessions_remaining;
                const progressPct = pkg.sessions_total > 0
                  ? Math.round((pkg.sessions_remaining / pkg.sessions_total) * 100)
                  : 0;
                return (
                  <Card key={pkg.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {(pkg.package_snapshot as Record<string, unknown>)?.name as string ?? "PT Package"}
                          </p>
                          {pkg.expiry_date && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Expires {format(parseISO(pkg.expiry_date), "dd MMM yyyy")}
                            </p>
                          )}
                        </div>
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "#8b5cf6" }}
                        >
                          {pkg.sessions_remaining} left
                        </span>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{creditsUsed} used of {pkg.sessions_total}</span>
                          <span>{progressPct}% remaining</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10">
                          <div
                            className="h-1.5 rounded-full"
                            style={{ width: `${progressPct}%`, background: "#8b5cf6" }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Upcoming Sessions ─────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Upcoming PT Sessions</h3>
            <Link href="/member/sessions" className="text-xs" style={{ color: "#3b82f6" }}>
              View all →
            </Link>
          </div>
          {data.upcoming_sessions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CalendarClock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming sessions</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {data.upcoming_sessions.map((session) => (
                <Card key={session.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {session.session_type ?? "PT Session"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(parseISO(session.start_time), "EEE, dd MMM · HH:mm")}
                          {" — "}
                          {format(parseISO(session.end_time), "HH:mm")}
                        </p>
                      </div>
                      {sessionModeBadge(session.session_mode)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
