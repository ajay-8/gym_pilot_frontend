"use client";

import { useState } from "react";
import { X, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useMembershipPlans } from "@/lib/hooks/use-membership-plans";
import type { ParticipantRole, WeeklyAvailability } from "@/types/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AddPersonTrainerData {
  onboarding_date: string;
  weekly_availability?: WeeklyAvailability;
}

export interface AddPersonMemberData {
  plan_id: string;
  membership_start_date: string;
}

export interface AddPersonPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  roles: ParticipantRole[];
  trainer?: AddPersonTrainerData;
  member?: AddPersonMemberData;
}

export interface AddPersonDialogProps {
  onClose: () => void;
  onSubmit: (data: AddPersonPayload) => void;
  isPending: boolean;
  error: string | null;
  /** Roles pre-checked when the dialog opens */
  defaultRoles?: ParticipantRole[];
  /**
   * Which roles the user can select in this dialog.
   * When omitted → all roles shown (All People page).
   * When a single role is provided → role picker hidden, that role is fixed.
   */
  availableRoles?: ParticipantRole[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun",
};

const EMPTY_AVAILABILITY: WeeklyAvailability = {
  monday: [], tuesday: [], wednesday: [], thursday: [],
  friday: [], saturday: [], sunday: [],
};

// ── Role badge colours ─────────────────────────────────────────────────────────

const ROLE_COLORS: Record<ParticipantRole, { bg: string; text: string }> = {
  member:  { bg: "rgba(16,185,129,0.12)",  text: "#10b981" },
  trainer: { bg: "rgba(139,92,246,0.12)",  text: "#8b5cf6" },
  staff:   { bg: "rgba(59,130,246,0.12)",  text: "#3b82f6" },
  admin:   { bg: "rgba(245,158,11,0.12)",  text: "#f59e0b" },
  owner:   { bg: "rgba(239,68,68,0.1)",    text: "#ef4444" },
};

// ── Shift editor (compact inline) ─────────────────────────────────────────────

function ShiftEditor({
  availability,
  onChange,
}: {
  availability: WeeklyAvailability;
  onChange: (a: WeeklyAvailability) => void;
}) {
  const inputStyle = {
    background: "hsl(var(--muted)/0.3)",
    border: "1px solid hsl(var(--border))",
    color: "hsl(var(--foreground))",
  };

  const toggleDay = (day: string) => {
    const current = (availability as any)[day] as { start: string; end: string }[];
    const updated = { ...availability } as any;
    if (current.length === 0) {
      updated[day] = [{ start: "06:00", end: "14:00" }];
    } else {
      updated[day] = [];
    }
    onChange(updated);
  };

  const updateSlot = (day: string, key: "start" | "end", value: string) => {
    const updated = { ...availability } as any;
    updated[day] = [{ ...(updated[day][0] ?? {}), [key]: value }];
    onChange(updated);
  };

  return (
    <div className="space-y-1.5">
      {DAYS.map((day) => {
        const slots = (availability as any)[day] as { start: string; end: string }[];
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
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<ParticipantRole, string> = {
  member: "Member", trainer: "Trainer", staff: "Staff", admin: "Admin", owner: "Owner",
};

export function AddPersonDialog({
  onClose,
  onSubmit,
  isPending,
  error,
  defaultRoles = [],
  availableRoles,
}: AddPersonDialogProps) {
  const today = new Date().toISOString().split("T")[0];

  // Derive title and whether roles are editable
  const fixedRole = availableRoles?.length === 1 ? availableRoles[0] : null;
  const dialogTitle = fixedRole ? `Add ${ROLE_LABELS[fixedRole]}` : "Add Person";
  const selectableRoles = availableRoles ?? (["member", "trainer", "staff", "admin"] as ParticipantRole[]);

  // Basic info
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  // Roles — when a single availableRole is fixed, seed it directly
  const initialRoles = fixedRole ? [fixedRole] : defaultRoles;
  const [roles, setRoles] = useState<Set<ParticipantRole>>(new Set(initialRoles));

  // Trainer-specific state
  const [onboardingDate, setOnboardingDate] = useState(today);
  const [showShifts, setShowShifts] = useState(false);
  const [availability, setAvailability] = useState<WeeklyAvailability>(EMPTY_AVAILABILITY);

  // Member-specific state
  const [planId, setPlanId] = useState("");
  const [memberStartDate, setMemberStartDate] = useState(today);

  const { data: plansData } = useMembershipPlans(
    {},
    roles.has("member")
  );
  const plans = plansData?.items ?? [];

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const toggleRole = (role: ParticipantRole) => {
    setRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  };

  const inputClass = "w-full px-3 py-2 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground";
  const inputStyle = { background: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border))" };
  const labelClass = "block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5";

  // Validation
  const isMember = roles.has("member");
  const isTrainer = roles.has("trainer");
  const phoneRequired = isMember;

  const canSubmit =
    form.first_name.trim() &&
    form.last_name.trim() &&
    form.email.trim() &&
    roles.size > 0 &&
    (!phoneRequired || form.phone.trim()) &&
    (!isMember || (planId && memberStartDate));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const payload: AddPersonPayload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      roles: Array.from(roles),
    };

    if (isTrainer) {
      const hasAnyShift = DAYS.some((d) => (availability as any)[d].length > 0);
      payload.trainer = {
        onboarding_date: onboardingDate,
        weekly_availability: hasAnyShift ? availability : undefined,
      };
    }

    if (isMember) {
      payload.member = {
        plan_id: planId,
        membership_start_date: memberStartDate,
      };
    }

    onSubmit(payload);
  };

  const ASSIGNABLE_ROLES: { role: ParticipantRole; label: string }[] = [
    { role: "member",  label: "Member" },
    { role: "trainer", label: "Trainer" },
    { role: "staff",   label: "Staff" },
    { role: "admin",   label: "Admin" },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-foreground">{dialogTitle}</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Creates an account if the email is new
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-xl flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>First Name *</label>
              <input
                value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
                placeholder="Rajesh"
                className={inputClass}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Last Name *</label>
              <input
                value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
                placeholder="Kumar"
                className={inputClass}
                style={inputStyle}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className={labelClass}>Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="person@example.com"
              className={inputClass}
              style={inputStyle}
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className={labelClass}>
              Phone{" "}
              <span className="normal-case font-normal">
                {phoneRequired ? "*" : "(optional)"}
              </span>
            </label>
            <div className="flex items-center overflow-hidden rounded-xl" style={inputStyle}>
              <span className="px-3 py-2 text-sm text-muted-foreground flex-shrink-0 select-none"
                style={{ borderRight: "1px solid hsl(var(--border))" }}>+91</span>
              <input
                type="tel"
                value={form.phone.replace(/^\+?91/, "")}
                onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit number"
                maxLength={10}
                className="flex-1 px-3 py-2 text-sm outline-none text-foreground placeholder:text-muted-foreground bg-transparent"
              />
            </div>
            {phoneRequired && !form.phone.trim() && (
              <p className="text-[11px] mt-1" style={{ color: "#f59e0b" }}>
                Phone is required for member enrollment
              </p>
            )}
          </div>

          {/* Roles — hidden when a single role is fixed by the calling page */}
          {!fixedRole && (
            <div>
              <label className={labelClass}>Roles *</label>
              <div className="flex flex-wrap gap-2">
                {ASSIGNABLE_ROLES.filter(({ role }) => selectableRoles.includes(role)).map(({ role, label }) => {
                  const active = roles.has(role);
                  const colors = ROLE_COLORS[role];
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className="px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
                      style={
                        active
                          ? { background: colors.bg, color: colors.text, border: `1px solid ${colors.text}40` }
                          : { background: "hsl(var(--muted)/0.4)", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {roles.size === 0 && (
                <p className="text-[11px] mt-1.5 text-muted-foreground">Select at least one role</p>
              )}
            </div>
          )}

          {/* ── Trainer section ──────────────────────────────── */}
          {isTrainer && (
            <div
              className="rounded-xl p-3 space-y-3"
              style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}
            >
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#8b5cf6" }}>
                Trainer Details
              </p>
              <div>
                <label className={labelClass}>Onboarding Date *</label>
                <input
                  type="date"
                  value={onboardingDate}
                  onChange={(e) => setOnboardingDate(e.target.value)}
                  className={inputClass}
                  style={{ ...inputStyle, colorScheme: "dark" }}
                  required
                />
              </div>

              {/* Shifts — collapsible */}
              <button
                type="button"
                onClick={() => setShowShifts((s) => !s)}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                {showShifts ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showShifts ? "Hide shift schedule" : "Set shift schedule (optional)"}
              </button>

              {showShifts && (
                <ShiftEditor availability={availability} onChange={setAvailability} />
              )}
            </div>
          )}

          {/* ── Member section ────────────────────────────────── */}
          {isMember && (
            <div
              className="rounded-xl p-3 space-y-3"
              style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}
            >
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#10b981" }}>
                Member Details
              </p>
              <div>
                <label className={labelClass}>Membership Plan *</label>
                <select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  required
                >
                  <option value="">Select a plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.price ? `— ₹${p.price}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Membership Start Date *</label>
                <input
                  type="date"
                  value={memberStartDate}
                  onChange={(e) => setMemberStartDate(e.target.value)}
                  className={inputClass}
                  style={{ ...inputStyle, colorScheme: "dark" }}
                  required
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="flex items-start gap-2 p-3 rounded-xl text-[11px]"
              style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}
            >
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending || !canSubmit}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
          >
            {isPending ? "Adding…" : dialogTitle}
          </button>
        </form>
      </div>
    </div>
  );
}
