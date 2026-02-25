"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMyGyms } from "@/lib/hooks/use-gyms";
import { useSetGymSession, useAuth } from "@/lib/hooks/use-auth";
import { Building2, Dumbbell, ChevronRight } from "lucide-react";

export default function SelectGymPage() {
  const { gymContext } = useAuth();
  const { data: gymsData, isLoading, isError } = useMyGyms({ page: 1, page_size: 50 });
  const setGymSession = useSetGymSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const showPortalSelector = searchParams.get("portal") === "choose";

  const handleSelectGym = async (gymId: string) => {
    try {
      await setGymSession.mutateAsync({ gym_id: gymId });
    } catch (error) {
      console.error("Failed to select gym:", error);
    }
  };

  // ── Portal Selector (dual-role: trainer + admin) ──────────────────────────
  if (showPortalSelector) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 mb-6">
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)" }}
              >
                <span className="text-white font-bold text-xl">GP</span>
              </div>
              <span className="text-2xl font-bold gradient-text">Gym Pilot</span>
            </div>
            <h1 className="text-3xl font-bold mt-4">Choose Your Portal</h1>
            <p className="text-muted-foreground mt-2">
              You have access to multiple portals for{" "}
              <span className="text-foreground font-medium">{gymContext?.gym_name}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Gym Admin Portal */}
            <Card
              className="cursor-pointer border transition-all duration-200 hover:border-primary hover:shadow-lg hover:shadow-primary/10 group"
              onClick={() => router.push("/dashboard")}
            >
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div
                  className="h-16 w-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)" }}
                >
                  <Building2 className="h-8 w-8" style={{ color: "#10b981" }} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">Gym Admin Portal</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage members, staff, memberships, payments and reports
                  </p>
                </div>
                <Button
                  className="w-full mt-auto"
                  onClick={(e) => { e.stopPropagation(); router.push("/dashboard"); }}
                >
                  Enter Admin Portal
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Trainer Portal */}
            <Card
              className="cursor-pointer border transition-all duration-200 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 group"
              style={{ borderColor: "hsl(var(--border))" }}
              onClick={() => router.push("/trainer/dashboard")}
            >
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div
                  className="h-16 w-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)" }}
                >
                  <Dumbbell className="h-8 w-8" style={{ color: "#8b5cf6" }} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">Trainer Portal</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage your PT packages, sessions, schedule and commissions
                  </p>
                </div>
                <Button
                  className="w-full mt-auto"
                  style={{ background: "#8b5cf6" }}
                  onClick={(e) => { e.stopPropagation(); router.push("/trainer/dashboard"); }}
                >
                  Enter Trainer Portal
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            You can switch portals anytime from the sidebar menu
          </p>
        </div>
      </div>
    );
  }

  // ── Gym Selection ──────────────────────────────────────────────────────────
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)" }}
            >
              <span className="text-white font-bold text-xl">GP</span>
            </div>
            <span className="text-2xl font-bold gradient-text">Gym Pilot</span>
          </div>
          <h1 className="text-3xl font-bold mt-4">
            {gymContext ? "Switch Gym" : "Select Your Gym"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {gymContext
              ? `Currently managing: ${gymContext.gym_name}`
              : "Choose which gym you want to access"}
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
