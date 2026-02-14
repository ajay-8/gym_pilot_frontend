"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Users, CreditCard, Calendar, BarChart3, UserPlus, Dumbbell, LogOut, Building2 } from "lucide-react";
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
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
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

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-muted/30 md:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold">GP</span>
          </div>
          <span className="text-lg font-bold">Gym Pilot</span>
        </div>

        {/* Gym Context */}
        <div className="border-b p-4">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{gymContext.gym_name}</p>
              <p className="text-xs text-muted-foreground">
                {userRoles.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(", ")}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
          <h1 className="text-2xl font-bold">
            {navigation.find((item) => item.href === pathname)?.name || "Dashboard"}
          </h1>

          {/* User Menu - Desktop */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.first_name?.[0] || user?.email?.[0].toUpperCase()}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {user?.first_name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
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
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
