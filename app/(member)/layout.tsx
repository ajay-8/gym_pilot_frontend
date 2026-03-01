"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Dumbbell,
  Receipt,
  LogOut,
  ChevronRight,
  ArrowLeftRight,
  ClipboardCheck,
  Building2,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, useLogout } from "@/lib/hooks/use-auth";
import { GymSwitcherPill } from "@/components/gym-switcher-pill";
import { useEffect } from "react";
import type { ParticipantRole } from "@/types/api";

// ── Nav ───────────────────────────────────────────────────────────────────────

const navigation = [
  { name: "Dashboard",   href: "/member/dashboard",   icon: LayoutDashboard },
  { name: "Membership",  href: "/member/membership",  icon: CreditCard },
  { name: "PT Sessions", href: "/member/sessions",    icon: Dumbbell },
  { name: "Check-ins",   href: "/member/check-ins",   icon: ClipboardCheck },
  { name: "Payments",    href: "/member/payments",    icon: Receipt },
  { name: "Trainers",    href: "/member/trainers",    icon: Users },
  { name: "Gym Info",    href: "/member/gym-info",    icon: Building2 },
  { name: "Profile",     href: "/member/profile",     icon: User },
];

// ── Layout ────────────────────────────────────────────────────────────────────

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, gymContext, isAuthenticated, hasHydrated } = useAuth();
  const logout = useLogout();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push("/login");
  }, [hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (hasHydrated && isAuthenticated && !gymContext) router.push("/select-gym");
  }, [hasHydrated, isAuthenticated, gymContext, router]);

  // Guard: must have member role
  useEffect(() => {
    if (hasHydrated && isAuthenticated && gymContext) {
      const isMember = gymContext.roles.includes("member" as ParticipantRole);
      if (!isMember) router.push("/select-gym");
    }
  }, [hasHydrated, isAuthenticated, gymContext, router]);

  if (!hasHydrated || !isAuthenticated || !gymContext) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-7 w-7 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "#3b82f6", borderTopColor: "transparent" }}
            suppressHydrationWarning
          />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const userRoles = gymContext.roles;
  const isAdmin = userRoles.some((r) => ["owner", "admin", "staff"].includes(r));
  const isTrainer = userRoles.includes("trainer" as ParticipantRole);
  const userInitial = user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || "U";

  const pageNames: Record<string, string> = {
    "/member/dashboard":  "Dashboard",
    "/member/membership": "My Membership",
    "/member/sessions":   "PT Sessions",
    "/member/check-ins":  "Check-in History",
    "/member/payments":   "Payments",
    "/member/trainers":   "Our Trainers",
    "/member/gym-info":   "Gym Info",
    "/member/profile":    "My Profile",
  };
  const currentPageName = pageNames[pathname] ?? "Member Portal";

  const handleLogout = async () => { await logout.mutateAsync(); };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside
        className="hidden w-64 flex-col md:flex"
        style={{
          background: "linear-gradient(180deg, hsl(220, 38%, 9%) 0%, hsl(220, 35%, 8%) 100%)",
          borderRight: "1px solid hsl(var(--border))",
        }}
      >
        {/* Logo */}
        <div
          className="flex h-16 flex-shrink-0 items-center gap-3 px-5"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}
        >
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #3b82f6 0%, #10b981 100%)" }}
          >
            <Dumbbell className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-base font-bold" style={{ color: "#3b82f6" }}>Member</span>
            <span className="text-base font-bold text-foreground"> Portal</span>
          </div>
        </div>

        {/* Gym pill — inline switcher */}
        <div className="px-3 py-3 flex-shrink-0" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          <GymSwitcherPill gymContext={gymContext} rgb="59,130,246" roleLabel="Member" />
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Menu
          </p>
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
                style={isActive ? { background: "rgba(59,130,246,0.12)", color: "#93c5fd" } : undefined}
              >
                <item.icon
                  className="h-4 w-4 flex-shrink-0"
                  style={isActive ? { color: "#3b82f6" } : undefined}
                />
                <span className="flex-1">{item.name}</span>
                {isActive && <ChevronRight className="h-3 w-3 opacity-70" style={{ color: "#3b82f6" }} />}
              </Link>
            );
          })}
        </nav>

        {/* Footer — portal switchers (if applicable) */}
        {(isTrainer || isAdmin) && (
          <div className="p-3 flex-shrink-0" style={{ borderTop: "1px solid hsl(var(--border))" }}>
            {isTrainer && (
              <Link
                href="/trainer/dashboard"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-150 mb-1"
              >
                <ArrowLeftRight className="h-4 w-4 flex-shrink-0" />
                <span>Switch to Trainer Portal</span>
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-150"
              >
                <ArrowLeftRight className="h-4 w-4 flex-shrink-0" />
                <span>Switch to Admin Portal</span>
              </Link>
            )}
          </div>
        )}
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header
          className="flex h-16 flex-shrink-0 items-center justify-between px-6"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}
        >
          <div>
            <h1 className="text-lg font-semibold text-foreground leading-tight">{currentPageName}</h1>
            <p className="text-xs text-muted-foreground">{gymContext.gym_name}</p>
          </div>

          <div className="flex items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full p-0">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: "linear-gradient(135deg, #3b82f6, #10b981)" }}
                  >
                    {userInitial}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.first_name || "Member"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/member/profile">My Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
