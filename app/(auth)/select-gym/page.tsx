"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMyGyms } from "@/lib/hooks/use-gyms";
import { useSetGymSession, useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";

export default function SelectGymPage() {
  const router = useRouter();
  const { user, hasGymContext } = useAuth();
  const { data: gymsData, isLoading, isError } = useMyGyms({ page: 1, page_size: 50 });
  const setGymSession = useSetGymSession();

  // If user already has gym context, redirect to dashboard
  useEffect(() => {
    if (hasGymContext) {
      router.push("/dashboard");
    }
  }, [hasGymContext, router]);

  const handleSelectGym = async (gymId: string) => {
    try {
      await setGymSession.mutateAsync({ gym_id: gymId });
      // Hook will redirect to dashboard on success
    } catch (error) {
      console.error("Failed to select gym:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading your gyms...</p>
      </div>
    );
  }

  if (isError || !gymsData?.items.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Gyms Found</CardTitle>
            <CardDescription>
              You don't have access to any gyms yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                Please contact your gym administrator or register a new gym.
              </AlertDescription>
            </Alert>
            <div className="mt-6 flex gap-4">
              <Button asChild className="flex-1">
                <Link href="/register">Register New Gym</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xl">GP</span>
            </div>
            <span className="text-2xl font-bold">Gym Pilot</span>
          </div>
          <h1 className="text-3xl font-bold mt-4">Select Your Gym</h1>
          <p className="text-muted-foreground mt-2">
            Choose which gym you want to manage
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Gyms</CardTitle>
            <CardDescription>
              You have access to {gymsData.total} {gymsData.total === 1 ? "gym" : "gyms"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gymsData.items.map((gym) => (
                <Card
                  key={gym.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleSelectGym(gym.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{gym.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {[gym.city, gym.state, gym.country]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                      <Button
                        disabled={setGymSession.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectGym(gym.id);
                        }}
                      >
                        {setGymSession.isPending ? "Selecting..." : "Select"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground text-center">
                Want to add another gym?{" "}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Register new gym
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
