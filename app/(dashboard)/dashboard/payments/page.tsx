"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  CreditCard,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Receipt,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Banknote,
  Smartphone,
  Building2,
  ArrowDownLeft,
  Plus,
  Download,
} from "lucide-react";
import { usePayments, usePaymentCreate, usePaymentRefund } from "@/lib/hooks/use-payments";
import { exportPaymentsToCSV } from "@/lib/utils/csv-export";
import { useMembers } from "@/lib/hooks/use-members";
import type {
  PaymentResponse,
  MemberListItem,
  PaymentMethod,
  PaymentStatus,
  PaymentListParams,
} from "@/types/api";

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtAmount(val: string | number) {
  const n = typeof val === "string" ? parseFloat(val) : val;
  return "Rs. " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function initials(first?: string, last?: string | null) {
  return ((first?.[0] ?? "") + (last?.[0] ?? "")).toUpperCase() || "?";
}

// ── Method config ─────────────────────────────────────────────────────────────

const METHOD_CONFIG: Record<PaymentMethod, { label: string; icon: React.FC<{ className?: string }>; color: string; bg: string }> = {
  cash: { label: "Cash", icon: Banknote, color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  upi: { label: "UPI", icon: Smartphone, color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  card: { label: "Card", icon: CreditCard, color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  bank_transfer: { label: "Bank", icon: Building2, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  other: { label: "Other", icon: ArrowDownLeft, color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
};

// ── Status config ─────────────────────────────────────────────────────────────

type StatusConfig = { label: string; icon: React.FC<{ className?: string }>; color: string; bg: string };
const STATUS_CONFIG: Record<PaymentStatus, StatusConfig> = {
  completed: { label: "Completed", icon: CheckCircle2, color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  pending: { label: "Pending", icon: Clock, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  processing: { label: "Processing", icon: Clock, color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  failed: { label: "Failed", icon: AlertCircle, color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  refunded: { label: "Refunded", icon: RotateCcw, color: "#f97316", bg: "rgba(249,115,22,0.12)" },
};

// ── Member Search Dropdown (for Record Payment dialog) ────────────────────────

interface MemberSearchProps {
  value: MemberListItem | null;
  onChange: (m: MemberListItem | null) => void;
}

function MemberSearchInput({ value, onChange }: MemberSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data } = useMembers({ search: query.trim() || undefined, page_size: 8 });
  const results = data?.items ?? [];

  useEffect(() => {
    setOpen(!!query.trim() && results.length > 0);
  }, [query, results.length]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  if (value) {
    return (
      <div
        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
        style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
      >
        <div
          className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
          style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}
        >
          {initials(value.first_name, value.last_name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {value.first_name} {value.last_name ?? ""}
          </p>
          <p className="text-[10px] text-muted-foreground">{value.phone ?? value.email ?? "—"}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="h-5 w-5 rounded-full flex items-center justify-center hover:bg-muted flex-shrink-0"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search member by name…"
          className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground"
          style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }}
          autoComplete="off"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full flex items-center justify-center hover:bg-muted">
            <X className="h-2.5 w-2.5 text-muted-foreground" />
          </button>
        )}
      </div>
      {open && (
        <div
          className="absolute top-full mt-1 left-0 right-0 z-50 rounded-xl shadow-2xl overflow-hidden"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          {results.map((m) => (
            <button
              key={m.participant_id}
              type="button"
              onClick={() => { onChange(m); setQuery(""); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/[0.04] transition-colors"
              style={{ borderBottom: "1px solid hsl(var(--border)/0.5)" }}
            >
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}
              >
                {initials(m.first_name, m.last_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {m.first_name} {m.last_name ?? ""}
                </p>
                <p className="text-[10px] text-muted-foreground">{m.phone ?? m.email ?? "—"}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Record Payment Dialog ─────────────────────────────────────────────────────

interface RecordPaymentDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

function RecordPaymentDialog({ onClose, onSuccess }: RecordPaymentDialogProps) {
  const [member, setMember] = useState<MemberListItem | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [txRef, setTxRef] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const create = usePaymentCreate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!member) { setError("Please select a member."); return; }
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) { setError("Enter a valid amount."); return; }

    try {
      await create.mutateAsync({
        participant_id: member.participant_id,
        amount: amt,
        payment_method: method,
        transaction_reference: txRef.trim() || null,
        notes: notes.trim() || null,
      });
      onSuccess();
      onClose();
    } catch {
      setError("Failed to record payment. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          <div>
            <h2 className="text-sm font-bold text-foreground">Record Payment</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Log a cash or manual payment</p>
          </div>
          <button onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Member */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Member *</label>
            <MemberSearchInput value={member} onChange={setMember} />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Amount (INR) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">Rs.</span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground"
                style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }}
              />
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Payment Method *</label>
            <div className="grid grid-cols-5 gap-1.5">
              {(Object.keys(METHOD_CONFIG) as PaymentMethod[]).map((m) => {
                const cfg = METHOD_CONFIG[m];
                const Icon = cfg.icon;
                const sel = method === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className="flex flex-col items-center gap-1 rounded-xl py-2 px-1 transition-all text-[10px] font-semibold"
                    style={{
                      background: sel ? cfg.bg : "hsl(var(--muted)/0.3)",
                      border: sel ? `1px solid ${cfg.color}40` : "1px solid hsl(var(--border)/0.5)",
                      color: sel ? cfg.color : "hsl(var(--muted-foreground))",
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transaction Reference */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Transaction Reference <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={txRef}
              onChange={(e) => setTxRef(e.target.value)}
              placeholder="UPI ref, cheque no., etc."
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground"
              style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Notes <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes…"
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground resize-none"
              style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
              style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
              style={{ border: "1px solid hsl(var(--border))" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
            >
              {create.isPending ? "Recording…" : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Refund Dialog ─────────────────────────────────────────────────────────────

interface RefundDialogProps {
  payment: PaymentResponse;
  memberName: string;
  onClose: () => void;
  onSuccess: () => void;
}

function RefundDialog({ payment, memberName, onClose, onSuccess }: RefundDialogProps) {
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const refund = usePaymentRefund();

  const handleConfirm = async () => {
    setError("");
    try {
      await refund.mutateAsync({ paymentId: payment.id, payload: { notes: notes.trim() || null } });
      onSuccess();
      onClose();
    } catch {
      setError("Failed to process refund. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-sm rounded-2xl shadow-2xl"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          <h2 className="text-sm font-bold text-foreground">Mark as Refunded</h2>
          <button onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-xl p-3 space-y-1"
            style={{ background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.2)" }}>
            <p className="text-xs font-semibold text-foreground">
              {fmtAmount(payment.amount)} — {memberName}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Receipt #{payment.receipt_number} · {fmtDate(payment.created_at)}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Refund Notes <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for refund…"
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground resize-none"
              style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }}
            />
          </div>

          {error && (
            <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>
          )}

          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
              style={{ border: "1px solid hsl(var(--border))" }}>
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={refund.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}
            >
              {refund.isPending ? "Processing…" : "Confirm Refund"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Payment Row ───────────────────────────────────────────────────────────────

interface PaymentRowProps {
  payment: PaymentResponse;
  member?: MemberListItem;
  onRefund: () => void;
}

function PaymentRow({ payment, member, onRefund }: PaymentRowProps) {
  const methodCfg = METHOD_CONFIG[payment.payment_method] ?? METHOD_CONFIG.other;
  const statusCfg = STATUS_CONFIG[payment.status] ?? STATUS_CONFIG.pending;
  const MethodIcon = methodCfg.icon;
  const StatusIcon = statusCfg.icon;
  const name = member ? `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim() : "Unknown Member";

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5"
      style={{ borderBottom: "1px solid hsl(var(--border)/0.6)" }}
    >
      {/* Avatar */}
      <div
        className="h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
        style={{ background: methodCfg.bg, color: methodCfg.color }}
      >
        {member ? initials(member.first_name, member.last_name) : <MethodIcon className="h-4 w-4" />}
      </div>

      {/* Name + receipt */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate leading-tight">{name}</p>
        <p className="text-[10px] text-muted-foreground">#{payment.receipt_number}</p>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0 hidden sm:block">
        <p className="text-sm font-bold text-foreground">{fmtAmount(payment.amount)}</p>
        <div className="flex items-center gap-1 justify-end mt-0.5">
          <MethodIcon className="h-2.5 w-2.5" style={{ color: methodCfg.color }} />
          <span className="text-[10px]" style={{ color: methodCfg.color }}>{methodCfg.label}</span>
        </div>
      </div>

      {/* Status */}
      <div
        className="flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0"
        style={{ background: statusCfg.bg }}
      >
        <StatusIcon className="h-2.5 w-2.5" style={{ color: statusCfg.color }} />
        <span className="text-[10px] font-semibold" style={{ color: statusCfg.color }}>
          {statusCfg.label}
        </span>
      </div>

      {/* Date */}
      <div className="text-right flex-shrink-0 hidden md:block min-w-[80px]">
        <p className="text-[11px] font-medium text-foreground">{fmtDate(payment.created_at)}</p>
        <p className="text-[10px] text-muted-foreground">{fmtTime(payment.created_at)}</p>
      </div>

      {/* Refund button */}
      {payment.status === "completed" && (
        <button
          onClick={onRefund}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold flex-shrink-0 transition-all hover:opacity-80"
          style={{ background: "rgba(249,115,22,0.1)", color: "#f97316", border: "1px solid rgba(249,115,22,0.2)" }}
        >
          <RotateCcw className="h-3 w-3" />
          Refund
        </button>
      )}
      {payment.status !== "completed" && <div className="w-[68px] flex-shrink-0 hidden sm:block" />}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-2xl text-sm font-semibold text-white"
      style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
    >
      <CheckCircle2 className="h-4 w-4" />
      {message}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const METHOD_TABS: { label: string; value: PaymentMethod | "" }[] = [
  { label: "All", value: "" },
  { label: "Cash", value: "cash" },
  { label: "UPI", value: "upi" },
  { label: "Card", value: "card" },
  { label: "Bank", value: "bank_transfer" },
];

const STATUS_OPTIONS: { label: string; value: PaymentStatus | "" }[] = [
  { label: "All Status", value: "" },
  { label: "Completed", value: "completed" },
  { label: "Pending", value: "pending" },
  { label: "Refunded", value: "refunded" },
  { label: "Failed", value: "failed" },
];

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "">("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("");
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [refundTarget, setRefundTarget] = useState<PaymentResponse | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const params: PaymentListParams = {
    page,
    page_size: 20,
    ...(methodFilter && { payment_method: methodFilter }),
    ...(statusFilter && { status: statusFilter }),
  };

  const { data: paymentsData, isLoading } = usePayments(params);
  // Fetch members for participant_id → name lookup
  const { data: membersData } = useMembers({ page_size: 100 });

  const payments = paymentsData?.items ?? [];
  const members = membersData?.items ?? [];
  const total = paymentsData?.total ?? 0;
  const totalPages = paymentsData?.total_pages ?? 1;

  // Build lookup map: participant_id → MemberListItem
  const memberMap = useMemo(() => {
    const map = new Map<string, MemberListItem>();
    members.forEach((m) => map.set(m.participant_id, m));
    return map;
  }, [members]);

  // Compute stat summary from current page (approximate - full dataset stats would need a backend endpoint)
  const completedCount = payments.filter((p) => p.status === "completed").length;
  const refundedCount = payments.filter((p) => p.status === "refunded").length;
  const totalRevenue = payments
    .filter((p) => p.status === "completed")
    .reduce((acc, p) => acc + parseFloat(p.amount), 0);

  // Reset to page 1 when filters change
  const handleMethodFilter = (v: PaymentMethod | "") => { setMethodFilter(v); setPage(1); };
  const handleStatusFilter = (v: PaymentStatus | "") => { setStatusFilter(v); setPage(1); };

  return (
    <div className="space-y-5">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-foreground leading-tight">Payments</h1>
          <p className="text-[11px] text-muted-foreground">
            {total > 0 ? `${total} transactions` : "No transactions yet"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportPaymentsToCSV(payments)}
            disabled={payments.length === 0}
            className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-sm font-semibold border border-border text-muted-foreground transition-all hover:text-foreground hover:border-foreground/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => setShowRecordDialog(true)}
            className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
          >
            <Plus className="h-3.5 w-3.5" />
            Record Payment
          </button>
        </div>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Total Transactions",
            value: total,
            sub: "across all filters",
            icon: Receipt,
            color: "#3b82f6",
            bg: "rgba(59,130,246,0.1)",
          },
          {
            label: "Completed (page)",
            value: completedCount,
            sub: "on this page",
            icon: CheckCircle2,
            color: "#10b981",
            bg: "rgba(16,185,129,0.1)",
          },
          {
            label: "Revenue (page)",
            value: fmtAmount(totalRevenue),
            sub: "completed payments",
            icon: CreditCard,
            color: "#8b5cf6",
            bg: "rgba(139,92,246,0.1)",
          },
          {
            label: "Refunded (page)",
            value: refundedCount,
            sub: "on this page",
            icon: RotateCcw,
            color: "#f97316",
            bg: "rgba(249,115,22,0.1)",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl px-4 py-3.5"
              style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-6 w-6 rounded-lg flex items-center justify-center"
                  style={{ background: card.bg }}>
                  <Icon className="h-3.5 w-3.5" style={{ color: card.color }} />
                </div>
                <p className="text-[11px] text-muted-foreground font-medium">{card.label}</p>
              </div>
              <p className="text-xl font-bold text-foreground leading-tight">{card.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Method tabs */}
        <div
          className="flex items-center rounded-xl p-0.5 gap-0.5"
          style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }}
        >
          {METHOD_TABS.map((tab) => {
            const active = methodFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => handleMethodFilter(tab.value as PaymentMethod | "")}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={active ? {
                  background: "rgba(16,185,129,0.15)",
                  color: "#10b981",
                  border: "1px solid rgba(16,185,129,0.25)",
                } : {
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilter(e.target.value as PaymentStatus | "")}
          className="h-8 px-3 rounded-xl text-[11px] font-semibold outline-none cursor-pointer text-foreground"
          style={{
            background: "hsl(var(--muted)/0.5)",
            border: "1px solid hsl(var(--border))",
          }}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Active filter indicators */}
        {(methodFilter || statusFilter) && (
          <button
            onClick={() => { setMethodFilter(""); setStatusFilter(""); setPage(1); }}
            className="flex items-center gap-1 h-8 px-2.5 rounded-xl text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
            style={{ border: "1px solid hsl(var(--border))" }}
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* ── Payments List ─────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        {/* List header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}
        >
          <p className="text-xs font-bold text-foreground">Transactions</p>
          {isLoading && (
            <div className="h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          )}
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">Loading…</div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center">
            <div
              className="h-12 w-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(16,185,129,0.08)" }}
            >
              <CreditCard className="h-6 w-6" style={{ color: "#10b981" }} />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">No payments found</p>
            <p className="text-[11px] text-muted-foreground">
              {methodFilter || statusFilter ? "Try adjusting your filters." : "Record the first payment to get started."}
            </p>
          </div>
        ) : (
          payments.map((p) => (
            <PaymentRow
              key={p.id}
              payment={p}
              member={memberMap.get(p.participant_id)}
              onRefund={() => setRefundTarget(p)}
            />
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: "1px solid hsl(var(--border))" }}
          >
            <p className="text-[11px] text-muted-foreground">
              Page {page} of {totalPages} · {total} total
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5 text-foreground" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30"
              >
                <ChevronRight className="h-3.5 w-3.5 text-foreground" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Dialogs ───────────────────────────────────────────────────────── */}
      {showRecordDialog && (
        <RecordPaymentDialog
          onClose={() => setShowRecordDialog(false)}
          onSuccess={() => setToast("Payment recorded successfully!")}
        />
      )}

      {refundTarget && (
        <RefundDialog
          payment={refundTarget}
          memberName={(() => {
            const m = memberMap.get(refundTarget.participant_id);
            return m ? `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() : "Unknown Member";
          })()}
          onClose={() => setRefundTarget(null)}
          onSuccess={() => setToast("Payment marked as refunded.")}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
