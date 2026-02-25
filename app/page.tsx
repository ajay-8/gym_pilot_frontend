"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  Users, CreditCard, Calendar, BarChart3, Shield, GitBranch,
  CheckCircle, XCircle, ChevronDown, ChevronUp, ArrowRight,
  Dumbbell, Menu, X,
} from "lucide-react";

// ── static data ───────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Features",     href: "#features" },
  { label: "Pricing",      href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "FAQ",          href: "#faq" },
];

const STATS = [
  { value: "500+",  label: "Gyms using Gym Pilot" },
  { value: "50k+",  label: "Members tracked" },
  { value: "10+ hrs", label: "Saved per week" },
  { value: "99.9%", label: "Uptime guaranteed" },
];

const PAIN_POINTS = [
  "Manual attendance tracking",     "Payment follow-ups every month",
  "No visibility into revenue",     "Confused membership plans",
  "Missed renewals",                "Trainer scheduling chaos",
];

const FEATURES = [
  { icon: Users,      color: "#10b981", title: "Smart Membership Management",  desc: "Create flexible plans, track renewals automatically, and maintain complete member history to never miss a renewal." },
  { icon: CreditCard, color: "#8b5cf6", title: "Payment Recording System",     desc: "Record cash, UPI, card payments. Track pending dues and get monthly revenue insights at a glance." },
  { icon: Calendar,   color: "#f59e0b", title: "Class & Schedule Management",  desc: "Set up recurring classes, assign trainers, manage capacity with automated scheduling." },
  { icon: BarChart3,  color: "#3b82f6", title: "Real-Time Dashboard",          desc: "Track total members, active/expired, revenue tracking, and monthly performance in real time." },
  { icon: GitBranch,  color: "#10b981", title: "Multi-Branch Ready",           desc: "Perfectly designed for multiple gyms and locations. Scale effortlessly as your business grows." },
  { icon: Shield,     color: "#8b5cf6", title: "Secure & Reliable",            desc: "Bank-grade security for all your data. Daily backups and 99.9% uptime guaranteed." },
];

const COMPARISON = [
  { feature: "Member Management", manual: "Spreadsheets / email",         gp: "Automated with smart tracking" },
  { feature: "Payment Tracking",  manual: "Manual follow-ups",            gp: "Automatic reminders & reports" },
  { feature: "Class Scheduling",  manual: "WhatsApp groups",              gp: "Organised calendar view" },
  { feature: "Revenue Insights",  manual: "No visibility",                gp: "Real-time dashboard" },
  { feature: "Time Required",     manual: "10+ hrs/week",                 gp: "< 1 hour/week" },
  { feature: "Data Security",     manual: "Risk of data loss",            gp: "Bank-grade security" },
];

const STEPS = [
  { n: "01", title: "Create your gym profile",    desc: "Set up your gym details, membership plans, and trainer profiles in minutes." },
  { n: "02", title: "Add members & plans",        desc: "Import existing members or add new ones with customizable membership plans." },
  { n: "03", title: "Start tracking everything",  desc: "Automate payments, schedules, and reports. Focus on growing your gym." },
];

const PRICING = [
  {
    name: "Starter", price: "₹999", period: "/month", tagline: "For single gym owners",
    features: ["Up to 100 members", "Payment tracking", "Basic reports", "Email support", "Mobile app access"],
    highlight: false,
  },
  {
    name: "Pro", price: "₹1999", period: "/month", tagline: "For multi-branch gyms",
    features: ["Unlimited members", "Multiple branches", "Advanced analytics", "Priority support", "Custom integrations", "Dedicated account manager"],
    highlight: true,
  },
];

const TESTIMONIALS = [
  { quote: "Gym Pilot saved me over 10 hours every week. Now I can focus on what matters — my members.", name: "Rajesh Kumar",  role: "Gym Owner, Mumbai" },
  { quote: "Payment tracking became effortless. No more chasing members for dues!",                       name: "Priya Sharma",  role: "Studio Owner, Bangalore" },
  { quote: "Best investment for my gym. The dashboard gives me complete control over my business.",        name: "Amit Patel",    role: "Multi-Gym Owner, Delhi" },
];

const FAQS = [
  { q: "Can I cancel anytime?",                a: "Yes, absolutely! There are no long-term contracts. You can cancel your subscription anytime with just one click from your dashboard." },
  { q: "How is my data secured?",              a: "We use bank-grade encryption (256-bit SSL) to protect your data. All information is stored on secure servers with daily backups and 99.9% uptime guarantee." },
  { q: "Do I need technical knowledge?",       a: "Not at all! Gym Pilot is designed to be intuitive and user-friendly. We also provide free onboarding training and 24/7 support to help you get started." },
  { q: "What happens after my trial ends?",    a: "After 14 days, you can choose to subscribe to a paid plan. If you don't subscribe, your account will be paused but your data will be safely stored for 30 days." },
  { q: "Can I import my existing member data?",a: "Yes! We support easy import from Excel/CSV files. Our team can also help you migrate your existing data during onboarding at no extra cost." },
  { q: "Can I manage multiple gym branches?",  a: "Absolutely! Our Pro plan is perfect for multi-branch operations. You can manage all locations from a single dashboard with branch-wise reports." },
  { q: "Is there a mobile app?",               a: "Yes! Gym Pilot works perfectly on mobile browsers, and we have native iOS and Android apps for both gym owners and members (coming soon)." },
];

// ── small reusable pieces ─────────────────────────────────────────────────────

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-3"
      style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.2)" }}
    >
      {children}
    </span>
  );
}

function GreenBtn({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href}>
      <button
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${className}`}
        style={{ background: "#10b981", color: "#fff" }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#059669")}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "#10b981")}
      >
        {children}
      </button>
    </Link>
  );
}

// ── main ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, gymContext, hasGymContext, hasHydrated } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) return;
    if (!hasGymContext) { router.push("/select-gym"); return; }
    const roles = gymContext?.roles ?? [];
    const isTrainer = roles.includes("trainer");
    const isAdmin = roles.some((r) => ["owner", "admin", "staff"].includes(r));
    router.push(isTrainer && !isAdmin ? "/trainer/dashboard" : "/dashboard");
  }, [isAuthenticated, hasGymContext, gymContext, hasHydrated, router]);

  if (!hasHydrated || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 inset-x-0 z-50"
        style={{ background: "rgba(8,11,16,0.88)", backdropFilter: "blur(14px)", borderBottom: "1px solid hsl(var(--border))" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#10b981,#8b5cf6)" }}>
              <Dumbbell className="text-white" style={{ width: 14, height: 14 }} />
            </div>
            <span className="font-bold gradient-text text-base">Gym Pilot</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} className="hover:text-foreground transition-colors">{l.label}</a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Login</Link>
            <GreenBtn href="/register">Book Demo</GreenBtn>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pb-4 space-y-1 border-t border-border" style={{ background: "hsl(var(--background))" }}>
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} onClick={() => setMobileMenuOpen(false)} className="block py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground py-2">Login</Link>
              <GreenBtn href="/register" className="w-full justify-center">Get Started Free</GreenBtn>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 flex flex-col items-center text-center px-4 sm:px-6" style={{
        background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16,185,129,0.08) 0%, transparent 60%)",
        borderBottom: "1px solid hsl(var(--border))",
      }}>
        {/* subtle dot-grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse 80% 60% at center, black 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at center, black 30%, transparent 100%)",
        }} />

        <span className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
          style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>
          🆓 Free 14-Day Trial · No Credit Card
        </span>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-3">
          Run Your Gym Like a Pro
        </h1>
        <p className="gradient-text text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-5 leading-tight">
          Without the Chaos
        </p>
        <p className="max-w-lg text-muted-foreground text-sm sm:text-base mb-8 leading-relaxed">
          Gym Pilot is an all-in-one platform that helps gym owners manage members, payments, classes, trainers, and reports — all in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm sm:max-w-md mb-2">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 min-w-0 px-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
          />
          <GreenBtn href="/register">Start Free Trial <ArrowRight className="h-3.5 w-3.5" /></GreenBtn>
        </div>
        <p className="text-xs text-muted-foreground">Setup in 5 minutes · Cancel anytime</p>
      </section>

      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      <div className="py-10 px-4" style={{ borderTop: "1px solid hsl(var(--border))", borderBottom: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="text-2xl sm:text-3xl font-black gradient-text">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pain Points ────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
            Still Managing Your Gym on<br className="hidden sm:block" />{" "}
            <span style={{ color: "#ef4444" }}>Excel & WhatsApp?</span>
          </h2>
          <p className="text-muted-foreground text-sm mb-10">You didn&apos;t start a gym to manage spreadsheets.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PAIN_POINTS.map(p => (
              <div key={p} className="flex items-center gap-2.5 rounded-lg p-3 text-left"
                style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}>
                <XCircle className="h-4 w-4 flex-shrink-0" style={{ color: "#ef4444" }} />
                <span className="text-sm text-muted-foreground">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-4 sm:px-6" style={{ background: "hsl(var(--card))", borderTop: "1px solid hsl(var(--border))", borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <SectionTag>Powerful Features</SectionTag>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Everything You Need to Run Your Gym</h2>
            <p className="text-muted-foreground mt-2 text-sm max-w-xl mx-auto">Designed specifically for gym owners who want to scale</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="rounded-xl p-5 transition-all"
                style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = color + "55")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))")}
              >
                <div className="h-9 w-9 rounded-lg flex items-center justify-center mb-4" style={{ background: color + "18" }}>
                  <Icon style={{ color, width: 18, height: 18 }} />
                </div>
                <h3 className="font-semibold text-foreground mb-1.5 text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <SectionTag>The Clear Choice</SectionTag>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              Manual Tracking vs <span className="gradient-text">Gym Pilot</span>
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">See why modern gym owners are switching</p>
          </div>
          {/* scrollable on small screens */}
          <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid hsl(var(--border))" }}>
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr style={{ background: "hsl(var(--muted))", borderBottom: "1px solid hsl(var(--border))" }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Feature</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#ef4444" }}>❌ Manual</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#10b981" }}>✅ Gym Pilot</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.feature} style={{ borderBottom: i < COMPARISON.length - 1 ? "1px solid hsl(var(--border))" : "none", background: i % 2 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                    <td className="px-5 py-3.5 font-medium text-foreground text-xs">{row.feature}</td>
                    <td className="px-4 py-3.5 text-center text-xs text-muted-foreground">{row.manual}</td>
                    <td className="px-4 py-3.5 text-center text-xs font-medium" style={{ color: "#10b981" }}>{row.gp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Steps ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6" style={{ background: "hsl(var(--card))", borderTop: "1px solid hsl(var(--border))", borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="max-w-5xl mx-auto text-center">
          <SectionTag>Simple Process</SectionTag>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-12">
            Get Started in <span className="gradient-text">3 Easy Steps</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="text-left rounded-xl p-6" style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-4xl font-black mb-4 leading-none" style={{ color: "rgba(16,185,129,0.25)" }}>{n}</p>
                <h3 className="font-semibold text-foreground mb-2 text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <SectionTag>Transparent Pricing</SectionTag>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Choose Your Perfect Plan</h2>
          <p className="text-muted-foreground mb-10 text-sm">No hidden fees. Cancel anytime. Start with a 14-day free trial.</p>
          <div className="grid gap-5 sm:grid-cols-2">
            {PRICING.map(plan => (
              <div key={plan.name} className="relative rounded-xl p-6 text-left flex flex-col" style={{
                background: plan.highlight ? "hsl(var(--background))" : "hsl(var(--card))",
                border: plan.highlight ? "1px solid #10b981" : "1px solid hsl(var(--border))",
                boxShadow: plan.highlight ? "0 0 32px rgba(16,185,129,0.1)" : "none",
              }}>
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full" style={{ background: "#10b981", color: "#fff" }}>
                    Most Popular
                  </span>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4">{plan.tagline}</p>
                  <p className="mb-5">
                    <span className="text-4xl font-black text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </p>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#10b981" }} />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href="/register" className="block mt-auto">
                  <button
                    className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors"
                    style={plan.highlight
                      ? { background: "#10b981", color: "#fff" }
                      : { background: "hsl(var(--secondary))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }
                    }
                    onMouseEnter={e => plan.highlight && ((e.currentTarget as HTMLElement).style.background = "#059669")}
                    onMouseLeave={e => plan.highlight && ((e.currentTarget as HTMLElement).style.background = "#10b981")}
                  >
                    Start Free Trial
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-20 px-4 sm:px-6" style={{ background: "hsl(var(--card))", borderTop: "1px solid hsl(var(--border))", borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="max-w-5xl mx-auto text-center">
          <SectionTag>Success Stories</SectionTag>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-10">
            Loved by <span className="gradient-text">Gym Owners</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="text-left rounded-xl p-5" style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-3xl font-serif leading-none mb-3" style={{ color: "#10b981" }}>&ldquo;</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{t.quote}</p>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <SectionTag>Got Questions</SectionTag>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">Everything you need to know about Gym Pilot</p>
          </div>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-foreground hover:bg-white/5 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  }
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 pt-3 text-xs text-muted-foreground leading-relaxed border-t border-border">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            Still have questions?{" "}
            <a href="mailto:support@gym-pilot.app" className="font-medium hover:text-foreground transition-colors" style={{ color: "#10b981" }}>
              Contact our team
            </a>
          </p>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="relative py-24 px-4 sm:px-6 overflow-hidden" style={{ background: "hsl(var(--card))", borderTop: "1px solid hsl(var(--border))" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-15" style={{ background: "radial-gradient(circle,#10b981,transparent 70%)" }} />
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-15" style={{ background: "radial-gradient(circle,#8b5cf6,transparent 70%)" }} />
        </div>
        <div className="relative max-w-lg mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Ready to Modernize Your Gym?</h2>
          <p className="text-muted-foreground text-sm mb-8">Join hundreds of gym owners saving time and growing faster</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 min-w-0 px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
            />
            <GreenBtn href="/register">Book Your Demo <ArrowRight className="h-3.5 w-3.5" /></GreenBtn>
          </div>
          <p className="text-xs text-muted-foreground mt-3">✓ Free consultation &nbsp;·&nbsp; No commitment &nbsp;·&nbsp; See results in 5 minutes</p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="py-12 px-4 sm:px-6" style={{ borderTop: "1px solid hsl(var(--border))" }}>
        <div className="max-w-7xl mx-auto grid gap-8 grid-cols-2 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#10b981,#8b5cf6)" }}>
                <Dumbbell className="text-white" style={{ width: 14, height: 14 }} />
              </div>
              <span className="font-bold gradient-text">Gym Pilot</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">The modern way to manage your gym business.</p>
          </div>
          {[
            { label: "Product", links: [{ text: "Features", href: "#features" }, { text: "Pricing", href: "#pricing" }, { text: "Testimonials", href: "#testimonials" }] },
            { label: "Company", links: [{ text: "About Us", href: "#" }, { text: "Contact", href: "#" }, { text: "Blog", href: "#" }] },
            { label: "Legal",   links: [{ text: "Privacy Policy", href: "#" }, { text: "Terms of Service", href: "#" }] },
          ].map(({ label, links }) => (
            <div key={label}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{label}</p>
              <ul className="space-y-2">
                {links.map(l => <li key={l.text}><a href={l.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{l.text}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-muted-foreground"
          style={{ borderTop: "1px solid hsl(var(--border))" }}>
          <span>© 2026 Gym Pilot. All rights reserved.</span>
          <span>Made with ❤️ for gym owners across India</span>
        </div>
      </footer>
    </div>
  );
}
