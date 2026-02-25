"use client";

import { useState } from "react";
import { UserPlus, X, ChevronRight, Users, CheckCircle, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAllParticipants } from "@/lib/hooks/use-members";
import { useTrainerCreate } from "@/lib/hooks/use-trainers";
import { useMemberOnboard } from "@/lib/hooks/use-members";
import { AddPersonDialog, type AddPersonPayload } from "@/components/participants/add-person-dialog";
import type { ParticipantRole, ParticipantSummary } from "@/types/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(first: string | null, last: string | null) {
  return ((first?.[0] ?? "") + (last?.[0] ?? "")).toUpperCase() || "?";
}

function fullName(p: ParticipantSummary) {
  return [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unnamed";
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ── Role badge ─────────────────────────────────────────────────────────────────

const ROLE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  member:  { bg: "rgba(16,185,129,0.12)",  text: "#10b981", label: "Member" },
  trainer: { bg: "rgba(139,92,246,0.12)",  text: "#8b5cf6", label: "Trainer" },
  staff:   { bg: "rgba(59,130,246,0.12)",  text: "#3b82f6", label: "Staff" },
  admin:   { bg: "rgba(245,158,11,0.12)",  text: "#f59e0b", label: "Admin" },
  owner:   { bg: "rgba(239,68,68,0.1)",    text: "#ef4444", label: "Owner" },
};

function RoleBadge({ role }: { role: string }) {
  const s = ROLE_STYLES[role] ?? { bg: "rgba(156,163,175,0.12)", text: "#9ca3af", label: role };
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

// ── Detail Panel ───────────────────────────────────────────────────────────────

function DetailPanel({
  person,
  onClose,
}: {
  person: ParticipantSummary;
  onClose: () => void;
}) {
  const router = useRouter();
  const name = fullName(person);
  const avatarColor = person.roles.includes("trainer")
    ? { bg: "rgba(139,92,246,0.12)", text: "#8b5cf6" }
    : { bg: "rgba(16,185,129,0.12)", text: "#10b981" };

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-sm shadow-2xl"
      style={{ background: "hsl(var(--card))", borderLeft: "1px solid hsl(var(--border))" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid hsl(var(--border))" }}
      >
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: avatarColor.bg, color: avatarColor.text }}
        >
          {initials(person.first_name, person.last_name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Joined {fmtDate(person.joined_at)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Roles */}
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Roles</p>
          <div className="flex flex-wrap gap-1.5">
            {person.roles.length > 0
              ? person.roles.map((r) => <RoleBadge key={r} role={r} />)
              : <span className="text-[11px] text-muted-foreground">No roles assigned</span>
            }
          </div>
        </div>

        {/* Contact */}
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Contact</p>
          <div className="space-y-1.5">
            {person.email && (
              <p className="text-xs text-foreground">{person.email}</p>
            )}
            {person.phone && (
              <p className="text-xs text-foreground">{person.phone}</p>
            )}
            {!person.email && !person.phone && (
              <p className="text-xs text-muted-foreground">No contact info</p>
            )}
          </div>
        </div>

        {/* Status */}
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Status</p>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={
              person.status === "active"
                ? { background: "rgba(16,185,129,0.12)", color: "#10b981" }
                : { background: "rgba(239,68,68,0.1)", color: "#ef4444" }
            }
          >
            {person.status.charAt(0).toUpperCase() + person.status.slice(1)}
          </span>
        </div>

        {/* Role-specific management links */}
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Manage</p>
          <div className="space-y-2">
            {person.roles.includes("member") && (
              <button
                onClick={() => router.push(`/dashboard/members/${person.user_id}`)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all hover:opacity-80"
                style={{ background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
              >
                <span>Manage Membership</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
            {person.roles.includes("trainer") && (
              <button
                onClick={() => router.push("/dashboard/trainers")}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all hover:opacity-80"
                style={{ background: "rgba(139,92,246,0.08)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.2)" }}
              >
                <span>View in Trainers</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
            {(person.roles.includes("staff") || person.roles.includes("admin")) && (
              <button
                onClick={() => router.push("/dashboard/staff")}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all hover:opacity-80"
                style={{ background: "rgba(59,130,246,0.08)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}
              >
                <span>View in Staff</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Role filter chips ──────────────────────────────────────────────────────────

const ROLE_FILTERS: { label: string; value: ParticipantRole | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Member", value: "member" },
  { label: "Trainer", value: "trainer" },
  { label: "Staff", value: "staff" },
  { label: "Admin", value: "admin" },
];

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ParticipantsPage() {
  const [roleFilter, setRoleFilter] = useState<ParticipantRole | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<ParticipantSummary | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { data, isLoading } = useAllParticipants({
    search: debouncedSearch || undefined,
    role: roleFilter,
    page_size: 50,
  });

  const create = useTrainerCreate();
  const onboard = useMemberOnboard();

  const participants = data?.participants ?? [];

  // Debounce search
  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__participantSearchTimeout);
    (window as any).__participantSearchTimeout = setTimeout(() => {
      setDebouncedSearch(val);
    }, 300);
  };

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  const handleAddPerson = async (payload: AddPersonPayload) => {
    setAddError(null);
    const { first_name, last_name, email, phone, roles, trainer, member } = payload;

    try {
      const isTrainer = roles.includes("trainer");
      const nonTrainerRoles = roles.filter((r) => r !== "trainer");

      if (isTrainer) {
        await create.mutateAsync({
          first_name,
          last_name,
          email,
          phone: phone || undefined,
          onboarding_date: trainer!.onboarding_date,
          weekly_availability: trainer!.weekly_availability,
        });
      }

      if (nonTrainerRoles.length > 0) {
        const memberPayload: any = {
          first_name,
          last_name,
          email: email || undefined,
          phone,
          roles: nonTrainerRoles,
        };
        if (member) {
          memberPayload.plan_id = member.plan_id;
          memberPayload.membership_start_date = member.membership_start_date;
        }
        await onboard.mutateAsync(memberPayload);
      }

      setShowAdd(false);
      const roleLabels = roles.map((r) => ROLE_STYLES[r]?.label ?? r).join(" + ");
      showToast(`${first_name} ${last_name} added as ${roleLabels}.`);
    } catch (e: unknown) {
      const err = e as { detail?: string };
      setAddError(err?.detail ?? "Failed to add person.");
    }
  };

  const isPending = create.isPending || onboard.isPending;

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-foreground leading-tight">Team & Members</h1>
          <p className="text-[11px] text-muted-foreground">
            {data?.total ?? 0} people at your gym
          </p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setAddError(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
        >
          <UserPlus className="h-4 w-4" />
          Add Person
        </button>
      </div>

      {/* ── Search + Role filters ────────────────────────────── */}
      <div className="space-y-3">
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name, email or phone…"
          className="w-full px-3 py-2 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        />
        <div className="flex items-center gap-1.5 flex-wrap">
          {ROLE_FILTERS.map((f) => (
            <button
              key={String(f.value)}
              onClick={() => setRoleFilter(f.value)}
              className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
              style={
                roleFilter === f.value
                  ? { background: "rgba(16,185,129,0.15)", color: "#10b981" }
                  : { background: "hsl(var(--muted)/0.5)", color: "hsl(var(--muted-foreground))" }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        {/* Table header */}
        <div
          className="grid px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
          style={{
            borderBottom: "1px solid hsl(var(--border)/0.6)",
            gridTemplateColumns: "1fr auto auto auto",
          }}
        >
          <span>Name</span>
          <span className="mr-6">Phone</span>
          <span className="mr-6">Roles</span>
          <span>Joined</span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">Loading…</div>
        ) : participants.length === 0 ? (
          <div className="py-16 text-center">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(16,185,129,0.08)" }}
            >
              <Users className="h-7 w-7" style={{ color: "#10b981" }} />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">
              {search || roleFilter ? "No people found" : "No one here yet"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {search || roleFilter
                ? "Try adjusting your search or filter."
                : "Click 'Add Person' to onboard your first team member."}
            </p>
          </div>
        ) : (
          participants.map((person) => {
            const name = fullName(person);
            const avatarColor = person.roles.includes("trainer")
              ? { bg: "rgba(139,92,246,0.12)", text: "#8b5cf6" }
              : { bg: "rgba(16,185,129,0.12)", text: "#10b981" };

            return (
              <button
                key={person.participant_id}
                onClick={() => setSelectedPerson(person)}
                className="w-full text-left hover:bg-white/[0.02] transition-all group"
                style={{ borderBottom: "1px solid hsl(var(--border)/0.4)" }}
              >
                <div
                  className="grid items-center px-4 py-3"
                  style={{ gridTemplateColumns: "1fr auto auto auto" }}
                >
                  {/* Name + avatar */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                      style={{ background: avatarColor.bg, color: avatarColor.text }}
                    >
                      {initials(person.first_name, person.last_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{person.email ?? "—"}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <span className="text-[11px] text-muted-foreground mr-6 tabular-nums">
                    {person.phone ?? "—"}
                  </span>

                  {/* Roles */}
                  <div className="flex flex-wrap gap-1 mr-6">
                    {person.roles.map((r) => (
                      <RoleBadge key={r} role={r} />
                    ))}
                  </div>

                  {/* Joined */}
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {fmtDate(person.joined_at)}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* ── Detail Panel ────────────────────────────────────── */}
      {selectedPerson && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setSelectedPerson(null)}
          />
          <DetailPanel
            person={selectedPerson}
            onClose={() => setSelectedPerson(null)}
          />
        </>
      )}

      {/* ── Add Person Dialog ────────────────────────────────── */}
      {showAdd && (
        <AddPersonDialog
          onClose={() => setShowAdd(false)}
          onSubmit={handleAddPerson}
          isPending={isPending}
          error={addError}
        />
      )}

      {/* ── Toast ───────────────────────────────────────────── */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-2xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
        >
          <CheckCircle className="h-4 w-4" />
          {toast}
        </div>
      )}
    </div>
  );
}
