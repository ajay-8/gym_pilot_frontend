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
  ChevronRight,
  ChevronDown,
  ArrowLeftRight,
  ScanLine,
  Banknote,
  UserCog,
  Bell,
  CheckCheck,
  AlertTriangle,
  ScanLine as ScanIcon,
  Sparkles,
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
import { useNotifications, useMarkAllRead } from "@/lib/hooks/use-notifications";
import type { NotificationResponse, NotificationType, ParticipantRole } from "@/types/api";
import { useEffect, useState } from "react";

// ── Nav ───────────────────────────────────────────────────────────────────────

type NavChild = { name: string; href: string; icon: React.ElementType; roles: string[] };
type NavGroup = { name: string; icon: React.ElementType; roles: string[]; children: NavChild[] };
type NavFlat  = { name: string; href: string; icon: React.ElementType; roles: string[] };
type NavEntry = NavFlat | NavGroup;

function isGroup(item: NavEntry): item is NavGroup {
  return "children" in item;
}

const navigation: NavEntry[] = [
  { name: "Dashboard",       href: "/dashboard",            icon: Home,      roles: ["owner", "admin", "staff", "trainer", "member"] },
  {
    name: "Team & Members", icon: Users, roles: ["owner", "admin", "staff"],
    children: [
      { name: "All",      href: "/dashboard/participants", icon: Users,    roles: ["owner", "admin", "staff"] },
      { name: "Members",  href: "/dashboard/members",      icon: Users,    roles: ["owner", "admin", "staff"] },
      { name: "Trainers", href: "/dashboard/trainers",     icon: Dumbbell, roles: ["owner", "admin"] },
      { name: "Staff",    href: "/dashboard/staff",        icon: UserCog,  roles: ["owner", "admin"] },
    ],
  },
  { name: "Check-ins",       href: "/dashboard/check-ins",  icon: ScanLine,  roles: ["owner", "admin", "staff"] },
  { name: "Memberships",     href: "/dashboard/memberships", icon: CreditCard, roles: ["owner", "admin", "staff"] },
  { name: "Classes",         href: "/dashboard/classes",     icon: Calendar,  roles: ["owner", "admin", "staff", "trainer"] },
  { name: "Payments",        href: "/dashboard/payments",    icon: Banknote,  roles: ["owner", "admin", "staff"] },
  { name: "Leads",           href: "/dashboard/leads",       icon: UserPlus,  roles: ["owner", "admin", "staff"] },
  { name: "Amenities",       href: "/dashboard/amenities",   icon: Sparkles,  roles: ["owner", "admin"] },
  { name: "Reports",         href: "/dashboard/reports",     icon: BarChart3, roles: ["owner", "admin"] },
];

// ── Notification type → icon + color ─────────────────────────────────────────

const TYPE_ICON: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  new_member:           { icon: Users,         color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  membership_expiring:  { icon: AlertTriangle,  color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  membership_expired:   { icon: AlertTriangle,  color: "#ef4444", bg: "rgba(239,68,68,0.1)"  },
  payment_received:     { icon: CreditCard,     color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  payment_overdue:      { icon: AlertTriangle,  color: "#ef4444", bg: "rgba(239,68,68,0.1)"  },
  class_booking:        { icon: Calendar,       color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  check_in:             { icon: ScanIcon,       color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
  general:              { icon: Bell,           color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
};

function getTypeCfg(type: string) {
  return TYPE_ICON[type as NotificationType] ?? TYPE_ICON.general;
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Notification Dropdown ─────────────────────────────────────────────────────

function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  // Fetch latest 8 notifications (mix of read + unread, newest first)
  const { data } = useNotifications({ page_size: 8 });
  const markAllRead = useMarkAllRead();

  const items = data?.items ?? [];
  const unreadCount = data?.unread_count ?? 0;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative h-9 w-9 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors outline-none">
          <Bell className="h-[18px] w-[18px] text-muted-foreground" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full text-[9px] font-bold text-white leading-none"
              style={{ background: "#10b981" }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="p-0 overflow-hidden"
        style={{ width: "340px", maxHeight: "520px" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}
        >
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-foreground">Notifications</p>
            {unreadCount > 0 && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}
              >
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutateAsync()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1 text-[11px] font-semibold transition-colors hover:opacity-70 disabled:opacity-40"
              style={{ color: "#10b981" }}
            >
              <CheckCheck className="h-3 w-3" />
              {markAllRead.isPending ? "Marking…" : "Mark all read"}
            </button>
          )}
        </div>

        {/* Notification list */}
        <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
          {items.length === 0 ? (
            <div className="py-10 text-center">
              <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-30" />
              <p className="text-[12px] text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            items.map((item: NotificationResponse) => {
              const cfg = getTypeCfg(item.type);
              const Icon = cfg.icon;
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]"
                  style={{
                    borderBottom: "1px solid hsl(var(--border)/0.5)",
                    background: item.is_read ? "transparent" : "rgba(16,185,129,0.015)",
                  }}
                >
                  {/* Type icon */}
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: cfg.bg }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[12px] text-foreground leading-snug"
                      style={{ fontWeight: item.is_read ? 400 : 600 }}
                    >
                      {item.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                      {item.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {fmtRelative(item.created_at)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!item.is_read && (
                    <div
                      className="h-2 w-2 rounded-full flex-shrink-0 mt-1.5"
                      style={{ background: "#10b981" }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer — View all */}
        <Link href="/dashboard/notifications" onClick={() => setOpen(false)}>
          <div
            className="px-4 py-3 text-center cursor-pointer transition-colors hover:bg-white/[0.03]"
            style={{ borderTop: "1px solid hsl(var(--border))" }}
          >
            <span className="text-[12px] font-semibold" style={{ color: "#10b981" }}>
              View all notifications →
            </span>
          </div>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, gymContext, isAuthenticated, hasHydrated } = useAuth();
  const logout = useLogout();

  // All hooks must be declared before any early returns
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push("/login");
  }, [hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (hasHydrated && isAuthenticated && !gymContext) router.push("/select-gym");
  }, [hasHydrated, isAuthenticated, gymContext, router]);

  // Auto-expand group when navigating to a child page
  useEffect(() => {
    for (const item of navigation) {
      if (isGroup(item) && item.children.some((c) => pathname.startsWith(c.href))) {
        setOpenGroup(item.name);
        return;
      }
    }
  }, [pathname]);

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
  const isTrainer = userRoles.includes("trainer" as ParticipantRole);
  const isMember = userRoles.includes("member" as ParticipantRole);
  const filteredNavigation = navigation.filter((item) =>
    isGroup(item)
      ? item.children.some((c) => c.roles.some((r) => userRoles.includes(r as ParticipantRole)))
      : item.roles.some((role) => userRoles.includes(role as ParticipantRole))
  );

  const handleLogout = async () => { await logout.mutateAsync(); };

  const extraPages: Record<string, string> = {
    "/dashboard/profile": "Profile",
    "/dashboard/notifications": "Notifications",
  };

  // Find current page name — check flat items and group children
  const currentPage = (() => {
    for (const item of navigation) {
      if (isGroup(item)) {
        const child = item.children.find((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
        if (child) return child;
      } else if (item.href === pathname) {
        return item;
      }
    }
    return extraPages[pathname] ? { name: extraPages[pathname] } : null;
  })();

  const userInitial = user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || "U";

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
            style={{ background: "linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)" }}
          >
            <span className="text-white font-bold text-sm">GP</span>
          </div>
          <span className="text-base font-bold gradient-text">Gym Pilot</span>
        </div>

        {/* Gym pill — inline switcher */}
        <div className="px-3 py-3 flex-shrink-0" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          <GymSwitcherPill
            gymContext={gymContext}
            rgb="16,185,129"
            roleLabel={userRoles.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(", ")}
          />
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Menu
          </p>
          {filteredNavigation.map((item) => {
            if (isGroup(item)) {
              const isOpen = openGroup === item.name;
              const hasActiveChild = item.children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
              const visibleChildren = item.children.filter((c) =>
                c.roles.some((r) => userRoles.includes(r as ParticipantRole))
              );
              return (
                <div key={item.name}>
                  <button
                    onClick={() => setOpenGroup(isOpen ? null : item.name)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      hasActiveChild ? "nav-active" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" style={hasActiveChild ? { color: "#10b981" } : undefined} />
                    <span className="flex-1 text-left">{item.name}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      style={hasActiveChild ? { color: "#10b981" } : undefined}
                    />
                  </button>
                  {isOpen && (
                    <div className="mt-0.5 ml-3 pl-3 space-y-0.5" style={{ borderLeft: "1px solid hsl(var(--border))" }}>
                      {visibleChildren.map((child) => {
                        const isChildActive = pathname === child.href || pathname.startsWith(child.href + "/");
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                              isChildActive ? "nav-active" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                            }`}
                          >
                            <child.icon className="h-3.5 w-3.5 flex-shrink-0" style={isChildActive ? { color: "#10b981" } : undefined} />
                            <span className="flex-1">{child.name}</span>
                            {isChildActive && <ChevronRight className="h-3 w-3 opacity-70" style={{ color: "#10b981" }} />}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive ? "nav-active" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" style={isActive ? { color: "#10b981" } : undefined} />
                <span className="flex-1">{item.name}</span>
                {isActive && <ChevronRight className="h-3 w-3 opacity-70" style={{ color: "#10b981" }} />}
              </Link>
            );
          })}
        </nav>

        {/* Footer — portal switchers (if applicable) */}
        {(isTrainer || isMember) && (
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
            {isMember && (
              <Link
                href="/member/dashboard"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-150"
              >
                <ArrowLeftRight className="h-4 w-4 flex-shrink-0" />
                <span>Switch to Member Portal</span>
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
            <h1 className="text-lg font-semibold text-foreground leading-tight">
              {currentPage?.name || "Dashboard"}
            </h1>
            <p className="text-xs text-muted-foreground">{gymContext.gym_name}</p>
          </div>

          {/* Desktop: bell dropdown + avatar */}
          <div className="hidden md:flex items-center gap-1.5">
            <NotificationDropdown />

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
                  <Link href="/dashboard/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">Gym Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile */}
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
                {filteredNavigation.map((item) =>
                  isGroup(item) ? (
                    item.children
                      .filter((c) => c.roles.some((r) => userRoles.includes(r as ParticipantRole)))
                      .map((child) => (
                        <DropdownMenuItem key={child.name} asChild>
                          <Link href={child.href}>
                            <child.icon className="mr-2 h-4 w-4" />
                            {child.name}
                          </Link>
                        </DropdownMenuItem>
                      ))
                  ) : (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link href={item.href}>
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  )
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
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
