"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Search, Plus, X, Phone, Mail, Calendar, MessageSquare,
  ChevronLeft, ChevronRight, ChevronDown, Trash2, AlertTriangle, CheckCircle, Send, UserCheck, Pencil, Save,
  Users, UserPlus, LayoutGrid, List, Eye,
  Globe, Share2, Megaphone, HelpCircle, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useLeads, useLeadsStats, useLeadCreate, useLeadUpdate, useLeadDelete,
  useLeadAddNote, useLeadMarkLost, useLeadConvert,
} from "@/lib/hooks/use-leads";
import { useMemberOnboard } from "@/lib/hooks/use-members";
import { fmtDate, fmtDateTime, initials } from "@/lib/utils/formatting";
import { useMembershipPlans } from "@/lib/hooks/use-membership-plans";
import {
  LeadResponse, LeadStatus, LeadSource,
  LeadCreateRequest, LeadUpdateRequest,
} from "@/types/api";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  new:            { label: "New",            color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  contacted:      { label: "Contacted",      color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  scheduled_tour: { label: "Tour Scheduled", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  tour_completed: { label: "Tour Done",      color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
  trial_started:  { label: "Trial",          color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  converted:      { label: "Converted",      color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  lost:           { label: "Lost",           color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

const SOURCE_CONFIG: Record<LeadSource, { label: string; color: string }> = {
  walk_in:       { label: "Walk-in",      color: "#10b981" },
  phone_inquiry: { label: "Phone",        color: "#3b82f6" },
  web_form:      { label: "Web Form",     color: "#8b5cf6" },
  referral:      { label: "Referral",     color: "#f59e0b" },
  social_media:  { label: "Social",       color: "#ec4899" },
  advertisement: { label: "Ad",           color: "#f97316" },
  other:         { label: "Other",        color: "#6b7280" },
};

const SOURCE_ICONS: Record<LeadSource, React.ElementType> = {
  walk_in:       Users,
  phone_inquiry: Phone,
  web_form:      Globe,
  referral:      UserPlus,
  social_media:  Share2,
  advertisement: Megaphone,
  other:         HelpCircle,
};

const LEAD_SOURCES: LeadSource[] = [
  "walk_in", "phone_inquiry", "web_form", "referral", "social_media", "advertisement", "other",
];

const LOST_REASONS = ["price", "location", "timing", "competition", "other"];

const STATUS_PIPELINE: LeadStatus[] = [
  "new", "contacted", "scheduled_tour", "tour_completed", "trial_started", "converted",
];

function isOverdue(date: string | null) {
  if (!date) return false;
  return new Date(date + "T23:59:59") < new Date();
}

function getFollowUpBadge(date: string | null): { text: string; color: string; bg: string } | null {
  if (!date) return null;
  const d = new Date(date + "T00:00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0)  return { text: "OVERDUE",  color: "#ef4444", bg: "rgba(239,68,68,0.15)" };
  if (diff === 0) return { text: "TODAY",   color: "#10b981", bg: "rgba(16,185,129,0.15)" };
  if (diff === 1) return { text: "TOMORROW", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" };
  return null;
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LeadStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.new;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function SourceBadge({ source }: { source: LeadSource }) {
  const cfg = SOURCE_CONFIG[source] ?? SOURCE_CONFIG.other;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: `${cfg.color}18`, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// ── FilterChip ────────────────────────────────────────────────────────────────

function FilterChip({ icon: Icon, label, value, options, onChange }: {
  icon: React.ElementType;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer select-none flex-shrink-0"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
      <Icon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
      <span className="text-xs text-muted-foreground">{label}:</span>
      <span className="text-xs font-semibold text-foreground">{value}</span>
      <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
      <select
        value={options.find(o => o.label === value)?.value ?? ""}
        onChange={e => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer w-full"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

// ── Add Lead Dialog ───────────────────────────────────────────────────────────

function AddLeadDialog({ onClose }: { onClose: () => void }) {
  const createLead = useLeadCreate();
  const [form, setForm] = useState<LeadCreateRequest>({
    first_name: "", phone: "", source: "walk_in",
  });
  const [error, setError] = useState("");

  const set = (k: keyof LeadCreateRequest, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.first_name.trim()) { setError("First name is required."); return; }
    if (!form.phone.trim()) { setError("Phone number is required."); return; }
    setError("");
    try {
      await createLead.mutateAsync(form);
      onClose();
    } catch {
      setError("Failed to create lead. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          <h2 className="text-sm font-bold text-foreground">Add New Lead</h2>
          <button onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                First Name *
              </label>
              <input value={form.first_name} onChange={e => set("first_name", e.target.value)}
                placeholder="Rahul"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground"
                style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Last Name
              </label>
              <input value={form.last_name ?? ""} onChange={e => set("last_name", e.target.value)}
                placeholder="Sharma"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground"
                style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }} />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Phone *
            </label>
            <div className="flex items-center overflow-hidden rounded-xl"
              style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }}>
              <span className="px-3 py-2 text-sm text-muted-foreground flex-shrink-0 select-none"
                style={{ borderRight: "1px solid hsl(var(--border))" }}>+91</span>
              <input value={form.phone.replace(/^\+?91/, "")}
                onChange={e => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit number" maxLength={10} type="tel"
                className="flex-1 px-3 py-2 text-sm outline-none text-foreground placeholder:text-muted-foreground bg-transparent" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Email
            </label>
            <input value={form.email ?? ""} onChange={e => set("email", e.target.value)}
              placeholder="rahul@email.com" type="email"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground"
              style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }} />
          </div>

          {/* Source + Follow-up */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Source *
              </label>
              <select value={form.source} onChange={e => set("source", e.target.value as LeadSource)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none text-foreground"
                style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }}>
                {LEAD_SOURCES.map(s => (
                  <option key={s} value={s}>{SOURCE_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Follow-up Date
              </label>
              <input value={form.next_follow_up_date ?? ""} onChange={e => set("next_follow_up_date", e.target.value)}
                type="date"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none text-foreground"
                style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }} />
            </div>
          </div>

          {/* Fitness goals */}
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Fitness Goals
            </label>
            <input value={form.fitness_goals ?? ""} onChange={e => set("fitness_goals", e.target.value)}
              placeholder="Weight loss, muscle gain…"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground"
              style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }} />
          </div>

          {error && <p className="text-[11px] text-red-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold hover:opacity-80 transition-opacity"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={createLead.isPending}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
              {createLead.isPending ? "Creating…" : "Add Lead"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mark Lost Dialog ──────────────────────────────────────────────────────────

function MarkLostDialog({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const markLost = useLeadMarkLost();
  const [reason, setReason] = useState("price");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    try {
      await markLost.mutateAsync({ leadId, payload: { lost_reason: reason, lost_reason_details: details || undefined } });
      onClose();
    } catch {
      setError("Failed to mark lead as lost.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="rounded-2xl w-full max-w-sm shadow-2xl"
        style={{ background: "hsl(var(--card))", border: "1px solid rgba(239,68,68,0.3)" }}>
        <div className="flex items-center gap-2.5 px-5 py-4"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          <AlertTriangle className="h-4 w-4" style={{ color: "#ef4444" }} />
          <h3 className="text-sm font-bold text-foreground">Mark as Lost</h3>
          <button onClick={onClose} className="ml-auto h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Reason *
            </label>
            <select value={reason} onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none text-foreground capitalize"
              style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }}>
              {LOST_REASONS.map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Details
            </label>
            <textarea value={details} onChange={e => setDetails(e.target.value)}
              placeholder="Additional notes…" rows={2}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground resize-none"
              style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }} />
          </div>
          {error && <p className="text-[11px] text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 py-2 rounded-xl text-xs font-semibold hover:opacity-80"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={markLost.isPending}
              className="flex-1 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"
              style={{ background: "#ef4444" }}>
              {markLost.isPending ? "Saving…" : "Mark Lost"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Convert & Onboard Dialog ──────────────────────────────────────────────────

interface ConvertDialogProps {
  lead: LeadResponse;
  onClose: () => void;
  onConverted: () => void;
}

function ConvertDialog({ lead, onClose, onConverted }: ConvertDialogProps) {
  const onboard = useMemberOnboard();
  const convertLead = useLeadConvert();
  const { data: plansData } = useMembershipPlans({}, true);

  const activePlans = (plansData?.items ?? []).filter(p => p.status === "active");

  const today = new Date().toISOString().split("T")[0];
  const [planId, setPlanId] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [email, setEmail] = useState(lead.email ?? "");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "success">("form");

  const emailRequired = !lead.email;
  const isPending = onboard.isPending || convertLead.isPending;

  const handleConvert = async () => {
    if (!planId) { setError("Please select a membership plan."); return; }
    if (emailRequired && !email.trim()) { setError("Email is required to create a member account."); return; }
    setError("");
    try {
      // Step 1: Onboard the lead as a new member
      const member = await onboard.mutateAsync({
        first_name: lead.first_name,
        last_name: lead.last_name ?? undefined,
        phone: lead.phone,
        email: email.trim() || undefined,
        plan_id: planId,
        membership_start_date: startDate,
      });

      // Step 2: Mark the lead as converted, linking to the new participant
      await convertLead.mutateAsync({
        leadId: lead.id,
        payload: { participant_id: member.participant_id },
      });

      setStep("success");
    } catch (err: any) {
      const msg = err?.detail ?? err?.response?.data?.detail ?? "Conversion failed. Please try again.";
      setError(msg);
    }
  };

  if (step === "success") {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
        <div className="rounded-2xl w-full max-w-sm p-8 text-center shadow-2xl"
          style={{ background: "hsl(var(--card))", border: "1px solid rgba(16,185,129,0.3)" }}>
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(16,185,129,0.12)" }}>
            <CheckCircle className="h-7 w-7" style={{ color: "#10b981" }} />
          </div>
          <p className="text-base font-bold text-foreground mb-1">Lead Converted!</p>
          <p className="text-xs text-muted-foreground mb-5">
            {lead.first_name} is now an active member with a membership.
          </p>
          <button onClick={() => { onConverted(); onClose(); }}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>

        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 py-4"
          style={{ borderBottom: "1px solid hsl(var(--border))", background: "rgba(16,185,129,0.04)" }}>
          <div className="h-8 w-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(16,185,129,0.12)" }}>
            <UserCheck className="h-4 w-4" style={{ color: "#10b981" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Convert to Member</p>
            <p className="text-[11px] text-muted-foreground">
              {lead.first_name} {lead.last_name ?? ""} · {lead.phone}
            </p>
          </div>
          <button onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Info banner */}
          <div className="px-3 py-2.5 rounded-xl text-xs"
            style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
            <p className="text-muted-foreground leading-relaxed">
              This will create a member account for <span className="font-semibold text-foreground">{lead.first_name}</span> with the selected plan, then mark this lead as converted.
            </p>
          </div>

          {/* Email — required if lead has no email */}
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Email {emailRequired ? "*" : ""}
            </label>
            {emailRequired && (
              <p className="text-[10px] text-amber-400 mb-1.5">
                This lead has no email — required to create a member account.
              </p>
            )}
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="member@email.com"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground"
              style={{
                background: "hsl(var(--muted)/0.5)",
                border: `1px solid ${emailRequired && !email.trim() ? "rgba(245,158,11,0.4)" : "hsl(var(--border))"}`,
              }}
            />
          </div>

          {/* Plan selector */}
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              Membership Plan *
            </label>
            <div className="space-y-1.5 max-h-44 overflow-y-auto">
              {activePlans.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No active plans available</p>
              ) : activePlans.map(plan => {
                const selected = planId === plan.id;
                return (
                  <button key={plan.id} onClick={() => setPlanId(plan.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all"
                    style={selected
                      ? { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.4)" }
                      : { background: "hsl(var(--muted)/0.5)", border: "1px solid transparent" }
                    }>
                    <div className="flex items-center gap-2.5">
                      <div className="h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={selected
                          ? { borderColor: "#10b981", background: "#10b981" }
                          : { borderColor: "hsl(var(--border))" }
                        }>
                        {selected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{plan.name}</p>
                        {plan.duration_days ? (
                          <p className="text-[10px] text-muted-foreground">{plan.duration_days}d</p>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-xs font-bold flex-shrink-0"
                      style={{ color: selected ? "#10b981" : "hsl(var(--foreground))" }}>
                      ₹{Number(plan.price).toLocaleString("en-IN")}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start date */}
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Membership Start Date
            </label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none text-foreground"
              style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }} />
          </div>

          {error && (
            <p className="text-[11px] text-red-400 px-1">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold hover:opacity-80"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
              Cancel
            </button>
            <button onClick={handleConvert} disabled={isPending || !planId}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-40 hover:opacity-90 transition-all"
              style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
              {isPending ? "Converting…" : "Convert & Enroll"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Lead Detail Panel ─────────────────────────────────────────────────────────

function LeadPanel({ lead, onClose }: { lead: LeadResponse; onClose: () => void }) {
  const updateLead = useLeadUpdate();
  const addNote = useLeadAddNote();
  const deleteLead = useLeadDelete();
  const [tab, setTab] = useState<"details" | "notes">("details");
  const [noteText, setNoteText] = useState("");
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<LeadUpdateRequest>({});

  const cfg = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new;
  const notes = (lead.notes?.entries ?? []).slice().reverse();

  const startEdit = () => {
    setEditForm({
      first_name: lead.first_name,
      last_name: lead.last_name ?? undefined,
      phone: lead.phone,
      email: lead.email ?? undefined,
      source: lead.source,
      fitness_goals: lead.fitness_goals ?? undefined,
      next_follow_up_date: lead.next_follow_up_date ?? undefined,
    });
    setEditMode(true);
  };

  const [saveError, setSaveError] = useState("");

  const handleSaveEdit = async () => {
    setSaveError("");
    try {
      await updateLead.mutateAsync({ leadId: lead.id, payload: editForm });
      setEditMode(false);
      onClose();
    } catch {
      setSaveError("Failed to save. Please try again.");
    }
  };

  const setF = (k: keyof LeadUpdateRequest, v: string) =>
    setEditForm(f => ({ ...f, [k]: v || undefined }));

  const handleStatusChange = (newStatus: LeadStatus) => {
    setEditForm(f => ({ ...f, status: newStatus }));
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    await addNote.mutateAsync({ leadId: lead.id, payload: { note: noteText.trim() } });
    setNoteText("");
  };

  const handleDelete = async () => {
    await deleteLead.mutateAsync(lead.id);
    onClose();
  };

  const portalRoot = typeof document !== "undefined" ? document.body : null;
  if (!portalRoot) return null;

  return createPortal(
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>

        {/* Colored accent strip */}
        <div className="h-1 w-full flex-shrink-0"
          style={{ background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}88)` }} />

        {/* Panel header */}
        <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          <div className="h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: cfg.bg, color: cfg.color, boxShadow: `0 0 0 2px ${cfg.color}30` }}>
            {initials(lead.first_name, lead.last_name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">
              {lead.first_name} {lead.last_name ?? ""}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <StatusBadge status={lead.status} />
              <SourceBadge source={lead.source} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {lead.status !== "converted" && lead.status !== "lost" && (
              editMode
                ? <button onClick={() => setEditMode(false)}
                    className="h-7 px-2.5 rounded-lg text-xs font-semibold transition-colors hover:bg-muted"
                    style={{ color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}>
                    Cancel
                  </button>
                : <button onClick={startEdit}
                    className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                    title="Edit lead">
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
            )}
            <button onClick={onClose}
              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Status pipeline */}
        {lead.status !== "lost" && (
          <div className="px-5 py-3 flex-shrink-0"
            style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Pipeline
            </p>
            <div className="flex gap-1 flex-wrap">
              {STATUS_PIPELINE.map((s) => {
                const scfg = STATUS_CONFIG[s];
                const isActive = s === (editMode ? (editForm.status ?? lead.status) : lead.status);
                return editMode ? (
                  <button key={s} onClick={() => handleStatusChange(s)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all hover:opacity-90"
                    style={isActive
                      ? { background: scfg.bg, color: scfg.color, border: `1px solid ${scfg.color}50` }
                      : { background: "hsl(var(--muted)/0.4)", color: "hsl(var(--muted-foreground))", border: "1px solid transparent" }
                    }>
                    {scfg.label}
                  </button>
                ) : (
                  <span key={s}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold"
                    style={isActive
                      ? { background: scfg.bg, color: scfg.color, border: `1px solid ${scfg.color}50` }
                      : { background: "hsl(var(--muted)/0.2)", color: "hsl(var(--muted-foreground)/0.5)", border: "1px solid transparent" }
                    }>
                    {scfg.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-shrink-0" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          {(["details", "notes"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-xs font-semibold capitalize transition-colors relative"
              style={{ color: tab === t ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}>
              {t} {t === "notes" && notes.length > 0 && (
                <span className="ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
                  {notes.length}
                </span>
              )}
              {tab === t && (
                <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                  style={{ background: "#10b981" }} />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {editMode ? (
            <div className="p-5 space-y-3">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">First Name *</label>
                  <input value={editForm.first_name ?? ""} onChange={e => setF("first_name", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none text-foreground"
                    style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Last Name</label>
                  <input value={editForm.last_name ?? ""} onChange={e => setF("last_name", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none text-foreground"
                    style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }} />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Phone *</label>
                <div className="flex items-center overflow-hidden rounded-xl"
                  style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }}>
                  <span className="px-3 py-2 text-sm text-muted-foreground flex-shrink-0 select-none"
                    style={{ borderRight: "1px solid hsl(var(--border))" }}>+91</span>
                  <input value={(editForm.phone ?? "").replace(/^\+?91/, "")}
                    onChange={e => setF("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    type="tel" maxLength={10}
                    className="flex-1 px-3 py-2 text-sm outline-none text-foreground bg-transparent" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Email</label>
                <input value={editForm.email ?? ""} onChange={e => setF("email", e.target.value)}
                  type="email" placeholder="optional"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground"
                  style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }} />
              </div>

              {/* Source */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Source</label>
                <select value={editForm.source ?? lead.source} onChange={e => setF("source", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none text-foreground"
                  style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }}>
                  {LEAD_SOURCES.map(s => (
                    <option key={s} value={s}>{SOURCE_CONFIG[s].label}</option>
                  ))}
                </select>
              </div>

              {/* Follow-up date */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Follow-up Date</label>
                <input value={editForm.next_follow_up_date ?? ""} onChange={e => setF("next_follow_up_date", e.target.value)}
                  type="date"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none text-foreground"
                  style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }} />
              </div>

              {/* Fitness goals */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Fitness Goals</label>
                <input value={editForm.fitness_goals ?? ""} onChange={e => setF("fitness_goals", e.target.value)}
                  placeholder="Weight loss, muscle gain…"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground"
                  style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }} />
              </div>

              {saveError && (
                <p className="text-[11px] text-center" style={{ color: "#ef4444" }}>{saveError}</p>
              )}
              {/* Save button */}
              <button onClick={handleSaveEdit} disabled={updateLead.isPending || !editForm.first_name?.trim() || !editForm.phone?.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-40 transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                <Save className="h-3.5 w-3.5" />
                {updateLead.isPending ? "Saving…" : "Save Changes"}
              </button>
            </div>
          ) : tab === "details" ? (
            <div className="p-5 space-y-4">
              {/* Contact info */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Contact</p>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: "hsl(var(--muted)/0.2)" }}>
                  <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium text-foreground">{lead.phone}</p>
                  </div>
                </div>
                {lead.email && (
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: "hsl(var(--muted)/0.2)" }}>
                    <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground">Email</p>
                      <p className="text-sm font-medium text-foreground">{lead.email}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Follow-up */}
              {lead.next_follow_up_date && (
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                  style={{
                    background: isOverdue(lead.next_follow_up_date)
                      ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.08)",
                    border: `1px solid ${isOverdue(lead.next_follow_up_date) ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
                  }}>
                  <Calendar className="h-3.5 w-3.5 flex-shrink-0"
                    style={{ color: isOverdue(lead.next_follow_up_date) ? "#ef4444" : "#f59e0b" }} />
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      {isOverdue(lead.next_follow_up_date) ? "Overdue follow-up" : "Next follow-up"}
                    </p>
                    <p className="text-xs font-semibold" style={{
                      color: isOverdue(lead.next_follow_up_date) ? "#ef4444" : "#f59e0b",
                    }}>
                      {fmtDate(lead.next_follow_up_date)}
                    </p>
                  </div>
                </div>
              )}

              {/* Fitness goals */}
              {lead.fitness_goals && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Fitness Goals
                  </p>
                  <p className="text-sm text-foreground">{lead.fitness_goals}</p>
                </div>
              )}

              {/* Lost reason */}
              {lead.status === "lost" && lead.lost_reason && (
                <div className="px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#ef4444" }}>
                    Lost Reason
                  </p>
                  <p className="text-xs font-semibold text-foreground capitalize">{lead.lost_reason}</p>
                  {lead.lost_reason_details && (
                    <p className="text-[11px] text-muted-foreground mt-1">{lead.lost_reason_details}</p>
                  )}
                </div>
              )}

              {/* Timestamps */}
              <div className="space-y-1 pt-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Created</span>
                  <span className="text-[11px] text-foreground">{fmtDateTime(lead.created_at)}</span>
                </div>
                {lead.last_contact_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Last contact</span>
                    <span className="text-[11px] text-foreground">{fmtDate(lead.last_contact_date)}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-5 space-y-3">
              {notes.length === 0 ? (
                <div className="py-8 text-center">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-30" />
                  <p className="text-sm text-muted-foreground">No notes yet</p>
                </div>
              ) : (
                notes.map((n, i) => (
                  <div key={i} className="px-3 py-2.5 rounded-xl"
                    style={{ background: "hsl(var(--muted)/0.4)", border: "1px solid hsl(var(--border))" }}>
                    <p className="text-xs text-foreground leading-relaxed">{n.note}</p>
                    <p className="text-[10px] text-muted-foreground mt-1.5">{fmtDateTime(n.timestamp)}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Add note input (always visible at bottom) */}
        <div className="px-4 py-3 flex-shrink-0"
          style={{ borderTop: "1px solid hsl(var(--border))" }}>
          <div className="flex gap-2">
            <input
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleAddNote()}
              placeholder="Add a follow-up note…"
              className="flex-1 px-3 py-2 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground"
              style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }}
            />
            <button onClick={handleAddNote} disabled={!noteText.trim() || addNote.isPending}
              className="h-9 w-9 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all hover:opacity-90"
              style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
          style={{ borderTop: "1px solid hsl(var(--border))" }}>
          {/* Convert button — only show for active leads */}
          {lead.status !== "converted" && lead.status !== "lost" && (
            <button onClick={() => setShowConvertDialog(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
              <UserCheck className="h-3 w-3" />
              Convert to Member
            </button>
          )}
          {lead.status !== "converted" && lead.status !== "lost" && (
            <button onClick={() => setShowLostDialog(true)}
              className="h-9 w-9 flex items-center justify-center rounded-xl transition-all hover:opacity-90 flex-shrink-0"
              style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertTriangle className="h-3.5 w-3.5" />
            </button>
          )}
          {lead.status === "lost" && (
            <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold"
              style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
              <AlertTriangle className="h-3 w-3" />
              Lost · {lead.lost_reason ?? ""}
            </div>
          )}
          {lead.status === "converted" && (
            <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold"
              style={{ background: "rgba(16,185,129,0.08)", color: "#10b981" }}>
              <CheckCircle className="h-3 w-3" />
              Converted to Member
            </div>
          )}
          {showDeleteConfirm ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Delete?</span>
              <button onClick={handleDelete} disabled={deleteLead.isPending}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white disabled:opacity-50"
                style={{ background: "#ef4444" }}>
                Yes
              </button>
              <button onClick={() => setShowDeleteConfirm(false)}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
                style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                No
              </button>
            </div>
          ) : (
            <button onClick={() => setShowDeleteConfirm(true)}
              className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0">
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
      </div>

      {showLostDialog && (
        <MarkLostDialog leadId={lead.id} onClose={() => setShowLostDialog(false)} />
      )}
      {showConvertDialog && (
        <ConvertDialog
          lead={lead}
          onClose={() => setShowConvertDialog(false)}
          onConverted={onClose}
        />
      )}
    </>,
    portalRoot
  );
}

// ── Lead Row ──────────────────────────────────────────────────────────────────

function LeadRow({ lead, onClick }: { lead: LeadResponse; onClick: () => void }) {
  const [showLostLocal, setShowLostLocal] = useState(false);
  const cfg = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new;
  const srcCfg = SOURCE_CONFIG[lead.source] ?? SOURCE_CONFIG.other;
  const SrcIcon = SOURCE_ICONS[lead.source] ?? HelpCircle;
  const badge = getFollowUpBadge(lead.next_follow_up_date);

  return (
    <>
      <tr onClick={onClick}
        className="cursor-pointer hover:bg-white/[0.03] transition-colors"
        style={{ borderBottom: "1px solid hsl(var(--border)/0.5)" }}>

        {/* Name */}
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: cfg.bg, color: cfg.color }}>
              {initials(lead.first_name, lead.last_name)}
            </div>
            <p className="text-sm font-semibold text-foreground truncate">
              {lead.first_name} {lead.last_name ?? ""}
            </p>
          </div>
        </td>

        {/* Phone */}
        <td className="px-4 py-3.5 hidden sm:table-cell">
          <span className="text-[11px] text-foreground">{lead.phone}</span>
        </td>

        {/* Email */}
        <td className="px-4 py-3.5 hidden md:table-cell">
          <span className="text-[11px] text-foreground">{lead.email ?? "—"}</span>
        </td>

        {/* Source */}
        <td className="px-4 py-3.5 hidden sm:table-cell">
          <div className="flex items-center gap-1.5">
            <SrcIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: srcCfg.color }} />
            <span className="text-xs text-muted-foreground">{srcCfg.label}</span>
          </div>
        </td>

        {/* Status */}
        <td className="px-4 py-3.5">
          <StatusBadge status={lead.status} />
        </td>

        {/* Follow-up */}
        <td className="px-4 py-3 hidden md:table-cell">
          {lead.next_follow_up_date ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground">{fmtDate(lead.next_follow_up_date)}</span>
              {badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: badge.bg, color: badge.color }}>
                  {badge.text}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground">—</span>
          )}
        </td>

        {/* Actions */}
        <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-0.5">
            <button onClick={() => onClick()}
              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
              style={{ color: "hsl(var(--muted-foreground))" }}
              title="View details">
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onClick()}
              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
              style={{ color: "hsl(var(--muted-foreground))" }}
              title="Add note">
              <MessageSquare className="h-3.5 w-3.5" />
            </button>
            {lead.status !== "converted" && lead.status !== "lost" && (
              <button onClick={e => { e.stopPropagation(); setShowLostLocal(true); }}
                className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
                style={{ color: "#ef4444" }}
                title="Mark lost">
                <AlertTriangle className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </td>
      </tr>
      {showLostLocal && typeof document !== "undefined" && createPortal(
        <MarkLostDialog leadId={lead.id} onClose={() => setShowLostLocal(false)} />,
        document.body
      )}
    </>
  );
}

// ── Lead Card (grid view) ─────────────────────────────────────────────────────

function LeadCard({ lead, onClick }: { lead: LeadResponse; onClick: () => void }) {
  const cfg = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new;
  const overdue = isOverdue(lead.next_follow_up_date);

  return (
    <div
      className="rounded-2xl p-4 cursor-pointer transition-all hover:translate-y-[-1px]"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: cfg.bg, color: cfg.color }}>
            {initials(lead.first_name, lead.last_name)}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">
              {lead.first_name} {lead.last_name ?? ""}
            </p>
            <StatusBadge status={lead.status} />
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
      </div>

      {/* Source + Follow-up rows */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Source</span>
          <SourceBadge source={lead.source} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Follow-up</span>
          {lead.next_follow_up_date ? (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 flex-shrink-0" style={{ color: overdue ? "#ef4444" : "#f59e0b" }} />
              <span className="text-[11px] font-semibold" style={{ color: overdue ? "#ef4444" : "#f59e0b" }}>
                {fmtDate(lead.next_follow_up_date)}
              </span>
              {overdue && (
                <span className="text-[9px] font-bold px-1 py-0.5 rounded"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                  Overdue
                </span>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground">—</span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
        <a href={`tel:${lead.phone}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity"
          style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
          <Phone className="h-3 w-3" />
          Call
        </a>
        {lead.email ? (
          <a href={`mailto:${lead.email}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity"
            style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}>
            <Mail className="h-3 w-3" />
            Email
          </a>
        ) : (
          <button onClick={() => onClick()}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity"
            style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.2)" }}>
            <MessageSquare className="h-3 w-3" />
            Notes
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const STATUS_TABS: { key: LeadStatus | ""; label: string }[] = [
  { key: "", label: "All" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "scheduled_tour", label: "Tour" },
  { key: "tour_completed", label: "Tour Done" },
  { key: "trial_started", label: "Trial" },
  { key: "converted", label: "Converted" },
  { key: "lost", label: "Lost" },
];  

const LEADS_PAGE_SIZE = 10;

export default function LeadsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadResponse | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useLeads({
    status: statusFilter || undefined,
    source: sourceFilter || undefined,
    search: debouncedSearch || undefined,
    page,
    per_page: LEADS_PAGE_SIZE,
  });

  const { data: stats } = useLeadsStats();

  const leads = data?.leads ?? [];

  // Keep selected lead in sync with updated data
  const panelLead = selectedLead
    ? (leads.find(l => l.id === selectedLead.id) ?? selectedLead)
    : null;

  // Conversion by source (computed from current page leads)
  const conversionStats = [
    { key: "web_form" as LeadSource,    label: "Web" },
    { key: "referral" as LeadSource,    label: "Referral" },
    { key: "social_media" as LeadSource, label: "Social" },
  ].map(s => {
    const sl = leads.filter(l => l.source === s.key);
    return { ...s, rate: sl.length > 0 ? Math.round(sl.filter(l => l.status === "converted").length / sl.length * 100) : null };
  }).filter(s => s.rate !== null);

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight gradient-text">Leads</h1>
            {(stats?.total ?? 0) > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
                {stats!.total} TOTAL
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your sales pipeline and track conversion metrics from all sources
          </p>
        </div>
        <button onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 shadow-lg flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 4px 14px rgba(16,185,129,0.3)" }}>
          <Plus className="h-4 w-4" />
          New Lead
        </button>
      </div>

      {/* ── Stat Cards + Conversion ─────────────────────────────────────── */}
      {(() => {
        const total = stats?.total ?? 0;
        const newCount = stats?.new_count ?? 0;
        const converted = stats?.converted_count ?? 0;
        const overdue = stats?.overdue_count ?? 0;
        const inProgress = Math.max(0, total - newCount - converted);
        const convPct = total > 0 ? Math.round((converted / total) * 100) : null;
        const newPct  = total > 0 ? Math.round((newCount  / total) * 100) : null;
        const hasOverdue = overdue > 0;

        return (
          <div className="grid grid-cols-5 gap-3">

            {/* Total Leads */}
            <div className="rounded-2xl p-3.5" style={{ background: "hsl(var(--card))", border: "1px solid rgba(59,130,246,0.25)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(59,130,246,0.12)" }}>
                  <Users className="h-4 w-4" style={{ color: "#3b82f6" }} />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>All</span>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
              <p className="text-2xl font-bold" style={{ color: "#3b82f6" }}>{total}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {total > 0 ? `${newCount} new · ${inProgress} in progress` : "No leads yet"}
              </p>
            </div>

            {/* New */}
            <div className="rounded-2xl p-3.5" style={{ background: "hsl(var(--card))", border: "1px solid rgba(139,92,246,0.25)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(139,92,246,0.12)" }}>
                  <UserPlus className="h-4 w-4" style={{ color: "#8b5cf6" }} />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>
                  {newPct !== null ? `${newPct}%` : "—"}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">New</p>
              <p className="text-2xl font-bold" style={{ color: "#8b5cf6" }}>{newCount}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Awaiting first contact</p>
            </div>

            {/* Follow-ups */}
            <div className="rounded-2xl p-3.5" style={{ background: "hsl(var(--card))", border: `1px solid ${hasOverdue ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.25)"}` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: hasOverdue ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)" }}>
                  <Calendar className="h-4 w-4" style={{ color: hasOverdue ? "#ef4444" : "#f59e0b" }} />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={hasOverdue
                    ? { background: "rgba(239,68,68,0.1)", color: "#ef4444" }
                    : { background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
                  {hasOverdue ? "Overdue" : "On track"}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Follow-ups</p>
              <p className="text-2xl font-bold" style={{ color: hasOverdue ? "#ef4444" : "#f59e0b" }}>{overdue}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{hasOverdue ? "Need immediate action" : "All follow-ups on schedule"}</p>
            </div>

            {/* Converted */}
            <div className="rounded-2xl p-3.5" style={{ background: "hsl(var(--card))", border: "1px solid rgba(16,185,129,0.25)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(16,185,129,0.12)" }}>
                  <CheckCircle className="h-4 w-4" style={{ color: "#10b981" }} />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                  {convPct !== null ? `${convPct}%` : "—"}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Converted</p>
              <p className="text-2xl font-bold" style={{ color: "#10b981" }}>{converted}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{converted === 1 ? "1 member joined" : `${converted} members joined`}</p>
            </div>

            {/* Conversion Rate by Source */}
            <div className="rounded-2xl p-3.5" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">Conversion Rate</p>
              {conversionStats.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {conversionStats.map(s => {
                    const SrcIcon = SOURCE_ICONS[s.key] ?? HelpCircle;
                    const srcCfg = SOURCE_CONFIG[s.key];
                    return (
                      <div key={s.key} className="flex items-center gap-2">
                        <SrcIcon className="h-3 w-3 flex-shrink-0" style={{ color: srcCfg.color }} />
                        <span className="text-[10px] text-muted-foreground flex-1 truncate">{s.label}</span>
                        <span className="text-[11px] font-bold" style={{ color: "#10b981" }}>{s.rate}%</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground">No data yet</p>
              )}
            </div>

          </div>
        );
      })()}

      {/* ── Filters + Search ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterChip
          icon={Filter}
          label="Status"
          value={statusFilter ? (STATUS_CONFIG[statusFilter as LeadStatus]?.label ?? statusFilter) : "All"}
          options={[{ value: "", label: "All" }, ...STATUS_TABS.filter(t => t.key).map(t => ({ value: t.key, label: t.label }))]}
          onChange={v => { setStatusFilter(v); setPage(1); }}
        />
        <FilterChip
          icon={Globe}
          label="Source"
          value={sourceFilter ? (SOURCE_CONFIG[sourceFilter as LeadSource]?.label ?? sourceFilter) : "Any"}
          options={[{ value: "", label: "Any" }, ...LEAD_SOURCES.map(s => ({ value: s, label: SOURCE_CONFIG[s].label }))]}
          onChange={v => { setSourceFilter(v); setPage(1); }}
        />

        {/* View toggle */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-full flex-shrink-0"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <button onClick={() => setViewMode("table")}
            className="h-7 w-7 rounded-full flex items-center justify-center transition-all"
            style={viewMode === "table" ? { background: "rgba(16,185,129,0.12)", color: "#10b981" } : { color: "hsl(var(--muted-foreground))" }}>
            <List className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setViewMode("grid")}
            className="h-7 w-7 rounded-full flex items-center justify-center transition-all"
            style={viewMode === "grid" ? { background: "rgba(16,185,129,0.12)", color: "#10b981" } : { color: "hsl(var(--muted-foreground))" }}>
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search leads by name, phone, email…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-full text-sm outline-none text-foreground placeholder:text-muted-foreground"
            style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
        </div>
      </div>

      {/* ── Lead List ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="rounded-2xl py-12 text-center text-xs text-muted-foreground"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          Loading…
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-2xl py-14 text-center"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: "rgba(16,185,129,0.08)" }}>
            <UserPlus className="h-6 w-6" style={{ color: "#10b981" }} />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">
            {search || statusFilter || sourceFilter ? "No leads match your filters" : "No leads yet"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {search || statusFilter || sourceFilter ? "Try changing the filters" : "Add your first lead to start tracking prospects"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {leads.map(lead => (
            <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
          ))}
          <div onClick={() => setShowAddDialog(true)}
            className="rounded-2xl p-4 cursor-pointer transition-all hover:translate-y-[-1px] flex items-center justify-center min-h-[168px]"
            style={{ background: "hsl(var(--card))", border: "1px dashed rgba(16,185,129,0.3)" }}>
            <div className="text-center">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center mx-auto mb-2"
                style={{ background: "rgba(16,185,129,0.08)" }}>
                <UserPlus className="h-5 w-5" style={{ color: "#10b981" }} />
              </div>
              <p className="text-sm font-semibold text-foreground">Add New Lead</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Click to add</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ borderBottom: "1px solid hsl(var(--border))", background: "hsl(var(--muted)/0.3)" }}>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Phone</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Email</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Source</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Status</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Next Follow-up</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <LeadRow key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {data && leads.length > 0 && data.total_pages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min((page - 1) * LEADS_PAGE_SIZE + 1, data.total)}–{Math.min(page * LEADS_PAGE_SIZE, data.total)} of {data.total} lead{data.total !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-1">{page} / {data.total_pages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(data.total_pages, p + 1))} disabled={page >= data.total_pages}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Dialogs & Panels ───────────────────────────────────────────── */}
      {showAddDialog && <AddLeadDialog onClose={() => setShowAddDialog(false)} />}
      {panelLead && <LeadPanel lead={panelLead} onClose={() => setSelectedLead(null)} />}
    </div>
  );
}
