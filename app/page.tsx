import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">GP</span>
            </div>
            <span className="text-xl font-bold">Gym Pilot</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center gap-8 py-24 md:py-32">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Modern Gym Management
            <br />
            <span className="text-primary">Made Simple</span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Complete gym management solution for fitness businesses. Manage members,
            track attendance, schedule classes, and grow your business.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row mt-8">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free Trial
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24 bg-muted/30">
        <div className="flex flex-col items-center gap-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need to Run Your Gym
            </h2>
            <p className="max-w-2xl text-muted-foreground sm:text-lg">
              Powerful features designed for modern fitness businesses
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-6xl">
            <Card>
              <CardHeader>
                <CardTitle>Member Management</CardTitle>
                <CardDescription>
                  Complete member profiles, health records, and attendance tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Digital member profiles</li>
                  <li>• Health & fitness tracking</li>
                  <li>• Attendance history</li>
                  <li>• Automated notifications</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Membership Plans</CardTitle>
                <CardDescription>
                  Flexible pricing and subscription management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Custom pricing tiers</li>
                  <li>• Auto-renewal system</li>
                  <li>• Payment tracking</li>
                  <li>• Expiry reminders</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Class Scheduling</CardTitle>
                <CardDescription>
                  Easy class booking and capacity management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Recurring schedules</li>
                  <li>• Online bookings</li>
                  <li>• Waitlist management</li>
                  <li>• Trainer assignment</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Personal Training</CardTitle>
                <CardDescription>
                  PT packages and session management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Session packages</li>
                  <li>• Credit tracking</li>
                  <li>• Trainer scheduling</li>
                  <li>• Commission management</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analytics & Reports</CardTitle>
                <CardDescription>
                  Insights to grow your business
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Revenue tracking</li>
                  <li>• Member growth trends</li>
                  <li>• Attendance analytics</li>
                  <li>• Custom reports</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lead Management</CardTitle>
                <CardDescription>
                  Track and convert potential members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Lead capture forms</li>
                  <li>• Follow-up tracking</li>
                  <li>• Conversion analytics</li>
                  <li>• Staff assignment</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Ready to Get Started?</CardTitle>
            <CardDescription className="text-lg">
              Join hundreds of gyms using Gym Pilot to manage their business
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/register">
              <Button size="lg">Start Your Free Trial</Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container flex flex-col gap-4 sm:flex-row sm:flex-row sm:justify-between sm:items-center">
          <p className="text-sm text-muted-foreground">
            © 2026 Gym Pilot. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground">Privacy</Link>
            <Link href="#" className="hover:text-foreground">Terms</Link>
            <Link href="#" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
