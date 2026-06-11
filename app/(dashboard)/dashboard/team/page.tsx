"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Phone,
  Mail,
  Shield,
  Calendar,
  CheckCircle,
  UserPlus,
  Filter,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function fullName(item: StaffListItem) {
  return fmtFullName(item.first_name, item.last_name);
}

// ── Role colors ───────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  owner:   { bg: "rgba(245,158,11,0.12)",  color: "#f59e0b" },
  admin:   { bg: "rgba(239,68,68,0.1)",    color: "#ef4444" },
  trainer: { bg: "rgba(139,92,246,0.12)",  color: "#8b5cf6" },
  staff:   { bg: "rgba(59,130,246,0.12)",  color: "#3b82f6" },
};

function avatarStyle(roles: string[]) {
  if (roles.includes("owner"))   return ROLE_COLORS.owner;
  if (roles.includes("admin"))   return ROLE_COLORS.admin;
  if (roles.includes("trainer")) return ROLE_COLORS.trainer;
  return ROLE_COLORS.staff;
}

function RoleBadge({ role }: { role: string }) {
  const s = ROLE_COLORS[role.toLowerCase()] ?? { bg: "rgba(107,114,128,0.1)", color: "#9ca3af" };
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
      style={{ background: s.bg, color: s.color }}>
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={isActive
        ? { background: "rgba(16,185,129,0.12)", color: "#10b981" }
        : { background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
      {isActive ? "Active" : status}
    </span>
  );
}

// ── FilterChip ────────────────────────────────────────────────────────────────

function FilterChip({ icon: Icon, label, value, options, onChange }: {
  icon: React.ElementType;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer select-none flex-shrink-0"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
      <Icon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
      <span className="text-xs text-muted-foreground">{label}:</span>
      <span className="text-xs font-semibold text-foreground">{value}</span>
      <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
      <select
        value={options.find(o => o.label === value)?.value ?? ""}
        onChange={e => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer w-full"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

// ── Role filter config ────────────────────────────────────────────────────────

const ROLE_FILTERS: { label: string; value: string | null }[] = [
  { label: "All",     value: null },
  { label: "Trainer", value: "trainer" },
  { label: "Staff",   value: "staff" },
  { label: "Admin",   value: "admin" },
  { label: "Owner",   value: "owner" },
];

// ── Detail Panel ──────────────────────────────────────────────────────────────

function DetailPanel({ item, onClose }: { item: StaffListItem; onClose: () => void }) {
  const name = fullName(item);
  const av = avatarStyle(item.roles);
  const portalRoot = typeof document !== "undefined" ? document.body : null;
  if (!portalRoot) return null;

  return createPortal(
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Modal centering wrapper */}
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          {/* Colored accent strip */}
          <div className="h-1 w-full flex-shrink-0"
            style={{ background: `linear-gradient(90deg, ${av.color}, ${av.color}88)` }} />
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
            style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <div className="h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: av.bg, color: av.color, boxShadow: `0 0 0 2px ${av.color}30` }}>
              {initials(item.first_name, item.last_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{name}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {item.roles.map((r) => <RoleBadge key={r} role={r} />)}
              </div>
            </div>
            <button onClick={onClose}
              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status</p>
              <StatusBadge status={item.status} />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Contact</p>
              <DetailRow icon={Mail} label="Email" value={item.email ?? "—"} />
              <DetailRow icon={Phone} label="Phone" value={item.phone ?? "—"} />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Roles</p>
              <div className="rounded-xl p-3 space-y-2" style={{ background: "hsl(var(--muted)/0.2)" }}>
                {item.roles.map((r) => {
                  const s = ROLE_COLORS[r.toLowerCase()] ?? { color: "#9ca3af" };
                  return (
                    <div key={r} className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5" style={{ color: s.color }} />
                      <span className="text-sm font-medium text-foreground capitalize">{r}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Membership</p>
              <DetailRow icon={Calendar} label="Joined" value={fmtDate(item.joined_at)} />
            </div>
          </div>
        </div>
      </div>
    </>,
    portalRoot
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{ background: "hsl(var(--muted)/0.2)" }}>
      <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<StaffListItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useStaff({
    search: debouncedSearch || undefined,
    role: roleFilter || undefined,
    page,
    page_size: PAGE_SIZE,
  });

  const onboard = useMemberOnboard();
  const trainerCreate = useTrainerCreate();
  const queryClient = useQueryClient();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 1;


  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  // Unified Add Person handler — routes to trainer API or staff API based on selected roles
  const handleAddPerson = async (payload: AddPersonPayload) => {
    setAddError(null);
    const { first_name, last_name, email, phone, roles, trainer } = payload;
    try {
      const isTrainer = roles.includes("trainer");
      const nonTrainerRoles = roles.filter((r) => r !== "trainer");

      if (isTrainer) {
        const result = await trainerCreate.mutateAsync({
          first_name,
          last_name,
          email,
          phone: phone || undefined,
          onboarding_date: trainer?.onboarding_date ?? new Date().toISOString().split("T")[0],
          weekly_availability: trainer?.weekly_availability,
        });
        const msg = result.is_new_user
          ? `Trainer onboarded! ${result.invitation_sent ? "Invitation SMS sent." : "No phone — share the login link manually."}`
          : "Existing user added as trainer.";
        showToast(msg);
      }

      if (nonTrainerRoles.length > 0) {
        await onboard.mutateAsync({ first_name, last_name, email, phone: phone || "", roles: nonTrainerRoles });
        if (!isTrainer) showToast("Team member added successfully.");
      }

      queryClient.invalidateQueries({ queryKey: staffKeys.all });
      setShowAdd(false);
    } catch (e: unknown) {
      const err = e as { detail?: string };
      setAddError(err?.detail ?? "Failed to add team member.");
    }
  };

  const isPending = trainerCreate.isPending || onboard.isPending;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight gradient-text">Team</h1>
          <p className="text-muted-foreground mt-1">Manage trainers, staff, admins and owners</p>
        </div>
        <Button onClick={() => { setShowAdd(true); setAddError(null); }}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Person
        </Button>
      </div>

      {/* ── Filter + Search ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterChip
          icon={Filter}
          label="Role"
          value={roleFilter ? (ROLE_FILTERS.find(f => f.value === roleFilter)?.label ?? "All") : "All"}
          options={ROLE_FILTERS.map(f => ({ value: f.value ?? "", label: f.label }))}
          onChange={v => { setRoleFilter(v || null); setPage(1); }}
        />
        {(search || roleFilter) && (
          <button onClick={() => { setSearch(""); setRoleFilter(null); setPage(1); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-80 flex-shrink-0"
            style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
            <X className="h-3 w-3" /> Clear
          </button>
        )}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search team members by name, phone, email…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-full text-sm outline-none text-foreground placeholder:text-muted-foreground"
            style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
        </div>
      </div>

      {/* ── Team List ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: "rgba(59,130,246,0.1)" }}>
              <Users className="h-4 w-4" style={{ color: "#3b82f6" }} />
            </div>
            <div>
              <CardTitle>
                {roleFilter
                  ? `${ROLE_FILTERS.find((f) => f.value === roleFilter)?.label}s`
                  : search ? "Search Results" : "All Team Members"}
              </CardTitle>
              <CardDescription>
                {isLoading ? "Loading..." : `${total} ${total === 1 ? "person" : "people"}`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Loading team...</div>
          ) : items.length > 0 ? (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const name = fullName(item);
                  const av = avatarStyle(item.roles);
                  return (
                    <TableRow key={item.participant_id} className="cursor-pointer" onClick={() => setSelected(item)}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                            style={{ background: av.bg, color: av.color }}>
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
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No team members found</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {search || roleFilter ? "Try adjusting your search or filter." : "Add your first team member to get started."}
              </p>
              {(search || roleFilter) && (
                <Button variant="outline" onClick={() => { setSearch(""); setRoleFilter(null); setPage(1); }}>
                  Clear Filters
                </Button>
              )}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground px-1">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Detail Panel ────────────────────────────────────────────────── */}
      {selected && (
        <DetailPanel item={selected} onClose={() => setSelected(null)} />
      )}

      {/* ── Add Person Dialog ────────────────────────────────────────────── */}
      {showAdd && (
        <AddPersonDialog
          availableRoles={["trainer", "staff", "admin"]}
          defaultRoles={["staff"]}
          onClose={() => { setShowAdd(false); setAddError(null); }}
          onSubmit={handleAddPerson}
          isPending={isPending}
          error={addError}
        />
      )}

      {/* ── Toast ───────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-2xl text-sm font-semibold text-white max-w-[calc(100vw-3rem)]"
          style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
          <CheckCircle className="h-4 w-4" />
          {toast}
        </div>
      )}
    </div>
  );
}
