"use client";

import { useState } from "react";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useMemberOnboard } from "@/lib/hooks/use-members";
import { Gender, ParticipantRole } from "@/types/api";

const formSchema = z
  .object({
    first_name: z.string().min(1, "First name is required").max(100),
    last_name: z.string().max(100).optional(),
    phone: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .max(15)
      .regex(/^(\+91[-\s]?)?[6-9]\d{9}$/, "Invalid Indian phone number"),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
    date_of_birth: z.string().optional(),
    roles: z
      .array(z.enum(["member", "trainer", "staff", "admin", "owner"]))
      .min(1, "At least one role is required"),
    membership_start_date: z.string().optional(),
  })
  .refine(
    (data) => {
      // If "member" role is selected, membership_start_date is required
      if (data.roles.includes("member")) {
        return data.membership_start_date && data.membership_start_date.length > 0;
      }
      return true;
    },
    {
      message: "Membership start date is required when Member role is selected",
      path: ["membership_start_date"],
    }
  );

type FormData = z.infer<typeof formSchema>;

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMemberDialog({ open, onOpenChange }: AddMemberDialogProps) {
  const [errorMessage, setErrorMessage] = useState("");
  const memberOnboard = useMemberOnboard();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      gender: undefined,
      date_of_birth: "",
      roles: ["member"],
      membership_start_date: new Date().toISOString().split("T")[0],
    },
  });

  const onSubmit = async (data: FormData) => {
    setErrorMessage("");

    try {
      await memberOnboard.mutateAsync({
        first_name: data.first_name,
        last_name: data.last_name || undefined,
        phone: data.phone,
        email: data.email || undefined,
        gender: data.gender as Gender | undefined,
        date_of_birth: data.date_of_birth || undefined,
        membership_start_date: data.membership_start_date || undefined,
        roles: data.roles as ParticipantRole[],
      });

      form.reset();
      onOpenChange(false);
    } catch (error: unknown) {
      const err = error as { detail?: string };
      setErrorMessage(err.detail || "Failed to add member. Please try again.");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setErrorMessage("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
          <DialogDescription>
            Add a new member to your gym. Fill in their details below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="roles"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Roles *</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Select at least one role for this participant
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "member", label: "Member" },
                      { value: "trainer", label: "Trainer" },
                      { value: "staff", label: "Staff" },
                      { value: "admin", label: "Admin" },
                    ].map((role) => (
                      <FormField
                        key={role.value}
                        control={form.control}
                        name="roles"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={role.value}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(role.value as ParticipantRole)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, role.value])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value: string) => value !== role.value
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {role.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="membership_start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Membership Start Date
                    {form.watch("roles")?.includes("member") && " *"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      disabled={!form.watch("roles")?.includes("member")}
                    />
                  </FormControl>
                  {form.watch("roles")?.includes("member") && (
                    <p className="text-sm text-muted-foreground">
                      Required when Member role is selected
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={memberOnboard.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={memberOnboard.isPending}>
                {memberOnboard.isPending ? "Adding..." : "Add Member"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
