"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Users,
  CreditCard,
  Calendar,
  BarChart3,
  UserPlus,
  Dumbbell,
  LogOut,
  Building2,
  ChevronRight,
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

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home, roles: ["owner", "admin", "staff", "trainer", "member"] },
  { name: "Members", href: "/dashboard/members", icon: Users, roles: ["owner", "admin", "staff"] },
  { name: "Memberships", href: "/dashboard/memberships", icon: CreditCard, roles: ["owner", "admin", "staff"] },
  { name: "Classes", href: "/dashboard/classes", icon: Calendar, roles: ["owner", "admin", "staff", "trainer"] },
  { name: "Trainers", href: "/dashboard/trainers", icon: Dumbbell, roles: ["owner", "admin"] },
  { name: "Leads", href: "/dashboard/leads", icon: UserPlus, roles: ["owner", "admin", "staff"] },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3, roles: ["owner", "admin"] },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, gymContext, isAuthenticated, hasHydrated } = useAuth();
  const logout = useLogout();

  // Redirect to login if not authenticated (only after hydration)
  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [hasHydrated, isAuthenticated, router]);

  // Redirect to gym selection if no gym context (only after hydration)
  useEffect(() => {
    if (hasHydrated && isAuthenticated && !gymContext) {
      router.push("/select-gym");
    }
  }, [hasHydrated, isAuthenticated, gymContext, router]);

  if (!hasHydrated || !isAuthenticated || !gymContext) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const userRoles = gymContext?.roles || [];
  const filteredNavigation = navigation.filter((item) =>
    item.roles.some((role) => userRoles.includes(role))
  );

  const handleLogout = async () => {
    await logout.mutateAsync();
  };

  const currentPage = navigation.find((item) => item.href === pathname);
  const userInitial = user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
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
            style={{ background: "linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)" }}
          >
            <span className="text-white font-bold text-sm">GP</span>
          </div>
          <span className="text-base font-bold gradient-text">Gym Pilot</span>
        </div>

        {/* Gym Context */}
        <div className="px-3 py-3 flex-shrink-0" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          <div
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5"
            style={{
              background: "rgba(16,185,129,0.06)",
              border: "1px solid rgba(16,185,129,0.14)",
            }}
          >
            <div
              className="h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(16,185,129,0.15)" }}
            >
              <Building2 className="h-3.5 w-3.5" style={{ color: "#10b981" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-foreground">{gymContext.gym_name}</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {userRoles.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(", ")}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Menu
          </p>
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 group ${
                  isActive ? "nav-active" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <Icon
                  className="h-4 w-4 flex-shrink-0 transition-colors"
                  style={isActive ? { color: "#10b981" } : undefined}
                />
                <span className="flex-1">{item.name}</span>
                {isActive && (
                  <ChevronRight className="h-3 w-3 opacity-70" style={{ color: "#10b981" }} />
                )}
              </Link>
            );
          })}
        </nav>

      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header
          className="flex h-16 flex-shrink-0 items-center justify-between px-6"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}
        >
          <div>
            <h1 className="text-lg font-semibold text-foreground leading-tight">
              {currentPage?.name || "Dashboard"}
            </h1>
            <p className="text-xs text-muted-foreground">{gymContext.gym_name}</p>
          </div>

          {/* Desktop user avatar */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full p-0">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: "linear-gradient(135deg, #10b981, #8b5cf6)" }}
                  >
                    {userInitial}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.first_name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">Profile Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/select-gym">Switch Gym</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Users className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{gymContext.gym_name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filteredNavigation.map((item) => (
                  <DropdownMenuItem key={item.name} asChild>
                    <Link href={item.href}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
