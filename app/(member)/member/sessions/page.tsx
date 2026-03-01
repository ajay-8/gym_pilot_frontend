"use client";

import { useState } from "react";
import { useMyPTSessions, useMyPTPurchases } from "@/lib/hooks/use-member-portal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import {
  CalendarClock,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function modeBadge(mode: string) {
  const colors: Record<string, string> = { in_person: "#10b981", online: "#3b82f6", hybrid: "#8b5cf6" };
  const labels: Record<string, string> = { in_person: "In Person", online: "Online", hybrid: "Hybrid" };
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

// ── How Credits Work banner ───────────────────────────────────────────────────

function CreditFlowBanner() {
  return (
    <div
      className="flex gap-3 rounded-lg px-4 py-3 text-sm"
      style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}
    >
      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "#8b5cf6" }} />
      <div style={{ color: "#c4b5fd" }}>
        <span className="font-semibold" style={{ color: "#a78bfa" }}>How credits work: </span>
        When you train with your PT, they log the session which deducts one credit from your package.
        You can track remaining credits in your active packages below.
      </div>
    </div>
  );
}

// ── Active Packages section ───────────────────────────────────────────────────

function ActivePackagesSection() {
  const { data: purchasesData, isLoading } = useMyPTPurchases({ status: "active" });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Active PT Packages</h2>
        {purchasesData && purchasesData.total > 0 && (
          <span className="text-xs text-muted-foreground">{purchasesData.total} active</span>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading packages…</p>
      ) : !purchasesData || purchasesData.items.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center">
            <Dumbbell className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">
              No active packages. Browse trainers to purchase one.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {purchasesData.items.map((pkg) => {
            const snapshot = pkg.package_snapshot as Record<string, unknown>;
            const progressPct =
              pkg.sessions_total > 0
                ? Math.round((pkg.sessions_remaining / pkg.sessions_total) * 100)
                : 0;
            const pkgName = (snapshot?.name as string) ?? "PT Package";
            const trainerName = pkg.trainer_name ?? null;
            return (
              <Card key={pkg.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-sm font-medium text-foreground">{pkgName}</p>
                      {trainerName && (
                        <p className="text-xs" style={{ color: "#8b5cf6" }}>
                          {trainerName}
                        </p>
                      )}
                      {pkg.expiry_date && (
                        <p className="text-xs text-muted-foreground">
                          Expires {format(parseISO(pkg.expiry_date), "dd MMM yyyy")}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-lg font-bold tabular-nums flex-shrink-0"
                      style={{ color: "#8b5cf6" }}
                    >
                      {pkg.sessions_remaining}
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{pkg.sessions_used} used / {pkg.sessions_total} total</span>
                      <span style={{ color: "#8b5cf6" }}>{pkg.sessions_remaining} left</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10">
                      <div
                        className="h-1.5 rounded-full transition-all"
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
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SessionsPage() {
  const [page, setPage] = useState(1);

  const { data: sessionsData, isLoading: sessionsLoading } = useMyPTSessions({
    status: "completed",
    page,
    page_size: 10,
  });

  return (
    <div className="space-y-6">
      {/* Credit flow explanation */}
      <CreditFlowBanner />

      {/* Active packages — always visible */}
      <ActivePackagesSection />

      {/* Session history */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Session History</h2>

        <Card>
          {sessionsLoading ? (
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Loading…
            </CardContent>
          ) : !sessionsData || sessionsData.items.length === 0 ? (
            <CardContent className="py-12 text-center">
              <CalendarClock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No sessions logged yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Visit the gym and your trainer will log each session after it happens.
              </p>
            </CardContent>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                      {["Date", "Duration", "Type", "Mode"].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessionsData.items.map((s) => {
                      const dur = Math.round(
                        (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000
                      );
                      const dateStr = s.completed_at
                        ? format(parseISO(s.completed_at), "EEE, dd MMM yyyy")
                        : format(parseISO(s.start_time), "EEE, dd MMM yyyy");
                      return (
                        <tr
                          key={s.id}
                          style={{ borderBottom: "1px solid hsl(var(--border))" }}
                          className="hover:bg-white/3 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-foreground">{dateStr}</td>
                          <td className="px-4 py-3 text-muted-foreground">{dur} min</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {s.session_type ?? "PT Session"}
                          </td>
                          <td className="px-4 py-3">{modeBadge(s.session_mode)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {sessionsData.total_pages > 1 && (
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderTop: "1px solid hsl(var(--border))" }}
                >
                  <p className="text-xs text-muted-foreground">
                    Page {sessionsData.page} of {sessionsData.total_pages} &middot;{" "}
                    {sessionsData.total} sessions
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= sessionsData.total_pages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
