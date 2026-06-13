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
import { useLogin, useAuth, resolvePortalRoute } from "@/lib/hooks/use-auth";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Users, TrendingUp, Clock } from "lucide-react";

const formSchema = z.object({
  email:      z.string().email("Invalid email address"),
  password:   z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const STATS = [
  { icon: Users,       value: "500+",  label: "Gyms Onboarded" },
  { icon: TrendingUp,  value: "99.9%", label: "Uptime SLA" },
  { icon: Clock,       value: "24/7",  label: "Expert Support" },
];

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();
  const { isAuthenticated, gymContext, hasGymContext, hasHydrated } = useAuth();

  useEffect(() => {
    if (!hasHydrated) return;
    if (login.isPending) return;
    if (isAuthenticated) {
      router.push(hasGymContext ? resolvePortalRoute(gymContext?.roles ?? []) : "/select-gym");
    }
  }, [isAuthenticated, gymContext, hasGymContext, hasHydrated, login.isPending, router]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  const onSubmit = async (values: FormValues) => {
    setError("");
    try {
      await login.mutateAsync(values);
    } catch (err: any) {
      if (err?.error_code === "EMAIL_NOT_VERIFIED") {
        router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
      } else if (err?.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else if (typeof err?.detail === "string" && !err.detail.includes("status code")) {
        setError(err.detail);
      } else {
        setError("Something went wrong. Please try again.");
      }
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
        className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col"
        style={{
          backgroundImage: "url('/gym-login-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRight: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(135deg, rgba(8,11,16,0.82) 0%, rgba(8,11,16,0.55) 50%, rgba(8,11,16,0.72) 100%)",
        }} />

        {/* Logo — top left, alone */}
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

        {/* Centered content — headline + description + stats */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-10 space-y-6">
          <div>
            <h2 className="text-5xl font-bold text-white leading-tight mb-4">
              Run your gym<br />
              <em style={{
                fontStyle: "italic",
                background: "linear-gradient(90deg, #10b981, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                smarter,
              </em>{" "}
              not harder.
            </h2>
            <p className="text-base leading-relaxed max-w-sm" style={{ color: "rgba(255,255,255,0.78)" }}>
              The ultimate all-in-one management suite for modern fitness facilities.
              Streamline operations and focus on what matters: your members.
            </p>
          </div>

          <div className="flex items-end gap-0">
            {STATS.map((stat, i) => (
              <div key={stat.label} className="flex items-stretch">
                {i > 0 && (
                  <div className="w-px mx-7 self-stretch" style={{ backgroundColor: "rgba(255,255,255,0.18)" }} />
                )}
                <div>
                  <div className="text-3xl font-bold text-white leading-none tracking-tight">{stat.value}</div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <stat.icon className="h-3 w-3 flex-shrink-0" style={{ color: "#10b981" }} />
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.72)" }}>{stat.label}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Avatar group — pinned to bottom */}
        <div className="relative z-10 px-10 pb-10 flex items-center gap-3">
          <div className="flex -space-x-2.5">
            {(["#10b981","#8b5cf6","#f59e0b"] as const).map((color, i) => (
              <div
                key={i}
                className="h-8 w-8 rounded-full border-2 flex items-center justify-center text-[11px] font-bold text-white"
                style={{ borderColor: "#080b10", background: color }}
              >
                {["J","M","S"][i]}
              </div>
            ))}
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.72)" }}>
            Joined by <span className="text-white font-semibold">10k+</span> gym operators worldwide
          </p>
        </div>
      </div>

      {/* ── Right: login form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">

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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.42)" }}>
              Sign in to your gym dashboard
            </p>
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                {/* Email */}
                <FormField control={form.control} name="email" render={({ field: { onBlur, ...rest } }) => (
                  <FormItem>
                    <div className="text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.58)" }}>Email</div>
                    <FormControl>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                          style={{ color: "rgba(255,255,255,0.28)" }} />
                        <input
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", caretColor: "#10b981" }}
                          onFocus={e => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.45)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16,185,129,0.08)"; }}
                          onBlur={e => { onBlur(); e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                          {...rest}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs mt-1" style={{ color: "#f87171" }} />
                  </FormItem>
                )} />

                {/* Password */}
                <FormField control={form.control} name="password" render={({ field: { onBlur, ...rest } }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.58)" }}>Password</span>
                      <Link href="/forgot-password" className="text-xs transition-opacity hover:opacity-80" style={{ color: "#10b981" }}>
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                          style={{ color: "rgba(255,255,255,0.28)" }} />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-white outline-none transition-all"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", caretColor: "#10b981" }}
                          onFocus={e => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.45)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16,185,129,0.08)"; }}
                          onBlur={e => { onBlur(); e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                          {...rest}
                        />
                        <button type="button" onClick={() => setShowPassword(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                          style={{ color: "rgba(255,255,255,0.28)" }}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs mt-1" style={{ color: "#f87171" }} />
                  </FormItem>
                )} />

                {/* Remember me */}
                <FormField control={form.control} name="rememberMe" render={({ field }) => (
                  <FormItem>
                    <label className="flex items-center gap-2.5 cursor-pointer group w-fit">
                      <div className="relative flex-shrink-0">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={field.value ?? true}
                          onChange={field.onChange}
                        />
                        <div
                          className="h-4 w-4 rounded transition-all"
                          style={{
                            background: field.value ? "#10b981" : "rgba(255,255,255,0.05)",
                            border: field.value ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.2)",
                            boxShadow: field.value ? "0 0 8px rgba(16,185,129,0.35)" : "none",
                          }}
                        >
                          {field.value && (
                            <svg className="h-3 w-3 absolute top-0.5 left-0.5" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-xs select-none transition-colors"
                        style={{ color: field.value ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.45)" }}>
                        Remember me on this device
                      </span>
                    </label>
                  </FormItem>
                )} />

                {/* Submit */}
                <button
                  type="submit"
                  disabled={login.isPending}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all mt-2"
                  style={{
                    background: login.isPending ? "rgba(16,185,129,0.45)" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    boxShadow: login.isPending ? "none" : "0 0 24px rgba(16,185,129,0.28)",
                    cursor: login.isPending ? "not-allowed" : "pointer",
                  }}
                >
                  {login.isPending ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 animate-spin"
                        style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} suppressHydrationWarning />
                      Signing in...
                    </>
                  ) : (
                    <>Sign In <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </form>
            </Form>

          {/* Sign up link */}
          <p className="text-center text-xs mt-5" style={{ color: "rgba(255,255,255,0.32)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium transition-opacity hover:opacity-80" style={{ color: "#10b981" }}>
              Start free trial
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
