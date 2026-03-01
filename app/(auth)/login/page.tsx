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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLogin, useAuth, resolvePortalRoute } from "@/lib/hooks/use-auth";

// Form validation schema
const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const login = useLogin();
  const { isAuthenticated, gymContext, hasGymContext, hasHydrated } = useAuth();

  // Redirect already-authenticated users, but not while login mutation is in progress
  // (the mutation handles routing itself — this guard is only for direct /login visits)
  useEffect(() => {
    if (!hasHydrated) return;
    if (login.isPending) return;
    if (isAuthenticated) {
      router.push(hasGymContext ? resolvePortalRoute(gymContext?.roles ?? []) : "/select-gym");
    }
  }, [isAuthenticated, gymContext, hasGymContext, hasHydrated, login.isPending, router]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError("");

    try {
      await login.mutateAsync(values);
      // Success - the hook will redirect to dashboard or gym selection
    } catch (err: any) {
      // err is an APIError shaped object (see client.ts interceptor)
      // 401 always means wrong credentials on the login page
      if (err?.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else if (typeof err?.detail === "string" && !err.detail.includes("status code")) {
        setError(err.detail);
      } else {
        setError("Something went wrong. Please try again.");
      }
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)" }}
            >
              <span className="text-white font-bold text-xl">GP</span>
            </div>
            <span className="text-2xl font-bold gradient-text">Gym Pilot</span>
          </Link>
          <h1 className="text-3xl font-bold mt-4">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to your account to continue
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Link
                          href="/forgot-password"
                          className="text-sm text-primary hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="current-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={login.isPending}
                >
                  {login.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
