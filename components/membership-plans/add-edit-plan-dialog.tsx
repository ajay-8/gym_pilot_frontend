"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useMembershipPlanCreate,
  useMembershipPlanUpdate,
} from "@/lib/hooks/use-membership-plans";
import { MembershipPlanResponse } from "@/types/api";

const formSchema = z.object({
  name: z.string().min(2, "Plan name must be at least 2 characters").max(100),
  description: z.string().max(1000).optional(),
  duration_days: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  currency: z.string().min(1),
});

type FormData = z.infer<typeof formSchema>;

interface AddEditPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: MembershipPlanResponse | null;
}

export function AddEditPlanDialog({ open, onOpenChange, plan }: AddEditPlanDialogProps) {
  const [errorMessage, setErrorMessage] = useState("");
  const isEditing = !!plan;

  const createPlan = useMembershipPlanCreate();
  const updatePlan = useMembershipPlanUpdate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      duration_days: "30",
      price: "",
      currency: "INR",
    },
  });

  // Reset form when plan changes or dialog opens/closes
  useEffect(() => {
    if (open && plan) {
      form.reset({
        name: plan.name,
        description: plan.description || "",
        duration_days: plan.duration_days?.toString() || "unlimited",
        price: plan.price.toString(),
        currency: plan.currency,
      });
    } else if (open && !plan) {
      form.reset({
        name: "",
        description: "",
        duration_days: "30",
        price: "",
        currency: "INR",
      });
    }
  }, [open, plan, form]);

  const onSubmit = async (data: FormData) => {
    setErrorMessage("");

    try {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        duration_days: data.duration_days && data.duration_days !== "unlimited" ? parseInt(data.duration_days) : undefined,
        price: parseFloat(data.price),
        currency: data.currency,
      };

      if (isEditing) {
        await updatePlan.mutateAsync({
          planId: plan.id,
          payload,
        });
      } else {
        await createPlan.mutateAsync(payload);
      }

      form.reset();
      onOpenChange(false);
    } catch (error: unknown) {
      const err = error as { detail?: string };
      setErrorMessage(err.detail || `Failed to ${isEditing ? "update" : "create"} plan. Please try again.`);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setErrorMessage("");
    }
    onOpenChange(newOpen);
  };

  const isPending = createPlan.isPending || updatePlan.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Add"} Membership Plan</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the membership plan details below."
              : "Create a new membership plan for your gym."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Basic Monthly, Premium Annual" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what's included in this plan"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="duration_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unlimited">Unlimited / Lifetime</SelectItem>
                      <SelectItem value="30">1 Month (30 days)</SelectItem>
                      <SelectItem value="90">3 Months (90 days)</SelectItem>
                      <SelectItem value="180">6 Months (180 days)</SelectItem>
                      <SelectItem value="365">1 Year (365 days)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Leave empty for unlimited/lifetime memberships
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEditing
                    ? "Updating..."
                    : "Creating..."
                  : isEditing
                  ? "Update Plan"
                  : "Create Plan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
