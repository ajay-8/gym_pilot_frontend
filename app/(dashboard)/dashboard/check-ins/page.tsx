"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Search, LogIn, LogOut, Clock, Users, CheckCircle, X, RefreshCw,
} from "lucide-react";
import { useCheckIns, useCheckInCreate, useCheckout } from "@/lib/hooks/use-check-ins";
import { useMembers } from "@/lib/hooks/use-members";
import type { MemberListItem, CheckInResponse } from "@/types/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayRange() {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  return { date_from: from.toISOString(), date_to: to.toISOString() };
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function duration(from: string, to: string | null) {
  const ms = (to ? new Date(to) : new Date()).getTime() - new Date(from).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function initials(first?: string, last?: string | null) {
  return ((first?.[0] ?? "") + (last?.[0] ?? "")).toUpperCase() || "?";
}

// ── Member Search Dropdown ─────────────────────────────────────────────────────

interface MemberSearchProps {
  onCheckIn: (member: MemberListItem) => void;
  alreadyInGym: Set<string>; // participant_ids currently inside
  isPending: boolean;
}

function MemberSearch({ onCheckIn, alreadyInGym, isPending }: MemberSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: membersData } = useMembers({ search: query.trim() || undefined, page_size: 8 });
  const results = membersData?.items ?? [];

  useEffect(() => {
    setOpen(!!query.trim() && results.length > 0);
  }, [query, results.length]);

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const handleSelect = (member: MemberListItem) => {
    onCheckIn(member);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search member by name or phone…"
          className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
          autoComplete="off"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center hover:bg-muted"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>

      {open && (
        <div
          className="absolute top-full mt-1.5 left-0 right-0 z-50 rounded-xl shadow-2xl overflow-hidden"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          {results.map((m) => {
            const inside = alreadyInGym.has(m.participant_id);
            return (
              <button
                key={m.participant_id}
                onClick={() => !inside && handleSelect(m)}
                disabled={inside || isPending}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ borderBottom: "1px solid hsl(var(--border)/0.5)" }}
              >
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}
                >
                  {initials(m.first_name, m.last_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {m.first_name} {m.last_name ?? ""}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{m.phone ?? "—"}</p>
                </div>
                {inside ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
                    Inside
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-muted-foreground flex-shrink-0">
                    Check In →
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Check-in Row ──────────────────────────────────────────────────────────────

interface CheckInRowProps {
  checkIn: CheckInResponse;
  member?: MemberListItem;
  onCheckout: () => void;
  isCheckingOut: boolean;
}

function CheckInRow({ checkIn, member, onCheckout, isCheckingOut }: CheckInRowProps) {
  const isInside = !checkIn.checked_out_at;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5"
      style={{ borderBottom: "1px solid hsl(var(--border)/0.6)" }}
    >
      {/* Status strip + avatar */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div
          className="w-0.5 h-9 rounded-full"
          style={{ background: isInside ? "#10b981" : "hsl(var(--border))" }}
        />
        <div
          className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={
            isInside
              ? { background: "rgba(16,185,129,0.12)", color: "#10b981" }
              : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
          }
        >
          {member ? initials(member.first_name, member.last_name) : "?"}
        </div>
      </div>

      {/* Name + phone */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate leading-tight">
          {member ? `${member.first_name} ${member.last_name ?? ""}` : "Unknown Member"}
        </p>
        <p className="text-[11px] text-muted-foreground">{member?.phone ?? "—"}</p>
      </div>

      {/* Time in */}
      <div className="hidden sm:block text-right flex-shrink-0">
        <p className="text-[10px] text-muted-foreground">In</p>
        <p className="text-xs font-semibold text-foreground">{fmtTime(checkIn.checked_in_at)}</p>
      </div>

      {/* Time out / duration */}
      <div className="text-right flex-shrink-0 min-w-[56px]">
        {checkIn.checked_out_at ? (
          <>
            <p className="text-[10px] text-muted-foreground">Out</p>
            <p className="text-xs font-semibold text-foreground">{fmtTime(checkIn.checked_out_at)}</p>
          </>
        ) : (
          <>
            <p className="text-[10px]" style={{ color: "#10b981" }}>Inside</p>
            <p className="text-xs font-semibold" style={{ color: "#10b981" }}>
              {duration(checkIn.checked_in_at, null)}
            </p>
          </>
        )}
      </div>

      {/* Duration (if checked out) */}
      {checkIn.checked_out_at && (
        <div className="hidden md:block text-right flex-shrink-0 min-w-[44px]">
          <p className="text-[10px] text-muted-foreground">Duration</p>
          <p className="text-xs font-semibold text-foreground">
            {duration(checkIn.checked_in_at, checkIn.checked_out_at)}
          </p>
        </div>
      )}

      {/* Checkout button */}
      {isInside && (
        <button
          onClick={onCheckout}
          disabled={isCheckingOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-90 disabled:opacity-40 flex-shrink-0"
          style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <LogOut className="h-3 w-3" />
          {isCheckingOut ? "…" : "Check Out"}
        </button>
      )}

      {!isInside && (
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl flex-shrink-0"
          style={{ background: "hsl(var(--muted)/0.4)" }}>
          <CheckCircle className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">Done</span>
        </div>
      )}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-2xl text-sm font-semibold text-white"
      style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
    >
      <CheckCircle className="h-4 w-4" />
      {message}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CheckInsPage() {
  const { date_from, date_to } = useMemo(() => todayRange(), []);
  const [checkingOutId, setCheckingOutId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { data: todayData, isLoading, refetch, isFetching } = useCheckIns({
    date_from,
    date_to,
    page_size: 100,
  });

  // Fetch all members for participant_id → name lookup (backend max is 100)
  const { data: membersData } = useMembers({ page_size: 100 });

  const checkIn = useCheckInCreate();
  const checkout = useCheckout();

  const checkIns = todayData?.items ?? [];
  const members = membersData?.items ?? [];

  // Build lookup map: participant_id → MemberListItem
  const memberMap = useMemo(() => {
    const map = new Map<string, MemberListItem>();
    members.forEach((m: MemberListItem) => map.set(m.participant_id, m));
    return map;
  }, [members]);

  // Who's currently inside (checked in, no checkout)
  const insideSet = useMemo(
    () => new Set(checkIns.filter((c) => !c.checked_out_at).map((c) => c.participant_id)),
    [checkIns]
  );

  const insideCount = insideSet.size;
  const todayTotal = checkIns.length;

  // Sort: currently inside first, then by check-in time desc
  const sortedCheckIns = useMemo(
    () =>
      [...checkIns].sort((a, b) => {
        if (!a.checked_out_at && b.checked_out_at) return -1;
        if (a.checked_out_at && !b.checked_out_at) return 1;
        return new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime();
      }),
    [checkIns]
  );

  const handleCheckIn = async (member: MemberListItem) => {
    try {
      await checkIn.mutateAsync({ participant_id: member.participant_id });
      setToast(`${member.first_name} checked in!`);
    } catch {
      setToast("Check-in failed. Please try again.");
    }
  };

  const handleCheckout = async (checkInId: string, member?: MemberListItem) => {
    setCheckingOutId(checkInId);
    try {
      await checkout.mutateAsync({ checkInId });
      setToast(`${member?.first_name ?? "Member"} checked out!`);
    } catch {
      setToast("Checkout failed. Please try again.");
    } finally {
      setCheckingOutId(null);
    }
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-foreground leading-tight">Check-ins</h1>
          <p className="text-[11px] text-muted-foreground">{today}</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
          title="Refresh"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-2xl px-4 py-3.5"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="h-6 w-6 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.12)" }}>
              <Users className="h-3.5 w-3.5" style={{ color: "#10b981" }} />
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">Inside Now</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{insideCount}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">currently in gym</p>
        </div>

        <div
          className="rounded-2xl px-4 py-3.5"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="h-6 w-6 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(59,130,246,0.12)" }}>
              <LogIn className="h-3.5 w-3.5" style={{ color: "#3b82f6" }} />
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">Checked In Today</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{todayTotal}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">total visits today</p>
        </div>
      </div>

      {/* ── Quick check-in ─────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(16,185,129,0.12)" }}>
            <LogIn className="h-3.5 w-3.5" style={{ color: "#10b981" }} />
          </div>
          <p className="text-xs font-bold text-foreground">Quick Check-In</p>
          {checkIn.isPending && (
            <span className="text-[10px] text-muted-foreground ml-auto">Checking in…</span>
          )}
        </div>
        <MemberSearch
          onCheckIn={handleCheckIn}
          alreadyInGym={insideSet}
          isPending={checkIn.isPending}
        />
        <p className="text-[10px] text-muted-foreground mt-2">
          Search by member name or phone · members already inside are shown but can't be checked in again
        </p>
      </div>

      {/* ── Today's log ────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        {/* Table header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}
        >
          <p className="text-xs font-bold text-foreground">Today's Log</p>
          {insideCount > 0 && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}
            >
              {insideCount} inside
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">Loading…</div>
        ) : sortedCheckIns.length === 0 ? (
          <div className="py-14 text-center">
            <div
              className="h-12 w-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(16,185,129,0.08)" }}
            >
              <Clock className="h-6 w-6" style={{ color: "#10b981" }} />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">No check-ins today</p>
            <p className="text-[11px] text-muted-foreground">
              Use the search above to check in a member
            </p>
          </div>
        ) : (
          sortedCheckIns.map((ci) => (
            <CheckInRow
              key={ci.id}
              checkIn={ci}
              member={memberMap.get(ci.participant_id)}
              onCheckout={() => handleCheckout(ci.id, memberMap.get(ci.participant_id))}
              isCheckingOut={checkingOutId === ci.id}
            />
          ))
        )}
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
