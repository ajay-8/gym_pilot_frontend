"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Package,
  CalendarCheck,
  Clock,
  DollarSign,
  User,
  LogOut,
  Building2,
  ChevronRight,
  Dumbbell,
  ArrowLeftRight,
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
import { useEffect } from "react";
import type { ParticipantRole } from "@/types/api";

// ── Nav ───────────────────────────────────────────────────────────────────────

const navigation = [
  { name: "Dashboard",    href: "/trainer/dashboard",    icon: Home },
  { name: "My Packages",  href: "/trainer/packages",     icon: Package },
  { name: "Sessions",     href: "/trainer/sessions",     icon: CalendarCheck },
  { name: "Schedule",     href: "/trainer/schedule",     icon: Clock },
  { name: "Commissions",  href: "/trainer/commissions",  icon: DollarSign },
  { name: "Profile",      href: "/trainer/profile",      icon: User },
];

// ── Layout ────────────────────────────────────────────────────────────────────

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
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

  // Guard: must have trainer role
  useEffect(() => {
    if (hasHydrated && isAuthenticated && gymContext) {
      const isTrainer = gymContext.roles.includes("trainer" as ParticipantRole);
      if (!isTrainer) router.push("/dashboard");
    }
  }, [hasHydrated, isAuthenticated, gymContext, router]);

  if (!hasHydrated || !isAuthenticated || !gymContext) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#8b5cf6", borderTopColor: "transparent" }} suppressHydrationWarning />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const userRoles = gymContext.roles;
  const isAdmin = userRoles.some((r) => ["owner", "admin", "staff"].includes(r));
  const userInitial = user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || "U";

  const pageNames: Record<string, string> = {
    "/trainer/dashboard":   "Dashboard",
    "/trainer/packages":    "My Packages",
    "/trainer/sessions":    "Sessions",
    "/trainer/schedule":    "Schedule",
    "/trainer/commissions": "Commissions",
    "/trainer/profile":     "Profile",
  };
  const currentPageName = pageNames[pathname] ?? "Trainer Portal";

  const handleLogout = async () => { await logout.mutateAsync(); };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside
        className="hidden w-64 flex-col md:flex"
        style={{
          background: "linear-gradient(180deg, hsl(270, 38%, 9%) 0%, hsl(270, 35%, 8%) 100%)",
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
            style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #10b981 100%)" }}
          >
            <Dumbbell className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-base font-bold" style={{ color: "#8b5cf6" }}>Trainer</span>
            <span className="text-base font-bold text-foreground"> Portal</span>
          </div>
        </div>

        {/* Gym pill */}
        <div className="px-3 py-3 flex-shrink-0" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          <div
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5"
            style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.14)" }}
          >
            <div
              className="h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(139,92,246,0.15)" }}
            >
              <Building2 className="h-3.5 w-3.5" style={{ color: "#8b5cf6" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-foreground">{gymContext.gym_name}</p>
              <p className="text-[10px] text-muted-foreground">Trainer</p>
            </div>
          </div>
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
                  isActive ? "text-foreground bg-white/8" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
                style={isActive ? { background: "rgba(139,92,246,0.12)", color: "#c4b5fd" } : undefined}
              >
                <item.icon
                  className="h-4 w-4 flex-shrink-0"
                  style={isActive ? { color: "#8b5cf6" } : undefined}
                />
                <span className="flex-1">{item.name}</span>
                {isActive && <ChevronRight className="h-3 w-3 opacity-70" style={{ color: "#8b5cf6" }} />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 flex-shrink-0" style={{ borderTop: "1px solid hsl(var(--border))" }}>
          {isAdmin && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-150 mb-1"
            >
              <ArrowLeftRight className="h-4 w-4 flex-shrink-0" />
              <span>Switch to Admin Portal</span>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all duration-150"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
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
                    style={{ background: "linear-gradient(135deg, #8b5cf6, #10b981)" }}
                  >
                    {userInitial}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.first_name || "Trainer"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/trainer/profile">My Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/select-gym">Switch Gym</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <ArrowLeftRight className="mr-2 h-4 w-4" />
                        Admin Portal
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
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
