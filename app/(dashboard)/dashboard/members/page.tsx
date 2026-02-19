"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMembers } from "@/lib/hooks/use-members";
import { useMembershipPlans } from "@/lib/hooks/use-membership-plans";
import { useMembershipReport } from "@/lib/hooks/use-reports";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { UserPlus, ChevronLeft, ChevronRight, Search, Filter, X, Download, Upload, Pencil, Trash2, Eye } from "lucide-react";
import { StatusType } from "@/types/api";
import { AddMemberDialog } from "@/components/members/add-member-dialog";
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
import { useMemberDelete } from "@/lib/hooks/use-members";

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

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function MembersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [planFilter, setPlanFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch members with search and filters
  const { data, isLoading, error } = useMembers({
    page,
    page_size: pageSize,
    search: searchTerm || undefined,
    status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
    plan_id: planFilter && planFilter !== "all" ? planFilter : undefined,
  });

  // Lazy-load membership plans only when filter dropdown is opened
  const { data: plansData } = useMembershipPlans({ page_size: 100 }, showFilters);

  // Membership stats for summary bar (no date filter = all-time breakdown)
  const { data: membershipReport } = useMembershipReport();

  // Delete mutation
  const deleteMember = useMemberDelete();

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Members</h1>
          <p className="text-muted-foreground mt-1">
            Paying gym members and their active subscriptions
          </p>
        </div>
        <div className="flex gap-2">
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
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total Members",
            value: (membershipReport
              ? membershipReport.by_status.active + membershipReport.by_status.expired + membershipReport.by_status.cancelled + membershipReport.by_status.frozen
              : null),
            bar: "stat-bar-blue",
            iconBg: "rgba(59,130,246,0.1)",
            iconColor: "#3b82f6",
          },
          {
            label: "Active Members",
            value: membershipReport?.by_status.active ?? null,
            bar: "stat-bar-green",
            iconBg: "rgba(16,185,129,0.1)",
            iconColor: "#10b981",
          },
          {
            label: "Expired",
            value: membershipReport?.by_status.expired ?? null,
            bar: "stat-bar-amber",
            iconBg: "rgba(245,158,11,0.1)",
            iconColor: "#f59e0b",
          },
          {
            label: "Cancelled",
            value: membershipReport?.by_status.cancelled ?? null,
            bar: "stat-bar-blue",
            iconBg: "rgba(107,114,128,0.1)",
            iconColor: "#6b7280",
          },
        ].map(({ label, value, bar, iconBg, iconColor }) => (
          <div
            key={label}
            className="rounded-xl overflow-hidden"
            style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
          >
            <div className={`h-1 ${bar}`} />
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span
                className="text-xl font-bold"
                style={{ color: value === null ? undefined : iconColor }}
              >
                {value === null ? "—" : value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                <Search className="h-4 w-4" style={{ color: "#10b981" }} />
              </div>
              <div>
                <CardTitle>Search & Filter</CardTitle>
                <CardDescription>
                  Search by name, email, or phone. Filter by status or plan.
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // Reset to first page on search
                }}
                className="pl-10"
              />
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Filter Controls */}
          {showFilters && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="frozen">Frozen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan-filter">Membership Plan</Label>
                <Select
                  value={planFilter}
                  onValueChange={(value) => {
                    setPlanFilter(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger id="plan-filter">
                    <SelectValue placeholder="All plans" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    {plansData?.items.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Name</TableHead>
                    <TableHead className="w-[240px]">Contact</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[140px]">Start Date</TableHead>
                    <TableHead className="w-[140px]">End Date</TableHead>
                    <TableHead className="w-[140px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((member) => (
                    <TableRow key={member.user_id}>
                      <TableCell className="font-medium">
                        {member.first_name} {member.last_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {member.email && (
                            <span className="text-sm">{member.email}</span>
                          )}
                          {member.phone && (
                            <span className="text-sm text-muted-foreground">{member.phone}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(member.membership_status)}>
                          {formatStatus(member.membership_status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(member.membership_start_date)}</TableCell>
                      <TableCell>
                        {member.membership_end_date
                          ? formatDate(member.membership_end_date)
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
                  ))}
                </TableBody>
              </Table>

              {/* Pagination — always visible */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {Math.min((page - 1) * pageSize + 1, data.total)}–{Math.min(page * pageSize, data.total)} of {data.total} member{data.total !== 1 ? "s" : ""}
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

      {/* Add Member Dialog */}
      <AddMemberDialog open={showAddDialog} onOpenChange={setShowAddDialog} />

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
