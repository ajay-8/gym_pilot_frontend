"use client";

import { useState } from "react";
import {
  Dumbbell,
  UserPlus,
  X,
  ChevronRight,
  Activity,
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
  Power,
  Pencil,
} from "lucide-react";
import {
  useTrainers,
  useTrainerCreate,
  useTrainerUpdate,
  useUpdateTrainerAvailability,
  useTrainerOffboard,
  useTrainerPerformance,
  useTrainerCommissionSummary,
  useTrainerCommissions,
  useMarkCommissionPaid,
} from "@/lib/hooks/use-trainers";
import { AddPersonDialog, type AddPersonPayload } from "@/components/participants/add-person-dialog";
import type {
  GymTrainerContractResponse,
  WeeklyAvailability,
  TrainerPerformanceResponse,
  CommissionSummaryResponse,
  CommissionSummaryItem,
} from "@/types/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

function fmtCurrency(val: string | null | undefined, currency = "INR") {
  if (!val) return "—";
  const num = parseFloat(val);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);
}

function fmtRate(val: string | null | undefined) {
  if (!val) return "—";
  return `${parseFloat(val).toFixed(1)}%`;
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Status Badge ──────────────────────────────────────────────────────────────

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
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

// ── Trainer Card ──────────────────────────────────────────────────────────────

interface TrainerCardProps {
  trainer: GymTrainerContractResponse;
  onClick: () => void;
}

function TrainerCard({ trainer, onClick }: TrainerCardProps) {
  const name = trainer.trainer_name ?? "Unnamed Trainer";
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl px-4 py-4 transition-all hover:bg-white/[0.02] group"
      style={{ borderBottom: "1px solid hsl(var(--border)/0.6)" }}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6" }}
        >
          {initials(name).toUpperCase()}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground truncate">{name}</p>
            <StatusBadge status={trainer.status} />
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Since {fmtDate(trainer.onboarding_date)}
          </p>
        </div>

        {/* Rates */}
        <div className="hidden sm:flex flex-col items-end gap-0.5 flex-shrink-0">
          {trainer.hourly_rate && (
            <p className="text-xs font-semibold text-foreground">
              {fmtCurrency(trainer.hourly_rate, trainer.currency)}/hr
            </p>
          )}
          {trainer.commission_rate && (
            <p className="text-[11px] text-muted-foreground">
              {fmtRate(trainer.commission_rate)} commission
            </p>
          )}
          {!trainer.hourly_rate && !trainer.commission_rate && (
            <p className="text-[11px] text-muted-foreground">No rates set</p>
          )}
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
    </button>
  );
}

// ── Performance Panel Section ─────────────────────────────────────────────────

function PerformanceSection({ performance }: { performance: TrainerPerformanceResponse }) {
  const rate = parseFloat(performance.completion_rate ?? "0").toFixed(1);
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
        Performance
      </p>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Total Sessions", value: performance.total_sessions, icon: Activity, color: "#8b5cf6" },
          { label: "Completion Rate", value: `${rate}%`, icon: TrendingUp, color: "#10b981" },
          { label: "Active Clients", value: performance.active_clients, icon: Users, color: "#3b82f6" },
          { label: "Avg Duration", value: performance.average_session_duration_minutes ? `${Math.round(performance.average_session_duration_minutes)}m` : "—", icon: Clock, color: "#f59e0b" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-3"
            style={{ background: "hsl(var(--muted)/0.3)" }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon className="h-3 w-3" style={{ color: s.color }} />
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
            <p className="text-base font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <div className="rounded-xl p-3" style={{ background: "hsl(var(--muted)/0.3)" }}>
          <p className="text-[10px] text-muted-foreground mb-1">Total Revenue</p>
          <p className="text-sm font-bold text-foreground">
            {fmtCurrency(performance.total_revenue)}
          </p>
        </div>
        <div className="rounded-xl p-3" style={{ background: "hsl(var(--muted)/0.3)" }}>
          <p className="text-[10px] text-muted-foreground mb-1">Commission Earned</p>
          <p className="text-sm font-bold text-foreground">
            {fmtCurrency(performance.total_commission_earned)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Mark Paid Dialog ──────────────────────────────────────────────────────────

function MarkPaidDialog({
  trainerId,
  period,
  onClose,
}: {
  trainerId: string;
  period: CommissionSummaryItem;
  onClose: () => void;
}) {
  const [paymentRef, setPaymentRef] = useState("");
  const [notes, setNotes] = useState("");

  // Period format in summary is "YYYY-MM", API needs "YYYY-MM-DD"
  const periodFrom = period.period.length === 7 ? `${period.period}-01` : period.period;

  const { data: commissionsData, isLoading: loadingCommissions } = useTrainerCommissions(trainerId, {
    status: "pending",
    period_from: periodFrom,
    period_to: periodFrom,
    per_page: 100,
  });

  const markPaid = useMarkCommissionPaid();

  const handleSubmit = async () => {
    const commissions = commissionsData?.commissions ?? [];
    for (const commission of commissions) {
      await markPaid.mutateAsync({
        commissionId: commission.id,
        payload: {
          payment_reference: paymentRef.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });
    }
    onClose();
  };

  const isPending = markPaid.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="rounded-2xl p-6 w-full max-w-sm mx-4"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-foreground">Mark Commissions Paid</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Period: {period.period}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-70">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Summary */}
        <div
          className="rounded-xl p-3 mb-4 grid grid-cols-2 gap-2"
          style={{ background: "hsl(var(--muted)/0.3)" }}
        >
          <div>
            <p className="text-[10px] text-muted-foreground">Pending Sessions</p>
            <p className="text-sm font-bold text-foreground">{period.pending_count}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Amount</p>
            <p className="text-sm font-bold" style={{ color: "#8b5cf6" }}>
              {fmtCurrency(period.total_commission)}
            </p>
          </div>
        </div>

        {loadingCommissions ? (
          <p className="text-center text-xs text-muted-foreground py-4">Loading commissions…</p>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Payment Reference <span className="font-normal">(optional)</span>
              </label>
              <input
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="e.g. UPI-123456, NEFT ref"
                className="w-full rounded-xl px-3 py-2 text-sm bg-transparent outline-none"
                style={{ border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Notes <span className="font-normal">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Any remarks…"
                className="w-full rounded-xl px-3 py-2 text-sm bg-transparent outline-none resize-none"
                style={{ border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "hsl(var(--muted)/0.4)", color: "hsl(var(--muted-foreground))" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || loadingCommissions || !commissionsData?.commissions?.length}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "#8b5cf6" }}
          >
            {isPending ? "Processing…" : `Mark ${period.pending_count} Paid`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Commission Summary Section ─────────────────────────────────────────────────

function CommissionSection({ summary, trainerId }: { summary: CommissionSummaryResponse; trainerId: string }) {
  const [payPeriod, setPayPeriod] = useState<CommissionSummaryItem | null>(null);

  return (
    <div className="space-y-2">
      {payPeriod && (
        <MarkPaidDialog
          trainerId={trainerId}
          period={payPeriod}
          onClose={() => setPayPeriod(null)}
        />
      )}
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
        Commissions
      </p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total Earnings", value: summary.total_earnings, color: "#8b5cf6" },
          { label: "Pending", value: summary.total_pending, color: "#f59e0b" },
          { label: "Paid", value: summary.total_paid, color: "#10b981" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-2.5 text-center"
            style={{ background: "hsl(var(--muted)/0.3)" }}
          >
            <p className="text-[10px] text-muted-foreground mb-1">{s.label}</p>
            <p className="text-sm font-bold" style={{ color: s.color }}>
              {fmtCurrency(s.value)}
            </p>
          </div>
        ))}
      </div>
      {summary.by_period.length > 0 && (
        <div
          className="rounded-xl overflow-hidden mt-1"
          style={{ border: "1px solid hsl(var(--border)/0.5)" }}
        >
          <div
            className="grid px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase"
            style={{ borderBottom: "1px solid hsl(var(--border)/0.5)", gridTemplateColumns: "1fr auto auto auto" }}
          >
            <span>Period</span>
            <span className="text-right mr-3">Sessions</span>
            <span className="text-right mr-3">Amount</span>
            <span className="text-right">Status</span>
          </div>
          {summary.by_period.slice(0, 6).map((p) => (
            <div
              key={p.period}
              className="grid items-center px-3 py-2 text-[11px]"
              style={{ borderBottom: "1px solid hsl(var(--border)/0.3)", gridTemplateColumns: "1fr auto auto auto" }}
            >
              <span className="text-muted-foreground">{p.period}</span>
              <span className="text-right mr-3 text-foreground">{p.total_sessions}</span>
              <span className="text-right mr-3 font-semibold text-foreground">
                {fmtCurrency(p.total_commission)}
              </span>
              <span className="text-right">
                {p.pending_count > 0 ? (
                  <button
                    onClick={() => setPayPeriod(p)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
                    style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6" }}
                  >
                    Pay ({p.pending_count})
                  </button>
                ) : (
                  <span className="text-[10px]" style={{ color: "#10b981" }}>Paid</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Shift Schedule Section ────────────────────────────────────────────────────

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun",
};

function ShiftScheduleSection({
  trainer,
  onUpdateShifts,
  isUpdating,
}: {
  trainer: GymTrainerContractResponse;
  onUpdateShifts: (a: WeeklyAvailability) => void;
  isUpdating: boolean;
}) {
  const availability: WeeklyAvailability = (trainer.weekly_availability as WeeklyAvailability) ?? {
    monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [],
  };
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<WeeklyAvailability>(availability);

  const inputStyle = {
    background: "hsl(var(--muted)/0.3)",
    border: "1px solid hsl(var(--border))",
    color: "hsl(var(--foreground))",
  };

  const toggleDay = (day: string) => {
    const updated = { ...draft } as any;
    if ((updated[day] as any[]).length === 0) {
      updated[day] = [{ start: "06:00", end: "14:00" }];
    } else {
      updated[day] = [];
    }
    setDraft(updated);
  };

  const updateSlot = (day: string, key: "start" | "end", value: string) => {
    const updated = { ...draft } as any;
    updated[day] = [{ ...(updated[day][0] ?? {}), [key]: value }];
    setDraft(updated);
  };

  const activeDays = DAYS.filter((d) => ((availability as any)[d] as any[]).length > 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Shift Schedule
        </p>
        <button
          onClick={() => { setEditing((e) => !e); setDraft(availability); }}
          className="flex items-center gap-1 text-[11px] font-semibold hover:opacity-70 transition-opacity"
          style={{ color: "#8b5cf6" }}
        >
          <Pencil className="h-3 w-3" />
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      {!editing ? (
        <div>
          {activeDays.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">No shifts set — trainer sets via their portal</p>
          ) : (
            <div className="space-y-1">
              {activeDays.map((day) => {
                const slots = (availability as any)[day] as { start: string; end: string }[];
                return (
                  <div key={day} className="flex items-center gap-2">
                    <span
                      className="w-10 text-center text-[11px] font-bold px-1 py-0.5 rounded-lg"
                      style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6" }}
                    >
                      {DAY_LABELS[day]}
                    </span>
                    <span className="text-[11px] text-foreground tabular-nums">
                      {slots[0]?.start} – {slots[0]?.end}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {DAYS.map((day) => {
            const slots = (draft as any)[day] as { start: string; end: string }[];
            const active = slots.length > 0;
            return (
              <div key={day} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleDay(day)}
                  className="w-10 text-center text-[11px] font-semibold rounded-lg py-1 transition-all"
                  style={
                    active
                      ? { background: "rgba(139,92,246,0.15)", color: "#8b5cf6" }
                      : { background: "hsl(var(--muted)/0.3)", color: "hsl(var(--muted-foreground))" }
                  }
                >
                  {DAY_LABELS[day]}
                </button>
                {active && (
                  <>
                    <input
                      type="time"
                      value={slots[0]?.start ?? "06:00"}
                      onChange={(e) => updateSlot(day, "start", e.target.value)}
                      className="rounded-lg px-2 py-1 text-[11px] outline-none w-24"
                      style={{ ...inputStyle, colorScheme: "dark" }}
                    />
                    <span className="text-[10px] text-muted-foreground">–</span>
                    <input
                      type="time"
                      value={slots[0]?.end ?? "14:00"}
                      onChange={(e) => updateSlot(day, "end", e.target.value)}
                      className="rounded-lg px-2 py-1 text-[11px] outline-none w-24"
                      style={{ ...inputStyle, colorScheme: "dark" }}
                    />
                  </>
                )}
              </div>
            );
          })}
          <button
            onClick={() => { onUpdateShifts(draft); setEditing(false); }}
            disabled={isUpdating}
            className="mt-2 w-full py-1.5 rounded-xl text-[12px] font-bold text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}
          >
            {isUpdating ? "Saving…" : "Save Shifts"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

interface DetailPanelProps {
  trainer: GymTrainerContractResponse;
  onClose: () => void;
  onStatusToggle: () => void;
  isToggling: boolean;
  onOffboard: () => void;
  isOffboarding: boolean;
  onUpdateShifts: (trainer: GymTrainerContractResponse, availability: WeeklyAvailability) => void;
  isTogglingShifts: boolean;
}

function DetailPanel({ trainer, onClose, onStatusToggle, isToggling, onOffboard, isOffboarding, onUpdateShifts, isTogglingShifts }: DetailPanelProps) {
  const [confirmOffboard, setConfirmOffboard] = useState(false);
  const name = trainer.trainer_name ?? "Unnamed Trainer";
  const { data: performance, isLoading: perfLoading } = useTrainerPerformance(trainer.id);
  const { data: commSummary, isLoading: commLoading } = useTrainerCommissionSummary(trainer.id);

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-md shadow-2xl"
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
          {initials(name).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-foreground truncate">{name}</p>
            <StatusBadge status={trainer.status} />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Onboarded {fmtDate(trainer.onboarding_date)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Body (scrollable) */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Shift Schedule */}
        <ShiftScheduleSection
          trainer={trainer}
          onUpdateShifts={(availability) =>
            onUpdateShifts(trainer, availability)
          }
          isUpdating={isTogglingShifts}
        />

        {/* Performance */}
        {perfLoading ? (
          <div className="py-4 text-center text-xs text-muted-foreground">
            Loading performance…
          </div>
        ) : performance ? (
          <PerformanceSection performance={performance} />
        ) : (
          <div className="py-4 text-center text-xs text-muted-foreground">
            No performance data yet
          </div>
        )}

        {/* Commissions */}
        {commLoading ? (
          <div className="py-4 text-center text-xs text-muted-foreground">
            Loading commissions…
          </div>
        ) : commSummary ? (
          <CommissionSection summary={commSummary} trainerId={trainer.id} />
        ) : (
          <div className="py-4 text-center text-xs text-muted-foreground">
            No commission data yet
          </div>
        )}
      </div>

      {/* Actions footer */}
      <div
        className="px-5 py-4 flex-shrink-0 space-y-2"
        style={{ borderTop: "1px solid hsl(var(--border))" }}
      >
        {/* Status toggle + Offboard */}
        {!confirmOffboard ? (
          <div className="flex items-center gap-3">
            <button
              onClick={onStatusToggle}
              disabled={isToggling || isOffboarding}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
              style={
                trainer.status === "active"
                  ? { background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }
                  : { background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }
              }
            >
              <Power className="h-3.5 w-3.5" />
              {isToggling ? "Updating…" : trainer.status === "active" ? "Deactivate" : "Reactivate"}
            </button>
            <button
              onClick={() => setConfirmOffboard(true)}
              disabled={isToggling || isOffboarding}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40 ml-auto"
              style={{ background: "hsl(var(--muted)/0.5)", color: "hsl(var(--muted-foreground))" }}
            >
              Offboard
            </button>
          </div>
        ) : (
          <div
            className="rounded-xl p-3 space-y-2"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
          >
            <p className="text-[11px] font-semibold" style={{ color: "#ef4444" }}>
              Remove {name} from this gym? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { onOffboard(); setConfirmOffboard(false); }}
                disabled={isOffboarding}
                className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}
              >
                {isOffboarding ? "Offboarding…" : "Yes, Offboard"}
              </button>
              <button
                onClick={() => setConfirmOffboard(false)}
                className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold"
                style={{ background: "hsl(var(--muted)/0.5)", color: "hsl(var(--muted-foreground))" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TrainersPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [selectedTrainer, setSelectedTrainer] = useState<GymTrainerContractResponse | null>(null);
  const [showOnboard, setShowOnboard] = useState(false);
  const [onboardError, setOnboardError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { data, isLoading } = useTrainers({
    status: statusFilter,
    per_page: 100,
  });

  const create = useTrainerCreate();
  const update = useTrainerUpdate();
  const updateAvailability = useUpdateTrainerAvailability();
  const offboard = useTrainerOffboard();

  const trainers = data?.trainers ?? [];
  const activeCount = trainers.filter((t) => t.status === "active").length;
  const inactiveCount = trainers.filter((t) => t.status === "inactive").length;

  const handleAddTrainer = async (payload: AddPersonPayload) => {
    setOnboardError(null);
    try {
      const result = await create.mutateAsync({
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        phone: payload.phone || undefined,
        onboarding_date: payload.trainer?.onboarding_date ?? new Date().toISOString().split("T")[0],
        weekly_availability: payload.trainer?.weekly_availability,
      });
      setShowOnboard(false);
      const msg = result.is_new_user
        ? `Trainer onboarded! ${result.invitation_sent ? "Invitation SMS sent." : "No phone — share the login link manually."}`
        : "Existing user added as trainer.";
      showToast(msg);
    } catch (e: unknown) {
      const err = e as { detail?: string };
      setOnboardError(err?.detail ?? "Failed to onboard trainer.");
    }
  };

  const handleUpdateShifts = async (trainer: GymTrainerContractResponse, availability: WeeklyAvailability) => {
    try {
      await updateAvailability.mutateAsync({
        trainerId: trainer.id,
        availability,
      });
      setSelectedTrainer((prev) =>
        prev && prev.id === trainer.id ? { ...prev, weekly_availability: availability } : prev
      );
      showToast("Shifts updated.");
    } catch {
      showToast("Failed to update shifts.");
    }
  };

  const handleOffboard = async (trainer: GymTrainerContractResponse) => {
    try {
      await offboard.mutateAsync(trainer.id);
      setSelectedTrainer(null);
      showToast(`${trainer.trainer_name ?? "Trainer"} offboarded.`);
    } catch {
      showToast("Failed to offboard trainer.");
    }
  };

  const handleStatusToggle = async (trainer: GymTrainerContractResponse) => {
    setTogglingId(trainer.id);
    const newStatus = trainer.status === "active" ? "inactive" : "active";
    try {
      await update.mutateAsync({
        trainerId: trainer.id,
        payload: { status: newStatus },
      });
      // Update selected trainer state
      setSelectedTrainer((prev) =>
        prev?.id === trainer.id ? { ...prev, status: newStatus } : prev
      );
      showToast(`Trainer ${newStatus === "active" ? "reactivated" : "deactivated"}.`);
    } catch {
      showToast("Failed to update status.");
    } finally {
      setTogglingId(null);
    }
  };

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const filters = [
    { label: "All", value: undefined },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-foreground leading-tight">Trainers</h1>
          <p className="text-[11px] text-muted-foreground">
            {data?.total ?? 0} trainer{data?.total !== 1 ? "s" : ""} at your gym
          </p>
        </div>
        <button
          onClick={() => { setShowOnboard(true); setOnboardError(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}
        >
          <UserPlus className="h-4 w-4" />
          Onboard Trainer
        </button>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-2xl px-4 py-3.5"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className="h-6 w-6 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(139,92,246,0.12)" }}
            >
              <Dumbbell className="h-3.5 w-3.5" style={{ color: "#8b5cf6" }} />
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">Active Trainers</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{activeCount}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">currently working</p>
        </div>

        <div
          className="rounded-2xl px-4 py-3.5"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className="h-6 w-6 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.1)" }}
            >
              <Users className="h-3.5 w-3.5" style={{ color: "#ef4444" }} />
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">Inactive</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{inactiveCount}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">not currently active</p>
        </div>
      </div>

      {/* ── Filter tabs ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        {filters.map((f) => (
          <button
            key={String(f.value)}
            onClick={() => setStatusFilter(f.value)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
            style={
              statusFilter === f.value
                ? { background: "rgba(139,92,246,0.15)", color: "#8b5cf6" }
                : { background: "hsl(var(--muted)/0.5)", color: "hsl(var(--muted-foreground))" }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Trainers list ───────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">Loading…</div>
        ) : trainers.length === 0 ? (
          <div className="py-16 text-center">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(139,92,246,0.08)" }}
            >
              <Dumbbell className="h-7 w-7" style={{ color: "#8b5cf6" }} />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">No trainers found</p>
            <p className="text-[11px] text-muted-foreground">
              {statusFilter
                ? `No ${statusFilter} trainers.`
                : "Click 'Onboard Trainer' to add your first trainer."}
            </p>
          </div>
        ) : (
          trainers.map((trainer) => (
            <TrainerCard
              key={trainer.id}
              trainer={trainer}
              onClick={() => setSelectedTrainer(trainer)}
            />
          ))
        )}
      </div>

      {/* ── Detail Panel ────────────────────────────────────────────────── */}
      {selectedTrainer && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setSelectedTrainer(null)}
          />
          <DetailPanel
            trainer={selectedTrainer}
            onClose={() => setSelectedTrainer(null)}
            onStatusToggle={() => handleStatusToggle(selectedTrainer)}
            isToggling={togglingId === selectedTrainer.id}
            onOffboard={() => handleOffboard(selectedTrainer)}
            isOffboarding={offboard.isPending}
            onUpdateShifts={handleUpdateShifts}
            isTogglingShifts={updateAvailability.isPending}
          />
        </>
      )}

      {/* ── Add Trainer Dialog ──────────────────────────────────────────── */}
      {showOnboard && (
        <AddPersonDialog
          availableRoles={["trainer"]}
          defaultRoles={["trainer"]}
          onClose={() => { setShowOnboard(false); setOnboardError(null); }}
          onSubmit={handleAddTrainer}
          isPending={create.isPending}
          error={onboardError}
        />
      )}

      {/* ── Toast ───────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-2xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}
        >
          <CheckCircle className="h-4 w-4" />
          {toast}
        </div>
      )}
    </div>
  );
}
