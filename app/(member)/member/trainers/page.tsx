"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGymTrainers,
  useTrainerPublicProfile,
  useMyPTPurchases,
  memberPortalKeys,
} from "@/lib/hooks/use-member-portal";
import { paymentsApi } from "@/lib/api/payments";
import { ptApi } from "@/lib/api/pt";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Dumbbell,
  Users,
  Clock,
  Mail,
  Phone,
  Star,
  Award,
  Languages,
  BookOpen,
  Heart,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Package,
  CalendarDays,
  Timer,
  Lock,
  ShieldCheck,
  IndianRupee,
} from "lucide-react";
import type { GymTrainerContractResponse, PTPackageBrief } from "@/types/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAY_ABBR: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun",
};

function getAvailableDays(availability: GymTrainerContractResponse["weekly_availability"]): string[] {
  if (!availability) return [];
  return Object.entries(availability)
    .filter(([, slots]) => Array.isArray(slots) && slots.length > 0)
    .map(([day]) => DAY_ABBR[day] ?? day);
}

function sessionModeLabel(m: string): string {
  return ({ in_person: "In-person", online: "Online", hybrid: "Hybrid" } as Record<string, string>)[m] ?? m;
}


// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 text-sm font-medium shadow-2xl"
      style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", color: "#fff" }}
    >
      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
      <span>{msg}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 text-xs">✕</button>
    </div>
  );
}

// ── TrainerCard ───────────────────────────────────────────────────────────────

function TrainerCard({
  trainer,
  onClick,
}: {
  trainer: GymTrainerContractResponse;
  onClick: () => void;
}) {
  const availableDays = getAvailableDays(trainer.weekly_availability);
  const initial = trainer.trainer_name?.[0]?.toUpperCase() ?? "T";
  const hourlyRate = trainer.hourly_rate ? parseFloat(trainer.hourly_rate) : null;

  return (
    <Card
      className="cursor-pointer transition-all duration-150 hover:border-blue-500/40 hover:shadow-lg"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4 mb-4">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-foreground truncate">
              {trainer.trainer_name ?? "Trainer"}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{ background: "#10b98122", color: "#10b981" }}
              >
                Active
              </span>
              <span className="text-xs text-muted-foreground">
                {hourlyRate ? `₹${hourlyRate.toLocaleString("en-IN")}/hr` : "Rate not set"}
              </span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50 mt-1 flex-shrink-0" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          {availableDays.length > 0 ? (
            availableDays.map((day) => (
              <span
                key={day}
                className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                style={{ background: "rgba(59,130,246,0.1)", color: "#93c5fd" }}
              >
                {day}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">Schedule not set</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── PackageCard ───────────────────────────────────────────────────────────────

function PackageCard({
  pkg,
  onBuy,
  isOwned = false,
}: {
  pkg: PTPackageBrief;
  onBuy: () => void;
  isOwned?: boolean;
}) {
  const price = parseFloat(pkg.price);

  return (
    <Card
      className="transition-all duration-150"
      style={isOwned ? { opacity: 0.6 } : undefined}
    >
      <CardContent className="p-4">
        {/* Already active banner */}
        {isOwned && (
          <div
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium mb-3"
            style={{
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.25)",
              color: "#10b981",
            }}
          >
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
            Already purchased &amp; active
          </div>
        )}

        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{pkg.name}</p>
            {pkg.description && (
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {pkg.description}
              </p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-base font-bold text-foreground">
              ₹{price.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-muted-foreground">{pkg.currency}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <span
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs"
            style={{ background: "rgba(59,130,246,0.1)", color: "#93c5fd" }}
          >
            <Package className="h-3 w-3" />
            {pkg.session_count} sessions
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs"
            style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}
          >
            <Timer className="h-3 w-3" />
            {pkg.duration_minutes} min/session
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs"
            style={{ background: "rgba(139,92,246,0.1)", color: "#c4b5fd" }}
          >
            {sessionModeLabel(pkg.session_mode)}
          </span>
          {pkg.expiry_days && (
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs"
              style={{ background: "rgba(245,158,11,0.1)", color: "#fbbf24" }}
            >
              <CalendarDays className="h-3 w-3" />
              {pkg.expiry_days}d validity
            </span>
          )}
        </div>

        <button
          disabled={isOwned}
          className="w-full h-9 text-sm rounded-lg font-semibold text-white flex items-center justify-center gap-1.5 transition-opacity"
          style={{
            background: isOwned
              ? "rgba(255,255,255,0.08)"
              : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            color: isOwned ? "hsl(var(--muted-foreground))" : "#fff",
            cursor: isOwned ? "not-allowed" : "pointer",
          }}
          onClick={isOwned ? undefined : onBuy}
        >
          {isOwned ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Active Package
            </>
          ) : (
            <>
              <IndianRupee className="h-3.5 w-3.5" />
              Buy Package
            </>
          )}
        </button>
      </CardContent>
    </Card>
  );
}

// ── CheckoutDialog ────────────────────────────────────────────────────────────

type PayStep = "idle" | "processing" | "success" | "error";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as any).Razorpay) { resolve(true); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function CheckoutDialog({
  pkg,
  trainerName,
  open,
  onClose,
  onSuccess,
}: {
  pkg: PTPackageBrief | null;
  trainerName: string | null;
  open: boolean;
  onClose: () => void;
  onSuccess: (pkgName: string) => void;
}) {
  const qc = useQueryClient();
  const [step, setStep] = useState<PayStep>("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const price = pkg ? parseFloat(pkg.price) : 0;

  const handleClose = () => {
    if (step === "processing") return;
    setStep("idle"); setErrMsg(null); onClose();
  };

  const handlePay = async () => {
    if (!pkg) return;
    setStep("processing");
    setErrMsg(null);
    try {
      const order = await paymentsApi.createOrder({
        amount: parseFloat(pkg.price),
        currency: pkg.currency || "INR",
        description: `PT Package: ${pkg.name}`,
      });

      if (order.key_id === "mock_key_id") {
        // ── Mock mode: backend auto-verifies any non-empty signature ──
        await new Promise((r) => setTimeout(r, 700)); // brief realism delay
        await paymentsApi.verifyPayment({
          order_id: order.order_id,
          payment_id: `mock_pay_${Date.now()}`,
          signature: `mock_sig_${Date.now()}`,
        });
        await ptApi.purchasePackage(pkg.id, { payment_id: order.payment_id });
        qc.invalidateQueries({ queryKey: memberPortalKeys.all });
      } else {
        // ── Real Razorpay ──
        const loaded = await loadRazorpayScript();
        if (!loaded) throw new Error("Could not load Razorpay. Check your connection.");
        await new Promise<void>((resolve, reject) => {
          const options = {
            key: order.key_id,
            amount: order.amount,
            currency: order.currency,
            name: "GymPilot",
            description: pkg.name,
            order_id: order.order_id,
            handler: async (res: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
              try {
                await paymentsApi.verifyPayment({ order_id: res.razorpay_order_id, payment_id: res.razorpay_payment_id, signature: res.razorpay_signature });
                await ptApi.purchasePackage(pkg.id, { payment_id: order.payment_id });
                qc.invalidateQueries({ queryKey: memberPortalKeys.all });
                resolve();
              } catch (e) { reject(e); }
            },
            modal: { ondismiss: () => reject(new Error("dismissed")) },
            theme: { color: "#3b82f6" },
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.on("payment.failed", () => reject(new Error("Payment failed")));
          rzp.open();
        });
      }

      setStep("success");
      const pkgName = pkg.name;
      setTimeout(() => { setStep("idle"); setErrMsg(null); onClose(); onSuccess(pkgName); }, 2000);
    } catch (e: any) {
      if (e?.message === "dismissed") { setStep("idle"); return; }
      setErrMsg(e?.message || "Something went wrong. Please try again.");
      setStep("error");
    }
  };

  if (!pkg) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden" style={{ background: "hsl(222, 20%, 8%)" }}>
        <DialogTitle className="sr-only">Pay for {pkg.name}</DialogTitle>

        {/* ── Success ── */}
        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-14 gap-4">
            <div className="h-16 w-16 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.15)" }}>
              <CheckCircle2 className="h-8 w-8" style={{ color: "#10b981" }} />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-foreground">Payment Successful!</p>
              <p className="text-sm text-muted-foreground mt-1">Your PT credits have been added.</p>
            </div>
          </div>
        )}

        {/* ── Processing ── */}
        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Processing payment…</p>
          </div>
        )}

        {/* ── Error ── */}
        {step === "error" && (
          <div className="p-6 space-y-4">
            <div className="p-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
              {errMsg}
            </div>
            <div className="flex gap-2">
              <button onClick={handleClose} className="flex-1 rounded-lg py-2.5 text-sm text-muted-foreground border border-border">Cancel</button>
              <button onClick={() => { setStep("idle"); setErrMsg(null); }} className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white" style={{ background: "rgba(59,130,246,0.85)" }}>
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* ── Idle: order confirmation ── */}
        {step === "idle" && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="min-w-0 flex-1 mr-3">
                <p className="text-sm font-bold text-foreground truncate">{pkg.name}</p>
                {trainerName && <p className="text-xs text-muted-foreground truncate">{trainerName}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-foreground">₹{price.toLocaleString("en-IN")}</p>
                <div className="flex items-center gap-1 justify-end" style={{ color: "#10b981" }}>
                  <ShieldCheck className="h-3 w-3" />
                  <span className="text-[10px]">Secure</span>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Package summary */}
              <div className="rounded-lg p-3 space-y-1.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Sessions</span>
                  <span className="text-foreground font-medium">{pkg.session_count}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="text-foreground font-medium">{pkg.duration_minutes} min each</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Mode</span>
                  <span className="text-foreground font-medium">{sessionModeLabel(pkg.session_mode)}</span>
                </div>
                {pkg.expiry_days && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Valid for</span>
                    <span className="text-foreground font-medium">{pkg.expiry_days} days</span>
                  </div>
                )}
              </div>

              {/* Pay */}
              <button
                onClick={handlePay}
                className="w-full rounded-lg py-3 text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" }}
              >
                <Lock className="h-3.5 w-3.5" />
                Pay ₹{price.toLocaleString("en-IN")}
              </button>

              <button onClick={handleClose} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
                Cancel
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── TrainerDetailSheet ────────────────────────────────────────────────────────

function TrainerDetailSheet({
  gymTrainerId,
  open,
  onClose,
  onPurchased,
}: {
  gymTrainerId: string;
  open: boolean;
  onClose: () => void;
  onPurchased: (name: string) => void;
}) {
  const { data: profile, isLoading } = useTrainerPublicProfile(gymTrainerId);
  const { data: purchasesData } = useMyPTPurchases({ status: "active" });
  const [checkoutPkg, setCheckoutPkg] = useState<PTPackageBrief | null>(null);

  // Set of package IDs the member already has active
  const ownedPackageIds = new Set(
    (purchasesData?.items ?? []).map((p) => p.package_id)
  );

  const initial = profile?.trainer_name?.[0]?.toUpperCase() ?? "T";

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <DialogContent
          className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
          style={{ background: "hsl(220, 38%, 9%)" }}
        >
          {/* Accessibility title for loading/error states */}
          {(isLoading || !profile) && (
            <DialogHeader>
              <DialogTitle className="sr-only">
                {isLoading ? "Loading trainer profile…" : "Trainer Profile"}
              </DialogTitle>
            </DialogHeader>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !profile ? (
            <p className="p-6 text-center text-muted-foreground text-sm">Could not load trainer profile.</p>
          ) : (
            <div className="space-y-6 pb-6">
              <DialogHeader>
                <div className="flex items-center gap-4 pt-2">
                  <div
                    className="h-16 w-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" }}
                  >
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-lg font-bold text-foreground">
                      {profile.trainer_name ?? "Trainer"}
                    </DialogTitle>
                    {profile.years_of_experience != null && (
                      <p className="text-sm text-muted-foreground">
                        {profile.years_of_experience} yr{profile.years_of_experience !== 1 ? "s" : ""} experience
                      </p>
                    )}
                  </div>
                </div>
              </DialogHeader>

              {/* Contact */}
              {(profile.email || profile.phone) && (
                <div className="rounded-xl p-4 space-y-2" style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.15)" }}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Contact</p>
                  {profile.email && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="break-all">{profile.email}</span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Rate & capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.15)" }}>
                  <p className="text-[10px] text-muted-foreground mb-1">Hourly Rate</p>
                  <p className="text-base font-bold text-foreground">
                    {profile.hourly_rate ? `₹${parseFloat(profile.hourly_rate).toLocaleString("en-IN")}` : "—"}
                  </p>
                </div>
                <div className="rounded-xl p-3" style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.15)" }}>
                  <p className="text-[10px] text-muted-foreground mb-1">Max Sessions/Day</p>
                  <p className="text-base font-bold text-foreground">{profile.max_sessions_per_day ?? "—"}</p>
                </div>
              </div>

              {/* Available days */}
              {(() => {
                const days = getAvailableDays(profile.weekly_availability as GymTrainerContractResponse["weekly_availability"]);
                return days.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Available Days
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {days.map((day) => (
                        <span key={day} className="inline-flex items-center rounded-lg px-3 py-1 text-xs font-medium" style={{ background: "rgba(59,130,246,0.12)", color: "#93c5fd" }}>
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Availability notes */}
              {profile.availability_notes && (
                <div className="rounded-xl p-4" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.15)" }}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Availability Note
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{profile.availability_notes}</p>
                </div>
              )}

              {/* Bio */}
              {profile.bio && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" /> About
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {/* Specializations */}
              {profile.specializations.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5" /> Specializations
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.specializations.map((s) => (
                      <span key={s} className="inline-flex items-center rounded-lg px-3 py-1 text-xs font-medium" style={{ background: "rgba(139,92,246,0.12)", color: "#c4b5fd" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {profile.certifications.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5" /> Certifications
                  </p>
                  <div className="space-y-2">
                    {profile.certifications.map((c, i) => (
                      <div key={i} className="rounded-lg p-3 text-sm" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
                        <p className="font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{c.issuer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Training philosophy */}
              {profile.training_philosophy && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5" /> Training Philosophy
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed italic">&ldquo;{profile.training_philosophy}&rdquo;</p>
                </div>
              )}

              {/* Languages */}
              {profile.languages_spoken.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Languages className="h-3.5 w-3.5" /> Languages
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.languages_spoken.map((lang) => (
                      <span key={lang} className="inline-flex items-center rounded-lg px-3 py-1 text-xs font-medium" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* PT Packages */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" /> PT Packages
                </p>
                {profile.pt_packages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No packages available yet.</p>
                ) : (
                  <div className="space-y-3">
                    {profile.pt_packages.map((pkg) => (
                      <PackageCard
                        key={pkg.id}
                        pkg={pkg}
                        isOwned={ownedPackageIds.has(pkg.id)}
                        onBuy={() => setCheckoutPkg(pkg)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Razorpay checkout */}
      <CheckoutDialog
        pkg={checkoutPkg}
        trainerName={profile?.trainer_name ?? null}
        open={!!checkoutPkg}
        onClose={() => setCheckoutPkg(null)}
        onSuccess={(name) => {
          setCheckoutPkg(null);
          onPurchased(name);
        }}
      />
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TrainersPage() {
  const { data, isLoading } = useGymTrainers();
  const trainers = data?.trainers ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #3b82f620 0%, #10b98120 100%)" }}
            >
              <Users className="h-5 w-5" style={{ color: "#3b82f6" }} />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">Our Trainers</p>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Loading…" : trainers.length === 0
                  ? "No trainers available"
                  : `${trainers.length} active trainer${trainers.length !== 1 ? "s" : ""} · click to view profile & packages`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 rounded-xl animate-pulse" style={{ background: "hsl(var(--border))" }} />
          ))}
        </div>
      ) : trainers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No active trainers at this gym yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainers.map((trainer) => (
            <TrainerCard key={trainer.id} trainer={trainer} onClick={() => setSelectedId(trainer.id)} />
          ))}
        </div>
      )}

      {/* Detail sheet */}
      {selectedId && (
        <TrainerDetailSheet
          gymTrainerId={selectedId}
          open={!!selectedId}
          onClose={() => setSelectedId(null)}
          onPurchased={(name) => {
            setSelectedId(null);
            showToast(`"${name}" purchased! Check PT Sessions for your credits.`);
          }}
        />
      )}

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
