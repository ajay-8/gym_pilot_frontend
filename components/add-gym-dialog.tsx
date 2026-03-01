"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCreateGym } from "@/lib/hooks/use-gyms";

// ── Schema — mirrors the gym section of the register page ────────────────────

const schema = z.object({
  gymName:   z.string().min(2, "Gym name must be at least 2 characters"),
  brandName: z.string().optional(),
  address:   z.string().optional(),
  city:      z.string().min(2, "City is required"),
  state:     z.string().min(2, "State is required"),
  country:   z.string().min(2, "Country is required"),
  pincode:   z.string().regex(/^\d{6}$/, "Pincode must be 6 digits").optional().or(z.literal("")),
  latitude:  z.string().optional().or(z.literal("")),
  longitude: z.string().optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  const hasLat = !!data.latitude;
  const hasLon = !!data.longitude;
  if (hasLat !== hasLon) {
    const msg = "Both latitude and longitude must be provided together";
    if (!hasLat) ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg, path: ["latitude"] });
    if (!hasLon) ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg, path: ["longitude"] });
  }
  if (data.latitude && (isNaN(Number(data.latitude)) || Number(data.latitude) < -90 || Number(data.latitude) > 90)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Must be between -90 and 90", path: ["latitude"] });
  }
  if (data.longitude && (isNaN(Number(data.longitude)) || Number(data.longitude) < -180 || Number(data.longitude) > 180)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Must be between -180 and 180", path: ["longitude"] });
  }
});

type FormValues = z.infer<typeof schema>;

// ── Component ─────────────────────────────────────────────────────────────────

interface AddGymDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddGymDialog({ open, onOpenChange }: AddGymDialogProps) {
  const [error, setError] = useState("");
  const createGym = useCreateGym();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      gymName:   "",
      brandName: "",
      address:   "",
      city:      "",
      state:     "",
      country:   "India",
      pincode:   "",
      latitude:  "",
      longitude: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError("");
    try {
      await createGym.mutateAsync({
        name:       values.gymName,
        brand_name: values.brandName || undefined,
        address:    values.address   || undefined,
        city:       values.city,
        state:      values.state,
        country:    values.country,
        pincode:    values.pincode  ? parseInt(values.pincode)    : undefined,
        latitude:   values.latitude ? parseFloat(values.latitude) : undefined,
        longitude:  values.longitude ? parseFloat(values.longitude) : undefined,
      });

      onOpenChange(false);
      form.reset();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create gym. Please try again.");
    }
  };

  const isPending = createGym.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isPending) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Gym</DialogTitle>
          <DialogDescription>
            You&apos;ll be set as the owner and switched into the new gym automatically.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* ── Gym Details ─────────────────────────────────────────── */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Gym Details</h3>

              {/* Gym Name */}
              <FormField
                control={form.control}
                name="gymName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gym Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Elite Fitness Club" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Brand Name */}
              <FormField
                control={form.control}
                name="brandName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Elite Fitness" {...field} />
                    </FormControl>
                    <FormDescription>
                      If you have multiple locations under one brand
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Street address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

              {/* City + State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input placeholder="Mumbai" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State *</FormLabel>
                      <FormControl>
                        <Input placeholder="Maharashtra" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Country + Pincode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country *</FormLabel>
                      <FormControl>
                        <Input placeholder="India" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode</FormLabel>
                      <FormControl>
                        <Input placeholder="400001" maxLength={6} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Latitude + Longitude */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input placeholder="19.0760" inputMode="decimal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input placeholder="72.8777" inputMode="decimal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ── Actions ─────────────────────────────────────────────── */}
            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Gym"}
              </Button>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
