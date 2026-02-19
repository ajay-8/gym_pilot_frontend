"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMembershipPlans, useMembershipPlanDelete } from "@/lib/hooks/use-membership-plans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Plus, Edit, Trash2, Calendar, ChevronLeft, ChevronRight, CreditCard } from "lucide-react";
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
    maximumFractionDigits: 0,
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

// Color palette for plan cards (cycles through)
const planColors = [
  { bar: "stat-bar-green", iconBg: "rgba(16, 185, 129, 0.12)", iconColor: "#10b981", priceColor: "#10b981" },
  { bar: "stat-bar-purple", iconBg: "rgba(139, 92, 246, 0.12)", iconColor: "#8b5cf6", priceColor: "#8b5cf6" },
  { bar: "stat-bar-amber", iconBg: "rgba(245, 158, 11, 0.12)", iconColor: "#f59e0b", priceColor: "#f59e0b" },
  { bar: "stat-bar-blue", iconBg: "rgba(59, 130, 246, 0.12)", iconColor: "#3b82f6", priceColor: "#3b82f6" },
];

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
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Membership Plans</h1>
          <p className="text-muted-foreground mt-1">Manage your gym's membership plans and pricing</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Plan
        </Button>
      </div>

      {/* Plans Grid */}
      <div
        className="rounded-xl p-6"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        {/* Section header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
            <CreditCard className="h-4 w-4" style={{ color: "#10b981" }} />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">All Plans</h2>
            <p className="text-sm text-muted-foreground">
              {data?.total || 0} plan{(data?.total || 0) !== 1 ? "s" : ""} total
            </p>
          </div>
        </div>

        {!data?.items || data.items.length === 0 ? (
          <div className="text-center py-16">
            <div
              className="mx-auto mb-4 h-16 w-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(16, 185, 129, 0.1)" }}
            >
              <CreditCard className="h-8 w-8" style={{ color: "#10b981" }} />
            </div>
            <p className="text-muted-foreground mb-6">No membership plans yet</p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Plan
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((plan, idx) => {
                const palette = planColors[idx % planColors.length];
                const isInactive = plan.status === "inactive";
                return (
                  <div
                    key={plan.id}
                    className={`rounded-xl overflow-hidden transition-all duration-200 ${isInactive ? "opacity-60" : "hover:scale-[1.02]"}`}
                    style={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  >
                    {/* Colored top bar */}
                    <div className={`h-1 ${palette.bar}`} />

                    <div className="p-5">
                      {/* Plan name + status */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-lg flex-shrink-0"
                            style={{ background: palette.iconBg }}
                          >
                            <CreditCard className="h-4 w-4" style={{ color: palette.iconColor }} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-base leading-tight">{plan.name}</h3>
                            {plan.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {plan.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(plan.status)} className="ml-2 flex-shrink-0">
                          {formatStatus(plan.status)}
                        </Badge>
                      </div>

                      {/* Price + Duration */}
                      <div className="flex items-end justify-between">
                        <div>
                          <div
                            className="text-2xl font-bold"
                            style={{ color: palette.priceColor }}
                          >
                            {formatPrice(plan.price, plan.currency)}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {formatDuration(plan.duration_days)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(plan)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingPlan(plan)}
                            disabled={deletePlan.isPending}
                            className="h-8 w-8 p-0 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {data.total_pages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
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
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                    disabled={page === data.total_pages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

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
