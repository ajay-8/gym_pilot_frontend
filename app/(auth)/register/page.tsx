"use client";

import { useState, useEffect } from "react";
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
import {
  Eye, EyeOff, ArrowRight, ArrowLeft,
  Building2, User, Mail, Phone, Lock, Check,
} from "lucide-react";

// ─── Validation schema ────────────────────────────────────────────────────────
const formSchema = z.object({
  gymName:         z.string().min(2, "Gym name must be at least 2 characters"),
  city:            z.string().min(2, "City is required"),
  country:         z.string().min(2, "Country is required"),
  email:           z.string().email("Invalid email address"),
  password:        z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  firstName:       z.string().min(2, "First name is required"),
  lastName:        z.string().optional(),
  phone:           z.string().regex(/^[6-9]\d{9}$/, "Invalid phone (10 digits, starts 6-9)").optional().or(z.literal("")),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

const STEP1_FIELDS: (keyof FormValues)[] = ["gymName", "city", "country"];

const BENEFITS = [
  "Member management & check-ins",
  "Automated payments & invoicing",
  "Attendance tracking & reports",
  "Lead conversion tools",
  "Multi-staff role access",
];

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
      {icon && (
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>
      )}
      <input
        className={`w-full py-3 rounded-xl text-sm text-white outline-none transition-all ${icon ? "pl-10" : "pl-4"} ${suffix ? "pr-10" : "pr-4"}`}
        style={inputBase}
        onFocus={onFocusStyle}
        onBlur={onBlurStyle}
        {...props}
      />
      {suffix && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>
      )}
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
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string>("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const gymOnboard = useGymOnboard();
  const { isAuthenticated, hasGymContext, hasHydrated } = useAuth();

  useEffect(() => {
    if (!hasHydrated) return;
    if (isAuthenticated) router.push(hasGymContext ? "/dashboard" : "/select-gym");
  }, [isAuthenticated, hasGymContext, hasHydrated, router]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gymName: "", city: "", country: "India",
      email: "", password: "", confirmPassword: "",
      firstName: "", lastName: "", phone: "",
    },
    mode: "onTouched",
  });

  const goNext = async () => {
    const ok = await form.trigger(STEP1_FIELDS);
    if (ok) { setStep(2); setError(""); }
  };

  const onSubmit = async (values: FormValues) => {
    setError("");
    try {
      await gymOnboard.mutateAsync({
        gym: {
          name:    values.gymName,
          city:    values.city,
          country: values.country,
          state:   "",
        },
        owner: {
          email:      values.email,
          password:   values.password,
          first_name: values.firstName,
          last_name:  values.lastName  || undefined,
          phone:      values.phone     || undefined,
        },
      });
    } catch (err: any) {
      setError(err?.detail || "Failed to register. Please try again.");
    }
  };

  if (!hasHydrated || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#080b10" }} suppressHydrationWarning>
        <div className="h-8 w-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "rgba(16,185,129,0.3)", borderTopColor: "#10b981" }}
          suppressHydrationWarning />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen" style={{ backgroundColor: "#080b10" }}>

      {/* ── Left: gym photo panel ── */}
      <div
        className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between"
        style={{
          backgroundImage: "url('/gym-login-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRight: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(135deg, rgba(8,11,16,0.88) 0%, rgba(8,11,16,0.72) 50%, rgba(8,11,16,0.82) 100%)",
        }} />

        {/* Logo */}
        <div className="relative z-10 p-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)" }}
            >
              <span className="text-white font-bold text-base">GP</span>
            </div>
            <span className="text-lg font-bold tracking-widest text-white uppercase">Gym Pilot</span>
          </Link>
        </div>

        {/* Center: headline + benefits */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-10 space-y-7">
          <div>
            <h2 className="text-5xl font-bold text-white leading-tight mb-4">
              Empower Your<br />
              <em style={{
                fontStyle: "italic",
                background: "linear-gradient(90deg, #10b981, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Fitness Empire
              </em>
            </h2>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
              The all-in-one platform to automate operations, delight members, and scale without the headache.
            </p>
          </div>

          {/* Benefit checklist */}
          <div className="space-y-3">
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-center gap-3">
                <div
                  className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(16,185,129,0.18)" }}
                >
                  <Check className="h-3 w-3" style={{ color: "#10b981" }} />
                </div>
                <span className="text-sm font-medium text-white">{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: social proof */}
        <div className="relative z-10 px-10 pb-10">
          <div className="pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.72)" }}>
              Trusted by <span className="text-white font-bold">2,000+</span> gyms worldwide
            </p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              Used by gyms in 18+ countries
            </p>
          </div>
        </div>
      </div>

      {/* ── Right: register form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 overflow-y-auto">

        {/* Mobile logo */}
        <Link href="/" className="inline-flex items-center gap-2 mb-8 lg:hidden">
          <div
            className="h-9 w-9 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)" }}
          >
            <span className="text-white font-bold text-base">GP</span>
          </div>
          <span
            className="text-xl font-bold"
            style={{ background: "linear-gradient(90deg, #10b981, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            Gym Pilot
          </span>
        </Link>

        <div className="w-full max-w-md">

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Start your free trial</h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              Set up your gym in 2 simple steps — no card required
            </p>
          </div>

          {/* Step indicator */}
          <div className="mb-7">
            <p className="text-xs font-medium mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
              Step {step} of 2
            </p>
            <div className="flex items-center gap-0">
              {([1, 2] as const).map((s, i) => {
                const done   = step > s;
                const active = step === s;
                const color  = done || active ? "#10b981" : "rgba(255,255,255,0.18)";
                const bg     = done || active ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)";
                return (
                  <div key={s} className="flex items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                        style={{ border: `2px solid ${color}`, backgroundColor: bg, color }}
                      >
                        {done ? <Check className="h-3.5 w-3.5" /> : s}
                      </div>
                      <span className="text-xs font-medium" style={{ color: active || done ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.28)" }}>
                        {s === 1 ? "Gym Info" : "Account Setup"}
                      </span>
                    </div>
                    {i === 0 && (
                      <div
                        className="w-10 h-px mx-3 transition-all"
                        style={{ backgroundColor: step === 2 ? "rgba(16,185,129,0.45)" : "rgba(255,255,255,0.12)" }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-sm"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
            >
              {error}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>

              {/* ── STEP 1: Gym Info ── */}
              {step === 1 && (
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
                          placeholder="Elite Fitness Club"
                          {...field}
                        />
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

                  <button
                    type="button"
                    onClick={goNext}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 mt-3 transition-all"
                    style={{
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      boxShadow: "0 0 24px rgba(16,185,129,0.28)",
                    }}
                  >
                    Next Step <ArrowRight className="h-4 w-4" />
                  </button>

                  {/* Trust indicators */}
                  <div className="flex items-center justify-center gap-4 pt-1">
                    {["No credit card required", "14-day free trial", "Setup in 60 seconds"].map((t) => (
                      <div key={t} className="flex items-center gap-1">
                        <Check className="h-3 w-3 flex-shrink-0" style={{ color: "#10b981" }} />
                        <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── STEP 2: Account Setup ── */}
              {step === 2 && (
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
                        <FieldInput
                          type="email"
                          icon={<Mail className="h-4 w-4" style={{ color: "rgba(255,255,255,0.28)" }} />}
                          placeholder="you@example.com"
                          autoComplete="email"
                          {...field}
                        />
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
                          placeholder="9876543210"
                          inputMode="tel"
                          {...field}
                        />
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
                          placeholder="Min. 8 characters"
                          autoComplete="new-password"
                          suffix={
                            <button type="button" onClick={() => setShowPwd(v => !v)}
                              className="transition-opacity hover:opacity-70"
                              style={{ color: "rgba(255,255,255,0.28)" }}>
                              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          }
                          {...field}
                        />
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
                          placeholder="••••••••"
                          autoComplete="new-password"
                          suffix={
                            <button type="button" onClick={() => setShowConfirm(v => !v)}
                              className="transition-opacity hover:opacity-70"
                              style={{ color: "rgba(255,255,255,0.28)" }}>
                              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs mt-1" style={{ color: "#f87171" }} />
                    </FormItem>
                  )} />

                  <div className="flex gap-3 mt-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.65)",
                      }}
                    >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>

                    <button
                      type="submit"
                      disabled={gymOnboard.isPending}
                      className="flex-[2] py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all"
                      style={{
                        background: gymOnboard.isPending
                          ? "rgba(16,185,129,0.45)"
                          : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        boxShadow: gymOnboard.isPending ? "none" : "0 0 24px rgba(16,185,129,0.28)",
                        cursor: gymOnboard.isPending ? "not-allowed" : "pointer",
                      }}
                    >
                      {gymOnboard.isPending ? (
                        <>
                          <div className="h-4 w-4 rounded-full border-2 animate-spin"
                            style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                          Creating...
                        </>
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
