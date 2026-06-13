"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { Check, Mail, ArrowLeft, RefreshCw } from "lucide-react";


function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";
  const [userId, setUserId]     = useState(searchParams.get("user_id") || "");

  const [otp, setOtp]           = useState(["", "", "", "", "", ""]);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // If we only have email (came from login redirect), auto-send a fresh OTP and capture user_id
  useEffect(() => {
    if (!userId && email) {
      authApi.resendVerificationOTP(email).then(res => {
        if (res.user_id) setUserId(res.user_id);
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError("");
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    // Auto-submit when all 6 digits entered
    if (digit && index === 5 && next.every(d => d)) {
      handleSubmit(next.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    pasted.split("").forEach((d, i) => { next[i] = d; });
    setOtp(next);
    if (pasted.length === 6) {
      handleSubmit(pasted);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  const handleSubmit = async (code?: string) => {
    const finalOtp = code ?? otp.join("");
    if (finalOtp.length < 6) {
      setError("Enter all 6 digits");
      return;
    }
    if (!userId && !email) {
      setError("Missing verification details. Please register again.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      if (!userId) {
        setError("Could not resolve account. Please request a new code.");
        return;
      }
      await authApi.verifyEmail({ user_id: userId, otp: finalOtp });
      setSuccess(true);
      setTimeout(() => {
        router.push(`/login${email ? `?email=${encodeURIComponent(email)}` : ""}`);
      }, 2000);
    } catch (err: any) {
      const code_err = err?.error_code;
      if (code_err === "INVALID_OTP") {
        setError("Invalid or expired code. Try again or request a new one.");
      } else {
        setError(err?.message || "Verification failed. Please try again.");
      }
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;
    setResending(true);
    setError("");
    try {
      const res = await authApi.resendVerificationOTP(email);
      if (res.user_id) setUserId(res.user_id);
      setResendCooldown(60);
    } catch {
      setError("Could not resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-6" style={{ backgroundColor: "#080b10" }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2 mb-10">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)" }}>
            <span className="text-white font-bold text-base">GP</span>
          </div>
          <span className="text-xl font-bold"
            style={{ background: "linear-gradient(90deg, #10b981, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Gym Pilot
          </span>
        </Link>

        {success ? (
          /* Success state */
          <div className="text-center">
            <div className="mx-auto mb-5 h-14 w-14 rounded-full flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.15)", border: "2px solid rgba(16,185,129,0.4)" }}>
              <Check className="h-7 w-7" style={{ color: "#10b981" }} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              Redirecting you to login...
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="mb-4 h-12 w-12 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
                <Mail className="h-6 w-6" style={{ color: "#10b981" }} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">Check your email</h1>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                We sent a 6-digit code to{" "}
                {email
                  ? <span className="font-medium text-white">{email}</span>
                  : "your email address"
                }
              </p>
            </div>

            {/* OTP inputs */}
            <div className="flex gap-2 mb-2" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  style={{
                    width: "44px",
                    height: "52px",
                    flexShrink: 0,
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${error ? "rgba(239,68,68,0.5)" : digit ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.15)"}`,
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "20px",
                    fontWeight: 700,
                    textAlign: "center" as const,
                    outline: "none",
                    caretColor: "#10b981",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = "rgba(16,185,129,0.5)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16,185,129,0.08)";
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = error
                      ? "rgba(239,68,68,0.5)"
                      : digit ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.15)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  disabled={loading}
                />
              ))}
            </div>

            {/* Error */}
            {error && (
              <p className="mb-4 text-xs" style={{ color: "#f87171" }}>{error}</p>
            )}

            {/* Submit button */}
            <button
              onClick={() => handleSubmit()}
              disabled={loading || otp.some(d => !d)}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 mt-4 transition-all"
              style={{
                background: loading || otp.some(d => !d)
                  ? "rgba(16,185,129,0.35)"
                  : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                boxShadow: loading || otp.some(d => !d) ? "none" : "0 0 20px rgba(16,185,129,0.25)",
                cursor: loading || otp.some(d => !d) ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 animate-spin"
                    style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                  Verifying...
                </>
              ) : "Verify Email"}
            </button>

            {/* Resend */}
            <div className="mt-5 text-center">
              <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                Didn't receive the code?
              </p>
              <button
                onClick={handleResend}
                disabled={resending || resendCooldown > 0 || !email}
                className="text-xs font-medium flex items-center gap-1 mx-auto transition-opacity"
                style={{
                  color: resendCooldown > 0 ? "rgba(255,255,255,0.3)" : "#10b981",
                  cursor: resendCooldown > 0 ? "default" : "pointer",
                }}
              >
                <RefreshCw className={`h-3 w-3 ${resending ? "animate-spin" : ""}`} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
              </button>
            </div>

            {/* Back to login */}
            <div className="mt-6 text-center">
              <Link href="/login" className="inline-flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
                style={{ color: "rgba(255,255,255,0.35)" }}>
                <ArrowLeft className="h-3 w-3" /> Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
