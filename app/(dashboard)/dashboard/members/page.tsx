"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMembers } from "@/lib/hooks/use-members";
import { useMembershipPlans } from "@/lib/hooks/use-membership-plans";
import { useMembershipReport } from "@/lib/hooks/use-reports";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, ChevronLeft, ChevronRight, Search, Filter, ChevronDown, X, Download, Upload, Pencil, Trash2, Eye, Users, CheckCircle, Clock, XCircle } from "lucide-react";
import { StatusType } from "@/types/api";
import { AddPersonDialog, type AddPersonPayload } from "@/components/participants/add-person-dialog";
import { EditMemberDialog } from "@/components/members/edit-member-dialog";
import { CSVImportDialog } from "@/components/members/csv-import-dialog";
import { exportMembersToCSV } from "@/lib/utils/csv-export";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMemberDelete, useMemberOnboard } from "@/lib/hooks/use-members";
import { fmtDate } from "@/lib/utils/formatting";
import { useTrainerCreate } from "@/lib/hooks/use-trainers";

const PAGE_SIZE = 10;
const PLANS_FETCH_SIZE = 50; // load plans for the filter dropdown

// Helper function to get badge variant based on status
function getStatusBadgeVariant(status: StatusType): "default" | "success" | "warning" | "destructive" | "secondary" {
  switch (status) {
    case "active":
      return "success";
    case "inactive":
    case "frozen":
      return "warning";
    case "suspended":
    case "cancelled":
      return "destructive";
    case "expired":
      return "secondary";
    default:
      return "default";
  }
}

// Helper function to format status text
function formatStatus(status: StatusType): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
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

function MembersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // Search and filter states — seed status from URL param (e.g. ?status=active from dashboard)
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") ?? "");
  const [planFilter, setPlanFilter] = useState<string>("");
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Fetch members with search and filters
  const { data, isLoading, error } = useMembers({
    page,
    page_size: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
    plan_id: planFilter && planFilter !== "all" ? planFilter : undefined,
  });

  const { data: plansData } = useMembershipPlans({ page_size: PLANS_FETCH_SIZE });

  // Membership stats for summary bar (no date filter = all-time breakdown)
  const { data: membershipReport } = useMembershipReport();

  // Delete mutation
  const deleteMember = useMemberDelete();

  // Add person mutations
  const onboard = useMemberOnboard();
  const createTrainer = useTrainerCreate();
  const [addError, setAddError] = useState<string | null>(null);

  const handleAddPerson = async (payload: AddPersonPayload) => {
    setAddError(null);
    const { first_name, last_name, email, phone, roles, trainer, member } = payload;
    try {
      const isTrainer = roles.includes("trainer");
      const nonTrainerRoles = roles.filter((r) => r !== "trainer");

      if (isTrainer) {
        await createTrainer.mutateAsync({
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

      setShowAddDialog(false);
    } catch (e: unknown) {
      const err = e as { detail?: string };
      setAddError(err?.detail ?? "Failed to add person.");
    }
  };

  const handlePreviousPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    if (data && page < data.total_pages) {
      setPage((prev) => prev + 1);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setPlanFilter("");
    setPage(1);
  };

  const hasActiveFilters = searchTerm || (statusFilter && statusFilter !== "all") || (planFilter && planFilter !== "all");

  const handleExportCSV = () => {
    if (!data || data.items.length === 0) {
      alert("No members to export");
      return;
    }

    exportMembersToCSV(data.items);
  };

  const handleEditClick = (member: any) => {
    setSelectedMember(member);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (member: any) => {
    setSelectedMember(member);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMember) return;

    try {
      await deleteMember.mutateAsync(selectedMember.user_id);
      setShowDeleteDialog(false);
      setSelectedMember(null);
    } catch (error) {
      console.error("Failed to delete member:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight gradient-text">Members</h1>
          <p className="text-muted-foreground mt-1">
            Paying gym members and their active subscriptions
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0 flex-wrap">
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button variant="outline" onClick={handleExportCSV} disabled={!data || data.items.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Membership Stats Bar */}
      {(() => {
        const bs = membershipReport?.by_status;
        const total = bs ? bs.active + bs.expired + bs.cancelled + bs.frozen : null;
        const activePct = total ? Math.round((bs!.active / total) * 100) : null;
        const exp7d = membershipReport?.expiring_in_7d ?? 0;
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            {/* Total Members */}
            <div className="rounded-2xl p-4" style={{ background: "hsl(var(--card))", border: "1px solid rgba(59,130,246,0.3)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(59,130,246,0.12)" }}>
                  <Users className="h-4 w-4" style={{ color: "#3b82f6" }} />
                </div>
                {bs && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>All</span>}
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Total Members</p>
              <p className="text-2xl font-bold" style={{ color: total === null ? "hsl(var(--muted-foreground))" : "#3b82f6" }}>{total ?? "—"}</p>
              {bs && bs.frozen > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {bs.frozen} frozen
                </p>
              )}
            </div>

            {/* Active Members */}
            <div className="rounded-2xl p-4" style={{ background: "hsl(var(--card))", border: "1px solid rgba(16,185,129,0.3)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(16,185,129,0.12)" }}>
                  <CheckCircle className="h-4 w-4" style={{ color: "#10b981" }} />
                </div>
                {activePct !== null && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>{activePct}%</span>}
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Active Members</p>
              <p className="text-2xl font-bold" style={{ color: bs ? "#10b981" : "hsl(var(--muted-foreground))" }}>{bs?.active ?? "—"}</p>
              {total !== null && (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(16,185,129,0.12)" }}>
                    <div className="h-full rounded-full" style={{ width: `${activePct}%`, background: "#10b981" }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{bs!.active} of {total} members</p>
                </div>
              )}
            </div>

            {/* Expired */}
            <div className="rounded-2xl p-4" style={{ background: "hsl(var(--card))", border: `1px solid ${exp7d > 0 ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: exp7d > 0 ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)" }}>
                  <Clock className="h-4 w-4" style={{ color: exp7d > 0 ? "#ef4444" : "#f59e0b" }} />
                </div>
                {exp7d > 0 && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>Action needed</span>}
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Expired</p>
              <p className="text-2xl font-bold" style={{ color: bs ? (exp7d > 0 ? "#ef4444" : "#f59e0b") : "hsl(var(--muted-foreground))" }}>{bs?.expired ?? "—"}</p>
              <p className="text-[10px] mt-1" style={{ color: exp7d > 0 ? "#ef4444" : "hsl(var(--muted-foreground))" }}>
                {exp7d > 0 ? `${exp7d} expiring this week` : "None expiring this week"}
              </p>
            </div>

            {/* Cancelled */}
            <div className="rounded-2xl p-4" style={{ background: "hsl(var(--card))", border: "1px solid rgba(100,116,139,0.3)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(100,116,139,0.12)" }}>
                  <XCircle className="h-4 w-4" style={{ color: "#64748b" }} />
                </div>
                {bs && bs.frozen > 0 && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>{bs.frozen} frozen</span>}
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Cancelled</p>
              <p className="text-2xl font-bold" style={{ color: bs ? "#64748b" : "hsl(var(--muted-foreground))" }}>{bs?.cancelled ?? "—"}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {bs ? (bs.cancelled === 0 ? "No cancellations" : "Requires review") : "—"}
              </p>
            </div>

          </div>
        );
      })()}

      {/* ── Filters + Search ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterChip
          icon={Filter}
          label="Status"
          value={statusFilter && statusFilter !== "all" ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) : "All"}
          options={[
            { value: "", label: "All" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
            { value: "expired", label: "Expired" },
            { value: "cancelled", label: "Cancelled" },
            { value: "frozen", label: "Frozen" },
          ]}
          onChange={v => { setStatusFilter(v); setPage(1); }}
        />
        <FilterChip
          icon={Users}
          label="Plan"
          value={planFilter && planFilter !== "all" ? (plansData?.items.find(p => p.id === planFilter)?.name ?? "Custom") : "All"}
          options={[
            { value: "", label: "All" },
            ...(plansData?.items.map(p => ({ value: p.id, label: p.name })) ?? []),
          ]}
          onChange={v => { setPlanFilter(v); setPage(1); }}
        />
        {hasActiveFilters && (
          <button onClick={handleClearFilters}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-80 flex-shrink-0"
            style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
            <X className="h-3 w-3" /> Clear
          </button>
        )}

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search members by name, phone, email…"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-full text-sm outline-none text-foreground placeholder:text-muted-foreground"
            style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load members. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {/* Members Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: "rgba(139, 92, 246, 0.1)" }}>
              <UserPlus className="h-4 w-4" style={{ color: "#8b5cf6" }} />
            </div>
            <div>
              <CardTitle>
                {hasActiveFilters ? "Filtered Members" : "All Members"}
              </CardTitle>
              <CardDescription>
                {data ? `${data.total} total member${data.total === 1 ? "" : "s"}` : "Loading..."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading members...</div>
            </div>
          ) : data && data.items.length > 0 ? (
            <>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Name</TableHead>
                    <TableHead className="w-[180px]">Email</TableHead>
                    <TableHead className="w-[120px]">Phone</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[140px]">Start Date</TableHead>
                    <TableHead className="w-[140px]">End Date</TableHead>
                    <TableHead className="w-[140px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((member) => {
                    const initials = `${member.first_name?.[0] ?? ""}${member.last_name?.[0] ?? ""}`.toUpperCase();
                    return (
                    <TableRow key={member.user_id} className="hover:bg-white/[0.03]">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                            style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}
                          >
                            {initials}
                          </div>
                          <span className="font-semibold text-foreground">
                            {member.first_name} {member.last_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[11px] text-foreground">{member.email ?? "—"}</TableCell>
                      <TableCell className="text-[11px] text-foreground">{member.phone ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(member.membership_status)}>
                          {formatStatus(member.membership_status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{fmtDate(member.membership_start_date)}</TableCell>
                      <TableCell>
                        {member.membership_end_date
                          ? fmtDate(member.membership_end_date)
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/members/${member.user_id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(member)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(member)}
                            disabled={deleteMember.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                  })}
                </TableBody>
              </Table>
              </div>

              {/* Pagination */}
              {data.total_pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {Math.min((page - 1) * PAGE_SIZE + 1, data.total)}–{Math.min(page * PAGE_SIZE, data.total)} of {data.total} member{data.total !== 1 ? "s" : ""}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-1">
                      {page} / {data.total_pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={page >= data.total_pages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              {hasActiveFilters ? (
                <>
                  <Search className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No members found</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Try adjusting your search or filters
                  </p>
                  <Button variant="outline" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                </>
              ) : (
                <>
                  <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No members yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Get started by adding your first member
                  </p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Person Dialog (Member pre-checked) */}
      {showAddDialog && (
        <AddPersonDialog
          availableRoles={["member"]}
          defaultRoles={["member"]}
          onClose={() => setShowAddDialog(false)}
          onSubmit={handleAddPerson}
          isPending={onboard.isPending || createTrainer.isPending}
          error={addError}
        />
      )}

      {/* CSV Import Dialog */}
      <CSVImportDialog open={showImportDialog} onOpenChange={setShowImportDialog} />

      {/* Edit Member Dialog */}
      <EditMemberDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        member={selectedMember}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedMember?.first_name} {selectedMember?.last_name}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMember.isPending ? "Deleting..." : "Delete Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function MembersPage() {
  return (
    <Suspense>
      <MembersContent />
    </Suspense>
  );
}
