"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store/auth-store";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground";
  const inputStyle = {
    background: "hsl(var(--muted)/0.3)",
    border: "1px solid hsl(var(--border))",
  };
  const labelClass =
    "block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5";

  const canSubmit =
    !!token &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setIsPending(true);
    try {
      await authApi.confirmPasswordReset({ token: token!, new_password: newPassword });
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as { detail?: string };
      setError(e?.detail ?? "This link is invalid or has expired. Please request a new one.");
    } finally {
      setIsPending(false);
    }
  };

  // No token in URL
  if (!token) {
    return (
      <div
        className="rounded-2xl p-6 text-center space-y-4"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        <div
          className="mx-auto h-12 w-12 rounded-full flex items-center justify-center"
          style={{ background: "rgba(239,68,68,0.1)" }}
        >
          <AlertTriangle className="h-6 w-6" style={{ color: "#ef4444" }} />
        </div>
        <h2 className="text-base font-bold text-foreground">Invalid Link</h2>
        <p className="text-sm text-muted-foreground">
          No reset token found. Please use the link from your invitation or password
          reset email, or request a new one.
        </p>
        <Link
          href="/login"
          className="block w-full py-2.5 rounded-xl text-sm font-bold text-white text-center transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
        >
          Back to Login
        </Link>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div
        className="rounded-2xl p-6 text-center space-y-4"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        <div
          className="mx-auto h-12 w-12 rounded-full flex items-center justify-center"
          style={{ background: "rgba(16,185,129,0.12)" }}
        >
          <CheckCircle className="h-6 w-6" style={{ color: "#10b981" }} />
        </div>
        <h2 className="text-base font-bold text-foreground">Password Set!</h2>
        <p className="text-sm text-muted-foreground">
          Your password has been set successfully. You can now log in with your new
          password.
        </p>
        <button
          onClick={async () => {
            try { await authApi.logout(); } catch { /* ignore — might not be logged in */ }
            useAuthStore.getState().clearAuth();
            router.push("/login");
          }}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      suppressHydrationWarning
    >
      <h2 className="text-base font-bold text-foreground mb-1">Set Your Password</h2>
      <p className="text-[11px] text-muted-foreground mb-5">
        Choose a strong password — at least 8 characters.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>New Password *</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass}
            style={inputStyle}
            autoComplete="new-password"
            minLength={8}
            required
            suppressHydrationWarning
          />
          {newPassword.length > 0 && newPassword.length < 8 && (
            <p className="text-[11px] mt-1" style={{ color: "#f59e0b" }}>
              At least 8 characters required
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>Confirm Password *</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass}
            style={inputStyle}
            autoComplete="new-password"
            required
            suppressHydrationWarning
          />
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <p className="text-[11px] mt-1" style={{ color: "#ef4444" }}>
              Passwords do not match
            </p>
          )}
        </div>

        {error && (
          <div
            className="flex items-start gap-2 p-3 rounded-xl text-[11px]"
            style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}
          >
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !canSubmit}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
          suppressHydrationWarning
        >
          {isPending ? "Setting password…" : "Set Password"}
        </button>
      </form>

      <p className="text-center text-[11px] text-muted-foreground mt-4">
        Remember your password?{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)" }}
              suppressHydrationWarning
            >
              <span className="text-white font-bold text-xl">GP</span>
            </div>
            <span className="text-2xl font-bold gradient-text">Gym Pilot</span>
          </Link>
          <h1 className="text-3xl font-bold mt-4">Set Password</h1>
          <p className="text-muted-foreground mt-2">
            Create a secure password for your account
          </p>
        </div>

        <Suspense fallback={<div className="text-center text-muted-foreground text-sm">Loading…</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
