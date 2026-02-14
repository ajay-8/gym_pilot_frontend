"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useMemberDetail, useMemberStatusUpdate, useMemberHealthRecords, useMemberHealthRecordsUpdate } from "@/lib/hooks/use-members";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const { data: healthRecords, isLoading: isHealthLoading } = useMemberHealthRecords(userId);
  const updateStatus = useMemberStatusUpdate();
  const updateHealthRecords = useMemberHealthRecordsUpdate();

  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [targetStatus, setTargetStatus] = useState<StatusType | null>(null);
  const [isEditingHealth, setIsEditingHealth] = useState(false);
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

  const openStatusDialog = (status: StatusType) => {
    setTargetStatus(status);
    setShowStatusDialog(true);
  };

  const handleEditHealth = () => {
    if (healthRecords) {
      setHealthForm({
        emergency_contact: healthRecords.emergency_contact || { name: "", relationship: "", phone: "" },
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
            <h1 className="text-3xl font-bold tracking-tight">
              {member.first_name} {member.last_name}
            </h1>
            <p className="text-muted-foreground mt-1">Member Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusBadgeVariant(member.status)} className="text-sm">
            {formatStatus(member.status)}
          </Badge>
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
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Basic member details and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {member.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{member.email}</p>
                </div>
              </div>
            )}
            {member.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{member.phone}</p>
                </div>
              </div>
            )}
            {member.date_of_birth && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{formatDate(member.date_of_birth)}</p>
                </div>
              </div>
            )}
            {member.gender && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium capitalize">{member.gender.replace("_", " ")}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="font-medium">{formatDate(member.joined_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Roles</p>
                <p className="font-medium capitalize">{member.roles.join(", ")}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Membership Information */}
      {member.membership && (
        <Card>
          <CardHeader>
            <CardTitle>Membership</CardTitle>
            <CardDescription>Current membership plan and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </CardContent>
        </Card>
      )}

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Summary</CardTitle>
          <CardDescription>Member activity and engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Check-ins</p>
                <p className="text-2xl font-bold">{member.total_check_ins}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-2xl font-bold">{member.total_payments}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Records */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Health & Safety Records</CardTitle>
              <CardDescription>Medical information and emergency contacts</CardDescription>
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
    </div>
  );
}
