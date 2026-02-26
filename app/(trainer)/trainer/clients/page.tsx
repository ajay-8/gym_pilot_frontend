"use client";

import { useState } from "react";
import { Users, ChevronRight, X, ExternalLink } from "lucide-react";
import { useMyClients } from "@/lib/hooks/use-trainer-portal";
import type { PTClientSummary } from "@/types/api";

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(first: string | null, last: string | null) {
  return ((first?.[0] ?? "") + (last?.[0] ?? "")).toUpperCase() || "?";
}

function fullName(c: PTClientSummary) {
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unnamed";
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

// ── Detail Panel ───────────────────────────────────────────────────────────────

function DetailPanel({ client, onClose }: { client: PTClientSummary; onClose: () => void }) {
  const name = fullName(client);

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
          style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6" }}
        >
          {initials(client.first_name, client.last_name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {client.total_sessions} session{client.total_sessions !== 1 ? "s" : ""} total
          </p>
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

        {/* Contact */}
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Contact</p>
          <div className="space-y-1">
            {client.email && <p className="text-xs text-foreground">{client.email}</p>}
            {client.phone && <p className="text-xs text-foreground">{client.phone}</p>}
            {!client.email && !client.phone && (
              <p className="text-xs text-muted-foreground">No contact info</p>
            )}
          </div>
        </div>

        {/* Session Stats */}
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Sessions</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Total", value: client.total_sessions, color: "#8b5cf6" },
              { label: "Done", value: client.sessions_completed, color: "#10b981" },
              { label: "Upcoming", value: client.sessions_scheduled, color: "#f59e0b" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-xl p-3 text-center"
                style={{ background: "hsl(var(--muted)/0.4)", border: "1px solid hsl(var(--border))" }}
              >
                <p className="text-lg font-bold" style={{ color }}>{value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Timeline</p>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Last session</span>
              <span className="text-foreground">{fmtDateTime(client.last_session_at)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Next session</span>
              <span className="text-foreground">{fmtDateTime(client.next_session_at)}</span>
            </div>
          </div>
        </div>

        {/* Active Package */}
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Active Package</p>
          {client.active_package_name ? (
            <div
              className="rounded-xl p-3 space-y-2"
              style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}
            >
              <p className="text-xs font-semibold text-foreground">{client.active_package_name}</p>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Credits remaining</span>
                <span
                  className="text-sm font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6" }}
                >
                  {client.active_package_credits_remaining}
                </span>
              </div>
              {client.active_package_expiry && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Expires</span>
                  <span className="text-[11px] text-foreground">{fmtDate(client.active_package_expiry)}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No active package</p>
          )}
        </div>

        {/* Session history link */}
        <a
          href={`/trainer/sessions?member_id=${client.participant_id}`}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all hover:opacity-80"
          style={{ background: "rgba(139,92,246,0.08)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.2)" }}
        >
          <span>View Session History</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState<PTClientSummary | null>(null);

  const { data, isLoading } = useMyClients({
    search: debouncedSearch || undefined,
    page_size: 50,
  });

  const clients = data?.items ?? [];

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as { __clientSearchTimeout?: ReturnType<typeof setTimeout> }).__clientSearchTimeout);
    (window as { __clientSearchTimeout?: ReturnType<typeof setTimeout> }).__clientSearchTimeout = setTimeout(() => {
      setDebouncedSearch(val);
    }, 300);
  };

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-base font-bold text-foreground leading-tight">My Clients</h1>
        <p className="text-[11px] text-muted-foreground">
          {data?.total ?? 0} client{(data?.total ?? 0) !== 1 ? "s" : ""} across all sessions
        </p>
      </div>

      {/* ── Search ──────────────────────────────────────────── */}
      <input
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search by name, email or phone…"
        className="w-full px-3 py-2 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      />

      {/* ── Table ───────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        {/* Header row */}
        <div
          className="grid px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
          style={{
            borderBottom: "1px solid hsl(var(--border)/0.6)",
            gridTemplateColumns: "1fr 60px 60px 80px auto",
          }}
        >
          <span>Client</span>
          <span className="text-center">Done</span>
          <span className="text-center">Credits</span>
          <span>Last Session</span>
          <span />
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">Loading…</div>
        ) : clients.length === 0 ? (
          <div className="py-16 text-center">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(139,92,246,0.08)" }}
            >
              <Users className="h-7 w-7" style={{ color: "#8b5cf6" }} />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">
              {search ? "No clients found" : "No clients yet"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {search
                ? "Try adjusting your search."
                : "Clients appear here once you have a session booked with a member."}
            </p>
          </div>
        ) : (
          clients.map((client) => {
            const name = fullName(client);
            const hasCredits = client.active_package_credits_remaining > 0;

            return (
              <button
                key={client.participant_id}
                onClick={() => setSelected(client)}
                className="w-full text-left hover:bg-white/[0.02] transition-all group"
                style={{ borderBottom: "1px solid hsl(var(--border)/0.4)" }}
              >
                <div
                  className="grid items-center px-4 py-3"
                  style={{ gridTemplateColumns: "1fr 60px 60px 80px auto" }}
                >
                  {/* Name + avatar */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                      style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6" }}
                    >
                      {initials(client.first_name, client.last_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {client.email ?? client.phone ?? "—"}
                      </p>
                    </div>
                  </div>

                  {/* Sessions completed */}
                  <span className="text-[12px] font-semibold text-center tabular-nums" style={{ color: "#10b981" }}>
                    {client.sessions_completed}
                  </span>

                  {/* Credits remaining */}
                  <span
                    className="text-[12px] font-semibold text-center tabular-nums"
                    style={{ color: hasCredits ? "#8b5cf6" : "hsl(var(--muted-foreground))" }}
                  >
                    {client.active_package_credits_remaining > 0
                      ? client.active_package_credits_remaining
                      : "—"}
                  </span>

                  {/* Last session */}
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {fmtDate(client.last_session_at)}
                  </span>

                  {/* Arrow */}
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* ── Detail Panel ─────────────────────────────────────── */}
      {selected && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setSelected(null)} />
          <DetailPanel client={selected} onClose={() => setSelected(null)} />
        </>
      )}
    </div>
  );
}
