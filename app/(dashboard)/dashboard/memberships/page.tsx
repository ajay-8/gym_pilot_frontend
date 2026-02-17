"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMembershipPlans, useMembershipPlanDelete } from "@/lib/hooks/use-membership-plans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Edit, Trash2, DollarSign, Calendar } from "lucide-react";
import { MembershipPlanResponse, StatusType } from "@/types/api";
import { AddEditPlanDialog } from "@/components/membership-plans/add-edit-plan-dialog";

// Helper function to get badge variant based on status
function getStatusBadgeVariant(
  status: StatusType
): "default" | "success" | "warning" | "destructive" | "secondary" {
  switch (status) {
    case "active":
      return "success";
    case "inactive":
      return "secondary";
    default:
      return "default";
  }
}

// Helper function to format status text
function formatStatus(status: StatusType): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// Helper function to format price
function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
  }).format(price);
}

// Helper function to format duration
function formatDuration(days?: number): string {
  if (!days) return "Unlimited";
  if (days === 30) return "1 Month";
  if (days === 90) return "3 Months";
  if (days === 180) return "6 Months";
  if (days === 365) return "1 Year";
  return `${days} Days`;
}

export default function MembershipPlansPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlanResponse | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<MembershipPlanResponse | null>(null);

  const { data, isLoading, error } = useMembershipPlans({ page, page_size: 20 });
  const deletePlan = useMembershipPlanDelete();

  const handleEdit = (plan: MembershipPlanResponse) => {
    setEditingPlan(plan);
  };

  const handleDelete = async () => {
    if (!deletingPlan) return;

    try {
      await deletePlan.mutateAsync(deletingPlan.id);
      setDeletingPlan(null);
    } catch (err) {
      console.error("Failed to delete plan:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading membership plans...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>Failed to load membership plans. Please try again.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Membership Plans</h1>
          <p className="text-muted-foreground mt-1">Manage your gym's membership plans and pricing</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Plan
        </Button>
      </div>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Plans</CardTitle>
          <CardDescription>
            {data?.total || 0} plan{(data?.total || 0) !== 1 ? "s" : ""} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.items || data.items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No membership plans yet</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Plan
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          {plan.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {plan.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{formatPrice(plan.price, plan.currency)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDuration(plan.duration_days)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(plan.status)}>
                          {formatStatus(plan.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(plan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingPlan(plan)}
                            disabled={deletePlan.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data.total_pages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {data.page} of {data.total_pages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                      disabled={page === data.total_pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Plan Dialog */}
      <AddEditPlanDialog
        open={showAddDialog || !!editingPlan}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingPlan(null);
          }
        }}
        plan={editingPlan}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPlan} onOpenChange={() => setDeletingPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Membership Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingPlan?.name}"? This action cannot be undone.
              Existing memberships using this plan will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deletePlan.isPending}>
              {deletePlan.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
