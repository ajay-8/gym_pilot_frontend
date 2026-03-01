"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useGymOnboard } from "@/lib/hooks/use-gyms";
import { useAuth } from "@/lib/hooks/use-auth";

// Form validation schema
const formSchema = z.object({
  // Gym Details
  gymName:   z.string().min(2, "Gym name must be at least 2 characters"),
  brandName: z.string().optional(),
  address:   z.string().optional(),
  city:      z.string().min(2, "City is required"),
  state:     z.string().min(2, "State is required"),
  country:   z.string().min(2, "Country is required"),
  pincode:   z.string().regex(/^\d{6}$/, "Pincode must be 6 digits").optional().or(z.literal("")),
  latitude:  z.string().optional().or(z.literal("")),
  longitude: z.string().optional().or(z.literal("")),

  // Owner Details
  email:           z.string().email("Invalid email address"),
  password:        z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  firstName:       z.string().min(2, "First name is required"),
  lastName:        z.string().optional(),
  phone:           z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number (10 digits starting with 6-9)").optional(),
})
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .superRefine((data, ctx) => {
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

type FormValues = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const gymOnboard = useGymOnboard();
  const { isAuthenticated, hasGymContext, hasHydrated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!hasHydrated) return;

    if (isAuthenticated) {
      router.push(hasGymContext ? "/dashboard" : "/select-gym");
    }
  }, [isAuthenticated, hasGymContext, hasHydrated, router]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
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
      email:     "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError("");

    try {
      await gymOnboard.mutateAsync({
        gym: {
          name:       values.gymName,
          brand_name: values.brandName || undefined,
          address:    values.address   || undefined,
          city:       values.city,
          state:      values.state,
          country:    values.country,
          pincode:    values.pincode ? parseInt(values.pincode) : undefined,
          latitude:   values.latitude  ? parseFloat(values.latitude)  : undefined,
          longitude:  values.longitude ? parseFloat(values.longitude) : undefined,
        },
        owner: {
          email: values.email,
          password: values.password,
          first_name: values.firstName,
          last_name: values.lastName || undefined,
          phone: values.phone || undefined,
        },
      });

      // Success - the hook will redirect to login
    } catch (err: any) {
      setError(err?.detail || "Failed to register. Please try again.");
    }
  };

  // Show loading while checking auth
  if (!hasHydrated || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xl">GP</span>
            </div>
            <span className="text-2xl font-bold">Gym Pilot</span>
          </Link>
          <h1 className="text-3xl font-bold mt-4">Start Your Free Trial</h1>
          <p className="text-muted-foreground mt-2">
            Create your gym account in minutes
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Your Gym Account</CardTitle>
            <CardDescription>
              Enter your gym and account details below
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Gym Details Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Gym Details</h3>

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
                            <Input placeholder="400001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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

                {/* Owner Details Section */}
                <div className="space-y-4 pt-6 border-t">
                  <h3 className="text-lg font-semibold">Your Account Details</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
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
                      name="lastName"
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

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="9876543210" {...field} />
                        </FormControl>
                        <FormDescription>
                          10 digits starting with 6-9
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormDescription>
                          At least 8 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={gymOnboard.isPending}
                >
                  {gymOnboard.isPending ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          By creating an account, you agree to our{" "}
          <Link href="#" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
