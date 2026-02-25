"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  Users,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Ban,
  Dumbbell,
  BookOpen,
  Layers,
} from "lucide-react";
import {
  useGymClasses,
  useGymClassCreate,
  useGymClassUpdate,
  useGymClassDelete,
  useClassSessions,
  useSessionBookings,
  useClassSessionCreate,
  useClassSessionCancel,
} from "@/lib/hooks/use-classes";
import { useTrainers } from "@/lib/hooks/use-trainers";
import type {
  ClassSessionResponse,
  GymClassResponse,
  ClassSessionStatus,
} from "@/types/api";

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function fmtDuration(start: string, end: string) {
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}m` : ""}`;
}

function toLocalDatetimeInput(isoOrEmpty?: string) {
  if (!isoOrEmpty) return "";
  const d = new Date(isoOrEmpty);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Status config ──────────────────────────────────────────────────────────────

const SESSION_STATUS: Record<ClassSessionStatus, { label: string; color: string; bg: string; icon: React.FC<{ className?: string; style?: React.CSSProperties }> }> = {
  scheduled: { label: "Scheduled", color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: CheckCircle2 },
  completed: { label: "Completed", color: "#6b7280", bg: "rgba(107,114,128,0.12)", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: Ban },
};

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-2xl text-sm font-semibold text-white"
      style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
      onClick={onDismiss}
    >
      <CheckCircle2 className="h-4 w-4" />
      {message}
    </div>
  );
}

// ── Create Class Dialog ───────────────────────────────────────────────────────

interface CreateClassDialogProps {
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

function CreateClassDialog({ onClose, onSuccess }: CreateClassDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("60");
  const [capacity, setCapacity] = useState("20");
  const [error, setError] = useState("");
  const create = useGymClassCreate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Class name is required."); return; }
    try {
      await create.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        default_duration_minutes: parseInt(duration) || 60,
        default_capacity: parseInt(capacity) || 20,
      });
      onSuccess("Class created!");
      onClose();
    } catch {
      setError("Failed to create class. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl shadow-2xl"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          <div>
            <h2 className="text-sm font-bold text-foreground">New Class Type</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Define a reusable class template</p>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Class Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Yoga, HIIT, Zumba"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground"
              style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Brief description of the class…"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground resize-none"
              style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Duration (min)</label>
              <input type="number" min="15" max="480" value={duration} onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-foreground"
                style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Default Capacity</label>
              <input type="number" min="1" max="200" value={capacity} onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-foreground"
                style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }} />
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
              style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />{error}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
              style={{ border: "1px solid hsl(var(--border))" }}>Cancel</button>
            <button type="submit" disabled={create.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}>
              {create.isPending ? "Creating…" : "Create Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Schedule Session Dialog ────────────────────────────────────────────────────

interface ScheduleSessionDialogProps {
  classes: GymClassResponse[];
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

function ScheduleSessionDialog({ classes, onClose, onSuccess }: ScheduleSessionDialogProps) {
  const { data: trainersData } = useTrainers({ status: "active" });
  const trainers = trainersData?.trainers ?? [];

  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [trainerId, setTrainerId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const create = useClassSessionCreate();

  // Auto-fill end_time based on selected class default duration
  const selectedClass = classes.find((c) => c.id === classId);
  const handleClassChange = (id: string) => {
    setClassId(id);
    if (startTime) {
      const cls = classes.find((c) => c.id === id);
      if (cls) {
        const end = new Date(new Date(startTime).getTime() + cls.default_duration_minutes * 60000);
        setEndTime(toLocalDatetimeInput(end.toISOString()));
      }
    }
    const cls = classes.find((c) => c.id === id);
    if (cls) setCapacity(String(cls.default_capacity));
  };

  const handleStartChange = (val: string) => {
    setStartTime(val);
    if (val && selectedClass) {
      const end = new Date(new Date(val).getTime() + selectedClass.default_duration_minutes * 60000);
      setEndTime(toLocalDatetimeInput(end.toISOString()));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!classId) { setError("Select a class."); return; }
    if (!trainerId) { setError("Select a trainer."); return; }
    if (!startTime || !endTime) { setError("Set start and end times."); return; }
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) { setError("End time must be after start time."); return; }

    try {
      await create.mutateAsync({
        class_id: classId,
        trainer_id: trainerId,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        capacity: parseInt(capacity) || selectedClass?.default_capacity || 20,
        notes: notes.trim() || null,
      });
      onSuccess("Session scheduled!");
      onClose();
    } catch (err: unknown) {
      const msg = (err as { detail?: string })?.detail;
      setError(msg ?? "Failed to schedule session. Check for trainer conflicts.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl shadow-2xl"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          <div>
            <h2 className="text-sm font-bold text-foreground">Schedule Session</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Add a new class session</p>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Class selector */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Class *</label>
            <select value={classId} onChange={(e) => handleClassChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-foreground cursor-pointer"
              style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }}>
              {classes.length === 0 && <option value="">— No classes yet —</option>}
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Trainer selector */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Trainer *</label>
            <select value={trainerId} onChange={(e) => setTrainerId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-foreground cursor-pointer"
              style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }}>
              <option value="">— Select trainer —</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.participant_id}>
                  {t.trainer_name ?? `Trainer ${t.id.slice(0, 6)}`}
                </option>
              ))}
            </select>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Start *</label>
              <input type="datetime-local" value={startTime} onChange={(e) => handleStartChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-foreground"
                style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))", colorScheme: "dark" }} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">End *</label>
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-foreground"
                style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))", colorScheme: "dark" }} />
            </div>
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Capacity</label>
            <input type="number" min="1" max="200" value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder={String(selectedClass?.default_capacity ?? 20)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground"
              style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }} />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Notes <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="Any special notes for this session…"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground resize-none"
              style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }} />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
              style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />{error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted"
              style={{ border: "1px solid hsl(var(--border))" }}>Cancel</button>
            <button type="submit" disabled={create.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}>
              {create.isPending ? "Scheduling…" : "Schedule Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Session Detail Panel ──────────────────────────────────────────────────────

interface SessionDetailPanelProps {
  session: ClassSessionResponse;
  trainerName: string;
  onClose: () => void;
  onCancel: (sessionId: string, reason: string) => void;
  isCancelling: boolean;
}

function SessionDetailPanel({ session, trainerName, onClose, onCancel, isCancelling }: SessionDetailPanelProps) {
  const { data: bookings, isLoading: loadingBookings } = useSessionBookings(session.id);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const statusCfg = SESSION_STATUS[session.status] ?? SESSION_STATUS.scheduled;
  const StatusIcon = statusCfg.icon;
  const spotsLeft = session.capacity - session.current_bookings;
  const fillPct = Math.min(100, (session.current_bookings / session.capacity) * 100);

  return (
    <div
      className="fixed inset-y-0 right-0 z-40 w-full max-w-sm shadow-2xl flex flex-col"
      style={{ background: "hsl(var(--card))", borderLeft: "1px solid hsl(var(--border))" }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-5 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground truncate leading-tight">
            {session.gym_class?.name ?? "Class Session"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{fmtDate(session.start_time)}</p>
        </div>
        <button onClick={onClose} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted flex-shrink-0">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Details */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: statusCfg.bg }}>
            <StatusIcon className="h-3 w-3" style={{ color: statusCfg.color }} />
            <span className="text-[11px] font-semibold" style={{ color: statusCfg.color }}>{statusCfg.label}</span>
          </div>
        </div>

        {/* Time */}
        <div className="rounded-xl p-3 space-y-2"
          style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.15)" }}>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" style={{ color: "#8b5cf6" }} />
            <span className="text-xs font-semibold text-foreground">
              {fmtTime(session.start_time)} – {fmtTime(session.end_time)}
            </span>
            <span className="text-[10px] text-muted-foreground">({fmtDuration(session.start_time, session.end_time)})</span>
          </div>
          <p className="text-[11px] text-muted-foreground pl-5">{fmtDate(session.start_time)}</p>
        </div>

        {/* Trainer */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Trainer</p>
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6" }}>
              {trainerName[0] ?? "?"}
            </div>
            <p className="text-sm font-semibold text-foreground">{trainerName}</p>
          </div>
        </div>

        {/* Capacity */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Capacity</p>
            <span className="text-[11px] font-semibold text-foreground">
              {session.current_bookings} / {session.capacity}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${fillPct}%`,
                background: fillPct >= 90 ? "#ef4444" : fillPct >= 70 ? "#f59e0b" : "#8b5cf6",
              }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {spotsLeft > 0 ? `${spotsLeft} spots remaining` : "Full — waitlist active"}
          </p>
        </div>

        {/* Notes */}
        {session.notes && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Notes</p>
            <p className="text-xs text-muted-foreground">{session.notes}</p>
          </div>
        )}

        {/* Bookings list */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Bookings ({session.current_bookings})
          </p>
          {loadingBookings ? (
            <p className="text-[11px] text-muted-foreground">Loading…</p>
          ) : !bookings || bookings.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">No bookings yet.</p>
          ) : (
            <div className="space-y-1.5">
              {bookings.slice(0, 10).map((b) => (
                <div key={b.id} className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: "hsl(var(--muted)/0.4)" }}>
                  <div className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                    style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6" }}>
                    {b.participant_id.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-foreground truncate">Participant</p>
                    <p className="text-[10px] text-muted-foreground">{b.status}</p>
                  </div>
                  {b.status === "waitlisted" && b.waitlist_position && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>
                      #{b.waitlist_position}
                    </span>
                  )}
                </div>
              ))}
              {bookings.length > 10 && (
                <p className="text-[10px] text-muted-foreground text-center">+{bookings.length - 10} more</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer — Cancel session */}
      {session.status === "scheduled" && (
        <div className="flex-shrink-0 p-4" style={{ borderTop: "1px solid hsl(var(--border))" }}>
          {!showCancelConfirm ? (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              Cancel Session
            </button>
          ) : (
            <div className="rounded-xl p-3 space-y-2.5"
              style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-[11px] font-semibold text-foreground">Cancel this session?</p>
              <input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason (optional)"
                className="w-full px-2.5 py-2 rounded-lg text-xs outline-none text-foreground placeholder:text-muted-foreground"
                style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }} />
              <div className="flex gap-2">
                <button onClick={() => { onCancel(session.id, cancelReason); setShowCancelConfirm(false); }}
                  disabled={isCancelling}
                  className="flex-1 py-2 rounded-lg text-[11px] font-bold text-white hover:opacity-90 disabled:opacity-50"
                  style={{ background: "#ef4444" }}>
                  {isCancelling ? "Cancelling…" : "Yes, Cancel"}
                </button>
                <button onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2 rounded-lg text-[11px] font-semibold text-muted-foreground hover:bg-muted"
                  style={{ border: "1px solid hsl(var(--border))" }}>
                  Keep
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Session Card ──────────────────────────────────────────────────────────────

interface SessionCardProps {
  session: ClassSessionResponse;
  trainerName: string;
  onClick: () => void;
}

function SessionCard({ session, trainerName, onClick }: SessionCardProps) {
  const statusCfg = SESSION_STATUS[session.status] ?? SESSION_STATUS.scheduled;
  const StatusIcon = statusCfg.icon;
  const fillPct = Math.min(100, (session.current_bookings / session.capacity) * 100);
  const spotsLeft = session.capacity - session.current_bookings;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl p-4 transition-all hover:border-purple-500/30"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <div className="flex items-start gap-3">
        {/* Left accent */}
        <div className="w-1 rounded-full flex-shrink-0 self-stretch"
          style={{ background: statusCfg.color, minHeight: "40px" }} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-bold text-foreground truncate">
              {session.gym_class?.name ?? "Class"}
            </p>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: statusCfg.bg }}>
              <StatusIcon className="h-2.5 w-2.5" style={{ color: statusCfg.color }} />
              <span className="text-[10px] font-semibold" style={{ color: statusCfg.color }}>
                {statusCfg.label}
              </span>
            </div>
          </div>

          {/* Time + trainer row */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2.5">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {fmtTime(session.start_time)} · {fmtDuration(session.start_time, session.end_time)}
            </span>
            <span className="flex items-center gap-1">
              <Dumbbell className="h-3 w-3" />
              {trainerName}
            </span>
          </div>

          {/* Capacity bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">
                {session.current_bookings}/{session.capacity} booked
              </span>
              <span style={{ color: spotsLeft === 0 ? "#ef4444" : fillPct >= 70 ? "#f59e0b" : "#10b981" }}>
                {spotsLeft === 0 ? "Full" : `${spotsLeft} left`}
              </span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
              <div className="h-full rounded-full"
                style={{
                  width: `${fillPct}%`,
                  background: fillPct >= 90 ? "#ef4444" : fillPct >= 70 ? "#f59e0b" : "#8b5cf6",
                }} />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Classes Tab (class definitions) ──────────────────────────────────────────

interface ClassesTabProps {
  onCreateClass: () => void;
}

function ClassesTab({ onCreateClass }: ClassesTabProps) {
  const { data, isLoading } = useGymClasses({ page_size: 50 });
  const classes = data?.items ?? [];
  const deleteClass = useGymClassDelete();
  const updateClass = useGymClassUpdate();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleToggleStatus = async (cls: GymClassResponse) => {
    await updateClass.mutateAsync({
      classId: cls.id,
      payload: { status: cls.status === "active" ? "inactive" : "active" },
    });
  };

  const handleDelete = async (classId: string) => {
    setDeletingId(classId);
    try {
      await deleteClass.mutateAsync(classId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">{classes.length} class types defined</p>
        <button onClick={onCreateClass}
          className="flex items-center gap-1.5 h-7 px-3 rounded-xl text-[11px] font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}>
          <Plus className="h-3 w-3" />New Class
        </button>
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-xs text-muted-foreground">Loading…</div>
      ) : classes.length === 0 ? (
        <div className="py-14 text-center rounded-2xl"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: "rgba(139,92,246,0.08)" }}>
            <Layers className="h-6 w-6" style={{ color: "#8b5cf6" }} />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">No class types yet</p>
          <p className="text-[11px] text-muted-foreground">Create your first class type to start scheduling sessions.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {classes.map((cls) => (
            <div key={cls.id} className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
              style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(139,92,246,0.1)" }}>
                <BookOpen className="h-4.5 w-4.5" style={{ color: "#8b5cf6" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{cls.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {cls.default_duration_minutes}m · {cls.default_capacity} capacity
                  {cls.description ? ` · ${cls.description.slice(0, 40)}${cls.description.length > 40 ? "…" : ""}` : ""}
                </p>
              </div>
              {/* Status toggle */}
              <button onClick={() => handleToggleStatus(cls)}
                className="px-2.5 py-1 rounded-full text-[10px] font-semibold flex-shrink-0 transition-all"
                style={cls.status === "active"
                  ? { background: "rgba(16,185,129,0.12)", color: "#10b981" }
                  : { background: "rgba(107,114,128,0.12)", color: "#6b7280" }}>
                {cls.status === "active" ? "Active" : "Inactive"}
              </button>
              {/* Delete */}
              <button onClick={() => handleDelete(cls.id)} disabled={deletingId === cls.id}
                className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors flex-shrink-0 disabled:opacity-40">
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: ClassSessionStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Upcoming", value: "scheduled" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function ClassesPage() {
  const [tab, setTab] = useState<"sessions" | "classes">("sessions");
  const [statusFilter, setStatusFilter] = useState<ClassSessionStatus | "">("");
  const [page, setPage] = useState(1);
  const [selectedSession, setSelectedSession] = useState<ClassSessionResponse | null>(null);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showScheduleSession, setShowScheduleSession] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Fetch data
  const sessionParams = {
    page,
    page_size: 15,
    ...(statusFilter && { status: statusFilter }),
  };
  const { data: sessionsData, isLoading: loadingSessions } = useClassSessions(sessionParams);
  const { data: classesData } = useGymClasses({ page_size: 100 });
  const { data: trainersData } = useTrainers({ status: "active" });

  const sessions = sessionsData?.items ?? [];
  const classes = classesData?.items ?? [];
  const trainers = trainersData?.trainers ?? [];
  const total = sessionsData?.total ?? 0;
  const totalPages = sessionsData?.total_pages ?? 1;

  // Build trainer lookup: participant_id → trainer_name
  const trainerMap = useMemo(() => {
    const map = new Map<string, string>();
    trainers.forEach((t) => {
      map.set(t.participant_id, t.trainer_name ?? `Trainer ${t.id.slice(0, 6)}`);
    });
    return map;
  }, [trainers]);

  const cancelSession = useClassSessionCancel();

  const handleCancelSession = async (sessionId: string, reason: string) => {
    try {
      await cancelSession.mutateAsync({ sessionId, payload: { reason: reason || null } });
      setSelectedSession(null);
      setToast("Session cancelled.");
    } catch {
      setToast("Failed to cancel session.");
    }
  };

  const handleStatusFilter = (v: ClassSessionStatus | "") => { setStatusFilter(v); setPage(1); };

  // Stat summaries from current page
  const scheduledCount = sessions.filter((s) => s.status === "scheduled").length;
  const totalBookings = sessions.reduce((acc, s) => acc + s.current_bookings, 0);

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-foreground leading-tight">Classes</h1>
          <p className="text-[11px] text-muted-foreground">
            {classes.length} class types · {total} sessions
          </p>
        </div>
        <button
          onClick={() => setShowScheduleSession(true)}
          className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}
        >
          <Plus className="h-3.5 w-3.5" />
          Schedule Session
        </button>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Class Types", value: classes.length, sub: "defined templates", icon: Layers, color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
          { label: "Total Sessions", value: total, sub: "all time", icon: Calendar, color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
          { label: "Upcoming (page)", value: scheduledCount, sub: "on this page", icon: CheckCircle2, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
          { label: "Bookings (page)", value: totalBookings, sub: "on this page", icon: Users, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl px-4 py-3.5"
              style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: card.bg }}>
                  <Icon className="h-3.5 w-3.5" style={{ color: card.color }} />
                </div>
                <p className="text-[11px] text-muted-foreground font-medium">{card.label}</p>
              </div>
              <p className="text-xl font-bold text-foreground">{card.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Tab switcher ────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 rounded-xl p-0.5 w-fit"
        style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }}>
        {(["sessions", "classes"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all"
            style={tab === t ? {
              background: "rgba(139,92,246,0.15)",
              color: "#8b5cf6",
              border: "1px solid rgba(139,92,246,0.25)",
            } : { color: "hsl(var(--muted-foreground))" }}>
            {t === "sessions" ? "Sessions" : "Class Types"}
          </button>
        ))}
      </div>

      {/* ── Sessions tab ────────────────────────────────────────────── */}
      {tab === "sessions" && (
        <div className="space-y-4">
          {/* Status filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center rounded-xl p-0.5 gap-0.5"
              style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }}>
              {STATUS_TABS.map((st) => {
                const active = statusFilter === st.value;
                return (
                  <button key={st.value} onClick={() => handleStatusFilter(st.value as ClassSessionStatus | "")}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                    style={active ? {
                      background: "rgba(139,92,246,0.15)",
                      color: "#8b5cf6",
                      border: "1px solid rgba(139,92,246,0.25)",
                    } : { color: "hsl(var(--muted-foreground))" }}>
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Session list */}
          {loadingSessions ? (
            <div className="py-12 text-center text-xs text-muted-foreground">Loading…</div>
          ) : sessions.length === 0 ? (
            <div className="py-16 text-center rounded-2xl"
              style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "rgba(139,92,246,0.08)" }}>
                <Calendar className="h-6 w-6" style={{ color: "#8b5cf6" }} />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">No sessions found</p>
              <p className="text-[11px] text-muted-foreground">
                {statusFilter ? "Try changing the filter." : "Schedule the first session to get started."}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {sessions.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  trainerName={trainerMap.get(s.trainer_id) ?? "Unknown Trainer"}
                  onClick={() => setSelectedSession(s)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                  className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted disabled:opacity-30">
                  <ChevronLeft className="h-3.5 w-3.5 text-foreground" />
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted disabled:opacity-30">
                  <ChevronRight className="h-3.5 w-3.5 text-foreground" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Classes tab ─────────────────────────────────────────────── */}
      {tab === "classes" && (
        <ClassesTab onCreateClass={() => setShowCreateClass(true)} />
      )}

      {/* ── Side panel overlay ──────────────────────────────────────── */}
      {selectedSession && (
        <>
          <div className="fixed inset-0 z-30 bg-black/30" onClick={() => setSelectedSession(null)} />
          <SessionDetailPanel
            session={selectedSession}
            trainerName={trainerMap.get(selectedSession.trainer_id) ?? "Unknown Trainer"}
            onClose={() => setSelectedSession(null)}
            onCancel={handleCancelSession}
            isCancelling={cancelSession.isPending}
          />
        </>
      )}

      {/* ── Dialogs ─────────────────────────────────────────────────── */}
      {showCreateClass && (
        <CreateClassDialog
          onClose={() => setShowCreateClass(false)}
          onSuccess={(msg) => { setToast(msg); setTab("classes"); }}
        />
      )}

      {showScheduleSession && (
        <ScheduleSessionDialog
          classes={classes.filter((c) => c.status === "active")}
          onClose={() => setShowScheduleSession(false)}
          onSuccess={(msg) => setToast(msg)}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
