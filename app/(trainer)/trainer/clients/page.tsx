"use client";

import { useState } from "react";
import { Users, ChevronRight, X, ClipboardList, Loader2, Heart, AlertCircle } from "lucide-react";
import {
  useMyClients,
  useLogSession,
  useMySessions,
} from "@/lib/hooks/use-trainer-portal";
import { useMemberHealthRecords } from "@/lib/hooks/use-members";
import { fmtDate, initials, fullName as fmtFullName } from "@/lib/utils/formatting";
import type { PTClientSummary, PTActivePackageSummary } from "@/types/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// ── Helpers ────────────────────────────────────────────────────────────────────

function fullName(c: PTClientSummary) {
  return fmtFullName(c.first_name, c.last_name);
}

/** First active package that still has credits, or first package overall, or null */
function primaryPkg(client: PTClientSummary): PTActivePackageSummary | null {
  return client.active_packages.find((p) => p.credits_remaining > 0) ?? client.active_packages[0] ?? null;
}

/** Total credits remaining across all active packages */
function totalCredits(client: PTClientSummary) {
  return client.active_packages.reduce((sum, p) => sum + p.credits_remaining, 0);
}

// ── Log Session Dialog ─────────────────────────────────────────────────────────

function LogSessionDialog({
  client,
  onClose,
}: {
  client: PTClientSummary;
  onClose: () => void;
}) {
  const logSession = useLogSession();
  const today = new Date().toISOString().slice(0, 10);

  // Only show packages that still have credits
  const packages = client.active_packages.filter((p) => p.credits_remaining > 0);
  const [selectedPkg, setSelectedPkg] = useState<PTActivePackageSummary | null>(packages[0] ?? null);
  const [count, setCount] = useState(1);
  const [date, setDate] = useState(today);
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const maxCount = selectedPkg?.credits_remaining ?? 0;
  const isPending = logSession.isPending || progress !== null;

  const increment = () => setCount((c) => Math.min(c + 1, maxCount));
  const decrement = () => setCount((c) => Math.max(c - 1, 1));

  const handleSelectPkg = (pkg: PTActivePackageSummary) => {
    setSelectedPkg(pkg);
    setCount(1);
  };

  const handleSubmit = async () => {
    if (!selectedPkg || count < 1) return;
    setErr(null);
    setProgress({ done: 0, total: count });
    try {
      for (let i = 0; i < count; i++) {
        await logSession.mutateAsync({
          member_id: client.participant_id,
          package_purchase_id: selectedPkg.purchase_id,
          session_date: date,
          duration_minutes: duration,
          session_mode: "in_person",
          notes: notes.trim() || undefined,
        });
        setProgress({ done: i + 1, total: count });
      }
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Failed to log session. Try again.");
      setProgress(null);
    }
  };

  // No packages with credits left
  if (packages.length === 0) {
    return (
      <Dialog open onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Log Sessions</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-4 text-center">
            {fullName(client)} has no active package with remaining credits.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const creditsUsed = selectedPkg ? selectedPkg.credits_total - selectedPkg.credits_remaining : 0;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Log Sessions — {fullName(client)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">

          {/* Package chips (if multiple) */}
          {packages.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {packages.map((p) => (
                <button
                  key={p.purchase_id}
                  type="button"
                  onClick={() => handleSelectPkg(p)}
                  className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                  style={
                    selectedPkg?.purchase_id === p.purchase_id
                      ? { background: "rgba(139,92,246,0.18)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.4)" }
                      : { background: "transparent", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }
                  }
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {/* Package card with credit bar */}
          {selectedPkg && (
            <div className="rounded-2xl p-4" style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.2)" }}>
              <p className="text-xs font-semibold text-foreground mb-3">{selectedPkg.name}</p>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                <span>{creditsUsed} used</span>
                <span>{selectedPkg.credits_remaining} remaining</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(139,92,246,0.12)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: selectedPkg.credits_total > 0
                      ? `${(creditsUsed / selectedPkg.credits_total) * 100}%`
                      : "0%",
                    background: "linear-gradient(90deg, #8b5cf6, #a78bfa)",
                  }}
                />
              </div>
              {selectedPkg.expiry && (
                <p className="text-[10px] text-muted-foreground mt-2">Expires {fmtDate(selectedPkg.expiry)}</p>
              )}
            </div>
          )}

          {/* Session counter stepper */}
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3 text-center">
              Sessions to mark as done
            </p>
            <div className="flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={decrement}
                disabled={count <= 1 || isPending}
                className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl font-bold transition-all disabled:opacity-30 hover:opacity-80"
                style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }}
              >
                −
              </button>
              <div className="text-center w-16">
                <p className="text-5xl font-bold tabular-nums leading-none" style={{ color: "#a78bfa" }}>{count}</p>
                <p className="text-[10px] text-muted-foreground mt-2">of {maxCount} left</p>
              </div>
              <button
                type="button"
                onClick={increment}
                disabled={count >= maxCount || isPending}
                className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl font-bold transition-all disabled:opacity-30 hover:opacity-80"
                style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }}
              >
                +
              </button>
            </div>
          </div>

          {/* Date + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                className="mt-1 h-9"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Duration (min)</Label>
              <Input
                type="number"
                className="mt-1 h-9"
                value={duration}
                min={15}
                max={240}
                step={15}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              className="mt-1 resize-none"
              rows={2}
              placeholder="What was covered, progress notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Progress indicator */}
          {progress && (
            <div
              className="rounded-xl px-3 py-2 text-center"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
            >
              <p className="text-xs font-semibold" style={{ color: "#10b981" }}>
                Logging {progress.done + 1} of {progress.total}…
              </p>
            </div>
          )}

          {err && <p className="text-xs text-red-400">{err}</p>}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending || !selectedPkg}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log {count} Session{count !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Client Health Section (read-only for trainer) ─────────────────────────────

function ClientHealthSection({ userId }: { userId: string }) {
  const { data: health, isLoading } = useMemberHealthRecords(userId, true);
  const ec = health?.emergency_contact as any;
  const medNotes = (health?.medical_conditions as any)?.notes;
  const hasAnyData = ec?.name || medNotes || health?.injuries_limitations;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Heart className="h-3 w-3" style={{ color: "#ef4444" }} />
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Health & Safety</p>
      </div>
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : !hasAnyData ? (
        <p className="text-xs text-muted-foreground italic">No health records on file.</p>
      ) : (
        <div className="rounded-xl p-3 space-y-3" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)" }}>
          {ec?.name && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Emergency Contact</p>
              <p className="text-xs font-semibold text-foreground">{ec.name}</p>
              {ec.relationship && <p className="text-[11px] text-muted-foreground">{ec.relationship}</p>}
              {ec.phone && <p className="text-[11px] text-muted-foreground">{ec.phone}</p>}
            </div>
          )}
          {medNotes && (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <AlertCircle className="h-3 w-3 text-amber-400" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Medical / Allergies</p>
              </div>
              <p className="text-xs text-foreground">{medNotes}</p>
            </div>
          )}
          {health?.injuries_limitations && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Injuries / Limitations</p>
              <p className="text-xs text-foreground">{health.injuries_limitations}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Detail Panel ───────────────────────────────────────────────────────────────

const STATUS_CHIP: Record<string, { label: string; color: string; bg: string }> = {
  completed: { label: "Done",      color: "#10b981", bg: "rgba(16,185,129,0.1)"  },
  cancelled: { label: "Cancelled", color: "#f87171", bg: "rgba(239,68,68,0.1)"   },
  no_show:   { label: "No-show",   color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  scheduled: { label: "Scheduled", color: "#a78bfa", bg: "rgba(139,92,246,0.1)"  },
};

function DetailPanel({
  client,
  onClose,
}: {
  client: PTClientSummary;
  onClose: () => void;
}) {
  const name = fullName(client);
  const [showLog, setShowLog] = useState(false);

  const { data: sessionsData, isLoading: sessionsLoading } = useMySessions({
    member_id: client.participant_id,
    page_size: 50,
  });
  const sessions = sessionsData?.items ?? [];

  return (
    <>
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
                { label: "Total",     value: client.total_sessions,    color: "#8b5cf6" },
                { label: "Completed", value: client.sessions_completed, color: "#10b981" },
                { label: "Credits",   value: totalCredits(client),      color: totalCredits(client) > 0 ? "#f59e0b" : "hsl(var(--muted-foreground))" },
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

          {/* Active Packages */}
          {client.active_packages.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Active Package{client.active_packages.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-2">
                {client.active_packages.map((p) => (
                  <div
                    key={p.purchase_id}
                    className="rounded-xl p-3 space-y-1.5"
                    style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}
                  >
                    <p className="text-xs font-semibold text-foreground">{p.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">Credits left</span>
                      <span className="text-sm font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6" }}>
                        {p.credits_remaining}
                      </span>
                    </div>
                    {p.expiry && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">Expires</span>
                        <span className="text-[11px] text-foreground">{fmtDate(p.expiry)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Health & Safety */}
          <ClientHealthSection userId={client.user_id} />

          {/* Log session button */}
          {primaryPkg(client) && totalCredits(client) > 0 && (
            <button
              onClick={() => setShowLog(true)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all hover:opacity-80"
              style={{ background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
            >
              <span>Log Session</span>
              <ClipboardList className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Session History */}
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Session History
            </p>
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No sessions logged yet.</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((s) => {
                  const chip = STATUS_CHIP[s.status] ?? STATUS_CHIP.scheduled;
                  const date = new Date(s.start_time);
                  const durMins = Math.round(
                    (new Date(s.end_time).getTime() - date.getTime()) / 60000,
                  );
                  const dateLabel = date.toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  });
                  return (
                    <div
                      key={s.id}
                      className="rounded-xl p-3 space-y-1"
                      style={{ background: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border))" }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          {s.session_type ?? "PT Session"}
                        </span>
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: chip.bg, color: chip.color }}
                        >
                          {chip.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {dateLabel} · {durMins} min
                      </p>
                      {s.notes && (
                        <p className="text-[11px] text-muted-foreground italic">{s.notes}</p>
                      )}
                      {s.trainer_notes && (
                        <p className="text-[11px]" style={{ color: "#8b5cf6" }}>
                          Trainer: {s.trainer_notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {showLog && (
        <LogSessionDialog
          client={client}
          onClose={() => setShowLog(false)}
        />
      )}
    </>
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
                : "Clients appear here once a member purchases your package."}
            </p>
          </div>
        ) : (
          clients.map((client) => {
            const name = fullName(client);
            const credits = totalCredits(client);
            const creditAlert = credits === 0 ? "empty" : credits <= 2 ? "low" : null;

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
                    <div className="relative flex-shrink-0">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold"
                        style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6" }}
                      >
                        {initials(client.first_name, client.last_name)}
                      </div>
                      {creditAlert && (
                        <span
                          className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2"
                          style={{
                            background: creditAlert === "empty" ? "#ef4444" : "#f59e0b",
                            borderColor: "hsl(var(--card))",
                          }}
                        />
                      )}
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
                    style={{
                      color: creditAlert === "empty"
                        ? "#ef4444"
                        : creditAlert === "low"
                          ? "#f59e0b"
                          : credits > 0 ? "#8b5cf6" : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {credits > 0 ? credits : "—"}
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
          <DetailPanel
            client={selected}
            onClose={() => setSelected(null)}
          />
        </>
      )}
    </div>
  );
}
