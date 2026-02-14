"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMembers } from "@/lib/hooks/use-members";
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
import { UserPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { StatusType } from "@/types/api";
import { AddMemberDialog } from "@/components/members/add-member-dialog";

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

  const { data, isLoading, error } = useMembers({ page, page_size: pageSize });

  const handlePreviousPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    if (data && page < data.total_pages) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground mt-1">
            Manage your gym members and their memberships
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
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
          <CardTitle>All Members</CardTitle>
          <CardDescription>
            {data ? `${data.total} total members` : "Loading..."}
          </CardDescription>
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
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/members/${member.user_id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data.total_pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {data.total_pages}
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
              <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No members yet</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Get started by adding your first member
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <AddMemberDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </div>
  );
}
