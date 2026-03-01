"use client";

import { useState } from "react";
import {
  useMyPackages,
  useCreatePackage,
  useUpdatePackage,
  useDeletePackage,
} from "@/lib/hooks/use-trainer-portal";
import type {
  PTPackageResponse,
  PTPackageCreateRequest,
  PTPackageUpdateRequest,
  PTPlanType,
  PTSessionMode,
} from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Loader2, Package } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const PLAN_TYPE_LABELS: Record<PTPlanType, string> = {
  single: "Single Session",
  bundle: "Bundle",
  monthly_unlimited: "Monthly Unlimited",
};

const MODE_LABELS: Record<PTSessionMode, string> = {
  in_person: "In Person",
  online: "Online",
  hybrid: "Hybrid",
};

const PLAN_COLORS: Record<PTPlanType, { bg: string; text: string }> = {
  single:             { bg: "rgba(59,130,246,0.12)",   text: "#60a5fa" },
  bundle:             { bg: "rgba(139,92,246,0.12)",   text: "#a78bfa" },
  monthly_unlimited:  { bg: "rgba(16,185,129,0.12)",   text: "#34d399" },
};

const MODE_COLORS: Record<PTSessionMode, { bg: string; text: string }> = {
  in_person: { bg: "rgba(245,158,11,0.12)",  text: "#fbbf24" },
  online:    { bg: "rgba(6,182,212,0.12)",   text: "#22d3ee" },
  hybrid:    { bg: "rgba(236,72,153,0.12)",  text: "#f472b6" },
};

// ── Package Dialog ────────────────────────────────────────────────────────────

interface PackageDialogProps {
  open: boolean;
  onClose: () => void;
  existing?: PTPackageResponse;
}

function PackageDialog({ open, onClose, existing }: PackageDialogProps) {
  const createPkg = useCreatePackage();
  const updatePkg = useUpdatePackage();

  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [planType, setPlanType] = useState<PTPlanType>(existing?.plan_type ?? "bundle");
  const [sessionMode, setSessionMode] = useState<PTSessionMode>(existing?.session_mode ?? "in_person");
  const [sessionCount, setSessionCount] = useState(existing?.session_count?.toString() ?? "");
  const [expiryDays, setExpiryDays] = useState(existing?.expiry_days?.toString() ?? "");
  const [price, setPrice] = useState(existing ? Number(existing.price).toString() : "");
  const [currency, setCurrency] = useState(existing?.currency ?? "INR");

  const isPending = createPkg.isPending || updatePkg.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    if (existing) {
      const payload: PTPackageUpdateRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        plan_type: planType,
        session_mode: sessionMode,
        session_count: planType !== "monthly_unlimited" && sessionCount ? Number(sessionCount) : undefined,
        expiry_days: expiryDays ? Number(expiryDays) : undefined,
        price: Number(price),
      };
      await updatePkg.mutateAsync({ id: existing.id, payload });
    } else {
      const payload: PTPackageCreateRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        plan_type: planType,
        session_mode: sessionMode,
        session_count: planType !== "monthly_unlimited" && sessionCount ? Number(sessionCount) : undefined,
        expiry_days: expiryDays ? Number(expiryDays) : undefined,
        price: Number(price),
        currency,
      };
      await createPkg.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Package" : "New Package"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="pkg-name">Package Name *</Label>
            <Input
              id="pkg-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 10-Session Bundle"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="pkg-desc">Description</Label>
            <Textarea
              id="pkg-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's included in this package..."
              className="mt-1 resize-none"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Plan Type *</Label>
              <Select value={planType} onValueChange={(v) => setPlanType(v as PTPlanType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PLAN_TYPE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Session Mode *</Label>
              <Select value={sessionMode} onValueChange={(v) => setSessionMode(v as PTSessionMode)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MODE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {planType !== "monthly_unlimited" && (
              <div>
                <Label htmlFor="pkg-sessions">Session Count</Label>
                <Input
                  id="pkg-sessions"
                  type="number"
                  min="1"
                  value={sessionCount}
                  onChange={(e) => setSessionCount(e.target.value)}
                  placeholder="e.g. 10"
                  className="mt-1"
                />
              </div>
            )}
            <div>
              <Label htmlFor="pkg-days">Expiry Days</Label>
              <Input
                id="pkg-days"
                type="number"
                min="1"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                placeholder="e.g. 30 (blank = no expiry)"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pkg-price">Price *</Label>
              <Input
                id="pkg-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="pkg-currency">Currency</Label>
              <Input
                id="pkg-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                maxLength={3}
                placeholder="INR"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim() || !price}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {existing ? "Save Changes" : "Create Package"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PackagesPage() {
  const { data, isLoading } = useMyPackages();
  const deletePkg = useDeletePackage();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PTPackageResponse | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<PTPackageResponse | undefined>();

  const packages = data?.items ?? [];

  const openCreate = () => { setEditTarget(undefined); setDialogOpen(true); };
  const openEdit = (pkg: PTPackageResponse) => { setEditTarget(pkg); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditTarget(undefined); };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deletePkg.mutateAsync(deleteTarget.id);
    setDeleteTarget(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">My Packages</h2>
          <p className="text-sm text-muted-foreground mt-1">Create and manage your PT packages</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Package
        </Button>
      </div>

      {/* Package Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : packages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground opacity-30 mb-3" />
          <p className="text-muted-foreground font-medium">No packages yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first PT package to get started</p>
          <Button className="mt-4" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Package
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => {
            const planColor = PLAN_COLORS[pkg.plan_type] ?? PLAN_COLORS.bundle;
            const modeColor = MODE_COLORS[pkg.session_mode] ?? MODE_COLORS.in_person;
            const isActive = pkg.status === "active";

            return (
              <Card key={pkg.id} className="relative overflow-hidden">
                {/* Status indicator */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ background: isActive ? "#10b981" : "#6b7280" }}
                />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-foreground leading-tight pr-2">{pkg.name}</h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEdit(pkg)}
                        className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(pkg)}
                        className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {pkg.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{pkg.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: planColor.bg, color: planColor.text }}
                    >
                      {PLAN_TYPE_LABELS[pkg.plan_type]}
                    </span>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: modeColor.bg, color: modeColor.text }}
                    >
                      {MODE_LABELS[pkg.session_mode]}
                    </span>
                    {!isActive && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {pkg.status}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    {pkg.session_count > 0 && (
                      <p>{pkg.session_count} sessions · {pkg.duration_minutes} min each</p>
                    )}
                    {pkg.expiry_days && (
                      <p>{pkg.expiry_days} days validity</p>
                    )}
                  </div>

                  <div className="mt-4 pt-3" style={{ borderTop: "1px solid hsl(var(--border)/0.5)" }}>
                    <span className="text-xl font-bold text-foreground">
                      {pkg.currency} {Number(pkg.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      {dialogOpen && (
        <PackageDialog
          open={dialogOpen}
          onClose={closeDialog}
          existing={editTarget}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Package</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletePkg.isPending}
            >
              {deletePkg.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
