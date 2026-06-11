"use client";

import { useState } from "react";
import { UserPlus, X, ChevronLeft, ChevronRight, Users, CheckCircle, ExternalLink, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAllParticipants } from "@/lib/hooks/use-members";
import { useTrainerCreate } from "@/lib/hooks/use-trainers";
import { useMemberOnboard } from "@/lib/hooks/use-members";
import { AddPersonDialog, type AddPersonPayload } from "@/components/participants/add-person-dialog";
import type { ParticipantRole, ParticipantSummary } from "@/types/api";
import { fmtDate, initials, fullName as fmtFullName } from "@/lib/utils/formatting";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function fullName(p: ParticipantSummary) {
  return fmtFullName(p.first_name, p.last_name);
}

// ── Role badge ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

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
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<ParticipantSummary | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { data, isLoading } = useAllParticipants({
    search: debouncedSearch || undefined,
    role: roleFilter,
    page,
    page_size: PAGE_SIZE,
  });

  const create = useTrainerCreate();
  const onboard = useMemberOnboard();

  const participants = data?.participants ?? [];

  // Debounce search
  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
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
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight gradient-text">All Participants</h1>
          <p className="text-muted-foreground mt-1">
            Everyone at your gym — members, trainers, staff and owners
          </p>
        </div>
        <Button onClick={() => { setShowAdd(true); setAddError(null); }}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Person
        </Button>
      </div>

      {/* ── Search + Role filters ────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: "rgba(16,185,129,0.1)" }}>
              <Search className="h-4 w-4" style={{ color: "#10b981" }} />
            </div>
            <div>
              <CardTitle>Search & Filter</CardTitle>
              <CardDescription>Search by name, email or phone. Filter by role.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search participants..."
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {ROLE_FILTERS.map((f) => (
              <button
                key={String(f.value)}
                onClick={() => { setRoleFilter(f.value); setPage(1); }}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={
                  roleFilter === f.value
                    ? { background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Table ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: "rgba(139,92,246,0.1)" }}>
              <Users className="h-4 w-4" style={{ color: "#8b5cf6" }} />
            </div>
            <div>
              <CardTitle>
                {roleFilter ? `${ROLE_STYLES[roleFilter]?.label ?? roleFilter}s` : "All Participants"}
              </CardTitle>
              <CardDescription>
                {data ? `${data.total} total person${data.total === 1 ? "" : "s"}` : "Loading..."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading participants...</div>
            </div>
          ) : participants.length > 0 ? (
            <>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((person) => {
                    const name = fullName(person);
                    const avatarColor = person.roles.includes("trainer")
                      ? { bg: "rgba(139,92,246,0.12)", text: "#8b5cf6" }
                      : { bg: "rgba(16,185,129,0.12)", text: "#10b981" };
                    return (
                      <TableRow
                        key={person.participant_id}
                        className="cursor-pointer"
                        onClick={() => setSelectedPerson(person)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                              style={{ background: avatarColor.bg, color: avatarColor.text }}
                            >
                              {initials(person.first_name, person.last_name)}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{name}</p>
                              <p className="text-xs text-muted-foreground">{person.email ?? "—"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{person.phone ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {person.roles.map((r) => <RoleBadge key={r} role={r} />)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{fmtDate(person.joined_at)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
              {data && Math.ceil(data.total / 10) > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {Math.min((page - 1) * 10 + 1, data.total)}–{Math.min(page * 10, data.total)} of {data.total}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-1">{page} / {Math.ceil(data.total / 10)}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(Math.ceil(data.total / 10), p + 1))} disabled={page >= Math.ceil(data.total / 10)}>
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">
                {search || roleFilter ? "No people found" : "No one here yet"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {search || roleFilter
                  ? "Try adjusting your search or filter."
                  : "Click 'Add Person' to onboard your first team member."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-2xl text-sm font-semibold text-white max-w-[calc(100vw-3rem)]"
          style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
        >
          <CheckCircle className="h-4 w-4" />
          {toast}
        </div>
      )}
    </div>
  );
}
