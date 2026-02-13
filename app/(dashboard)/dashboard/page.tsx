"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Calendar, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";

export default function DashboardPage() {
  const { user, gymContext } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold">
          Welcome back, {user?.first_name || "there"}!
        </h2>
        <p className="text-muted-foreground mt-1">
          Here's what's happening at {gymContext?.gym_name} today
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              No members yet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Memberships</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              No active memberships
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Classes Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              No classes scheduled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹0</div>
            <p className="text-xs text-muted-foreground">
              No revenue yet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with these common tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="text-base">Add New Member</CardTitle>
                <CardDescription className="text-sm">
                  Onboard a new member to your gym
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="text-base">Create Membership Plan</CardTitle>
                <CardDescription className="text-sm">
                  Set up pricing and duration
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="text-base">Schedule a Class</CardTitle>
                <CardDescription className="text-sm">
                  Add a new group fitness class
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Complete these steps to set up your gym
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center">
                <span className="text-xs font-medium">1</span>
              </div>
              <p className="text-sm">Set up membership plans</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full border-2 border-muted flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground">2</span>
              </div>
              <p className="text-sm text-muted-foreground">Add your first member</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full border-2 border-muted flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground">3</span>
              </div>
              <p className="text-sm text-muted-foreground">Schedule your first class</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full border-2 border-muted flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground">4</span>
              </div>
              <p className="text-sm text-muted-foreground">Record your first payment</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
