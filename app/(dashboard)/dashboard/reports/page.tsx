"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign, BarChart3, PieChart, Calendar } from "lucide-react";

const reports = [
  {
    title: "Membership Report",
    description: "Status breakdown, plan distribution, and growth trends",
    href: "/dashboard/reports/memberships",
    icon: Users,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  {
    title: "Revenue Analytics",
    description: "Payment method breakdown and revenue trends",
    href: "/dashboard/reports/revenue",
    icon: DollarSign,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950",
  },
  {
    title: "Attendance Report",
    description: "Daily check-ins and visitor trends",
    href: "/dashboard/reports/attendance",
    icon: Calendar,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950",
  },
  {
    title: "Member Analytics",
    description: "Growth metrics and membership type distribution (Coming soon)",
    href: "#",
    icon: TrendingUp,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950",
    disabled: true,
  },
  {
    title: "Lead Analytics",
    description: "Conversion metrics and source breakdown (Coming soon)",
    href: "#",
    icon: BarChart3,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950",
    disabled: true,
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Access comprehensive reports and insights about your gym's performance
        </p>
      </div>

      {/* Report Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon;
          const CardWrapper = report.disabled ? "div" : Link;
          const cardProps = report.disabled ? {} : { href: report.href };

          return (
            <CardWrapper key={report.title} {...cardProps}>
              <Card
                className={
                  report.disabled
                    ? "opacity-60 cursor-not-allowed"
                    : "cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
                }
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${report.bgColor}`}>
                      <Icon className={`h-6 w-6 ${report.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">{report.description}</CardDescription>
                </CardContent>
              </Card>
            </CardWrapper>
          );
        })}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>
            Choose from the following reports to gain insights into your gym's operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
              <div>
                <p className="font-medium">Membership Report</p>
                <p className="text-sm text-muted-foreground">
                  Track membership status, plan distribution, expiring memberships, and monthly growth trends
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
              <div>
                <p className="font-medium">Revenue Analytics</p>
                <p className="text-sm text-muted-foreground">
                  Analyze revenue by payment method, transaction volume, and monthly trends
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
              <div>
                <p className="font-medium">Attendance Report</p>
                <p className="text-sm text-muted-foreground">
                  Monitor daily check-ins, unique visitors, and identify peak days
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
