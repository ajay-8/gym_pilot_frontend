"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  useMySchedule,
  useMyGymTrainerContract,
  useUpdateAvailability,
  useCreateSession,
  useMyClients,
} from "@/lib/hooks/use-trainer-portal";
import type { WeeklyAvailability, ScheduleResponse, PTSessionInSchedule } from "@/types/api";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Plus, Trash2, Loader2, Clock, X } from "lucide-react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type DayKey = keyof WeeklyAvailability;

const DAYS: DayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_SHORT: Record<DayKey, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed",
  thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun",
};
const DAY_FULL: Record<DayKey, string> = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
  thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};

// ─── Grid constants ───────────────────────────────────────────────────────────

const GRID_START       = 5;   // 5 AM
const GRID_END         = 22;  // 10 PM
const HOUR_PX          = 56;  // px per hour
const HEADER_H         = 36;  // sticky day-header height (px)
const TOTAL_H          = (GRID_END - GRID_START) * HOUR_PX; // 952 px
const HOURS            = Array.from({ length: GRID_END - GRID_START + 1 }, (_, i) => GRID_START + i);
const AUTO_SCROLL_HOUR = 6;   // scroll to 6 AM on mount

// ─── Grid helpers ─────────────────────────────────────────────────────────────

function isoToLocalMins(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

function minsToY(mins: number): number {
  return ((mins / 60) - GRID_START) * HOUR_PX;
}

function sessTopPx(iso: string): number {
  const mins = Math.max(isoToLocalMins(iso), GRID_START * 60);
  return minsToY(mins);
}

function sessHPx(start: string, end: string): number {
  const startMins = Math.max(isoToLocalMins(start), GRID_START * 60);
  const endMins   = Math.min(isoToLocalMins(end),   GRID_END   * 60);
  return ((endMins - startMins) / 60) * HOUR_PX;
}

function fmtHour(h: number): string {
  if (h === 0 || h === 24) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function localIsoFromDate(date: Date, hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

// ─── Session status styles ────────────────────────────────────────────────────

function sessionSt(status: string, isPast: boolean): { bg: string; border: string; color: string; opacity: number } {
  const dimmed = isPast && status !== "scheduled";
  switch (status) {
    case "scheduled": return { bg: "rgba(139,92,246,0.45)", border: "rgba(139,92,246,0.75)", color: "#e9d5ff", opacity: 1 };
    case "completed": return { bg: dimmed ? "rgba(16,185,129,0.35)" : "rgba(16,185,129,0.45)", border: dimmed ? "rgba(16,185,129,0.55)" : "rgba(16,185,129,0.75)", color: dimmed ? "#6ee7b7" : "#34d399", opacity: dimmed ? 0.75 : 1 };
    case "cancelled": return { bg: "rgba(239,68,68,0.35)", border: "rgba(239,68,68,0.6)", color: "#fca5a5", opacity: dimmed ? 0.65 : 0.85 };
    case "no_show":   return { bg: "rgba(245,158,11,0.35)", border: "rgba(245,158,11,0.6)", color: "#fde68a", opacity: dimmed ? 0.65 : 0.85 };
    default:          return { bg: "rgba(139,92,246,0.45)", border: "rgba(139,92,246,0.75)", color: "#e9d5ff", opacity: 1 };
  }
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function fmtWeekLabel(start: Date): string {
  const end = addDays(start, 6);
  const o: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", o)} – ${end.toLocaleDateString("en-US", o)}, ${end.getFullYear()}`;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, color,
}: {
  label: string; value: string | number; sub: string; color?: "green" | "purple" | "amber";
}) {
  const accent =
    color === "green"  ? "#10b981" :
    color === "purple" ? "#a78bfa" :
    color === "amber"  ? "#f59e0b" :
    "hsl(var(--foreground))";
  return (
    <div className="rounded-xl px-4 py-3" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color: accent }}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}

// ─── SessionPopover ───────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled", completed: "Completed",
  cancelled: "Cancelled", no_show: "No-Show",
};

function SessionPopover({
  session, x, y, onClose,
}: {
  session: PTSessionInSchedule; x: number; y: number; onClose: () => void;
}) {
  const router = useRouter();
  const isPast = new Date(session.start_time) < new Date();
  const st = sessionSt(session.status ?? "scheduled", isPast);

  const date = new Date(session.start_time);
  const dateLabel = date.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
  const startLabel = fmtTime(session.start_time);
  const endLabel   = fmtTime(session.end_time);
  const durMins    = Math.round((new Date(session.end_time).getTime() - date.getTime()) / 60000);
  const memberName = [session.member_first_name, session.member_last_name].filter(Boolean).join(" ") || null;

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: "fixed",
        top: Math.min(y, window.innerHeight - 240),
        left: Math.min(x, window.innerWidth - 248),
        width: 232,
        zIndex: 50,
        background: "hsl(var(--popover))",
        border: "1px solid hsl(var(--border))",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        overflow: "hidden",
      }}
    >
      {/* Status bar + close */}
      <div style={{ background: st.bg, borderBottom: `1px solid ${st.border}`, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: st.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {STATUS_LABELS[session.status] ?? session.status}
        </span>
        <button onClick={onClose} style={{ display: "flex", alignItems: "center", color: st.color, opacity: 0.7, cursor: "pointer", background: "none", border: "none", padding: 0 }}>
          <X style={{ width: 13, height: 13 }} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--foreground))", margin: 0, lineHeight: "16px" }}>
          {session.session_type ?? "PT Session"}
        </p>

        {memberName && (
          <p style={{ fontSize: 12, color: st.color, margin: 0, fontWeight: 600 }}>{memberName}</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{dateLabel}</span>
          <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>
            {startLabel} – {endLabel}
            <span style={{ marginLeft: 6, opacity: 0.6 }}>({durMins} min)</span>
          </span>
        </div>

        <button
          onClick={() => { onClose(); router.push("/trainer/sessions"); }}
          style={{
            marginTop: 4,
            width: "100%",
            padding: "6px 0",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            color: "#a78bfa",
            background: "rgba(139,92,246,0.1)",
            border: "1px solid rgba(139,92,246,0.2)",
            cursor: "pointer",
          }}
        >
          View in Sessions →
        </button>
      </div>
    </div>
  );
}

// ─── CreateSessionDialog ──────────────────────────────────────────────────────

interface ClientOption {
  member_id: string;
  package_purchase_id: string;
  name: string;
}

function CreateSessionDialog({
  date, startHhmm, clients, trainerId, onClose,
}: {
  date: Date;
  startHhmm: string;
  clients: ClientOption[];
  trainerId: string;
  onClose: () => void;
}) {
  const createSession = useCreateSession();

  const defaultEndH = (() => {
    const [h, m] = startHhmm.split(":").map(Number);
    const endMins = h * 60 + m + 60;
    return `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;
  })();

  const [selectedClientIdx, setSelectedClientIdx] = useState(0);
  const [startTime, setStartTime]   = useState(startHhmm);
  const [endTime, setEndTime]       = useState(defaultEndH);
  const [sessionType, setSessionType] = useState("strength");
  const [sessionMode, setSessionMode] = useState<"in_person" | "online">("in_person");
  const [meetingLink, setMeetingLink] = useState("");
  const [notes, setNotes]           = useState("");
  const [error, setError]           = useState<string | null>(null);

  const dateLabel = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const hasClients = clients.length > 0;
  const selectedClient = clients[selectedClientIdx];

  const canSubmit = hasClients && startTime && endTime && startTime < endTime;

  const handleSubmit = async () => {
    if (!canSubmit || !selectedClient) return;
    setError(null);
    try {
      await createSession.mutateAsync({
        trainer_id: trainerId,
        member_id: selectedClient.member_id,
        package_purchase_id: selectedClient.package_purchase_id,
        start_time: localIsoFromDate(date, startTime),
        end_time: localIsoFromDate(date, endTime),
        session_type: sessionType || undefined,
        session_mode: sessionMode,
        meeting_link: sessionMode === "online" && meetingLink ? meetingLink : undefined,
        notes: notes || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const e = err as { detail?: string; message?: string };
      setError(e?.detail ?? e?.message ?? "Failed to create session. Please try again.");
    }
  };

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-1">
          <p className="text-sm text-muted-foreground">{dateLabel}</p>

          {/* Client */}
          {!hasClients ? (
            <div className="rounded-xl p-3 text-sm" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#fbbf24" }}>
              No clients with active packages found. Use the <strong>Sessions</strong> page to manage sessions.
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Client</label>
              <select
                value={selectedClientIdx}
                onChange={e => setSelectedClientIdx(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-sm text-foreground outline-none"
                style={{ background: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border))" }}
              >
                {clients.map((c, i) => (
                  <option key={i} value={i}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Start Time</label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">End Time</label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-9 text-sm" />
            </div>
          </div>

          {/* Session type */}
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Session Type</label>
            <Input
              value={sessionType}
              onChange={e => setSessionType(e.target.value)}
              placeholder="e.g. strength, cardio, yoga"
              className="h-9 text-sm"
            />
          </div>

          {/* Mode */}
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Mode</label>
            <div className="flex gap-2">
              {(["in_person", "online"] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSessionMode(m)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={sessionMode === m
                    ? { background: "rgba(139,92,246,0.18)", border: "1px solid rgba(139,92,246,0.4)", color: "#a78bfa" }
                    : { background: "transparent", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
                  }
                >
                  {m === "in_person" ? "In Person" : "Online"}
                </button>
              ))}
            </div>
          </div>

          {sessionMode === "online" && (
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Meeting Link</label>
              <Input
                value={meetingLink}
                onChange={e => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="h-9 text-sm"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Notes (optional)</label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any notes for this session"
              className="h-9 text-sm"
            />
          </div>

          {error && (
            <div className="rounded-xl p-3 text-[11px]" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={createSession.isPending}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || createSession.isPending}
          >
            {createSession.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── AvailabilityEditor ───────────────────────────────────────────────────────

function AvailabilityEditor({
  initial, gymTrainerId, onClose,
}: {
  initial: WeeklyAvailability; gymTrainerId: string; onClose: () => void;
}) {
  const updateAvailability = useUpdateAvailability();
  const [avail, setAvail] = useState<WeeklyAvailability>(() =>
    Object.fromEntries(DAYS.map(d => [d, (initial[d] ?? []).map(s => ({ ...s }))])) as unknown as WeeklyAvailability
  );

  const addSlot    = (day: DayKey) =>
    setAvail(p => ({ ...p, [day]: [...p[day], { start: "09:00", end: "17:00" }] }));
  const removeSlot = (day: DayKey, i: number) =>
    setAvail(p => ({ ...p, [day]: p[day].filter((_, j) => j !== i) }));
  const updateSlot = (day: DayKey, i: number, field: "start" | "end", val: string) =>
    setAvail(p => ({ ...p, [day]: p[day].map((s, j) => j === i ? { ...s, [field]: val } : s) }));

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Weekly Availability</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {DAYS.map(day => (
            <div key={day}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">{DAY_FULL[day]}</p>
                <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => addSlot(day)}>
                  <Plus className="h-3 w-3 mr-1" />Add Slot
                </Button>
              </div>
              {avail[day].length === 0 ? (
                <p className="text-xs text-muted-foreground ml-1">No availability</p>
              ) : (
                <div className="space-y-2">
                  {avail[day].map((slot, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input type="time" value={slot.start} onChange={e => updateSlot(day, idx, "start", e.target.value)} className="h-8 text-xs w-32" />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input type="time" value={slot.end} onChange={e => updateSlot(day, idx, "end", e.target.value)} className="h-8 text-xs w-32" />
                      <button
                        onClick={() => removeSlot(day, idx)}
                        className="h-8 w-8 rounded flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={updateAvailability.isPending}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              await updateAvailability.mutateAsync({
                trainerId: gymTrainerId,
                payload: { weekly_availability: avail },
              });
              onClose();
            }}
            disabled={updateAvailability.isPending}
          >
            {updateAvailability.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Availability
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const [weekStart, setWeekStart]   = useState(() => startOfWeek(new Date()));
  const [editAvail, setEditAvail]   = useState(false);
  const [nowMins, setNowMins]       = useState(() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); });
  const [selectedSess, setSelectedSess] = useState<{ session: PTSessionInSchedule; x: number; y: number } | null>(null);
  const [newSession, setNewSession] = useState<{ date: Date; startHhmm: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click or Escape
  useEffect(() => {
    if (!selectedSess) return;
    const onClick  = () => setSelectedSess(null);
    const onEscape = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedSess(null); };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, [!!selectedSess]);

  // Tick "now" indicator every minute
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setNowMins(d.getHours() * 60 + d.getMinutes());
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const { data: gymTrainer }                       = useMyGymTrainerContract();
  const weekStartStr                               = isoDate(weekStart);
  const weekEndStr                                 = isoDate(addDays(weekStart, 6));
  const { data: schedule, isLoading }              = useMySchedule(weekStartStr, weekEndStr);
  const { data: clientsData }                      = useMyClients({ page_size: 100 });

  // Auto-scroll to 6 AM once data loads
  useEffect(() => {
    if (!isLoading && scrollRef.current) {
      scrollRef.current.scrollTop = (AUTO_SCROLL_HOUR - GRID_START) * HOUR_PX - 8;
    }
  }, [isLoading]);

  const weekDays = useMemo(
    () => DAYS.map((dayKey, i) => ({ dayKey, date: addDays(weekStart, i) })),
    [weekStart],
  );

  const isPastWeek    = weekStart < startOfWeek(new Date());
  const isCurrentWeek = isoDate(weekStart) === isoDate(startOfWeek(new Date()));
  const todayStr      = isoDate(new Date());

  // Sessions per day — API returns ScheduleResponse.schedule: { "YYYY-MM-DD": { pt_sessions: [...] } }
  const sessionsByDay = useMemo(() => {
    const map: Record<string, PTSessionInSchedule[]> = {};
    DAYS.forEach(d => { map[d] = []; });
    if (!schedule) return map;
    const typed = schedule as ScheduleResponse;
    Object.entries(typed.schedule).forEach(([dateStr, dayData]) => {
      const d      = new Date(dateStr + "T00:00:00");
      const dayIdx = d.getDay(); // 0=Sun
      const key    = DAYS[dayIdx === 0 ? 6 : dayIdx - 1];
      if (key && Array.isArray(dayData?.pt_sessions)) {
        map[key].push(...dayData.pt_sessions);
      }
    });
    return map;
  }, [schedule]);

  // Clients with an active package (for Create Session dialog)
  // Uses the full client roster so brand-new clients (no sessions yet) are included.
  const clientOptions = useMemo((): ClientOption[] => {
    return (clientsData?.items ?? [])
      .filter(c => c.active_package_purchase_id != null && c.active_package_credits_remaining > 0)
      .map(c => ({
        member_id: c.participant_id,
        package_purchase_id: c.active_package_purchase_id!,
        name: [c.first_name, c.last_name].filter(Boolean).join(" ") || `Client ${c.participant_id.slice(0, 6)}`,
      }));
  }, [clientsData]);

  // Summary stats
  const stats = useMemo(() => {
    const all       = Object.values(sessionsByDay).flat();
    const scheduled = all.filter(s => s.status === "scheduled");
    const completed = all.filter(s => s.status === "completed");
    const noShows   = all.filter(s => s.status === "no_show");
    const bookedHrs = scheduled.reduce(
      (acc, s) => acc + (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 3_600_000, 0,
    );
    return { total: all.length, scheduled: scheduled.length, completed: completed.length, noShows: noShows.length, bookedHrs };
  }, [sessionsByDay]);

  const prevWeek = () => setWeekStart(d => addDays(d, -7));
  const nextWeek = () => setWeekStart(d => addDays(d, 7));
  const toToday  = () => setWeekStart(startOfWeek(new Date()));

  // Y position → HH:MM string
  function yToHhmm(y: number): string {
    const totalMins = Math.round((y / HOUR_PX + GRID_START) * 60 / 15) * 15; // snap to 15min
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 112px)", gap: 20 }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Schedule</h2>
          <p className="text-sm text-muted-foreground mt-1">Weekly PT session calendar</p>
        </div>
        <Button variant="outline" onClick={() => setEditAvail(true)}>
          <Clock className="h-4 w-4 mr-2" />Edit Availability
        </Button>
      </div>

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-3 gap-3">
        {isPastWeek ? (
          <>
            <StatCard label="Total Sessions" value={stats.total}     sub="this past week" />
            <StatCard label="Completed"      value={stats.completed} sub="sessions done"  color="green" />
            <StatCard label="No-Shows"       value={stats.noShows}   sub="clients missed" color="amber" />
          </>
        ) : (
          <>
            <StatCard label="Sessions"   value={stats.scheduled}                sub="scheduled this week" color="purple" />
            <StatCard label="Booked"     value={`${stats.bookedHrs.toFixed(1)}h`} sub="hours committed" />
            <StatCard label="Total"      value={stats.total}                    sub="sessions this week" color="green" />
          </>
        )}
      </div>

      {/* ── Calendar card ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>

        {/* Navigation */}
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={prevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 flex items-center justify-center gap-2">
            <span className="text-sm font-semibold text-foreground">{fmtWeekLabel(weekStart)}</span>
            {isPastWeek && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: "#6b7280" }}>
                Past
              </span>
            )}
            {isCurrentWeek && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.12)", color: "#a78bfa" }}>
                This Week
              </span>
            )}
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={toToday}>
            Today
          </Button>
        </div>

        {/* Legend */}
        <div
          className="flex items-center gap-4 px-4 py-2 text-[11px] text-muted-foreground"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-4 rounded-sm" style={{ background: "rgba(139,92,246,0.3)" }} />
            Scheduled
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-4 rounded-sm" style={{ background: "rgba(16,185,129,0.3)" }} />
            Completed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-4 rounded-sm" style={{ background: "rgba(239,68,68,0.25)" }} />
            Cancelled
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-4 rounded-sm" style={{ background: "rgba(245,158,11,0.25)" }} />
            No-show
          </span>
          {!isPastWeek && (
            <span className="ml-auto flex items-center gap-1 text-[10px]" style={{ color: "#6b7280" }}>
              Click empty slot to add session
            </span>
          )}
        </div>

        {/* Scrollable time grid */}
        <div ref={scrollRef} style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
          {isLoading ? (
            <div className="flex items-center justify-center" style={{ height: 280 }}>
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div style={{ display: "flex" }}>

              {/* Time label column */}
              <div style={{ width: 46, flexShrink: 0, position: "relative", height: HEADER_H + TOTAL_H }}>
                <div style={{ height: HEADER_H }} />
                {HOURS.map(h => (
                  <div
                    key={h}
                    style={{
                      position: "absolute",
                      top: HEADER_H + (h - GRID_START) * HOUR_PX - 6,
                      right: 8,
                      fontSize: 10,
                      lineHeight: "12px",
                      color: "hsl(var(--muted-foreground))",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fmtHour(h)}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDays.map(({ dayKey, date }) => {
                const isToday      = isoDate(date) === todayStr;
                const isPastDate   = isoDate(date) < todayStr;
                const sessions     = sessionsByDay[dayKey] ?? [];

                return (
                  <div
                    key={dayKey}
                    style={{
                      flex: 1,
                      minWidth: 88,
                      position: "relative",
                      borderLeft: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {/* Sticky day header */}
                    <div
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        height: HEADER_H,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isToday ? "rgba(139,92,246,0.12)" : isPastDate ? "rgba(0,0,0,0.15)" : "hsl(var(--card))",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: isToday ? "#a78bfa" : isPastDate ? "#4b5563" : "#6b7280" }}>
                        {DAY_SHORT[dayKey]}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: isToday ? "#a78bfa" : isPastDate ? "#4b5563" : "hsl(var(--foreground))" }}>
                        {date.getDate()}
                      </span>
                    </div>

                    {/* Grid body */}
                    <div
                      style={{ position: "relative", height: TOTAL_H }}
                      onClick={!isPastDate && !isToday ? (e) => {
                        // Only if clicking the grid background (not a session block)
                        const target = e.target as HTMLElement;
                        if (target.closest("[data-session]")) return;
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const relY = e.clientY - rect.top;
                        const hhmm = yToHhmm(relY);
                        setNewSession({ date, startHhmm: hhmm });
                      } : isToday ? (e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest("[data-session]")) return;
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const relY = e.clientY - rect.top;
                        const hhmm = yToHhmm(relY);
                        setNewSession({ date, startHhmm: hhmm });
                      } : undefined}
                    >

                      {/* Past date overlay — faded column */}
                      {isPastDate && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.28)", pointerEvents: "none", zIndex: 0 }} />
                      )}

                      {/* Today column tint */}
                      {isToday && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(139,92,246,0.025)", pointerEvents: "none" }} />
                      )}

                      {/* "Now" red line indicator */}
                      {isToday && nowMins >= GRID_START * 60 && nowMins < GRID_END * 60 && (
                        <div
                          style={{
                            position: "absolute",
                            left: 0, right: 0,
                            top: minsToY(nowMins),
                            zIndex: 6,
                            pointerEvents: "none",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
                          <div style={{ flex: 1, height: 1.5, background: "#ef4444" }} />
                        </div>
                      )}

                      {/* Hour grid lines */}
                      {HOURS.map(h => (
                        <div
                          key={h}
                          style={{
                            position: "absolute",
                            left: 0, right: 0,
                            top: (h - GRID_START) * HOUR_PX,
                            borderTop: `1px solid rgba(255,255,255,${h % 3 === 0 ? 0.07 : 0.03})`,
                            pointerEvents: "none",
                          }}
                        />
                      ))}

                      {/* Cursor hint for clickable future dates */}
                      {!isPastDate && (
                        <div
                          style={{ position: "absolute", inset: 0, cursor: "crosshair", zIndex: 1 }}
                          aria-hidden
                        />
                      )}

                      {/* Session blocks */}
                      {sessions.map((s) => {
                        const isPast  = new Date(s.start_time) < new Date();
                        const st      = sessionSt(s.status ?? "scheduled", isPast);
                        const top     = sessTopPx(s.start_time);
                        const height  = Math.max(sessHPx(s.start_time, s.end_time), 26);
                        const compact = height < 42;
                        const isCancelled = s.status === "cancelled";
                        const memberName  = [s.member_first_name, s.member_last_name].filter(Boolean).join(" ");

                        return (
                          <div
                            key={s.id}
                            data-session="1"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              const x = rect.right + 8 + 232 < window.innerWidth ? rect.right + 8 : rect.left - 240;
                              const y = Math.min(rect.top, window.innerHeight - 250);
                              setSelectedSess({ session: s, x, y });
                            }}
                            style={{
                              position: "absolute",
                              left: 2, right: 2,
                              top, height,
                              background: st.bg,
                              border: `1px solid ${st.border}`,
                              borderRadius: 8,
                              zIndex: 2,
                              overflow: "hidden",
                              padding: compact ? "3px 5px 4px" : "5px 6px 6px",
                              color: st.color,
                              cursor: "pointer",
                              opacity: st.opacity,
                            }}
                          >
                            {/* Cancelled strikethrough line */}
                            {isCancelled && (
                              <div style={{
                                position: "absolute",
                                left: 0, right: 0,
                                top: "50%",
                                height: 1.5,
                                background: "rgba(239,68,68,0.5)",
                                pointerEvents: "none",
                              }} />
                            )}

                            <div style={{ fontSize: 10, fontWeight: 600, lineHeight: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textDecoration: isCancelled ? "line-through" : "none", opacity: isCancelled ? 0.7 : 1 }}>
                              {s.session_type ?? "PT Session"}
                            </div>
                            {!compact && memberName && (
                              <div style={{ fontSize: 9, opacity: 0.8, lineHeight: "12px", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {memberName}
                              </div>
                            )}
                            {!compact && (
                              <div style={{ fontSize: 9, opacity: 0.65, lineHeight: "12px", marginTop: 1, display: "flex", alignItems: "center", gap: 3 }}>
                                <span>{fmtTime(s.start_time)}</span>
                                {isCancelled && <span style={{ color: "#fca5a5" }}>· Cancelled</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}

                    </div>
                  </div>
                );
              })}

            </div>
          )}
        </div>
      </div>

      {/* Session detail popover */}
      {selectedSess && (
        <SessionPopover
          session={selectedSess.session}
          x={selectedSess.x}
          y={selectedSess.y}
          onClose={() => setSelectedSess(null)}
        />
      )}

      {/* Create session dialog */}
      {newSession && gymTrainer && (
        <CreateSessionDialog
          date={newSession.date}
          startHhmm={newSession.startHhmm}
          clients={clientOptions}
          trainerId={gymTrainer.participant_id}
          onClose={() => setNewSession(null)}
        />
      )}

      {/* Availability editor dialog */}
      {editAvail && gymTrainer && (
        <AvailabilityEditor
          initial={(gymTrainer as any).weekly_availability ?? (Object.fromEntries(DAYS.map(d => [d, []])) as unknown as WeeklyAvailability)}
          gymTrainerId={gymTrainer.id}
          onClose={() => setEditAvail(false)}
        />
      )}
    </div>
  );
}
