"use client";

import { useMySessions, useMyCommissionSummary, useMyPerformance } from "@/lib/hooks/use-trainer-portal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarCheck,
  Clock,
  Users,
  DollarSign,
  TrendingUp,
  Loader2,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}


const MODE_LABELS: Record<string, string> = {
  in_person: "In Person",
  online: "Online",
  hybrid: "Hybrid",
};

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  sub,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
            <Icon className="h-5 w-5" style={{ color: iconColor }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TrainerDashboardPage() {
  // Today & this week date ranges
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Queries
  const { data: todaySessions, isLoading: loadingToday } = useMySessions({
    status: "scheduled",
  });
  const { data: upcomingSessions, isLoading: loadingUpcoming } = useMySessions({
    status: "scheduled",
    page_size: 5,
  });
  const { data: commissionSummary, isLoading: loadingCommissions } = useMyCommissionSummary();
  const { data: performance, isLoading: loadingPerf } = useMyPerformance();

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
        <p className="text-sm text-muted-foreground mt-1">Here's an overview of your training activity</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Sessions"
          value={loadingToday ? "—" : (todaySessions?.total ?? 0)}
          icon={CalendarCheck}
          iconColor="#10b981"
          iconBg="rgba(16,185,129,0.12)"
          sub="Scheduled for today"
        />
        <StatCard
          title="This Week"
          value={loadingUpcoming ? "—" : (upcomingSessions?.total ?? 0)}
          icon={Clock}
          iconColor="#3b82f6"
          iconBg="rgba(59,130,246,0.12)"
          sub="Upcoming sessions"
        />
        <StatCard
          title="Active Clients"
          value={loadingPerf ? "—" : (performance?.active_clients ?? 0)}
          icon={Users}
          iconColor="#8b5cf6"
          iconBg="rgba(139,92,246,0.12)"
          sub="With active packages"
        />
        <StatCard
          title="Pending Commission"
          value={loadingCommissions ? "—" : `$${Number(commissionSummary?.total_pending ?? 0).toFixed(2)}`}
          icon={DollarSign}
          iconColor="#f59e0b"
          iconBg="rgba(245,158,11,0.12)"
          sub="Awaiting payment"
        />
      </div>

      {/* Upcoming Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Upcoming Sessions</CardTitle>
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {loadingUpcoming ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !upcomingSessions?.items?.length ? (
              <div className="text-center py-8">
                <CalendarCheck className="h-8 w-8 mx-auto text-muted-foreground opacity-30 mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming sessions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.items.map((session) => {
                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ background: "hsl(var(--muted)/0.3)" }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {fmtDate(session.start_time)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {fmtTime(session.start_time)} · {Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 60000)} min
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa" }}
                        >
                          {MODE_LABELS[session.session_mode] ?? session.session_mode}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Performance Summary</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {loadingPerf || loadingCommissions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid hsl(var(--border)/0.5)" }}>
                  <span className="text-sm text-muted-foreground">Total Sessions (All Time)</span>
                  <span className="text-sm font-semibold text-foreground">{performance?.total_sessions ?? 0}</span>
                </div>
                <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid hsl(var(--border)/0.5)" }}>
                  <span className="text-sm text-muted-foreground">Completed Sessions</span>
                  <span className="text-sm font-semibold text-foreground">{performance?.completed_sessions ?? 0}</span>
                </div>
                <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid hsl(var(--border)/0.5)" }}>
                  <span className="text-sm text-muted-foreground">Active Clients</span>
                  <span className="text-sm font-semibold text-foreground">{performance?.active_clients ?? 0}</span>
                </div>
                <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid hsl(var(--border)/0.5)" }}>
                  <span className="text-sm text-muted-foreground">Total Earned</span>
                  <span className="text-sm font-semibold" style={{ color: "#10b981" }}>
                    ${Number(commissionSummary?.total_earnings ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Total Paid Out</span>
                  <span className="text-sm font-semibold" style={{ color: "#10b981" }}>
                    ${Number(commissionSummary?.total_paid ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
