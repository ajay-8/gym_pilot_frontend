"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { useMemberDashboard } from "@/lib/hooks/use-member-portal";
import { useMyHealthRecords, useMyHealthRecordsUpdate } from "@/lib/hooks/use-members";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { CreditCard, Heart, Pencil, Save, X } from "lucide-react";
import Link from "next/link";

// ── Helpers ───────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 py-3" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

// ── Health Records Section ────────────────────────────────────────────────────

function HealthRecordsSection() {
  const { data: health, isLoading } = useMyHealthRecords();
  const update = useMyHealthRecordsUpdate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    emergency_name: "",
    emergency_phone: "",
    emergency_relationship: "",
    injuries_limitations: "",
    medical_notes: "",
  });
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setForm({
      emergency_name: health?.emergency_contact?.name ?? "",
      emergency_phone: health?.emergency_contact?.phone ?? "",
      emergency_relationship: health?.emergency_contact?.relationship ?? "",
      injuries_limitations: health?.injuries_limitations ?? "",
      medical_notes: (health?.medical_conditions as any)?.notes ?? "",
    });
    setError(null);
    setEditing(true);
  }

  async function handleSave() {
    setError(null);
    update.mutate(
      {
        emergency_contact: {
          name: form.emergency_name,
          phone: form.emergency_phone,
          relationship: form.emergency_relationship,
        },
        injuries_limitations: form.injuries_limitations || undefined,
        medical_conditions: form.medical_notes ? [{ notes: form.medical_notes }] : undefined,
        fitness_goals: health?.fitness_goals ?? undefined,
      },
      {
        onSuccess: () => setEditing(false),
        onError: () => setError("Failed to save. Please try again."),
      }
    );
  }

  const ec = health?.emergency_contact as any;
  const inputClass = "w-full px-3 py-2 rounded-xl text-sm text-foreground outline-none bg-transparent";
  const inputStyle = { background: "hsl(var(--muted)/0.4)", border: "1px solid hsl(var(--border))" };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4" style={{ color: "#ef4444" }} />
            <CardTitle className="text-sm font-semibold text-foreground">Health & Safety</CardTitle>
          </div>
          {!editing && (
            <button onClick={startEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ background: "hsl(var(--muted)/0.5)", color: "hsl(var(--muted-foreground))" }}>
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <p className="text-xs text-muted-foreground py-4">Loading…</p>
        ) : editing ? (
          <div className="space-y-4">
            {/* Emergency Contact */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Emergency Contact</p>
              <div className="space-y-2">
                <input className={inputClass} style={inputStyle} placeholder="Full name"
                  value={form.emergency_name} onChange={e => setForm(f => ({ ...f, emergency_name: e.target.value }))} />
                <div className="flex">
                  <span className="flex items-center px-3 rounded-l-lg text-sm text-muted-foreground"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRight: "none" }}>+91</span>
                  <input className={inputClass} style={{ ...inputStyle, borderRadius: "0 8px 8px 0" }} placeholder="10-digit phone"
                    value={form.emergency_phone.replace(/^\+91/, "")}
                    onChange={e => setForm(f => ({ ...f, emergency_phone: `+91${e.target.value.replace(/\D/g, "").slice(0, 10)}` }))} />
                </div>
                <input className={inputClass} style={inputStyle} placeholder="Relationship (e.g. Spouse, Parent)"
                  value={form.emergency_relationship} onChange={e => setForm(f => ({ ...f, emergency_relationship: e.target.value }))} />
              </div>
            </div>
            {/* Medical */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Medical Conditions / Allergies</p>
              <textarea rows={3} className={inputClass} style={{ ...inputStyle, resize: "none" }}
                placeholder="List any conditions, allergies, or medications relevant to your training…"
                value={form.medical_notes} onChange={e => setForm(f => ({ ...f, medical_notes: e.target.value }))} />
            </div>
            {/* Injuries */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Injuries / Physical Limitations</p>
              <textarea rows={3} className={inputClass} style={{ ...inputStyle, resize: "none" }}
                placeholder="Any current injuries or physical limitations your trainer should know about…"
                value={form.injuries_limitations} onChange={e => setForm(f => ({ ...f, injuries_limitations: e.target.value }))} />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={handleSave} disabled={update.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                <Save className="h-3 w-3" />
                {update.isPending ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-opacity hover:opacity-80"
                style={{ background: "hsl(var(--muted)/0.5)", color: "hsl(var(--muted-foreground))" }}>
                <X className="h-3 w-3" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Emergency Contact */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Emergency Contact</p>
              {ec?.name ? (
                <div className="rounded-xl px-4 py-3 space-y-1" style={{ background: "hsl(var(--muted)/0.2)" }}>
                  <p className="text-sm font-semibold text-foreground">{ec.name}</p>
                  {ec.relationship && <p className="text-xs text-muted-foreground">{ec.relationship}</p>}
                  {ec.phone && <p className="text-xs text-muted-foreground">{ec.phone}</p>}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Not set — click Edit to add an emergency contact.</p>
              )}
            </div>
            {/* Medical */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Medical / Allergies</p>
              <p className="text-sm text-foreground">
                {(health?.medical_conditions as any)?.notes || <span className="text-muted-foreground italic">None recorded</span>}
              </p>
            </div>
            {/* Injuries */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Injuries / Limitations</p>
              <p className="text-sm text-foreground">
                {health?.injuries_limitations || <span className="text-muted-foreground italic">None recorded</span>}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, gymContext } = useAuth();
  const { data: dashData, isLoading } = useMemberDashboard();

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ");
  const membership = dashData?.active_membership;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ── Left: Profile + Health ─────────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center flex-shrink-0 text-white text-2xl font-bold"
                style={{ background: "linear-gradient(135deg, #3b82f6, #10b981)" }}
              >
                {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "M"}
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-foreground">
                  {fullName || "Member"}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {gymContext?.gym_name}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              <InfoRow label="Full Name" value={fullName || undefined} />
              <InfoRow label="Email Address" value={user?.email} />
              <div
                className="flex flex-col gap-0.5 py-3"
                style={{ borderBottom: "1px solid hsl(var(--border))" }}
              >
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="text-sm font-medium text-foreground capitalize">
                  {gymContext?.roles.join(", ") || "Member"}
                </p>
              </div>
              <InfoRow label="Gym" value={gymContext?.gym_name} />
            </div>
            <p className="text-xs text-muted-foreground mt-4 pt-3" style={{ borderTop: "1px solid hsl(var(--border))" }}>
              To update your profile details, please contact your gym admin.
            </p>
          </CardContent>
        </Card>

        <HealthRecordsSection />
      </div>

      {/* ── Sidebar: Membership + Quick Links ─────────────────────────── */}
      <div className="space-y-4">
        <Card style={{ border: "1px solid rgba(59,130,246,0.2)", background: "rgba(59,130,246,0.04)" }}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" style={{ color: "#3b82f6" }} />
              <CardTitle className="text-sm font-semibold text-foreground">Membership</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : membership ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium text-foreground">{membership.plan?.name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span
                    className="font-semibold capitalize"
                    style={{ color: membership.status === "active" ? "#10b981" : "#ef4444" }}
                  >
                    {membership.status}
                  </span>
                </div>
                {membership.end_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires</span>
                    <span className="font-medium text-foreground">
                      {format(parseISO(membership.end_date), "dd MMM yyyy")}
                    </span>
                  </div>
                )}
                <Link
                  href="/member/membership"
                  className="block mt-3 text-xs text-center py-1.5 rounded-md transition-colors"
                  style={{ background: "rgba(59,130,246,0.1)", color: "#93c5fd" }}
                >
                  View full history →
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground">No active membership.</p>
                <Link
                  href="/member/membership"
                  className="block mt-3 text-xs text-center py-1.5 rounded-md"
                  style={{ background: "rgba(59,130,246,0.1)", color: "#93c5fd" }}
                >
                  View membership →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1">
            {[
              { href: "/member/sessions",   label: "My PT Sessions" },
              { href: "/member/payments",   label: "Payment History" },
              { href: "/select-gym",        label: "Switch Gym" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
