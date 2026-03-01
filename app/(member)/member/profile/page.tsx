"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { useMemberDashboard } from "@/lib/hooks/use-member-portal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { CreditCard } from "lucide-react";
import Link from "next/link";

// ── Helpers ───────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 py-3" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, gymContext } = useAuth();
  const { data: dashData, isLoading } = useMemberDashboard();

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ");
  const membership = dashData?.active_membership;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ── Profile Card ──────────────────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center flex-shrink-0 text-white text-2xl font-bold"
                style={{ background: "linear-gradient(135deg, #3b82f6, #10b981)" }}
              >
                {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "M"}
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-foreground">
                  {fullName || "Member"}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {gymContext?.gym_name}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              <InfoRow label="Full Name" value={fullName || undefined} />
              <InfoRow label="Email Address" value={user?.email} />
              <div
                className="flex flex-col gap-0.5 py-3"
                style={{ borderBottom: "1px solid hsl(var(--border))" }}
              >
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="text-sm font-medium text-foreground capitalize">
                  {gymContext?.roles.join(", ") || "Member"}
                </p>
              </div>
              <InfoRow label="Gym" value={gymContext?.gym_name} />
            </div>
            <p className="text-xs text-muted-foreground mt-4 pt-3" style={{ borderTop: "1px solid hsl(var(--border))" }}>
              To update your profile details, please contact your gym admin.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Sidebar: Membership Mini-Card ─────────────────────────────── */}
      <div className="space-y-4">
        <Card style={{ border: "1px solid rgba(59,130,246,0.2)", background: "rgba(59,130,246,0.04)" }}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" style={{ color: "#3b82f6" }} />
              <CardTitle className="text-sm font-semibold text-foreground">Membership</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : membership ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium text-foreground">{membership.plan?.name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span
                    className="font-semibold capitalize"
                    style={{ color: membership.status === "active" ? "#10b981" : "#ef4444" }}
                  >
                    {membership.status}
                  </span>
                </div>
                {membership.end_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires</span>
                    <span className="font-medium text-foreground">
                      {format(parseISO(membership.end_date), "dd MMM yyyy")}
                    </span>
                  </div>
                )}
                <Link
                  href="/member/membership"
                  className="block mt-3 text-xs text-center py-1.5 rounded-md transition-colors"
                  style={{ background: "rgba(59,130,246,0.1)", color: "#93c5fd" }}
                >
                  View full history →
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground">No active membership.</p>
                <Link
                  href="/member/membership"
                  className="block mt-3 text-xs text-center py-1.5 rounded-md"
                  style={{ background: "rgba(59,130,246,0.1)", color: "#93c5fd" }}
                >
                  View membership →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick links */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1">
            {[
              { href: "/member/sessions",   label: "My PT Sessions" },
              { href: "/member/payments",   label: "Payment History" },
              { href: "/select-gym",        label: "Switch Gym" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
