"use client";

import { useState } from "react";
import {
  Building2,
  MapPin,
  Edit2,
  Save,
  X,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Globe,
  Hash,
} from "lucide-react";
import { useCurrentGym, useGymUpdate } from "@/lib/hooks/use-gym";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Alert ─────────────────────────────────────────────────────────────────────

function Alert({ type, message }: { type: "success" | "error"; message: string }) {
  const ok = type === "success";
  return (
    <div
      className="flex items-start gap-2.5 p-3 rounded-xl text-[12px] font-medium"
      style={
        ok
          ? { background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid rgba(16,185,129,0.15)" }
          : { background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }
      }
    >
      {ok
        ? <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
        : <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
      }
      <span>{message}</span>
    </div>
  );
}

// ── Field Input ───────────────────────────────────────────────────────────────

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground"
        style={{ background: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border))" }}
      />
    </div>
  );
}

// ── Info Row ──────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
  color = "#10b981",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      className="flex items-center gap-3.5 px-4 py-3 rounded-xl"
      style={{ background: "hsl(var(--muted)/0.2)" }}
    >
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18` }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          {label}
        </p>
        <p className="text-[13px] font-semibold text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  iconColor,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <div
        className="flex items-center gap-3 px-5 py-3.5"
        style={{ borderBottom: "1px solid hsl(var(--border))" }}
      >
        <div
          className="h-7 w-7 rounded-lg flex items-center justify-center"
          style={{ background: `${iconColor}18` }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: iconColor }} />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{title}</p>
          {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Gym Info Section ──────────────────────────────────────────────────────────

function GymInfoSection() {
  const { data: gym, isLoading } = useCurrentGym();
  const updateMutation = useGymUpdate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
  });
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const startEdit = () => {
    setForm({
      name: gym?.name ?? "",
      address: gym?.address ?? "",
      city: gym?.city ?? "",
      state: gym?.state ?? "",
      country: gym?.country ?? "",
      pincode: gym?.pincode?.toString() ?? "",
    });
    setFeedback(null);
    setEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      await updateMutation.mutateAsync({
        name: form.name.trim(),
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        country: form.country || undefined,
        pincode: form.pincode ? parseInt(form.pincode) : undefined,
      });
      setEditing(false);
      setFeedback({ type: "success", msg: "Gym details updated successfully." });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setFeedback({ type: "error", msg: e?.response?.data?.detail ?? "Failed to update gym details." });
    }
  };

  if (isLoading) {
    return (
      <div className="py-10 text-center text-xs text-muted-foreground">Loading…</div>
    );
  }

  const location = [gym?.address, gym?.city, gym?.state, gym?.country]
    .filter(Boolean)
    .join(", ") || "—";

  return (
    <>
      {/* ── Hero Banner ──────────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden mb-5"
        style={{ border: "1px solid hsl(var(--border))" }}
      >
        <div
          className="h-24"
          style={{
            background:
              "linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(59,130,246,0.2) 50%, rgba(139,92,246,0.15) 100%)",
          }}
        />
        <div className="px-5 pb-5">
          <div className="-mt-9 mb-4 flex items-end justify-between">
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center text-xl font-bold shadow-xl flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #10b981, #3b82f6)",
                color: "#fff",
                border: "3px solid hsl(var(--card))",
              }}
            >
              <Building2 className="h-7 w-7" />
            </div>
            {!editing && (
              <button
                onClick={startEdit}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all hover:opacity-90"
                style={{
                  background: "rgba(16,185,129,0.1)",
                  color: "#10b981",
                  border: "1px solid rgba(16,185,129,0.2)",
                }}
              >
                <Edit2 className="h-3.5 w-3.5" />
                Edit Details
              </button>
            )}
          </div>
          <h2 className="text-xl font-bold text-foreground">{gym?.name}</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">{location}</p>
        </div>
      </div>

      {/* ── Read View ────────────────────────────────────────────────── */}
      {!editing && (
        <SectionCard icon={MapPin} title="Location Details" iconColor="#3b82f6">
          <div className="space-y-2">
            <InfoRow icon={MapPin} label="Address" value={gym?.address ?? "—"} color="#3b82f6" />
            <div className="grid grid-cols-2 gap-2">
              <InfoRow icon={Globe} label="City" value={gym?.city ?? "—"} color="#8b5cf6" />
              <InfoRow icon={Globe} label="State" value={gym?.state ?? "—"} color="#8b5cf6" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <InfoRow icon={Globe} label="Country" value={gym?.country ?? "—"} color="#10b981" />
              <InfoRow icon={Hash} label="Pincode" value={gym?.pincode?.toString() ?? "—"} color="#f59e0b" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <InfoRow icon={Calendar} label="Created" value={fmtDate(gym?.created_at)} color="#6b7280" />
              <InfoRow icon={Calendar} label="Updated" value={fmtDate(gym?.updated_at)} color="#6b7280" />
            </div>
            {feedback && <Alert type={feedback.type} message={feedback.msg} />}
          </div>
        </SectionCard>
      )}

      {/* ── Edit Form ────────────────────────────────────────────────── */}
      {editing && (
        <SectionCard icon={Edit2} title="Edit Gym Details" iconColor="#10b981">
          <form onSubmit={handleSave} className="space-y-4">
            <FieldInput
              label="Gym Name *"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="e.g. FitZone Gym"
            />
            <FieldInput
              label="Address"
              value={form.address}
              onChange={(v) => setForm((f) => ({ ...f, address: v }))}
              placeholder="Street address"
            />
            <div className="grid grid-cols-2 gap-3">
              <FieldInput
                label="City"
                value={form.city}
                onChange={(v) => setForm((f) => ({ ...f, city: v }))}
                placeholder="e.g. Mumbai"
              />
              <FieldInput
                label="State"
                value={form.state}
                onChange={(v) => setForm((f) => ({ ...f, state: v }))}
                placeholder="e.g. Maharashtra"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldInput
                label="Country"
                value={form.country}
                onChange={(v) => setForm((f) => ({ ...f, country: v }))}
                placeholder="e.g. India"
              />
              <FieldInput
                label="Pincode"
                value={form.pincode}
                onChange={(v) => setForm((f) => ({ ...f, pincode: v }))}
                placeholder="6-digit PIN"
                type="number"
              />
            </div>
            {feedback && <Alert type={feedback.type} message={feedback.msg} />}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={updateMutation.isPending || !form.name.trim()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
              >
                <Save className="h-3.5 w-3.5" />
                {updateMutation.isPending ? "Saving…" : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setFeedback(null); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold"
                style={{ background: "hsl(var(--muted)/0.4)", color: "hsl(var(--muted-foreground))" }}
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </button>
            </div>
          </form>
        </SectionCard>
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function GymSettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-base font-bold text-foreground leading-tight">Gym Settings</h1>
        <p className="text-[11px] text-muted-foreground">
          Manage your gym&apos;s details and location
        </p>
      </div>
      <GymInfoSection />
    </div>
  );
}
