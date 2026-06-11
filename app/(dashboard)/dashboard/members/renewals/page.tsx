"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, RefreshCw, Search, ChevronLeft, ChevronRight, X, Calendar, CheckCircle, AlertCircle, Clock, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMembers, useMembershipRenew, useMemberRemind } from "@/lib/hooks/use-members";
import { fmtDate, initials } from "@/lib/utils/formatting";
import { useMembershipPlans } from "@/lib/hooks/use-membership-plans";
import { useDashboard } from "@/lib/hooks/use-reports";

// ── helpers ───────────────────────────────────────────────────────────────────

function daysUntil(d: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, mo, day] = d.split("-").map(Number);
  const end = new Date(y, mo - 1, day);
  return Math.round((end.getTime() - today.getTime()) / 86400000);
}

function daysSince(d: string): number {
  return Math.floor((Date.now() - new Date(d + "T00:00:00").getTime()) / 86400000);
}

const PAGE_SIZE = 20;

// ── Renew Dialog ──────────────────────────────────────────────────────────────

interface RenewDialogProps {
  userId: string;
  memberName: string;
  currentPlan: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

function RenewDialog({ userId, memberName, currentPlan, onClose, onSuccess }: RenewDialogProps) {
  const { data: plansData } = useMembershipPlans({}, true);
  const renewMembership = useMembershipRenew();
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [error, setError] = useState("");

  const activePlans = (plansData?.items ?? []).filter(p => p.status === "active");

  const handleRenew = async () => {
    if (!selectedPlanId) { setError("Please select a plan."); return; }
    setError("");
    try {
      await renewMembership.mutateAsync({ userId, payload: { plan_id: selectedPlanId } });
      onSuccess();
      onClose();
    } catch {
      setError("Failed to renew membership. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
      <div className="rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>

        {/* Dialog header */}
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid hsl(var(--border))", background: "rgba(16,185,129,0.05)" }}>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.12)" }}>
              <RefreshCw className="h-4 w-4" style={{ color: "#10b981" }} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Renew Membership</p>
              <p className="text-[11px] text-muted-foreground">{memberName}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5">
          {/* Current plan pill */}
          {currentPlan && (
            <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)" }}>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Current</span>
              <span className="text-xs font-bold" style={{ color: "#10b981" }}>{currentPlan}</span>
            </div>
          )}

          {/* Plan selector */}
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Choose Plan</p>
          <div className="space-y-1.5 max-h-52 overflow-y-auto -mx-1 px-1">
            {activePlans.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No active plans available</p>
            ) : activePlans.map(plan => {
              const selected = selectedPlanId === plan.id;
              return (
                <button key={plan.id} onClick={() => setSelectedPlanId(plan.id)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all"
                  style={selected
                    ? { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.4)" }
                    : { background: "hsl(var(--muted)/0.5)", border: "1px solid transparent" }
                  }>
                  <div className="flex items-center gap-2.5">
                    <div className="h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                      style={selected
                        ? { borderColor: "#10b981", background: "#10b981" }
                        : { borderColor: "hsl(var(--border))" }
                      }>
                      {selected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{plan.name}</p>
                      {plan.duration_days ? (
                        <p className="text-[10px] text-muted-foreground">{plan.duration_days}d duration</p>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-xs font-bold flex-shrink-0 ml-3"
                    style={{ color: selected ? "#10b981" : "hsl(var(--foreground))" }}>
                    ₹{Number(plan.price).toLocaleString("en-IN")}
                  </p>
                </button>
              );
            })}
          </div>

          {error && <p className="text-[11px] text-red-400 mt-3">{error}</p>}

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
              Cancel
            </button>
            <button onClick={handleRenew} disabled={renewMembership.isPending || !selectedPlanId}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
              {renewMembership.isPending ? "Renewing…" : "Confirm Renewal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Member Card ────────────────────────────────────────────────────────────────

interface MemberCardProps {
  userId: string;
  name: string;
  planName: string | null;
  endDate: string | null;
  startDate?: string | null;
  badge: "expiring" | "expired";
  onRenew: (userId: string, name: string, planName: string | null) => void;
  onRemind: (userId: string, name: string) => void;
  remindedIds: Set<string>;
  remindingId: string | null;
}

function MemberCard({ userId, name, planName, endDate, startDate, badge, onRenew, onRemind, remindedIds, remindingId }: MemberCardProps) {
  const days = endDate
    ? badge === "expiring" ? daysUntil(endDate) : daysSince(endDate)
    : null;
  const urgent = badge === "expired" || (days !== null && days <= 2);

  const accentColor = badge === "expired" ? "#ef4444" : urgent ? "#ef4444" : "#f59e0b";
  const chipBg = badge === "expired"
    ? "rgba(239,68,68,0.1)"
    : urgent ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)";

  const planDays = (startDate && endDate)
    ? Math.ceil(
        (new Date(endDate + "T00:00:00").getTime() - new Date(startDate + "T00:00:00").getTime()) / 86400000
      )
    : null;
  const isShortPlan = planDays !== null && planDays < 7;

  const chipLabel = badge === "expired"
    ? days === 0 ? "Today" : `${days}d ago`
    : days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days}d left`;

  const reminded = remindedIds.has(userId);
  const isReminding = remindingId === userId;

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02]"
      style={{ borderBottom: "1px solid hsl(var(--border)/0.6)" }}>

      {/* Left accent + avatar */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-0.5 h-10 rounded-full flex-shrink-0"
          style={{ background: accentColor, opacity: 0.7 }} />
        <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: `${accentColor}18`, color: accentColor }}>
          {initials(name.split(" ")[0], name.split(" ")[1])}
        </div>
      </div>

      {/* Name + plan */}
      <div className="flex-1 min-w-0">
        <Link href={`/dashboard/members/${userId}`}
          className="text-sm font-semibold text-foreground hover:underline block truncate leading-tight">
          {name}
        </Link>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] text-muted-foreground truncate">
            {planName ?? "—"}
          </span>
          {isShortPlan && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.25)" }}>
              {planDays}d pass
            </span>
          )}
        </div>
      </div>

      {/* Date — hidden on mobile */}
      {endDate && (
        <div className="flex-shrink-0 text-right hidden sm:block">
          <p className="text-[10px] text-muted-foreground mb-0.5">
            {badge === "expiring" ? "Expires" : "Expired"}
          </p>
          <p className="text-xs font-bold" style={{ color: accentColor }}>{fmtDate(endDate)}</p>
        </div>
      )}

      {/* Days chip */}
      {days !== null && (
        <span className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full"
          style={{ background: chipBg, color: accentColor }}>
          {chipLabel}
        </span>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Remind button — only for expired members */}
        {badge === "expired" && (
          <button
            onClick={() => onRemind(userId, name)}
            disabled={isReminding || reminded}
            title={reminded ? "Reminder already sent today (1 per day limit)" : "Send renewal reminder"}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={reminded
              ? { background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }
              : { background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }
            }>
            <Bell className="h-3 w-3" />
            {isReminding ? "…" : reminded ? "Sent" : "Remind"}
          </button>
        )}

        {/* Renew button */}
        <button
          onClick={() => onRenew(userId, name, planName)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
          <RefreshCw className="h-3 w-3" />
          Renew
        </button>
      </div>
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  count: number;
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function Section({ title, count, label, color, bgColor, icon, children, footer }: SectionProps) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: `1px solid ${color}40` }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5"
        style={{ background: bgColor, borderBottom: `1px solid ${color}25` }}>
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center"
            style={{ background: `${color}20` }}>
            {icon}
          </div>
          <span className="text-sm font-bold text-foreground">{title}</span>
          <span className="h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ background: `${color}22`, color }}>
            {count}
          </span>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      </div>
      {children}
      {footer}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RenewalsPage() {
  const searchParams = useSearchParams();
  // ?days=N passed from dashboard "View All" — show only expiring section
  const daysParam = searchParams.get("days");
  const expiringOnlyMode = daysParam !== null;
  const expiringDaysFilter = daysParam ? Math.max(1, Math.min(30, Number(daysParam))) : 30;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [renewTarget, setRenewTarget] = useState<{
    userId: string; name: string; planName: string | null;
  } | null>(null);
  const [successIds, setSuccessIds] = useState<Set<string>>(new Set());
  const [remindedIds, setRemindedIds] = useState<Set<string>>(new Set());
  const [remindingId, setRemindingId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Seed remindedIds from localStorage on mount (persists across page reloads)
  useEffect(() => {
    const now = Date.now();
    const seeded = new Set<string>();
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith("gp_remind_")) {
        const expiry = Number(localStorage.getItem(key));
        if (expiry > now) {
          seeded.add(key.slice("gp_remind_".length));
        } else {
          localStorage.removeItem(key); // clean up expired entries
        }
      }
    }
    if (seeded.size > 0) setRemindedIds(seeded);
  }, []);

  const { data: dash } = useDashboard();
  const remind = useMemberRemind();
  const { data: expiredData, isLoading: expiredLoading } = useMembers({
    status: "expired",
    page,
    page_size: PAGE_SIZE,
    search: debouncedSearch || undefined,
  });

  const expiringSoon = (dash?.expiring_soon_members ?? []).filter(
    m => !successIds.has(m.user_id) &&
      daysUntil(String(m.end_date)) <= expiringDaysFilter &&
      (!search || m.name.toLowerCase().includes(search.toLowerCase()))
  );

  const expiredMembers = (expiredData?.items ?? []).filter(
    m => !successIds.has(m.user_id)
  );

  const openRenewDialog = (userId: string, name: string, planName: string | null) => {
    setRenewTarget({ userId, name, planName });
  };

  const handleRenewSuccess = () => {
    if (renewTarget) setSuccessIds(prev => new Set(prev).add(renewTarget.userId));
  };

  const handleRemind = async (userId: string, _name: string) => {
    setRemindingId(userId);
    try {
      const result = await remind.mutateAsync(userId);
      // Mark as reminded whether sent or rate-limited — either way button should lock
      if (result.sent || result.reason === "rate_limited") {
        setRemindedIds(prev => new Set(prev).add(userId));
        // Persist for 24h so button stays locked across page reloads
        localStorage.setItem(`gp_remind_${userId}`, String(Date.now() + 86400000));
      }
    } catch {
      // fire-and-forget — silently fail on network error
    } finally {
      setRemindingId(null);
    }
  };

  const totalNeedRenewal = expiringSoon.length + (expiredData?.total ?? 0);

  // Page title adapts to mode
  const pageTitle = expiringOnlyMode
    ? `Expiring in ${expiringDaysFilter} Days`
    : "Membership Renewals";
  const pageSubtitle = expiringOnlyMode
    ? `${expiringSoon.length} member${expiringSoon.length !== 1 ? "s" : ""} expiring soon`
    : totalNeedRenewal > 0
      ? `${totalNeedRenewal} members need attention`
      : "All memberships are active";

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link href={expiringOnlyMode ? "/dashboard" : "/dashboard/members"}
          className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
          style={{ border: "1px solid hsl(var(--border))" }}>
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight gradient-text">{pageTitle}</h1>
          <p className="text-[11px] text-muted-foreground">{pageSubtitle}</p>
        </div>
      </div>

      {/* ── Summary chips (full mode only) ──────────────────────────────── */}
      {!expiringOnlyMode && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <Clock className="h-3 w-3" style={{ color: "#f59e0b" }} />
            <span className="text-[11px] font-semibold" style={{ color: "#f59e0b" }}>
              {expiringSoon.length} expiring this week
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle className="h-3 w-3" style={{ color: "#ef4444" }} />
            <span className="text-[11px] font-semibold" style={{ color: "#ef4444" }}>
              {expiredData?.total ?? 0} expired
            </span>
          </div>
        </div>
      )}

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by member name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        />
      </div>

      {/* ── Section 1: Expiring Soon ─────────────────────────────────────── */}
      {expiringSoon.length > 0 && (
        <Section
          title="Expiring Soon"
          count={expiringSoon.length}
          label={expiringOnlyMode ? `Within ${expiringDaysFilter} days` : "Within 7 days"}
          color="#f59e0b"
          bgColor="rgba(245,158,11,0.05)"
          icon={<Calendar className="h-3.5 w-3.5" style={{ color: "#f59e0b" }} />}
        >
          {expiringSoon.map(m => (
            <MemberCard
              key={m.participant_id}
              userId={m.user_id}
              name={m.name}
              planName={m.plan_name}
              endDate={String(m.end_date)}
              badge="expiring"
              onRenew={openRenewDialog}
              onRemind={handleRemind}
              remindedIds={remindedIds}
              remindingId={remindingId}
            />
          ))}
        </Section>
      )}

      {expiringSoon.length === 0 && expiringOnlyMode && (
        <div className="rounded-2xl py-12 text-center"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <CheckCircle className="h-8 w-8 mx-auto mb-2" style={{ color: "#10b981", opacity: 0.5 }} />
          <p className="text-sm font-semibold text-foreground mb-0.5">
            {search ? "No results found" : "No memberships expiring soon"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {search ? "Try a different search term" : `No members expiring within ${expiringDaysFilter} days`}
          </p>
        </div>
      )}

      {/* ── Section 2: Expired (hidden in expiring-only mode) ────────────── */}
      {!expiringOnlyMode && (
        <Section
          title="Lapsed Members"
          count={expiredData?.total ?? 0}
          label="Membership ended"
          color="#ef4444"
          bgColor="rgba(239,68,68,0.05)"
          icon={<AlertCircle className="h-3.5 w-3.5" style={{ color: "#ef4444" }} />}
          footer={
            expiredData && expiredData.total_pages > 1 ? (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {Math.min((page - 1) * PAGE_SIZE + 1, expiredData.total)}–{Math.min(page * PAGE_SIZE, expiredData.total)} of {expiredData.total} member{expiredData.total !== 1 ? "s" : ""}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-1">{page} / {expiredData.total_pages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(expiredData.total_pages, p + 1))} disabled={page === expiredData.total_pages}>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null
          }
        >
          {expiredLoading ? (
            <div className="py-10 text-center text-xs text-muted-foreground">Loading…</div>
          ) : expiredMembers.length === 0 ? (
            <div className="py-10 text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2" style={{ color: "#10b981", opacity: 0.5 }} />
              <p className="text-sm font-semibold text-foreground mb-0.5">
                {search ? "No results found" : "No lapsed members"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {search ? "Try a different search term" : "All members have active memberships"}
              </p>
            </div>
          ) : (
            expiredMembers.map(m => (
              <MemberCard
                key={m.user_id}
                userId={m.user_id}
                name={[m.first_name, m.last_name].filter(Boolean).join(" ") || "Unknown"}
                planName={null}
                endDate={m.membership_end_date ?? null}
                startDate={m.membership_start_date}
                badge="expired"
                onRenew={openRenewDialog}
                onRemind={handleRemind}
                remindedIds={remindedIds}
                remindingId={remindingId}
              />
            ))
          )}
        </Section>
      )}

      {/* ── Renew Dialog ─────────────────────────────────────────────────── */}
      {renewTarget && (
        <RenewDialog
          userId={renewTarget.userId}
          memberName={renewTarget.name}
          currentPlan={renewTarget.planName}
          onClose={() => setRenewTarget(null)}
          onSuccess={handleRenewSuccess}
        />
      )}
    </div>
  );
}
