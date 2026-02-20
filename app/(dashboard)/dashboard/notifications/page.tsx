"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  BellOff,
  CheckCheck,
  Users,
  CreditCard,
  AlertTriangle,
  Calendar,
  Info,
  ScanLine,
  Circle,
} from "lucide-react";
import { useNotifications, useMarkRead, useMarkAllRead } from "@/lib/hooks/use-notifications";
import type { NotificationResponse, NotificationType } from "@/types/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ── Notification icon + color by type ────────────────────────────────────────

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  new_member:          { icon: Users,         color: "#10b981", bg: "rgba(16,185,129,0.12)", label: "New Member" },
  membership_expiring: { icon: AlertTriangle,  color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Expiring Soon" },
  membership_expired:  { icon: BellOff,        color: "#ef4444", bg: "rgba(239,68,68,0.1)",   label: "Expired" },
  payment_received:    { icon: CreditCard,     color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", label: "Payment" },
  payment_overdue:     { icon: AlertTriangle,  color: "#ef4444", bg: "rgba(239,68,68,0.1)",   label: "Overdue" },
  class_booking:       { icon: Calendar,       color: "#3b82f6", bg: "rgba(59,130,246,0.12)", label: "Class" },
  check_in:            { icon: ScanLine,       color: "#06b6d4", bg: "rgba(6,182,212,0.12)",  label: "Check-in" },
  general:             { icon: Info,           color: "#6b7280", bg: "rgba(107,114,128,0.1)", label: "General" },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type as NotificationType] ?? TYPE_CONFIG.general;
}

// ── Notification Row ──────────────────────────────────────────────────────────

function NotificationRow({
  item,
  onMarkRead,
  isMarking,
}: {
  item: NotificationResponse;
  onMarkRead: () => void;
  isMarking: boolean;
}) {
  const cfg = getConfig(item.type);
  const Icon = cfg.icon;

  return (
    <div
      className="flex items-start gap-3.5 px-4 py-4 transition-all"
      style={{
        borderBottom: "1px solid hsl(var(--border)/0.6)",
        background: item.is_read ? "transparent" : "rgba(16,185,129,0.02)",
      }}
    >
      <div
        className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: cfg.bg }}
      >
        <Icon className="h-4 w-4" style={{ color: cfg.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className="text-sm text-foreground leading-tight"
              style={{ fontWeight: item.is_read ? 500 : 700 }}
            >
              {item.title}
            </p>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <p className="text-[10px] text-muted-foreground whitespace-nowrap">
              {fmtRelative(item.created_at)}
            </p>
            {!item.is_read && (
              <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: "#10b981" }} />
            )}
          </div>
        </div>
        <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{item.message}</p>
        {!item.is_read && (
          <button
            onClick={onMarkRead}
            disabled={isMarking}
            className="mt-1.5 text-[11px] font-semibold transition-colors hover:opacity-70 disabled:opacity-40"
            style={{ color: "#10b981" }}
          >
            {isMarking ? "Marking…" : "Mark as read"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  // Single query — fetch all, filter client-side for the tab
  const { data, isLoading } = useNotifications({ page_size: 100 });
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const allItems = data?.items ?? [];
  const unreadCount = data?.unread_count ?? 0;
  const total = data?.total ?? 0;

  // Client-side filter for tab
  const displayedItems = useMemo(
    () => (unreadOnly ? allItems.filter((n) => !n.is_read) : allItems),
    [allItems, unreadOnly]
  );

  // Counts by type from all items
  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    allItems.forEach((n) => { map[n.type] = (map[n.type] ?? 0) + 1; });
    return map;
  }, [allItems]);

  const expiringCount = (byType["membership_expiring"] ?? 0) + (byType["membership_expired"] ?? 0);
  const paymentCount  = (byType["payment_received"] ?? 0)    + (byType["payment_overdue"] ?? 0);
  const memberCount   = byType["new_member"] ?? 0;

  const handleMarkRead = async (id: string) => {
    setMarkingId(id);
    try { await markRead.mutateAsync(id); }
    finally { setMarkingId(null); }
  };

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-foreground leading-tight">Notifications</h1>
          <p className="text-[11px] text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread · ${total} total`
              : total > 0 ? `${total} notifications · all read` : "No notifications yet"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutateAsync()}
            disabled={markAllRead.isPending}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {markAllRead.isPending ? "Marking…" : "Mark all read"}
          </button>
        )}
      </div>

      {/* ── Stat Cards (derived from same query) ────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Unread",
            value: unreadCount,
            sub: "require attention",
            icon: Circle,
            color: unreadCount > 0 ? "#f59e0b" : "#10b981",
            bg: unreadCount > 0 ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)",
          },
          {
            label: "New Members",
            value: memberCount,
            sub: "joined notifications",
            icon: Users,
            color: "#10b981",
            bg: "rgba(16,185,129,0.12)",
          },
          {
            label: "Expiring",
            value: expiringCount,
            sub: "membership alerts",
            icon: AlertTriangle,
            color: expiringCount > 0 ? "#ef4444" : "#6b7280",
            bg: expiringCount > 0 ? "rgba(239,68,68,0.1)" : "rgba(107,114,128,0.1)",
          },
          {
            label: "Payments",
            value: paymentCount,
            sub: "payment events",
            icon: CreditCard,
            color: "#8b5cf6",
            bg: "rgba(139,92,246,0.12)",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl px-4 py-3.5"
            style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>
                <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Filter tabs ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        {[
          { label: `All (${total})`, value: false },
          { label: "Unread", value: true },
        ].map((t) => (
          <button
            key={String(t.value)}
            onClick={() => setUnreadOnly(t.value)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
            style={
              unreadOnly === t.value
                ? { background: "rgba(16,185,129,0.15)", color: "#10b981" }
                : { background: "hsl(var(--muted)/0.5)", color: "hsl(var(--muted-foreground))" }
            }
          >
            {t.label}
            {t.value && unreadCount > 0 && (
              <span
                className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                style={{ background: "#10b981", color: "#fff" }}
              >
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Notification List ────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">Loading…</div>
        ) : displayedItems.length === 0 ? (
          <div className="py-16 text-center">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(16,185,129,0.08)" }}
            >
              <Bell className="h-7 w-7" style={{ color: "#10b981" }} />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">
              {unreadOnly ? "No unread notifications" : "No notifications yet"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {unreadOnly ? "All caught up! Switch to 'All' to see history." : "Alerts will appear here when events occur."}
            </p>
          </div>
        ) : (
          displayedItems.map((item) => (
            <NotificationRow
              key={item.id}
              item={item}
              onMarkRead={() => handleMarkRead(item.id)}
              isMarking={markingId === item.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
