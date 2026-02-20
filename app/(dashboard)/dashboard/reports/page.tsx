"use client";

import Link from "next/link";
import { Users, TrendingUp, DollarSign, BarChart3, Calendar } from "lucide-react";

const reports = [
  {
    title: "Membership Report",
    description: "Status breakdown, plan distribution, and growth trends",
    href: "/dashboard/reports/memberships",
    icon: Users,
    bar: "stat-bar-blue",
    iconBg: "rgba(59, 130, 246, 0.12)",
    iconColor: "#3b82f6",
    dot: "#3b82f6",
    disabled: false,
  },
  {
    title: "Revenue Analytics",
    description: "Payment method breakdown and revenue trends",
    href: "/dashboard/reports/revenue",
    icon: DollarSign,
    bar: "stat-bar-green",
    iconBg: "rgba(16, 185, 129, 0.12)",
    iconColor: "#10b981",
    dot: "#10b981",
    disabled: false,
  },
  {
    title: "Attendance Report",
    description: "Daily check-ins and visitor trends",
    href: "/dashboard/reports/attendance",
    icon: Calendar,
    bar: "stat-bar-purple",
    iconBg: "rgba(139, 92, 246, 0.12)",
    iconColor: "#8b5cf6",
    dot: "#8b5cf6",
    disabled: false,
  },
  {
    title: "Member Analytics",
    description: "Growth metrics and membership type distribution",
    href: "/dashboard/reports/member-analytics",
    icon: TrendingUp,
    bar: "stat-bar-amber",
    iconBg: "rgba(245, 158, 11, 0.12)",
    iconColor: "#f59e0b",
    dot: "#f59e0b",
    disabled: false,
  },
  {
    title: "Lead Analytics",
    description: "Conversion metrics and source breakdown",
    href: "/dashboard/reports/lead-analytics",
    icon: BarChart3,
    bar: "stat-bar-blue",
    iconBg: "rgba(99, 102, 241, 0.12)",
    iconColor: "#6366f1",
    dot: "#6366f1",
    disabled: false,
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight gradient-text">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Access comprehensive reports and insights about your gym's performance
        </p>
      </div>

      {/* Report Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon;

          if (report.disabled) {
            return (
              <div
                key={report.title}
                className="rounded-xl overflow-hidden opacity-40 cursor-not-allowed"
                style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              >
                <div className={`h-1 ${report.bar}`} />
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-lg" style={{ background: report.iconBg }}>
                      <Icon className="h-5 w-5" style={{ color: report.iconColor }} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{report.title}</h3>
                      <span className="text-xs text-muted-foreground">Coming soon</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{report.description}</p>
                </div>
              </div>
            );
          }

          return (
            <Link key={report.title} href={report.href}>
              <div
                className="rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg group"
                style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              >
                <div className={`h-1 ${report.bar}`} />
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="p-2.5 rounded-lg transition-transform group-hover:scale-110"
                      style={{ background: report.iconBg }}
                    >
                      <Icon className="h-5 w-5" style={{ color: report.iconColor }} />
                    </div>
                    <h3 className="font-semibold">{report.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{report.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Report Descriptions */}
      <div
        className="rounded-xl p-6"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
            <BarChart3 className="h-4 w-4" style={{ color: "#10b981" }} />
          </div>
          <div>
            <h2 className="font-semibold">Available Reports</h2>
            <p className="text-sm text-muted-foreground">What each report covers</p>
          </div>
        </div>
        <div className="space-y-4">
          {reports.filter((r) => !r.disabled).map((report) => (
            <div key={report.title} className="flex items-start gap-3">
              <div
                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: report.dot }}
              />
              <div>
                <p className="font-medium text-sm">{report.title}</p>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
