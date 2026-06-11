"use client";

import { useState } from "react";
import {
  Mail,
  Phone,
  Lock,
  CheckCircle,
  AlertTriangle,
  Edit2,
  X,
  Save,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { useProfile, useProfileUpdate, useChangePassword } from "@/lib/hooks/use-profile";
import { fmtDate, initials } from "@/lib/utils/formatting";

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
      {ok ? <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />}
      <span>{message}</span>
    </div>
  );
}

// ── Password Input ────────────────────────────────────────────────────────────

function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground"
          style={{ background: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border))" }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

// ── Text Input ────────────────────────────────────────────────────────────────

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground"
        style={{ background: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border))", colorScheme: "dark" }}
      />
    </div>
  );
}

// ── Strength Bar ──────────────────────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const label = ["Too weak", "Weak", "Fair", "Strong", "Very strong"][score];
  const color = ["#ef4444", "#ef4444", "#f59e0b", "#10b981", "#10b981"][score];
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all"
            style={{ background: i < score ? color : "hsl(var(--border))" }}
          />
        ))}
      </div>
      <p className="text-[10px] font-medium" style={{ color }}>
        {label}
      </p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const updateMutation = useProfileUpdate();
  const changePwMutation = useChangePassword();

  // Profile edit state
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "" });
  const [profileFeedback, setProfileFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // Password state
  const [pwForm, setPwForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [pwFeedback, setPwFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(
    null
  );

  const fullName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Unnamed User";
  const initStr = initials(profile?.first_name, profile?.last_name);

  const startEdit = () => {
    setForm({
      first_name: profile?.first_name ?? "",
      last_name: profile?.last_name ?? "",
      phone: profile?.phone ?? "",
    });
    setProfileFeedback(null);
    setEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        first_name: form.first_name || null,
        last_name: form.last_name || null,
        phone: form.phone || null,
      });
      setEditing(false);
      setProfileFeedback({ type: "success", msg: "Profile updated successfully." });
      setTimeout(() => setProfileFeedback(null), 4000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setProfileFeedback({
        type: "error",
        msg: e?.response?.data?.detail ?? "Failed to update profile.",
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwFeedback({ type: "error", msg: "New passwords do not match." });
      return;
    }
    if (pwForm.new_password.length < 8) {
      setPwFeedback({ type: "error", msg: "Password must be at least 8 characters." });
      return;
    }
    try {
      await changePwMutation.mutateAsync({
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
      setPwFeedback({ type: "success", msg: "Password changed successfully." });
      setTimeout(() => setPwFeedback(null), 4000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setPwFeedback({
        type: "error",
        msg: e?.response?.data?.detail ?? "Failed to change password.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* ── Hero Card ──────────────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ border: "1px solid hsl(var(--border))" }}
      >
        {/* Gradient banner */}
        <div
          className="h-28"
          style={{
            background:
              "linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(139,92,246,0.25) 50%, rgba(59,130,246,0.15) 100%)",
          }}
        />

        {/* Avatar + name */}
        <div className="px-6 pb-5">
          {/* Avatar overlapping banner */}
          <div className="-mt-10 mb-4 flex items-end justify-between">
            <div
              className="h-20 w-20 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-xl flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #10b981, #8b5cf6)",
                color: "#fff",
                border: "3px solid hsl(var(--card))",
              }}
            >
              {initStr}
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
                Edit Profile
              </button>
            )}
          </div>

          {/* Name + email */}
          <div className="space-y-1 mb-5">
            <h2 className="text-xl font-bold text-foreground">{fullName}</h2>
            <p className="text-[13px] text-muted-foreground">{profile?.email}</p>
          </div>

          {/* Meta stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                icon: Calendar,
                label: "Joined",
                value: fmtDate(profile?.created_at),
                color: "#10b981",
              },
              {
                icon: Clock,
                label: "Last Login",
                value: fmtDate(profile?.last_login_at),
                color: "#8b5cf6",
              },
              {
                icon: ShieldCheck,
                label: "Status",
                value: profile?.status ?? "—",
                color: "#3b82f6",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl px-3 py-2.5"
                style={{ background: "hsl(var(--muted)/0.25)" }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <s.icon className="h-3 w-3" style={{ color: s.color }} />
                  <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
                </div>
                <p className="text-[12px] font-semibold text-foreground capitalize">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Contact Info / Edit Form ────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        <div
          className="px-5 py-3.5 flex items-center gap-3"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}
        >
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(16,185,129,0.12)" }}
          >
            <Mail className="h-3.5 w-3.5" style={{ color: "#10b981" }} />
          </div>
          <p className="text-sm font-bold text-foreground">
            {editing ? "Edit Details" : "Contact Information"}
          </p>
        </div>

        <div className="p-5">
          {!editing ? (
            <div className="space-y-3">
              <ContactRow icon={Mail} label="Email" value={profile?.email ?? "—"} />
              <ContactRow
                icon={Phone}
                label="Phone"
                value={profile?.phone ?? "Not set"}
                muted={!profile?.phone}
              />
              {profileFeedback && <Alert type={profileFeedback.type} message={profileFeedback.msg} />}
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  label="First Name"
                  value={form.first_name}
                  onChange={(v) => setForm((f) => ({ ...f, first_name: v }))}
                  placeholder="John"
                />
                <TextInput
                  label="Last Name"
                  value={form.last_name}
                  onChange={(v) => setForm((f) => ({ ...f, last_name: v }))}
                  placeholder="Doe"
                />
              </div>
              <TextInput
                label="Phone"
                value={form.phone}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                placeholder="+91 9876543210"
              />

              {/* Email read-only notice */}
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] text-muted-foreground"
                style={{ background: "hsl(var(--muted)/0.2)", border: "1px solid hsl(var(--border)/0.5)" }}
              >
                <Mail className="h-3 w-3 flex-shrink-0" />
                Email cannot be changed here — contact your administrator.
              </div>

              {profileFeedback && <Alert type={profileFeedback.type} message={profileFeedback.msg} />}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
                >
                  <Save className="h-3.5 w-3.5" />
                  {updateMutation.isPending ? "Saving…" : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditing(false); setProfileFeedback(null); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold"
                  style={{ background: "hsl(var(--muted)/0.4)", color: "hsl(var(--muted-foreground))" }}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── Change Password ─────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        <div
          className="px-5 py-3.5 flex items-center gap-3"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}
        >
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(139,92,246,0.12)" }}
          >
            <Lock className="h-3.5 w-3.5" style={{ color: "#8b5cf6" }} />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Change Password</p>
            <p className="text-[10px] text-muted-foreground">Keep your account secure</p>
          </div>
        </div>

        <div className="p-5">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <PasswordInput
              label="Current Password"
              value={pwForm.current_password}
              onChange={(v) => setPwForm((f) => ({ ...f, current_password: v }))}
              placeholder="Enter your current password"
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <PasswordInput
                label="New Password"
                value={pwForm.new_password}
                onChange={(v) => setPwForm((f) => ({ ...f, new_password: v }))}
                placeholder="Min 8 characters"
                required
              />
              <PasswordInput
                label="Confirm Password"
                value={pwForm.confirm_password}
                onChange={(v) => setPwForm((f) => ({ ...f, confirm_password: v }))}
                placeholder="Repeat new password"
                required
              />
            </div>

            {pwForm.new_password && (
              <PasswordStrength password={pwForm.new_password} />
            )}

            {pwFeedback && <Alert type={pwFeedback.type} message={pwFeedback.msg} />}

            <button
              type="submit"
              disabled={
                changePwMutation.isPending ||
                !pwForm.current_password ||
                !pwForm.new_password ||
                !pwForm.confirm_password
              }
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}
            >
              <Lock className="h-3.5 w-3.5" />
              {changePwMutation.isPending ? "Changing…" : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Contact Row ───────────────────────────────────────────────────────────────

function ContactRow({
  icon: Icon,
  label,
  value,
  muted,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3.5 px-4 py-3 rounded-xl"
      style={{ background: "hsl(var(--muted)/0.2)" }}
    >
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "hsl(var(--muted)/0.4)" }}
      >
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          {label}
        </p>
        <p
          className="text-[13px] font-semibold mt-0.5"
          style={{ color: muted ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))" }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
