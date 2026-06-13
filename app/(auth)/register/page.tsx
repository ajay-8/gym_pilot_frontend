"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useGymOnboard } from "@/lib/hooks/use-gyms";
import { useAuth } from "@/lib/hooks/use-auth";
import { authApi } from "@/lib/api";
import {
  Eye, EyeOff, ArrowRight, ArrowLeft,
  Building2, User, Mail, Phone, Lock, Check, RefreshCw,
} from "lucide-react";

// ─── Validation schema ────────────────────────────────────────────────────────
const formSchema = z.object({
  firstName:       z.string().min(2, "First name is required"),
  lastName:        z.string().optional(),
  email:           z.string().email("Invalid email address"),
  phone:           z.string().regex(/^[6-9]\d{9}$/, "Invalid phone (10 digits, starts 6-9)").optional().or(z.literal("")),
  password:        z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  gymName:         z.string().min(2, "Gym name must be at least 2 characters"),
  city:            z.string().min(2, "City is required"),
  country:         z.string().min(2, "Country is required"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;
type Step = 1 | "otp" | 2;

const ACCOUNT_FIELDS: (keyof FormValues)[] = ["firstName", "lastName", "email", "phone", "password", "confirmPassword"];

const BENEFITS = [
  "Member management & check-ins",
  "Automated payments & invoicing",
  "Attendance tracking & reports",
  "Lead conversion tools",
  "Multi-staff role access",
];

const STEPS = [
  { key: 1,     label: "Account" },
  { key: "otp", label: "Verify Email" },
  { key: 2,     label: "Gym Info" },
] as const;

// ─── Shared input helpers ─────────────────────────────────────────────────────
const inputBase: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  caretColor: "#10b981",
};

function onFocusStyle(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = "rgba(16,185,129,0.45)";
  e.currentTarget.style.boxShadow  = "0 0 0 3px rgba(16,185,129,0.08)";
}
function onBlurStyle(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
  e.currentTarget.style.boxShadow   = "none";
}

interface FieldInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}
function FieldInput({ icon, suffix, ...props }: FieldInputProps) {
  return (
    <div className="relative">
      {icon && <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>}
      <input
        className={`w-full py-3 rounded-xl text-sm text-white outline-none transition-all ${icon ? "pl-10" : "pl-4"} ${suffix ? "pr-10" : "pr-4"}`}
        style={inputBase}
        onFocus={onFocusStyle}
        onBlur={onBlurStyle}
        {...props}
      />
      {suffix && <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1.5">
      <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>{children}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep]                 = useState<Step>(1);
  const [error, setError]               = useState("");
  const [busy, setBusy]                 = useState(false);
  const [showPwd, setShowPwd]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  // OTP state
  const [otp, setOtp]                   = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const gymOnboard = useGymOnboard();
  const { isAuthenticated, hasGymContext, hasHydrated } = useAuth();

  useEffect(() => {
    if (!hasHydrated) return;
    if (isAuthenticated) router.push(hasGymContext ? "/dashboard" : "/select-gym");
  }, [isAuthenticated, hasGymContext, hasHydrated, router]);

  // Resend cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "", lastName: "", email: "", phone: "",
      password: "", confirmPassword: "",
      gymName: "", city: "", country: "India",
    },
    mode: "onTouched",
  });

  // ── Step 1 → OTP: validate account fields, check availability, send OTP ──
  const goToOtp = async () => {
    const valid = await form.trigger(ACCOUNT_FIELDS);
    if (!valid) return;

    setBusy(true);
    setError("");
    try {
      const email = form.getValues("email");
      const phone = form.getValues("phone") || undefined;

      // 1. Check availability
      const avail = await authApi.checkAvailability({ email, phone });
      if (!avail.can_proceed) {
        if (!avail.email_available) form.setError("email", { message: "Email is already registered" });
        if (!avail.phone_available) form.setError("phone", { message: "Phone number is already registered" });
        return;
      }

      // 2. Send pre-registration OTP
      await authApi.sendPreRegOTP(email);
      setOtp(["", "", "", "", "", ""]);
      setResendCooldown(60);
      setStep("otp");
      // Focus first OTP box after render
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("Could not send verification code. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // ── OTP input handlers ──
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError("");
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
    if (digit && index === 5 && next.every(d => d)) submitOtp(next.join(""));
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    pasted.split("").forEach((d, i) => { next[i] = d; });
    setOtp(next);
    if (pasted.length === 6) submitOtp(pasted);
    else otpRefs.current[pasted.length]?.focus();
  };

  // ── OTP → Step 2: verify code ──
  const submitOtp = async (code?: string) => {
    const finalOtp = code ?? otp.join("");
    if (finalOtp.length < 6) { setError("Enter all 6 digits"); return; }
    setBusy(true);
    setError("");
    try {
      await authApi.verifyPreRegOTP(form.getValues("email"), finalOtp);
      setStep(2);
    } catch (err: any) {
      const errCode = err?.error_code;
      if (errCode === "INVALID_OTP") {
        setError("Invalid or expired code. Try again or resend.");
      } else {
        setError(err?.message || "Verification failed.");
      }
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setBusy(false);
    }
  };

  // ── Resend OTP ──
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setBusy(true);
    setError("");
    try {
      await authApi.sendPreRegOTP(form.getValues("email"));
      setOtp(["", "", "", "", "", ""]);
      setResendCooldown(60);
      otpRefs.current[0]?.focus();
    } catch {
      setError("Could not resend code. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // ── Step 2 → Submit ──
  const onSubmit = async (values: FormValues) => {
    setError("");
    try {
      await gymOnboard.mutateAsync({
        gym: { name: values.gymName, city: values.city, country: values.country, state: "" },
        owner: {
          email:      values.email,
          password:   values.password,
          first_name: values.firstName,
          last_name:  values.lastName  || undefined,
          phone:      values.phone     || undefined,
        },
      });
    } catch (err: any) {
      const fields = err?.response?.data?.fields;
      if (fields) {
        setStep(1);
        if (fields.email) form.setError("email", { message: fields.email });
        if (fields.phone) form.setError("phone", { message: fields.phone });
      } else {
        setError(err?.response?.data?.message || "Failed to register. Please try again.");
      }
    }
  };

  const stepIndex = step === 1 ? 0 : step === "otp" ? 1 : 2;

  if (!hasHydrated || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#080b10" }} suppressHydrationWarning>
        <div className="h-8 w-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "rgba(16,185,129,0.3)", borderTopColor: "#10b981" }} suppressHydrationWarning />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen" style={{ backgroundColor: "#080b10" }}>

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between"
        style={{ backgroundImage: "url('/gym-login-bg.jpg')", backgroundSize: "cover", backgroundPosition: "center", borderRight: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(8,11,16,0.88) 0%, rgba(8,11,16,0.72) 50%, rgba(8,11,16,0.82) 100%)" }} />
        <div className="relative z-10 p-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)" }}>
              <span className="text-white font-bold text-base">GP</span>
            </div>
            <span className="text-lg font-bold tracking-widest text-white uppercase">Gym Pilot</span>
          </Link>
        </div>
        <div className="relative z-10 flex-1 flex flex-col justify-center px-10 space-y-7">
          <div>
            <h2 className="text-5xl font-bold text-white leading-tight mb-4">
              Empower Your<br />
              <em style={{ fontStyle: "italic", background: "linear-gradient(90deg, #10b981, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Fitness Empire
              </em>
            </h2>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
              The all-in-one platform to automate operations, delight members, and scale without the headache.
            </p>
          </div>
          <div className="space-y-3">
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(16,185,129,0.18)" }}>
                  <Check className="h-3 w-3" style={{ color: "#10b981" }} />
                </div>
                <span className="text-sm font-medium text-white">{b}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 px-10 pb-10">
          <div className="pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.72)" }}>
              Trusted by <span className="text-white font-bold">2,000+</span> gyms worldwide
            </p>
          </div>
        </div>
      </div>

      {/* ── Right: form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 overflow-y-auto">

        {/* Mobile logo */}
        <Link href="/" className="inline-flex items-center gap-2 mb-8 lg:hidden">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)" }}>
            <span className="text-white font-bold text-base">GP</span>
          </div>
          <span className="text-xl font-bold" style={{ background: "linear-gradient(90deg, #10b981, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Gym Pilot
          </span>
        </Link>

        <div className="w-full max-w-md">

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              Free up to 100 members — no credit card required
            </p>
          </div>

          {/* Step indicator — 3 steps */}
          <div className="mb-7">
            <p className="text-xs font-medium mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
              Step {stepIndex + 1} of 3
            </p>
            <div className="flex items-center">
              {STEPS.map((s, i) => {
                const done   = stepIndex > i;
                const active = stepIndex === i;
                const color  = done || active ? "#10b981" : "rgba(255,255,255,0.18)";
                const bg     = done || active ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)";
                return (
                  <div key={String(s.key)} className="flex items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0"
                        style={{ border: `2px solid ${color}`, backgroundColor: bg, color }}
                      >
                        {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                      </div>
                      <span className="text-xs font-medium whitespace-nowrap" style={{ color: active || done ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.28)" }}>
                        {s.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="w-8 h-px mx-2 flex-shrink-0 transition-all"
                        style={{ backgroundColor: stepIndex > i ? "rgba(16,185,129,0.45)" : "rgba(255,255,255,0.12)" }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
              {error}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>

              {/* ── STEP 1: Account Setup ── */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
                      <User className="h-3.5 w-3.5" style={{ color: "#8b5cf6" }} />
                    </div>
                    <span className="text-sm font-semibold text-white">Your Account</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="firstName" render={({ field }) => (
                      <FormItem>
                        <FieldLabel>First Name</FieldLabel>
                        <FormControl><FieldInput placeholder="John" {...field} /></FormControl>
                        <FormMessage className="text-xs mt-1" style={{ color: "#f87171" }} />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (
                      <FormItem>
                        <FieldLabel>Last Name</FieldLabel>
                        <FormControl><FieldInput placeholder="Doe" {...field} /></FormControl>
                        <FormMessage className="text-xs mt-1" style={{ color: "#f87171" }} />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FieldLabel>Email Address</FieldLabel>
                      <FormControl>
                        <FieldInput type="email"
                          icon={<Mail className="h-4 w-4" style={{ color: "rgba(255,255,255,0.28)" }} />}
                          placeholder="you@example.com" autoComplete="email" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs mt-1" style={{ color: "#f87171" }} />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FieldLabel>Phone (optional)</FieldLabel>
                      <FormControl>
                        <FieldInput
                          icon={<Phone className="h-4 w-4" style={{ color: "rgba(255,255,255,0.28)" }} />}
                          placeholder="9876543210" inputMode="tel" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs mt-1" style={{ color: "#f87171" }} />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FieldLabel>Password</FieldLabel>
                      <FormControl>
                        <FieldInput
                          type={showPwd ? "text" : "password"}
                          icon={<Lock className="h-4 w-4" style={{ color: "rgba(255,255,255,0.28)" }} />}
                          placeholder="Min. 8 characters" autoComplete="new-password"
                          suffix={
                            <button type="button" onClick={() => setShowPwd(v => !v)}
                              className="transition-opacity hover:opacity-70" style={{ color: "rgba(255,255,255,0.28)" }}>
                              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          }
                          {...field} />
                      </FormControl>
                      <FormMessage className="text-xs mt-1" style={{ color: "#f87171" }} />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                      <FieldLabel>Confirm Password</FieldLabel>
                      <FormControl>
                        <FieldInput
                          type={showConfirm ? "text" : "password"}
                          icon={<Lock className="h-4 w-4" style={{ color: "rgba(255,255,255,0.28)" }} />}
                          placeholder="••••••••" autoComplete="new-password"
                          suffix={
                            <button type="button" onClick={() => setShowConfirm(v => !v)}
                              className="transition-opacity hover:opacity-70" style={{ color: "rgba(255,255,255,0.28)" }}>
                              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          }
                          {...field} />
                      </FormControl>
                      <FormMessage className="text-xs mt-1" style={{ color: "#f87171" }} />
                    </FormItem>
                  )} />

                  <button type="button" onClick={goToOtp} disabled={busy}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 mt-3 transition-all"
                    style={{
                      background: busy ? "rgba(16,185,129,0.45)" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      boxShadow: busy ? "none" : "0 0 24px rgba(16,185,129,0.28)",
                      cursor: busy ? "not-allowed" : "pointer",
                    }}>
                    {busy ? (
                      <><div className="h-4 w-4 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />Checking...</>
                    ) : (
                      <>Send Verification Code <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-4 pt-1">
                    {["No credit card required", "Free up to 100 members", "Setup in 60 seconds"].map((t) => (
                      <div key={t} className="flex items-center gap-1">
                        <Check className="h-3 w-3 flex-shrink-0" style={{ color: "#10b981" }} />
                        <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── STEP OTP: Verify Email ── */}
              {step === "otp" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
                      <Mail className="h-3.5 w-3.5" style={{ color: "#10b981" }} />
                    </div>
                    <span className="text-sm font-semibold text-white">Verify your email</span>
                  </div>

                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                    We sent a 6-digit code to{" "}
                    <span className="font-medium text-white">{form.getValues("email")}</span>
                  </p>

                  {/* OTP boxes — fixed 44px each */}
                  <div className="flex gap-2" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        disabled={busy}
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
                          textAlign: "center",
                          outline: "none",
                          caretColor: "#10b981",
                          transition: "border-color 0.15s",
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16,185,129,0.08)"; }}
                        onBlur={e => { e.currentTarget.style.borderColor = error ? "rgba(239,68,68,0.5)" : digit ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.15)"; e.currentTarget.style.boxShadow = "none"; }}
                      />
                    ))}
                  </div>

                  <button type="button" onClick={() => submitOtp()} disabled={busy || otp.some(d => !d)}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all"
                    style={{
                      background: busy || otp.some(d => !d) ? "rgba(16,185,129,0.35)" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      boxShadow: busy || otp.some(d => !d) ? "none" : "0 0 24px rgba(16,185,129,0.28)",
                      cursor: busy || otp.some(d => !d) ? "not-allowed" : "pointer",
                    }}>
                    {busy ? (
                      <><div className="h-4 w-4 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />Verifying...</>
                    ) : (
                      <>Verify & Continue <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>

                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => { setStep(1); setOtp(["", "", "", "", "", ""]); setError(""); }}
                      className="flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
                      style={{ color: "rgba(255,255,255,0.4)" }}>
                      <ArrowLeft className="h-3 w-3" /> Back
                    </button>
                    <button type="button" onClick={handleResend} disabled={resendCooldown > 0 || busy}
                      className="flex items-center gap-1 text-xs transition-opacity"
                      style={{ color: resendCooldown > 0 ? "rgba(255,255,255,0.3)" : "#10b981", cursor: resendCooldown > 0 ? "default" : "pointer" }}>
                      <RefreshCw className={`h-3 w-3 ${busy && resendCooldown === 0 ? "animate-spin" : ""}`} />
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Gym Info ── */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.25)" }}>
                      <Building2 className="h-3.5 w-3.5" style={{ color: "#10b981" }} />
                    </div>
                    <span className="text-sm font-semibold text-white">Your Gym</span>
                  </div>

                  <FormField control={form.control} name="gymName" render={({ field }) => (
                    <FormItem>
                      <FieldLabel>Gym Name</FieldLabel>
                      <FormControl>
                        <FieldInput
                          icon={<Building2 className="h-4 w-4" style={{ color: "rgba(255,255,255,0.28)" }} />}
                          placeholder="Elite Fitness Club" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs mt-1" style={{ color: "#f87171" }} />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem>
                        <FieldLabel>City</FieldLabel>
                        <FormControl><FieldInput placeholder="Mumbai" {...field} /></FormControl>
                        <FormMessage className="text-xs mt-1" style={{ color: "#f87171" }} />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="country" render={({ field }) => (
                      <FormItem>
                        <FieldLabel>Country</FieldLabel>
                        <FormControl><FieldInput placeholder="India" {...field} /></FormControl>
                        <FormMessage className="text-xs mt-1" style={{ color: "#f87171" }} />
                      </FormItem>
                    )} />
                  </div>

                  <div className="flex gap-3 mt-3">
                    <button type="button" onClick={() => setStep("otp")}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)" }}>
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <button type="submit" disabled={gymOnboard.isPending}
                      className="flex-[2] py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all"
                      style={{
                        background: gymOnboard.isPending ? "rgba(16,185,129,0.45)" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        boxShadow: gymOnboard.isPending ? "none" : "0 0 24px rgba(16,185,129,0.28)",
                        cursor: gymOnboard.isPending ? "not-allowed" : "pointer",
                      }}>
                      {gymOnboard.isPending ? (
                        <><div className="h-4 w-4 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />Creating...</>
                      ) : (
                        <>Create My Gym <ArrowRight className="h-4 w-4" /></>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </form>
          </Form>

          {/* Footer */}
          <div className="mt-6 space-y-2">
            <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.32)" }}>
              Already have an account?{" "}
              <Link href="/login" className="font-medium transition-opacity hover:opacity-80" style={{ color: "#10b981" }}>
                Sign in
              </Link>
            </p>
            <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
              By signing up, you agree to our{" "}
              <Link href="#" className="hover:opacity-70 transition-opacity" style={{ color: "rgba(255,255,255,0.38)" }}>Terms</Link>
              {" & "}
              <Link href="#" className="hover:opacity-70 transition-opacity" style={{ color: "rgba(255,255,255,0.38)" }}>Privacy Policy</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
