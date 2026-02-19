"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useMemberDetail, useMemberStatusUpdate, useMembershipRenew, useMemberHealthRecords, useMemberHealthRecordsUpdate, useMemberDelete } from "@/lib/hooks/use-members";
import { EditMemberDialog } from "@/components/members/edit-member-dialog";
import { MembershipHistoryDialog } from "@/components/members/membership-history-dialog";
import { useMembershipPlans, useMembershipPlanDetail } from "@/lib/hooks/use-membership-plans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  User,
  CreditCard,
  Activity,
  Ban,
  CheckCircle,
  Heart,
  Edit2,
  Save,
  X,
  Trash2,
  Pencil,
} from "lucide-react";
import { StatusType } from "@/types/api";
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

// Helper function to get badge variant based on status
function getStatusBadgeVariant(
  status: StatusType
): "default" | "success" | "warning" | "destructive" | "secondary" {
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
    month: "long",
    day: "numeric",
  });
}

export default function MemberDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const { data: member, isLoading, error } = useMemberDetail(userId);

  // State declarations
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [targetStatus, setTargetStatus] = useState<StatusType | null>(null);
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [isEditingHealth, setIsEditingHealth] = useState(false);

  // Lazy-load health records only when editing
  const { data: healthRecords, isLoading: isHealthLoading } = useMemberHealthRecords(userId, isEditingHealth);

  // Fetch the current member's plan (only if they have one)
  const { data: currentMemberPlan } = useMembershipPlanDetail(
    member?.membership?.plan_id || "",
    !!member?.membership?.plan_id
  );

  // Lazy-load ALL plans only when renew dialog opens (for selection dropdown)
  const { data: plansData } = useMembershipPlans({ include_inactive: true }, showRenewDialog);

  const updateStatus = useMemberStatusUpdate();
  const renewMembership = useMembershipRenew();
  const updateHealthRecords = useMemberHealthRecordsUpdate();
  const deleteMember = useMemberDelete();
  const [healthForm, setHealthForm] = useState({
    emergency_contact: {
      name: "",
      relationship: "",
      phone: "",
    },
    fitness_goals: [] as string[],
    injuries_limitations: "",
    medical_conditions: [] as Array<{ condition?: string; severity?: string; notes?: string }>,
  });

  const handleStatusUpdate = async () => {
    if (!targetStatus) return;

    try {
      await updateStatus.mutateAsync({
        userId,
        payload: { status: targetStatus },
      });
      setShowStatusDialog(false);
      setTargetStatus(null);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMember.mutateAsync(userId);
      setShowDeleteDialog(false);
      router.push("/dashboard/members");
    } catch (err) {
      console.error("Failed to delete member:", err);
    }
  };

  const openStatusDialog = (status: StatusType) => {
    // Validate: Cannot activate if TIME-BASED membership is cancelled or expired
    if (status === "active" && member?.membership) {
      const membershipStatus = member.membership.status;
      const isLifetime = !member.membership.end_date; // Lifetime = no end_date

      // Only block activation for time-based memberships that are cancelled/expired
      if (!isLifetime && (membershipStatus === "cancelled" || membershipStatus === "expired")) {
        alert("Cannot activate: membership is " + membershipStatus + ". Please renew membership first.");
        return;
      }

      // Lifetime memberships can be reactivated even if cancelled
    }
    setTargetStatus(status);
    setShowStatusDialog(true);
  };

  const handleRenewMembership = async () => {
    if (!selectedPlanId) return;

    try {
      await renewMembership.mutateAsync({
        userId,
        payload: { plan_id: selectedPlanId },
      });
      setShowRenewDialog(false);
      setSelectedPlanId("");
    } catch (err) {
      console.error("Failed to renew membership:", err);
    }
  };

  const handleEditHealth = () => {
    if (healthRecords) {
      setHealthForm({
        emergency_contact: {
          name: healthRecords.emergency_contact?.name ?? "",
          relationship: healthRecords.emergency_contact?.relationship ?? "",
          phone: healthRecords.emergency_contact?.phone ?? "",
        },
        fitness_goals: healthRecords.fitness_goals || [],
        injuries_limitations: healthRecords.injuries_limitations || "",
        medical_conditions: healthRecords.medical_conditions || [],
      });
    }
    setIsEditingHealth(true);
  };

  const handleCancelEdit = () => {
    setIsEditingHealth(false);
  };

  const handleSaveHealth = async () => {
    try {
      await updateHealthRecords.mutateAsync({
        userId,
        payload: healthForm,
      });
      setIsEditingHealth(false);
    } catch (err) {
      console.error("Failed to update health records:", err);
    }
  };

  const addFitnessGoal = () => {
    setHealthForm((prev) => ({
      ...prev,
      fitness_goals: [...prev.fitness_goals, ""],
    }));
  };

  const updateFitnessGoal = (index: number, value: string) => {
    setHealthForm((prev) => ({
      ...prev,
      fitness_goals: prev.fitness_goals.map((goal, i) => (i === index ? value : goal)),
    }));
  };

  const removeFitnessGoal = (index: number) => {
    setHealthForm((prev) => ({
      ...prev,
      fitness_goals: prev.fitness_goals.filter((_, i) => i !== index),
    }));
  };

  const addMedicalCondition = () => {
    setHealthForm((prev) => ({
      ...prev,
      medical_conditions: [...prev.medical_conditions, { condition: "", severity: "", notes: "" }],
    }));
  };

  const updateMedicalCondition = (index: number, field: string, value: string) => {
    setHealthForm((prev) => ({
      ...prev,
      medical_conditions: prev.medical_conditions.map((cond, i) =>
        i === index ? { ...cond, [field]: value } : cond
      ),
    }));
  };

  const removeMedicalCondition = (index: number) => {
    setHealthForm((prev) => ({
      ...prev,
      medical_conditions: prev.medical_conditions.filter((_, i) => i !== index),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading member details...</div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertDescription>Failed to load member details. Please try again.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isActive = member.status === "active";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight gradient-text">
              {member.first_name} {member.last_name}
            </h1>
            <p className="text-muted-foreground mt-1">Gym Participant Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusBadgeVariant(member.status)} className="text-sm">
            {formatStatus(member.status)}
          </Badge>
          <Button
            variant="outline"
            onClick={() => setShowEditDialog(true)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          {isActive ? (
            <Button
              variant="outline"
              onClick={() => openStatusDialog("suspended")}
              disabled={updateStatus.isPending}
            >
              <Ban className="mr-2 h-4 w-4" />
              Suspend
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={() => openStatusDialog("active")}
              disabled={updateStatus.isPending}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Activate
            </Button>
          )}
        </div>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
              <User className="h-4 w-4" style={{ color: "#10b981" }} />
            </div>
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic gym participant details and contact information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {member.email && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.08)" }}>
                  <Mail className="h-4 w-4" style={{ color: "#10b981" }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium text-sm">{member.email}</p>
                </div>
              </div>
            )}
            {member.phone && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.08)" }}>
                  <Phone className="h-4 w-4" style={{ color: "#10b981" }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium text-sm">{member.phone}</p>
                </div>
              </div>
            )}
            {member.date_of_birth && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: "rgba(245, 158, 11, 0.08)" }}>
                  <Calendar className="h-4 w-4" style={{ color: "#f59e0b" }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  <p className="font-medium text-sm">{formatDate(member.date_of_birth)}</p>
                </div>
              </div>
            )}
            {member.gender && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: "rgba(139, 92, 246, 0.08)" }}>
                  <User className="h-4 w-4" style={{ color: "#8b5cf6" }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gender</p>
                  <p className="font-medium text-sm capitalize">{member.gender.replace("_", " ")}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: "rgba(245, 158, 11, 0.08)" }}>
                <Calendar className="h-4 w-4" style={{ color: "#f59e0b" }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Joined</p>
                <p className="font-medium text-sm">{formatDate(member.joined_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: "rgba(139, 92, 246, 0.08)" }}>
                <User className="h-4 w-4" style={{ color: "#8b5cf6" }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Roles</p>
                <p className="font-medium text-sm capitalize">{member.roles.join(", ")}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Membership Information */}
      {member.membership && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: "rgba(139, 92, 246, 0.1)" }}>
                  <CreditCard className="h-4 w-4" style={{ color: "#8b5cf6" }} />
                </div>
                <div>
                  <CardTitle>Membership</CardTitle>
                  <CardDescription>Current membership plan and status</CardDescription>
                </div>
              </div>
              <MembershipHistoryDialog userId={userId} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentMemberPlan && (
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="font-medium">{currentMemberPlan.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ₹{currentMemberPlan.price}
                      {currentMemberPlan.duration_days
                        ? ` / ${currentMemberPlan.duration_days} days`
                        : " / Unlimited"}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusBadgeVariant(member.membership.status)}>
                    {formatStatus(member.membership.status)}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{formatDate(member.membership.start_date)}</p>
                </div>
              </div>
              {member.membership.end_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">{formatDate(member.membership.end_date)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Renew Membership Button - Only for time-based memberships */}
            {member.membership.end_date &&
             (member.membership.status === "cancelled" || member.membership.status === "expired") && (
              <div className="mt-4 pt-4 border-t">
                <Button onClick={() => setShowRenewDialog(true)} className="w-full">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Renew Membership
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Check-ins */}
        <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="h-1 stat-bar-green" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Total Check-ins</p>
              <div className="p-2 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                <Activity className="h-4 w-4" style={{ color: "#10b981" }} />
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color: "#10b981" }}>{member.total_check_ins}</p>
            <p className="text-xs text-muted-foreground mt-1">Gym visits recorded</p>
          </div>
        </div>

        {/* Payments */}
        <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="h-1 stat-bar-purple" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Total Payments</p>
              <div className="p-2 rounded-lg" style={{ background: "rgba(139, 92, 246, 0.1)" }}>
                <CreditCard className="h-4 w-4" style={{ color: "#8b5cf6" }} />
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color: "#8b5cf6" }}>{member.total_payments}</p>
            <p className="text-xs text-muted-foreground mt-1">Transactions recorded</p>
          </div>
        </div>
      </div>

      {/* Health Records */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: "rgba(239, 68, 68, 0.1)" }}>
                <Heart className="h-4 w-4" style={{ color: "#ef4444" }} />
              </div>
              <div>
                <CardTitle>Health & Safety Records</CardTitle>
                <CardDescription>Medical information and emergency contacts</CardDescription>
              </div>
            </div>
            {!isEditingHealth && (
              <Button variant="outline" size="sm" onClick={handleEditHealth} disabled={isHealthLoading}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {isEditingHealth && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={updateHealthRecords.isPending}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveHealth}
                  disabled={updateHealthRecords.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateHealthRecords.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isHealthLoading ? (
            <div className="text-muted-foreground text-sm">Loading health records...</div>
          ) : isEditingHealth ? (
            <>
              {/* Emergency Contact - Edit Mode */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <h3 className="font-semibold">Emergency Contact</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-7">
                  <div>
                    <Label htmlFor="ec-name">Name</Label>
                    <Input
                      id="ec-name"
                      value={healthForm.emergency_contact.name}
                      onChange={(e) =>
                        setHealthForm((prev) => ({
                          ...prev,
                          emergency_contact: { ...prev.emergency_contact, name: e.target.value },
                        }))
                      }
                      placeholder="Contact name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ec-relationship">Relationship</Label>
                    <Input
                      id="ec-relationship"
                      value={healthForm.emergency_contact.relationship}
                      onChange={(e) =>
                        setHealthForm((prev) => ({
                          ...prev,
                          emergency_contact: { ...prev.emergency_contact, relationship: e.target.value },
                        }))
                      }
                      placeholder="e.g., Spouse, Parent"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ec-phone">Phone</Label>
                    <Input
                      id="ec-phone"
                      value={healthForm.emergency_contact.phone}
                      onChange={(e) =>
                        setHealthForm((prev) => ({
                          ...prev,
                          emergency_contact: { ...prev.emergency_contact, phone: e.target.value },
                        }))
                      }
                      placeholder="Contact number"
                    />
                  </div>
                </div>
              </div>

              {/* Medical Conditions - Edit Mode */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Medical Conditions</h3>
                  <Button variant="outline" size="sm" onClick={addMedicalCondition}>
                    Add Condition
                  </Button>
                </div>
                {healthForm.medical_conditions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No medical conditions recorded</p>
                ) : (
                  <div className="space-y-3">
                    {healthForm.medical_conditions.map((cond, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-sm">Condition {index + 1}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMedicalCondition(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`cond-${index}-name`}>Condition</Label>
                            <Input
                              id={`cond-${index}-name`}
                              value={cond.condition || ""}
                              onChange={(e) => updateMedicalCondition(index, "condition", e.target.value)}
                              placeholder="e.g., Asthma, Diabetes"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`cond-${index}-severity`}>Severity</Label>
                            <Input
                              id={`cond-${index}-severity`}
                              value={cond.severity || ""}
                              onChange={(e) => updateMedicalCondition(index, "severity", e.target.value)}
                              placeholder="e.g., Mild, Moderate, Severe"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor={`cond-${index}-notes`}>Notes</Label>
                          <Textarea
                            id={`cond-${index}-notes`}
                            value={cond.notes || ""}
                            onChange={(e) => updateMedicalCondition(index, "notes", e.target.value)}
                            placeholder="Additional details"
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fitness Goals - Edit Mode */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Fitness Goals</h3>
                  <Button variant="outline" size="sm" onClick={addFitnessGoal}>
                    Add Goal
                  </Button>
                </div>
                {healthForm.fitness_goals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No fitness goals recorded</p>
                ) : (
                  <div className="space-y-2">
                    {healthForm.fitness_goals.map((goal, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={goal}
                          onChange={(e) => updateFitnessGoal(index, e.target.value)}
                          placeholder={`Goal ${index + 1}`}
                        />
                        <Button variant="ghost" size="sm" onClick={() => removeFitnessGoal(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Injuries/Limitations - Edit Mode */}
              <div className="space-y-3">
                <h3 className="font-semibold">Injuries & Limitations</h3>
                <Textarea
                  value={healthForm.injuries_limitations}
                  onChange={(e) =>
                    setHealthForm((prev) => ({ ...prev, injuries_limitations: e.target.value }))
                  }
                  placeholder="Describe any injuries, physical limitations, or exercise restrictions"
                  rows={4}
                />
              </div>
            </>
          ) : (
            <>
              {/* Emergency Contact - View Mode */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <h3 className="font-semibold">Emergency Contact</h3>
                </div>
                {healthRecords?.emergency_contact?.name ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-7">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{healthRecords.emergency_contact.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Relationship</p>
                      <p className="font-medium">{healthRecords.emergency_contact.relationship || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{healthRecords.emergency_contact.phone || "N/A"}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground pl-7">No emergency contact on file</p>
                )}
              </div>

              {/* Medical Conditions - View Mode */}
              <div className="space-y-2">
                <h3 className="font-semibold">Medical Conditions</h3>
                {healthRecords?.medical_conditions && healthRecords.medical_conditions.length > 0 ? (
                  <div className="space-y-2">
                    {healthRecords.medical_conditions.map((cond, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="font-medium">{cond.condition || "Unnamed condition"}</p>
                            {cond.severity && (
                              <Badge variant="outline" className="text-xs">
                                {cond.severity}
                              </Badge>
                            )}
                            {cond.notes && <p className="text-sm text-muted-foreground">{cond.notes}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No medical conditions recorded</p>
                )}
              </div>

              {/* Fitness Goals - View Mode */}
              <div className="space-y-2">
                <h3 className="font-semibold">Fitness Goals</h3>
                {healthRecords?.fitness_goals && healthRecords.fitness_goals.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {healthRecords.fitness_goals.map((goal, index) => (
                      <li key={index} className="text-sm">
                        {goal}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No fitness goals recorded</p>
                )}
              </div>

              {/* Injuries/Limitations - View Mode */}
              <div className="space-y-2">
                <h3 className="font-semibold">Injuries & Limitations</h3>
                {healthRecords?.injuries_limitations ? (
                  <p className="text-sm">{healthRecords.injuries_limitations}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No injuries or limitations recorded</p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Status Update Confirmation Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {targetStatus === "active" ? "Activate" : "Suspend"} Member?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {targetStatus === "active"
                ? `This will restore ${member.first_name}'s access to the gym.`
                : `This will suspend ${member.first_name}'s gym access. They will not be able to check in until reactivated.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusUpdate} disabled={updateStatus.isPending}>
              {updateStatus.isPending ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Renew Membership Dialog */}
      <AlertDialog open={showRenewDialog} onOpenChange={setShowRenewDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renew Membership</AlertDialogTitle>
            <AlertDialogDescription>
              Select a new membership plan for {member.first_name}. The membership will be activated immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="plan-select">Membership Plan</Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger id="plan-select" className="mt-2">
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {plansData?.items
                  ?.filter((plan) => plan.status === "active")
                  .map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - ₹{plan.price}
                      {plan.duration_days ? ` (${plan.duration_days} days)` : " (Unlimited)"}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRenewMembership}
              disabled={!selectedPlanId || renewMembership.isPending}
            >
              {renewMembership.isPending ? "Renewing..." : "Renew Membership"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Member Dialog */}
      <EditMemberDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        member={member}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {member.first_name} {member.last_name}? This action cannot be undone and will remove all their data from this gym.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMember.isPending}
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
