"use client";

import { useState } from "react";
import { useMyCheckIns } from "@/lib/hooks/use-member-portal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { ClipboardCheck, ChevronLeft, ChevronRight, Calendar, Clock, Timer } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(checkedIn: string, checkedOut: string | null): string {
  if (!checkedOut) return "Active";
  const mins = differenceInMinutes(parseISO(checkedOut), parseISO(checkedIn));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CheckInsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyCheckIns({ page, page_size: 20 });

  const totalVisits = data?.total ?? 0;
  const thisMonth = data?.items.filter((c) => {
    const d = parseISO(c.checked_in_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length ?? 0;
  const activeNow = data?.items.find((c) => !c.checked_out_at);

  return (
    <div className="space-y-6">
      {/* ── Summary Strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Total Visits",
            value: totalVisits.toString(),
            icon: Calendar,
            color: "#3b82f6",
          },
          {
            label: "This Month",
            value: thisMonth.toString(),
            icon: Clock,
            color: "#10b981",
          },
          {
            label: "Status",
            value: activeNow ? "Checked In" : "Not Checked In",
            icon: Timer,
            color: activeNow ? "#10b981" : "#6b7280",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground mt-1">{stat.value}</p>
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

      {/* ── Check-in History Table ─────────────────────────────────────── */}
      <Card>
        {isLoading ? (
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Loading…</CardContent>
        ) : !data || data.items.length === 0 ? (
          <CardContent className="py-12 text-center">
            <ClipboardCheck className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No check-in history yet.</p>
          </CardContent>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                    {["Date", "Check-in Time", "Check-out Time", "Duration", "Notes"].map((h) => (
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
                  {data.items.map((c) => (
                    <tr
                      key={c.id}
                      style={{ borderBottom: "1px solid hsl(var(--border))" }}
                      className="hover:bg-white/3 transition-colors"
                    >
                      <td className="px-4 py-3 text-foreground font-medium">
                        {format(parseISO(c.checked_in_at), "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {format(parseISO(c.checked_in_at), "hh:mm a")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.checked_out_at ? (
                          format(parseISO(c.checked_out_at), "hh:mm a")
                        ) : (
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                            style={{ background: "#10b98122", color: "#10b981" }}
                          >
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDuration(c.checked_in_at, c.checked_out_at)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {c.notes ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.total_pages > 1 && (
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderTop: "1px solid hsl(var(--border))" }}
              >
                <p className="text-xs text-muted-foreground">
                  Page {data.page} of {data.total_pages} &middot; {data.total} visits
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
                    disabled={page >= data.total_pages}
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
  );
}
