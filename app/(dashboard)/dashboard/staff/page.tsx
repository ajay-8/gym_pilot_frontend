"use client";

import { useState } from "react";
import {
  Users,
  Search,
  X,
  ChevronRight,
  Phone,
  Mail,
  Shield,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { useStaff } from "@/lib/hooks/use-staff";
import type { StaffListItem } from "@/types/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(first: string | null | undefined, last: string | null | undefined) {
  const f = (first ?? "").trim()[0] ?? "";
  const l = (last ?? "").trim()[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fullName(item: StaffListItem) {
  return [item.first_name, item.last_name].filter(Boolean).join(" ") || "Unnamed";
}

// ── Role Badge ────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  owner: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  admin: { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
  trainer: { bg: "rgba(139,92,246,0.12)", color: "#8b5cf6" },
  staff: { bg: "rgba(59,130,246,0.12)", color: "#3b82f6" },
};

function RoleBadge({ role }: { role: string }) {
  const style = ROLE_COLORS[role.toLowerCase()] ?? {
    bg: "rgba(107,114,128,0.1)",
    color: "#9ca3af",
  };
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
      style={{ background: style.bg, color: style.color }}
    >
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={
        isActive
          ? { background: "rgba(16,185,129,0.12)", color: "#10b981" }
          : { background: "rgba(239,68,68,0.1)", color: "#ef4444" }
      }
    >
      {isActive ? "Active" : status}
    </span>
  );
}

// ── Avatar color by role ──────────────────────────────────────────────────────

function avatarStyle(roles: string[]) {
  if (roles.includes("owner"))
    return { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" };
  if (roles.includes("admin"))
    return { bg: "rgba(239,68,68,0.1)", color: "#ef4444" };
  if (roles.includes("trainer"))
    return { bg: "rgba(139,92,246,0.12)", color: "#8b5cf6" };
  return { bg: "rgba(59,130,246,0.12)", color: "#3b82f6" };
}

// ── Staff Card ────────────────────────────────────────────────────────────────

function StaffCard({
  item,
  onClick,
}: {
  item: StaffListItem;
  onClick: () => void;
}) {
  const name = fullName(item);
  const av = avatarStyle(item.roles);
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-4 transition-all hover:bg-white/[0.02] group"
      style={{ borderBottom: "1px solid hsl(var(--border)/0.6)" }}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: av.bg, color: av.color }}
        >
          {initials(item.first_name, item.last_name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground truncate">{name}</p>
            <StatusBadge status={item.status} />
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {item.roles.map((r) => (
              <RoleBadge key={r} role={r} />
            ))}
          </div>
        </div>

        {/* Email (hidden sm) */}
        <p className="hidden md:block text-[11px] text-muted-foreground truncate max-w-[160px]">
          {item.email ?? "—"}
        </p>

        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
    </button>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

function DetailPanel({
  item,
  onClose,
}: {
  item: StaffListItem;
  onClose: () => void;
}) {
  const name = fullName(item);
  const av = avatarStyle(item.roles);

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-sm shadow-2xl"
      style={{ background: "hsl(var(--card))", borderLeft: "1px solid hsl(var(--border))" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid hsl(var(--border))" }}
      >
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: av.bg, color: av.color }}
        >
          {initials(item.first_name, item.last_name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{name}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {item.roles.map((r) => (
              <RoleBadge key={r} role={r} />
            ))}
          </div>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Status */}
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Status
          </p>
          <StatusBadge status={item.status} />
        </div>

        {/* Contact */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Contact
          </p>
          <div className="space-y-2">
            <DetailRow icon={Mail} label="Email" value={item.email ?? "—"} />
            <DetailRow icon={Phone} label="Phone" value={item.phone ?? "—"} />
          </div>
        </div>

        {/* Roles */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Roles
          </p>
          <div
            className="rounded-xl p-3 space-y-2"
            style={{ background: "hsl(var(--muted)/0.2)" }}
          >
            {item.roles.map((r) => {
              const style = ROLE_COLORS[r.toLowerCase()] ?? { bg: "transparent", color: "#9ca3af" };
              return (
                <div key={r} className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" style={{ color: style.color }} />
                  <span className="text-sm font-medium text-foreground capitalize">{r}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Membership details */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Membership
          </p>
          <DetailRow icon={Calendar} label="Joined" value={fmtDate(item.joined_at)} />
        </div>

        {/* IDs */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            System IDs
          </p>
          <div
            className="rounded-xl p-3 space-y-1.5"
            style={{ background: "hsl(var(--muted)/0.2)" }}
          >
            <IdRow label="User ID" value={item.user_id} />
            <IdRow label="Participant ID" value={item.participant_id} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{ background: "hsl(var(--muted)/0.2)" }}
    >
      <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

function IdRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p
        className="text-[11px] font-mono text-foreground truncate"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        {value}
      </p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function StaffPage() {
  const [search, setSearch] = useState("");
  const [page] = useState(1);
  const [selected, setSelected] = useState<StaffListItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { data, isLoading } = useStaff({
    search: search || undefined,
    page,
    page_size: 100,
  });

  const items = data?.items ?? [];

  // Role counts
  const roleCounts: Record<string, number> = {};
  items.forEach((item) => {
    item.roles.forEach((r) => {
      roleCounts[r] = (roleCounts[r] ?? 0) + 1;
    });
  });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }
  void showToast; // prevent unused warning

  const statCards = [
    {
      label: "Total Staff",
      value: data?.total ?? 0,
      icon: Users,
      bg: "rgba(16,185,129,0.12)",
      color: "#10b981",
    },
    {
      label: "Owners",
      value: roleCounts["owner"] ?? 0,
      icon: Shield,
      bg: "rgba(245,158,11,0.12)",
      color: "#f59e0b",
    },
    {
      label: "Admins",
      value: roleCounts["admin"] ?? 0,
      icon: Shield,
      bg: "rgba(239,68,68,0.1)",
      color: "#ef4444",
    },
    {
      label: "Trainers",
      value: roleCounts["trainer"] ?? 0,
      icon: Users,
      bg: "rgba(139,92,246,0.12)",
      color: "#8b5cf6",
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-base font-bold text-foreground leading-tight">Staff Management</h1>
        <p className="text-[11px] text-muted-foreground">
          View all staff, admins, trainers and owners at your gym
        </p>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl px-4 py-3.5"
            style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="h-6 w-6 rounded-lg flex items-center justify-center"
                style={{ background: s.bg }}
              >
                <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or phone…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
          }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        )}
      </div>

      {/* ── Staff List ──────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(16,185,129,0.08)" }}
            >
              <Users className="h-7 w-7" style={{ color: "#10b981" }} />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">No staff found</p>
            <p className="text-[11px] text-muted-foreground">
              {search ? `No results for "${search}"` : "No staff members yet."}
            </p>
          </div>
        ) : (
          items.map((item) => (
            <StaffCard
              key={item.participant_id}
              item={item}
              onClick={() => setSelected(item)}
            />
          ))
        )}
      </div>

      {/* ── Detail Panel ────────────────────────────────────────────────── */}
      {selected && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setSelected(null)}
          />
          <DetailPanel item={selected} onClose={() => setSelected(null)} />
        </>
      )}

      {/* ── Toast ───────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-2xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
        >
          <CheckCircle className="h-4 w-4" />
          {toast}
        </div>
      )}
    </div>
  );
}
