"use client";

import { useState, useEffect } from "react";
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
import { DateOfBirthPicker } from "@/components/ui/date-of-birth-picker";
import { useMemberUpdate } from "@/lib/hooks/use-members";
import { MemberDetailResponse } from "@/types/api";

const formSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100).optional(),
  last_name: z.string().max(100).optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter 10-digit mobile number")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  date_of_birth: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: MemberDetailResponse | null;
}

export function EditMemberDialog({ open, onOpenChange, member }: EditMemberDialogProps) {
  const [errorMessage, setErrorMessage] = useState("");
  const memberUpdate = useMemberUpdate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      gender: undefined,
      date_of_birth: "",
    },
  });

  // Update form when member changes
  useEffect(() => {
    if (member) {
      form.reset({
        first_name: member.first_name || "",
        last_name: member.last_name || "",
        phone: (member.phone || "").replace(/^\+?91/, ""),
        email: member.email || "",
        gender: member.gender as any,
        date_of_birth: member.date_of_birth || "",
      });
    }
  }, [member, form]);

  const onSubmit = async (data: FormData) => {
    if (!member) return;

    setErrorMessage("");

    try {
      // Only send fields that have changed and have values
      const payload: any = {};
      if (data.first_name) payload.first_name = data.first_name;
      if (data.last_name) payload.last_name = data.last_name;
      if (data.phone) payload.phone = data.phone;
      if (data.email) payload.email = data.email;
      if (data.gender) payload.gender = data.gender;
      if (data.date_of_birth) payload.date_of_birth = data.date_of_birth;

      await memberUpdate.mutateAsync({
        userId: member.user_id,
        payload,
      });

      onOpenChange(false);
    } catch (error: any) {
      setErrorMessage(
        error?.detail || error?.response?.data?.detail || "Failed to update member. Please try again."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Member Details</DialogTitle>
          <DialogDescription>
            Update member's personal information
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
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John" />
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
                    <FormLabel>Last Name (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Doe" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <div className="flex items-center overflow-hidden rounded-md border border-input bg-background">
                      <span className="px-3 py-2 text-sm text-muted-foreground flex-shrink-0 select-none border-r border-input">+91</span>
                      <input
                        type="tel"
                        value={field.value?.replace(/^\+?91/, "") ?? ""}
                        onChange={e => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="10-digit number"
                        maxLength={10}
                        className="flex-1 px-3 py-2 text-sm outline-none bg-transparent text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
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
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="john@example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date_of_birth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth (Optional)</FormLabel>
                  <FormControl>
                    <DateOfBirthPicker value={field.value ?? ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender (Optional)</FormLabel>
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={memberUpdate.isPending}>
                {memberUpdate.isPending ? "Updating..." : "Update Member"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
