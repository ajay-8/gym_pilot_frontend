"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Shield,
  Calendar,
  CheckCircle,
  UserPlus,
  Dumbbell,
} from "lucide-react";
import { useStaff, staffKeys } from "@/lib/hooks/use-staff";
import { useMemberOnboard } from "@/lib/hooks/use-members";
import { useTrainerCreate } from "@/lib/hooks/use-trainers";
import { useQueryClient } from "@tanstack/react-query";
import { AddPersonDialog, type AddPersonPayload } from "@/components/participants/add-person-dialog";
import type { StaffListItem } from "@/types/api";
import { fmtDate, initials, fullName as fmtFullName } from "@/lib/utils/formatting";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PAGE_SIZE = 10;

function fullName(item: StaffListItem) {
  return fmtFullName(item.first_name, item.last_name);
}

// ── Role Badge ────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  owner: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  admin: { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
  trainer: { bg: "rgba(139,92,246,0.12)", color: "#8b5cf6" },
  staff: { bg: "rgba(59,130,246,0.12)", color: "#3b82f6" },
};

function RoleBadge({ role }: { role: string }) {
  const style = ROLE_COLORS[role.toLowerCase()] ?? {
    bg: "rgba(107,114,128,0.1)",
    color: "#9ca3af",
  };
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
      style={{ background: style.bg, color: style.color }}
    >
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={
        isActive
          ? { background: "rgba(16,185,129,0.12)", color: "#10b981" }
          : { background: "rgba(239,68,68,0.1)", color: "#ef4444" }
      }
    >
      {isActive ? "Active" : status}
    </span>
  );
}

// ── Avatar color by role ──────────────────────────────────────────────────────

function avatarStyle(roles: string[]) {
  if (roles.includes("owner"))
    return { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" };
  if (roles.includes("admin"))
    return { bg: "rgba(239,68,68,0.1)", color: "#ef4444" };
  if (roles.includes("trainer"))
    return { bg: "rgba(139,92,246,0.12)", color: "#8b5cf6" };
  return { bg: "rgba(59,130,246,0.12)", color: "#3b82f6" };
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

function DetailPanel({
  item,
  onClose,
}: {
  item: StaffListItem;
  onClose: () => void;
}) {
  const name = fullName(item);
  const av = avatarStyle(item.roles);

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
          style={{ background: av.bg, color: av.color }}
        >
          {initials(item.first_name, item.last_name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{name}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {item.roles.map((r) => (
              <RoleBadge key={r} role={r} />
            ))}
          </div>
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
        {/* Status */}
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Status
          </p>
          <StatusBadge status={item.status} />
        </div>

        {/* Contact */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Contact
          </p>
          <div className="space-y-2">
            <DetailRow icon={Mail} label="Email" value={item.email ?? "—"} />
            <DetailRow icon={Phone} label="Phone" value={item.phone ?? "—"} />
          </div>
        </div>

        {/* Roles */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Roles
          </p>
          <div
            className="rounded-xl p-3 space-y-2"
            style={{ background: "hsl(var(--muted)/0.2)" }}
          >
            {item.roles.map((r) => {
              const style = ROLE_COLORS[r.toLowerCase()] ?? { bg: "transparent", color: "#9ca3af" };
              return (
                <div key={r} className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" style={{ color: style.color }} />
                  <span className="text-sm font-medium text-foreground capitalize">{r}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Membership details */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Membership
          </p>
          <DetailRow icon={Calendar} label="Joined" value={fmtDate(item.joined_at)} />
        </div>

        {/* IDs */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            System IDs
          </p>
          <div
            className="rounded-xl p-3 space-y-1.5"
            style={{ background: "hsl(var(--muted)/0.2)" }}
          >
            <IdRow label="User ID" value={item.user_id} />
            <IdRow label="Participant ID" value={item.participant_id} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{ background: "hsl(var(--muted)/0.2)" }}
    >
      <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

function IdRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p
        className="text-[11px] font-mono text-foreground truncate"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        {value}
      </p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function StaffPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<StaffListItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [addStaffError, setAddStaffError] = useState<string | null>(null);
  const [showOnboardTrainer, setShowOnboardTrainer] = useState(false);
  const [onboardTrainerError, setOnboardTrainerError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useStaff({
    search: debouncedSearch || undefined,
    page,
    page_size: PAGE_SIZE,
  });

  const onboard = useMemberOnboard();
  const trainerCreate = useTrainerCreate();
  const queryClient = useQueryClient();

  const items = data?.items ?? [];

  // Role counts
  const roleCounts: Record<string, number> = {};
  items.forEach((item) => {
    item.roles.forEach((r) => {
      roleCounts[r] = (roleCounts[r] ?? 0) + 1;
    });
  });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const handleAddStaff = async (payload: AddPersonPayload) => {
    setAddStaffError(null);
    try {
      await onboard.mutateAsync({
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        phone: payload.phone || "",
        roles: payload.roles,
      });
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
      setShowAddStaff(false);
      showToast("Staff member added successfully.");
    } catch (e: unknown) {
      const err = e as { detail?: string };
      setAddStaffError(err?.detail ?? "Failed to add staff member.");
    }
  };

  const handleOnboardTrainer = async (payload: AddPersonPayload) => {
    setOnboardTrainerError(null);
    try {
      const result = await trainerCreate.mutateAsync({
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        phone: payload.phone || undefined,
        onboarding_date: new Date().toISOString().split("T")[0],
      });
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
      setShowOnboardTrainer(false);
      const msg = result.is_new_user
        ? `Trainer onboarded! ${result.invitation_sent ? "Invitation SMS sent." : "No phone — share the login link manually."}`
        : "Existing user added as trainer.";
      showToast(msg);
    } catch (e: unknown) {
      const err = e as { detail?: string };
      setOnboardTrainerError(err?.detail ?? "Failed to onboard trainer.");
    }
  };

  const statCards = [
    { label: "Total Staff",  value: data?.total ?? 0,           color: "#3b82f6", Icon: Users    },
    { label: "Owners",       value: roleCounts["owner"] ?? 0,   color: "#f59e0b", Icon: Shield   },
    { label: "Admins",       value: roleCounts["admin"] ?? 0,   color: "#ef4444", Icon: CheckCircle },
    { label: "Trainers",     value: roleCounts["trainer"] ?? 0, color: "#8b5cf6", Icon: Dumbbell },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight gradient-text">Team Management</h1>
          <p className="text-muted-foreground mt-1">
            View all staff, admins, trainers and owners at your gym
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <Button variant="outline" onClick={() => { setShowOnboardTrainer(true); setOnboardTrainerError(null); }}>
            <UserPlus className="mr-2 h-4 w-4" />
            Onboard Trainer
          </Button>
          <Button onClick={() => { setShowAddStaff(true); setAddStaffError(null); }}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(({ label, value, color, Icon }) => (
          <div
            key={label}
            className="rounded-2xl p-4"
            style={{ background: "hsl(var(--card))", border: `1px solid ${color}59` }}
          >
            <div className="mb-3">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: `${color}2e` }}
              >
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: "rgba(16,185,129,0.1)" }}>
              <Search className="h-4 w-4" style={{ color: "#10b981" }} />
            </div>
            <div>
              <CardTitle>Search</CardTitle>
              <CardDescription>Search by name, email or phone number.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search team members..."
                className="pl-10"
              />
            </div>
            {search && (
              <Button variant="outline" size="sm" onClick={() => { setSearch(""); setPage(1); }}>
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Staff List ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: "rgba(59,130,246,0.1)" }}>
              <Users className="h-4 w-4" style={{ color: "#3b82f6" }} />
            </div>
            <div>
              <CardTitle>{search ? "Search Results" : "All Team Members"}</CardTitle>
              <CardDescription>
                {data ? `${data.total} total team member${data.total === 1 ? "" : "s"}` : "Loading..."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading staff...</div>
            </div>
          ) : items.length > 0 ? (
            <>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const name = fullName(item);
                    const av = avatarStyle(item.roles);
                    return (
                      <TableRow key={item.participant_id} className="cursor-pointer hover:bg-white/[0.03]" onClick={() => setSelected(item)}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div
                              className="h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                              style={{ background: av.bg, color: av.color }}
                            >
                              {initials(item.first_name, item.last_name)}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{name}</p>
                              <StatusBadge status={item.status} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-[11px] text-foreground">{item.email ?? "—"}</TableCell>
                        <TableCell className="text-[11px] text-foreground">{item.phone ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {item.roles.map((r) => <RoleBadge key={r} role={r} />)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{fmtDate(item.joined_at)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
              {(data?.total_pages ?? 0) > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {Math.min((page - 1) * PAGE_SIZE + 1, data?.total ?? 0)}–{Math.min(page * PAGE_SIZE, data?.total ?? 0)} of {data?.total ?? 0}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-1">{page} / {data?.total_pages ?? 1}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(data?.total_pages ?? 1, p + 1))} disabled={page >= (data?.total_pages ?? 1)}>
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
              <h3 className="text-lg font-semibold">No team members found</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {search ? `No results for "${search}"` : "No team members yet."}
              </p>
              {search && (
                <Button variant="outline" onClick={() => { setSearch(""); setPage(1); }}>
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Detail Panel ────────────────────────────────────────────────── */}
      {selected && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setSelected(null)}
          />
          <DetailPanel item={selected} onClose={() => setSelected(null)} />
        </>
      )}

      {/* ── Add Staff Dialog ────────────────────────────────────────────── */}
      {showAddStaff && (
        <AddPersonDialog
          availableRoles={["staff", "admin"]}
          defaultRoles={["staff"]}
          onClose={() => { setShowAddStaff(false); setAddStaffError(null); }}
          onSubmit={handleAddStaff}
          isPending={onboard.isPending}
          error={addStaffError}
        />
      )}

      {/* ── Onboard Trainer Dialog ──────────────────────────────────────── */}
      {showOnboardTrainer && (
        <AddPersonDialog
          availableRoles={["trainer"]}
          defaultRoles={["trainer"]}
          onClose={() => { setShowOnboardTrainer(false); setOnboardTrainerError(null); }}
          onSubmit={handleOnboardTrainer}
          isPending={trainerCreate.isPending}
          error={onboardTrainerError}
        />
      )}

      {/* ── Toast ───────────────────────────────────────────────────────── */}
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
