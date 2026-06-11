"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMyGyms } from "@/lib/hooks/use-gyms";
import { useSetGymSession, useAuth } from "@/lib/hooks/use-auth";
import { Building2, Dumbbell, CreditCard, ChevronRight, MapPin } from "lucide-react";

// ── Logo header (shared) ──────────────────────────────────────────────────
function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 mb-10">
      <div
        className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)" }}
      >
        <span className="text-white font-bold text-base">GP</span>
      </div>
      <span className="text-lg font-bold tracking-widest text-white uppercase">Gym Pilot</span>
    </Link>
  );
}

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

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#080b10" }}>
        <div className="h-8 w-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "rgba(16,185,129,0.3)", borderTopColor: "#10b981" }} />
      </div>
    );
  }

  // ── Portal selector ───────────────────────────────────────────────────────
  if (showPortalSelector) {
    const roles = gymContext?.roles ?? [];
    const isAdmin   = roles.some((r) => ["owner", "admin", "staff"].includes(r));
    const isTrainer = roles.includes("trainer");
    const isMember  = roles.includes("member");

    const portals = [
      isAdmin && {
        label: "Gym Admin Portal",
        desc: "Manage members, staff, memberships, payments and reports",
        href: "/dashboard",
        color: "#10b981",
        icon: <Building2 className="h-5 w-5" style={{ color: "#10b981" }} />,
      },
      isTrainer && {
        label: "Trainer Portal",
        desc: "Manage your PT packages, sessions, schedule and commissions",
        href: "/trainer/dashboard",
        color: "#8b5cf6",
        icon: <Dumbbell className="h-5 w-5" style={{ color: "#8b5cf6" }} />,
      },
      isMember && {
        label: "Member Portal",
        desc: "View your membership, PT sessions, payments and profile",
        href: "/member/dashboard",
        color: "#3b82f6",
        icon: <CreditCard className="h-5 w-5" style={{ color: "#3b82f6" }} />,
      },
    ].filter(Boolean) as Array<{
      label: string; desc: string; href: string; color: string; icon: React.ReactNode;
    }>;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6" style={{ backgroundColor: "#080b10" }}>
        <Logo />
        <div className="w-full max-w-lg">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Choose Your Portal</h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              You have multiple roles at{" "}
              <span className="text-white font-medium">{gymContext?.gym_name}</span>
            </p>
          </div>

          <div className="space-y-3">
            {portals.map((portal) => (
              <button
                key={portal.href}
                onClick={() => router.push(portal.href)}
                className="w-full text-left rounded-2xl p-5 flex items-center justify-between transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${portal.color}55`;
                  e.currentTarget.style.background = `${portal.color}0d`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${portal.color}1a`, border: `1px solid ${portal.color}33` }}
                  >
                    {portal.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{portal.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{portal.desc}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 ml-3" style={{ color: "rgba(255,255,255,0.3)" }} />
              </button>
            ))}
          </div>

          <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.28)" }}>
            You can switch portals anytime from the sidebar menu
          </p>
        </div>
      </div>
    );
  }

  // ── Error / no gyms ───────────────────────────────────────────────────────
  if (isError || !gymsData?.items.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6" style={{ backgroundColor: "#080b10" }}>
        <Logo />
        <div className="w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-white mb-2">No Gyms Found</h1>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
            You don't have access to any gyms yet. Contact your gym admin or register a new one.
          </p>
          <div className="flex gap-3">
            <Link
              href="/register"
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white text-center"
              style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", boxShadow: "0 0 20px rgba(16,185,129,0.25)" }}
            >
              Register New Gym
            </Link>
            <Link
              href="/"
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-center"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)" }}
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Gym list ──────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6" style={{ backgroundColor: "#080b10" }}>
      <Logo />

      <div className="w-full max-w-lg">
        {/* Heading */}
        <div className="mb-7 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            {gymContext ? "Switch Gym" : "Select Your Gym"}
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            {gymContext
              ? `Currently managing: ${gymContext.gym_name}`
              : `You have access to ${gymsData.total} ${gymsData.total === 1 ? "gym" : "gyms"}`}
          </p>
        </div>

        {/* Gym cards */}
        <div className="space-y-3">
          {gymsData.items.map((gym) => (
            <button
              key={gym.id}
              onClick={() => handleSelectGym(gym.id)}
              disabled={setGymSession.isPending}
              className="w-full text-left rounded-2xl px-5 py-4 flex items-center justify-between transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: setGymSession.isPending ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!setGymSession.isPending) {
                  e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)";
                  e.currentTarget.style.background = "rgba(16,185,129,0.05)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.25)" }}
                >
                  <Building2 className="h-5 w-5" style={{ color: "#10b981" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{gym.name}</p>
                  {(gym.city || gym.country) && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                        {[gym.city, gym.state, gym.country].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div
                className="px-4 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
                style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981" }}
              >
                {setGymSession.isPending ? (
                  <div className="h-3 w-3 rounded-full border border-current border-t-transparent animate-spin" />
                ) : "Select"}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-7" style={{ color: "rgba(255,255,255,0.32)" }}>
          Want to add another gym?{" "}
          <Link href="/register" className="font-medium hover:opacity-80 transition-opacity" style={{ color: "#10b981" }}>
            Register new gym
          </Link>
        </p>
      </div>
    </div>
  );
}
