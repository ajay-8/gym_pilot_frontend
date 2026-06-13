"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth, useSetGymSession, resolvePortalRoute } from "@/lib/hooks/use-auth";
import { useMyGyms } from "@/lib/hooks/use-gyms";
import {
  Users, CreditCard, Calendar, BarChart3, Shield, GitBranch,
  CheckCircle, XCircle, ArrowRight,
  Dumbbell, Menu, X, TrendingUp, Star, Plus,
} from "lucide-react";

// ── static data ───────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Features",     href: "#features" },
  { label: "Pricing",      href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "FAQ",          href: "#faq" },
  { label: "Find a Gym",   href: "/gyms" },
];

const STATS = [
  { value: "500+",    label: "Gyms using Gym Pilot" },
  { value: "50k+",    label: "Members tracked" },
  { value: "10+ hrs", label: "Saved per week" },
  { value: "99.9%",   label: "Uptime guaranteed" },
];

const PAIN_POINTS = [
  "Manual attendance tracking",    "Payment follow-ups every month",
  "No visibility into revenue",    "Confused membership plans",
  "Missed renewals",               "Trainer scheduling chaos",
];

const FEATURES = [
  { icon: Users,      color: "#10b981", bg: "rgba(16,185,129,0.12)",  title: "Smart Membership Management",  desc: "Create flexible plans, track renewals automatically, and maintain complete member history to never miss a renewal." },
  { icon: CreditCard, color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  title: "Payment Recording System",     desc: "Record cash, UPI, card payments. Track pending dues and get monthly revenue insights at a glance." },
  { icon: Calendar,   color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  title: "Class & Schedule Management",  desc: "Set up recurring classes, assign trainers, manage capacity with automated scheduling." },
  { icon: BarChart3,  color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  title: "Real-Time Dashboard",          desc: "Track total members, active/expired, revenue tracking, and monthly performance in real time." },
  { icon: GitBranch,  color: "#10b981", bg: "rgba(16,185,129,0.12)",  title: "Multi-Branch Ready",           desc: "Perfectly designed for multiple gyms and locations. Scale effortlessly as your business grows." },
  { icon: Shield,     color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  title: "Secure & Reliable",            desc: "Bank-grade security for all your data. Daily backups and 99.9% uptime guaranteed." },
];

const COMPARISON = [
  { feature: "Member Management", manual: "Spreadsheets / email",   gp: "Automated with smart tracking" },
  { feature: "Payment Tracking",  manual: "Manual follow-ups",      gp: "Automatic reminders & reports" },
  { feature: "Class Scheduling",  manual: "WhatsApp groups",        gp: "Organised calendar view" },
  { feature: "Revenue Insights",  manual: "No visibility",          gp: "Real-time dashboard" },
  { feature: "Time Required",     manual: "10+ hrs/week",           gp: "< 1 hour/week" },
  { feature: "Data Security",     manual: "Risk of data loss",      gp: "Bank-grade security" },
];

const STEPS = [
  { n: "01", title: "Create your gym profile",   desc: "Set up your gym details, membership plans, and trainer profiles in minutes." },
  { n: "02", title: "Add members & plans",       desc: "Import existing members or add new ones with customizable membership plans." },
  { n: "03", title: "Start tracking everything", desc: "Automate payments, schedules, and reports. Focus on growing your gym." },
];

const PRICING = [
  {
    name: "Starter", price: "₹999", period: "/month", tagline: "For single gym owners", highlight: false,
    features: ["Up to 100 members", "Payment tracking", "Basic reports", "Email support", "Mobile app access"],
  },
  {
    name: "Pro", price: "₹1999", period: "/month", tagline: "For multi-branch gyms", highlight: true,
    features: ["Unlimited members", "Multiple branches", "Advanced analytics", "Priority support", "Custom integrations", "Dedicated account manager"],
  },
];

const TESTIMONIALS = [
  { quote: "Gym Pilot saved me over 10 hours every week. Now I can focus on what matters — my members.", name: "Rajesh Kumar", role: "Gym Owner, Mumbai",        stars: 5 },
  { quote: "Payment tracking became effortless. No more chasing members for dues!",                      name: "Priya Sharma", role: "Studio Owner, Bangalore",   stars: 5 },
  { quote: "Best investment for my gym. The dashboard gives me complete control over my business.",       name: "Amit Patel",   role: "Multi-Gym Owner, Delhi",    stars: 5 },
];

const FAQS = [
  { q: "Can I cancel anytime?",                 a: "Yes, absolutely! There are no long-term contracts. You can cancel your subscription anytime with just one click from your dashboard." },
  { q: "How is my data secured?",               a: "We use bank-grade encryption (256-bit SSL) to protect your data. All information is stored on secure servers with daily backups and 99.9% uptime guarantee." },
  { q: "Do I need technical knowledge?",        a: "Not at all! Gym Pilot is designed to be intuitive and user-friendly. We also provide free onboarding training and 24/7 support to help you get started." },
  { q: "What happens after my trial ends?",     a: "After 14 days, you can choose to subscribe to a paid plan. If you don't subscribe, your account will be paused but your data will be safely stored for 30 days." },
  { q: "Can I import my existing member data?", a: "Yes! We support easy import from Excel/CSV files. Our team can also help you migrate your existing data during onboarding at no extra cost." },
  { q: "Can I manage multiple gym branches?",   a: "Absolutely! Our Pro plan is perfect for multi-branch operations. You can manage all locations from a single dashboard with branch-wise reports." },
  { q: "Is there a mobile app?",                a: "Yes! Gym Pilot works perfectly on mobile browsers, and we have native iOS and Android apps for both gym owners and members (coming soon)." },
];

// ── scroll-reveal hook ────────────────────────────────────────────────────────

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, visible };
}

// ── reusable components ───────────────────────────────────────────────────────

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3"
      style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
      {children}
    </span>
  );
}

function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        filter: visible ? "blur(0)" : "blur(4px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(.25,.1,.25,1) ${delay}ms, filter 0.7s ease ${delay}ms`,
      }}>
      {children}
    </div>
  );
}

function PrimaryBtn({ href, children, className = "", pulse = false }: { href: string; children: React.ReactNode; className?: string; pulse?: boolean }) {
  return (
    <Link href={href}>
      <button
        className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap ${pulse ? "animate-lp-pulse-glow" : ""} ${className}`}
        style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", transition: "transform 0.4s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s ease", boxShadow: "0 4px 20px rgba(16,185,129,0.3)" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px) scale(1.02)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 30px rgba(16,185,129,0.45)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(16,185,129,0.3)"; }}
      >
        {children}
      </button>
    </Link>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, gymContext, hasGymContext, hasHydrated } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroParallax, setHeroParallax] = useState(0);

  const setGymSession = useSetGymSession();
  const { data: gymsData, isLoading: gymsLoading } = useMyGyms(
    { page: 1, page_size: 2 },
    { enabled: isAuthenticated && !hasGymContext && hasHydrated }
  );

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      setHeroParallax(window.scrollY * 0.35);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) return;
    if (!hasGymContext) {
      if (gymsLoading || !gymsData) return;
      if (gymsData.total === 1 && !setGymSession.isPending) {
        setGymSession.mutate({ gym_id: gymsData.items[0].id });
      } else {
        router.push("/select-gym");
      }
      return;
    }
    router.push(resolvePortalRoute(gymContext?.roles ?? []));
  }, [isAuthenticated, hasGymContext, gymContext, hasHydrated, gymsData, gymsLoading, setGymSession, router]);

  if (!hasHydrated || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#080b10" }} suppressHydrationWarning>
        <div className="h-6 w-6 rounded-full border-2 animate-spin" style={{ borderColor: "#10b981", borderTopColor: "transparent" }} suppressHydrationWarning />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden pb-12" style={{ backgroundColor: "#080b10", color: "#e2e8f0" }}>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(8,11,16,0.92)" : "rgba(8,11,16,0.6)",
          backdropFilter: "blur(18px)",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
          boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.4)" : "none",
        }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#10b981,#8b5cf6)" }}>
              <Dumbbell className="text-white" style={{ width: 16, height: 16 }} />
            </div>
            <span className="font-bold text-base" style={{ color: "#fff" }}>
              Gym <span style={{ color: "#10b981" }}>Pilot</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href}
                className="transition-colors hover:text-white relative group">
                {l.label}
                <span className="absolute -bottom-0.5 left-0 h-px w-0 group-hover:w-full transition-all duration-300" style={{ background: "#10b981" }} />
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-lg transition-all hover:text-white"
              style={{ color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)" }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.18)")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)")}
            >Login</Link>
            <PrimaryBtn href="/register">Sign Up Free <ArrowRight className="h-3.5 w-3.5 animate-lp-bounce-arrow" /></PrimaryBtn>
          </div>

          <button className="md:hidden p-1.5 rounded-lg transition-colors" style={{ color: "rgba(255,255,255,0.7)" }}
            onClick={() => setMobileMenuOpen(o => !o)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden px-4 pb-5 pt-2 space-y-1 border-t" style={{ background: "#0d1117", borderColor: "rgba(255,255,255,0.07)" }}>
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 text-sm transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.6)" }}>{l.label}</a>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-sm py-2" style={{ color: "rgba(255,255,255,0.6)" }}>Login</Link>
              <PrimaryBtn href="/register" className="w-full justify-center">Get Started Free</PrimaryBtn>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
        {/* Full-screen background image with parallax + dark overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/gym-hero.jpg')",
            backgroundSize: "cover",
            backgroundPosition: `center calc(30% + ${heroParallax * 0.4}px)`,
            willChange: "background-position",
          }}
        />
        <div className="absolute inset-0" style={{ background: "rgba(8,11,16,0.62)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(8,11,16,0.55) 0%, rgba(8,11,16,0.35) 40%, rgba(8,11,16,0.75) 100%)" }} />

        {/* Subtle color glows over the overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-15"
            style={{ background: "radial-gradient(ellipse,#10b981 0%,transparent 70%)", filter: "blur(80px)" }} />
          <div className="absolute top-20 right-1/3 w-[250px] h-[250px] rounded-full opacity-10"
            style={{ background: "radial-gradient(ellipse,#8b5cf6 0%,transparent 70%)", filter: "blur(60px)" }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center pt-32 pb-28">
          {/* Floating badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8"
            style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)", color: "#10b981", backdropFilter: "blur(8px)", animation: "lp-float 3s ease-in-out infinite, lp-border-glow 2.5s ease-in-out infinite" }}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-lp-ping" style={{ background: "#10b981" }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#10b981" }} />
            </span>
            Free 14-Day Trial · No Credit Card Required
          </div>

          {/* Headline — fade up staggered */}
          <div className="animate-lp-fade-up">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight tracking-tight mb-3 text-white"
              style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
              Run Your Gym Like a Pro
            </h1>
          </div>
          <div className="animate-lp-fade-up delay-100">
            <p className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6 leading-tight animate-lp-gradient-x"
              style={{ background: "linear-gradient(135deg,#10b981,#8b5cf6,#10b981)", backgroundSize: "200% 200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Without the Chaos
            </p>
          </div>
          <div className="animate-lp-fade-up delay-200">
            <p className="max-w-xl mx-auto mb-8 leading-relaxed text-base" style={{ color: "rgba(255,255,255,0.72)" }}>
              Gym Pilot is an all-in-one platform that helps gym owners manage members, payments, classes, trainers, and reports — all in one place.
            </p>
          </div>

          {/* CTA row */}
          <div className="animate-lp-fade-up delay-300 flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto mb-4">
            <input type="email" placeholder="Enter your email"
              className="flex-1 min-w-0 px-4 py-3 rounded-xl text-sm outline-none transition-all duration-300"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", backdropFilter: "blur(8px)" }}
              onFocus={e => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.6)")}
              onBlur={e => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)")}
            />
            <PrimaryBtn href="/register" pulse>
              Get Started Free <ArrowRight className="h-4 w-4" />
            </PrimaryBtn>
          </div>
          <div className="animate-lp-fade-up delay-400">
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.42)" }}>No credit card required · Setup in 5 minutes · Cancel anytime</p>
          </div>
        </div>

        {/* Bottom fade into dark page */}
        <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(to top, #080b10 0%, transparent 100%)" }} />
      </section>

      {/* ── Stats marquee — fixed ticker at bottom ─────────────────────────── */}

      {/* ── Pain Points ────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <RevealSection>
            <SectionTag>Sound Familiar?</SectionTag>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-white">
              Still Managing Your Gym on<br />
              <span style={{ color: "#ef4444" }}>Excel &amp; WhatsApp?</span>
            </h2>
            <p className="mb-12 text-base" style={{ color: "rgba(255,255,255,0.55)" }}>You didn&apos;t start a gym to manage spreadsheets.</p>
          </RevealSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PAIN_POINTS.map((p, i) => (
              <RevealSection key={p} delay={i * 80}>
                <div className="flex items-center gap-3 rounded-xl p-4 text-left hover-spring"
                  style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}>
                  <XCircle className="h-4 w-4 flex-shrink-0" style={{ color: "#ef4444" }} />
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>{p}</span>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solution ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center">
          <RevealSection>
            <SectionTag>The Solution</SectionTag>
            <h2 className="text-3xl sm:text-4xl font-bold mb-5 text-white leading-tight">
              Meet Gym Pilot —<br />Your Digital Gym Manager
            </h2>
            <p className="mb-8 leading-relaxed text-sm" style={{ color: "rgba(255,255,255,0.48)" }}>
              Gym Pilot automates your gym operations so you can focus on growing your members and building a strong fitness community. No more manual tracking, no more missed payments, no more chaos.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: TrendingUp, color: "#10b981", label: "10+ hours", sub: "saved per week" },
                { icon: Users,      color: "#8b5cf6", label: "500+ gyms", sub: "trust Gym Pilot" },
              ].map(({ icon: Icon, color, label, sub }) => (
                <div key={label} className="rounded-xl p-4 hover-spring"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <Icon className="h-5 w-5 mb-2" style={{ color }} />
                  <p className="font-bold text-white text-lg leading-tight">{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{sub}</p>
                </div>
              ))}
            </div>
            <PrimaryBtn href="/register">Get Started Free <ArrowRight className="h-4 w-4" /></PrimaryBtn>
          </RevealSection>

          <RevealSection delay={150}>
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl opacity-25"
                style={{ background: "radial-gradient(circle at 30% 50%, #10b981, transparent 60%)", filter: "blur(50px)" }} />
              <div className="relative rounded-2xl overflow-hidden hover-spring"
                style={{ border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
                <Image src="/gym-solution.jpg" alt="Gym management" width={600} height={420}
                  className="w-full object-cover" style={{ height: "380px", objectPosition: "center 20%" }} />
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 sm:px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-7xl mx-auto">
          <RevealSection className="text-center mb-14">
            <SectionTag>Core Features</SectionTag>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Everything You Need to Run Your Gym</h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>Powerful features designed specifically for gym owners who want to scale</p>
          </RevealSection>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, color, bg, title, desc }, i) => (
              <RevealSection key={title} delay={i * 70}>
                <div className="rounded-2xl p-6 h-full hover-spring cursor-default"
                  style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", transition: "border-color 0.3s ease, background 0.3s ease, transform 0.5s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s ease" }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = color + "50";
                    el.style.background = "rgba(255,255,255,0.045)";
                    el.style.boxShadow = `0 8px 30px ${color}15`;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "rgba(255,255,255,0.07)";
                    el.style.background = "rgba(255,255,255,0.025)";
                    el.style.boxShadow = "none";
                  }}>
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center mb-5" style={{ background: bg }}>
                    <Icon style={{ color, width: 20, height: 20 }} />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.58)" }}>{desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product Showcase ────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}>
        <div className="max-w-6xl mx-auto">
          <RevealSection className="text-center mb-14">
            <SectionTag>See It In Action</SectionTag>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Powerful Dashboard Built for{" "}
              <span className="animate-lp-gradient-x" style={{ background: "linear-gradient(135deg,#10b981,#8b5cf6,#10b981)", backgroundSize: "200% 200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Gym Owners
              </span>
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>Intuitive interface designed to save you time and give you complete control</p>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {[
              { title: "Member Dashboard",    desc: "Manage all your members, track attendance, and view membership status at a glance.", img: "/gym-members.jpg",   color: "#10b981" },
              { title: "Payment Tracking",    desc: "Record payments, track pending dues, and generate automatic payment reminders.",       img: "/gym-dashboard.jpg", color: "#8b5cf6" },
              { title: "Analytics & Reports", desc: "Real-time insights into revenue, member growth, and business performance.",            img: "/gym-hero.jpg",      color: "#3b82f6" },
            ].map(({ title, desc, img, color }, i) => (
              <RevealSection key={title} delay={i * 100}>
                <div className="rounded-2xl overflow-hidden group hover-spring"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", transition: "border-color 0.3s, transform 0.5s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color + "40"; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${color}18`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                  <div className="overflow-hidden" style={{ height: "180px" }}>
                    <Image src={img} alt={title} width={400} height={240}
                      className="w-full object-cover transition-transform duration-700 group-hover:scale-108"
                      style={{ height: "180px", objectPosition: "center 30%" }} />
                  </div>
                  <div className="p-5">
                    <div className="h-0.5 w-10 rounded-full mb-4" style={{ background: `linear-gradient(90deg,${color},transparent)` }} />
                    <h3 className="font-semibold text-white mb-2">{title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.58)" }}>{desc}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>

          <RevealSection className="text-center" delay={300}>
            <PrimaryBtn href="/register">Get Started Free <ArrowRight className="h-4 w-4" /></PrimaryBtn>
          </RevealSection>
        </div>
      </section>

      {/* ── Comparison ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-3xl mx-auto">
          <RevealSection className="text-center mb-12">
            <SectionTag>The Clear Choice</SectionTag>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Manual Tracking vs{" "}
              <span className="animate-lp-gradient-x" style={{ background: "linear-gradient(135deg,#10b981,#8b5cf6,#10b981)", backgroundSize: "200% 200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Gym Pilot
              </span>
            </h2>
            <p className="text-base" style={{ color: "rgba(255,255,255,0.52)" }}>See why modern gym owners are switching</p>
          </RevealSection>
          <RevealSection delay={100}>
            <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.38)" }}>Feature</th>
                    <th className="text-center px-4 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "#ef4444" }}>❌ Manual</th>
                    <th className="text-center px-4 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "#10b981" }}>✅ Gym Pilot</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr key={row.feature}
                      style={{ borderBottom: i < COMPARISON.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent", transition: "background 0.2s" }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.04)")}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = i % 2 ? "rgba(255,255,255,0.015)" : "transparent")}
                    >
                      <td className="px-5 py-4 font-medium text-xs" style={{ color: "rgba(255,255,255,0.78)" }}>{row.feature}</td>
                      <td className="px-4 py-4 text-center text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>{row.manual}</td>
                      <td className="px-4 py-4 text-center text-xs font-semibold" style={{ color: "#10b981" }}>{row.gp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── Steps ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}>
        <div className="max-w-5xl mx-auto text-center">
          <RevealSection>
            <SectionTag>Simple Process</SectionTag>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-14">
              Get Started in{" "}
              <span className="animate-lp-gradient-x" style={{ background: "linear-gradient(135deg,#10b981,#8b5cf6,#10b981)", backgroundSize: "200% 200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                3 Easy Steps
              </span>
            </h2>
          </RevealSection>
          <div className="grid gap-5 sm:grid-cols-3">
            {STEPS.map(({ n, title, desc }, i) => (
              <RevealSection key={n} delay={i * 100}>
                <div className="text-left rounded-2xl p-7 h-full hover-spring relative overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {/* Subtle corner glow */}
                  <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-10 pointer-events-none"
                    style={{ background: "#10b981", filter: "blur(20px)" }} />
                  <p className="text-6xl font-black mb-5 leading-none select-none"
                    style={{ background: "linear-gradient(135deg,rgba(16,185,129,0.25),rgba(139,92,246,0.25))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    {n}
                  </p>
                  <h3 className="font-semibold text-white mb-2">{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.58)" }}>{desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4 sm:px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <RevealSection>
            <SectionTag>Transparent Pricing</SectionTag>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Choose Your Perfect Plan</h2>
            <p className="mb-12 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>No hidden fees. Cancel anytime. Free up to 100 members, no credit card required.</p>
          </RevealSection>
          <div className="grid gap-6 sm:grid-cols-2">
            {PRICING.map((plan, i) => (
              <RevealSection key={plan.name} delay={i * 120}>
                <div className="relative rounded-2xl p-7 text-left flex flex-col h-full hover-spring"
                  style={{
                    background: plan.highlight ? "linear-gradient(145deg,rgba(16,185,129,0.09),rgba(139,92,246,0.06))" : "rgba(255,255,255,0.03)",
                    border: plan.highlight ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: plan.highlight ? "0 0 50px rgba(16,185,129,0.12), 0 0 0 1px rgba(16,185,129,0.05)" : "none",
                    animation: plan.highlight ? "lp-border-glow 3s ease-in-out infinite" : "none",
                  }}>
                  {plan.highlight && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full"
                      style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", boxShadow: "0 4px 12px rgba(16,185,129,0.4)" }}>
                      Most Popular
                    </span>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-white">{plan.name}</h3>
                    <p className="text-xs mb-5 mt-1" style={{ color: "rgba(255,255,255,0.38)" }}>{plan.tagline}</p>
                    <p className="mb-6">
                      <span className="text-5xl font-black text-white">{plan.price}</span>
                      <span className="text-sm ml-1" style={{ color: "rgba(255,255,255,0.38)" }}>{plan.period}</span>
                    </p>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-2.5 text-sm">
                          <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: "#10b981" }} />
                          <span style={{ color: "rgba(255,255,255,0.58)" }}>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href="/register" className="block mt-auto">
                    <button className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300"
                      style={plan.highlight
                        ? { background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", boxShadow: "0 4px 20px rgba(16,185,129,0.3)" }
                        : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.1)" }
                      }
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; (e.currentTarget as HTMLElement).style.transform = "scale(1.01)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                    >
                      Get Started Free
                    </button>
                  </Link>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-24 px-4 sm:px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}>
        <div className="max-w-5xl mx-auto text-center">
          <RevealSection>
            <SectionTag>Success Stories</SectionTag>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-12">
              Loved by{" "}
              <span className="animate-lp-gradient-x" style={{ background: "linear-gradient(135deg,#10b981,#8b5cf6,#10b981)", backgroundSize: "200% 200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Gym Owners
              </span>
            </h2>
          </RevealSection>
          <div className="grid gap-5 sm:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <RevealSection key={t.name} delay={i * 100}>
                <div className="text-left rounded-2xl p-6 flex flex-col h-full hover-spring"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.25)")}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)")}
                >
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.stars }).map((_, si) => (
                      <Star key={si} className="h-3.5 w-3.5 fill-current" style={{ color: "#f59e0b" }} />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed flex-1 mb-5" style={{ color: "rgba(255,255,255,0.52)" }}>&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,#10b981,#8b5cf6)", color: "#fff" }}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>{t.role}</p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-4 sm:px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-2xl mx-auto">
          <RevealSection className="text-center mb-12">
            <SectionTag>Got Questions?</SectionTag>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Frequently Asked{" "}
              <span className="animate-lp-gradient-x" style={{ background: "linear-gradient(135deg,#10b981,#8b5cf6,#10b981)", backgroundSize: "200% 200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Questions
              </span>
            </h2>
            <p className="text-base" style={{ color: "rgba(255,255,255,0.52)" }}>Everything you need to know about Gym Pilot</p>
          </RevealSection>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {FAQS.map((faq, i) => (
              <RevealSection key={i} delay={i * 40}>
                <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <button
                    className="w-full flex items-start justify-between py-5 text-left transition-colors gap-5"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span
                      className="text-base font-semibold leading-snug transition-colors duration-200"
                      style={{ color: openFaq === i ? "#10b981" : "#fff" }}
                    >
                      {faq.q}
                    </span>
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300"
                      style={{
                        background: openFaq === i ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)",
                        border: `1px solid ${openFaq === i ? "rgba(16,185,129,0.35)" : "rgba(255,255,255,0.12)"}`,
                        transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)",
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" style={{ color: openFaq === i ? "#10b981" : "rgba(255,255,255,0.55)" }} />
                    </div>
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-500"
                    style={{ maxHeight: openFaq === i ? "300px" : "0px" }}
                  >
                    <p className="pb-5 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.58)" }}>
                      {faq.a}
                    </p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
          <p className="text-center text-sm mt-12" style={{ color: "rgba(255,255,255,0.45)" }}>
            Still have questions?{" "}
            <a href="mailto:support@gym-pilot.app" className="font-semibold transition-colors hover:text-white" style={{ color: "#10b981" }}>
              Contact our team →
            </a>
          </p>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="relative py-28 px-4 sm:px-6 overflow-hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}>
        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle,#10b981,transparent 70%)", filter: "blur(70px)" }} />
          <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full opacity-12"
            style={{ background: "radial-gradient(circle,#8b5cf6,transparent 70%)", filter: "blur(70px)" }} />
        </div>
        <RevealSection className="relative max-w-xl mx-auto text-center">
          <SectionTag>Get Started Today</SectionTag>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Ready to Modernize Your Gym?</h2>
          <p className="mb-10 text-base" style={{ color: "rgba(255,255,255,0.58)" }}>Join hundreds of gym owners saving time and growing faster</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <PrimaryBtn href="/register" pulse>Create Free Account <ArrowRight className="h-4 w-4" /></PrimaryBtn>
            <Link href="/login" className="px-6 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.75)" }}
              onMouseEnter={(e: any) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            >Sign In</Link>
          </div>
          <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.28)" }}>✓ Free up to 100 members &nbsp;·&nbsp; No credit card required &nbsp;·&nbsp; Setup in 5 minutes</p>
        </RevealSection>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="py-14 px-4 sm:px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-7xl mx-auto grid gap-8 grid-cols-2 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#10b981,#8b5cf6)" }}>
                <Dumbbell className="text-white" style={{ width: 16, height: 16 }} />
              </div>
              <span className="font-bold text-white">Gym <span style={{ color: "#10b981" }}>Pilot</span></span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>The modern way to manage your gym business.</p>
          </div>
          {[
            { label: "Product", links: [{ text: "Features", href: "#features" }, { text: "Pricing", href: "#pricing" }, { text: "Testimonials", href: "#testimonials" }] },
            { label: "Company", links: [{ text: "About Us", href: "/about" }, { text: "Contact", href: "/contact" }, { text: "Blog", href: "/blog" }] },
            { label: "Legal",   links: [{ text: "Privacy Policy", href: "/privacy" }, { text: "Terms of Service", href: "/terms" }] },
          ].map(({ label, links }) => (
            <div key={label}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "rgba(255,255,255,0.28)" }}>{label}</p>
              <ul className="space-y-2.5">
                {links.map(l => (
                  <li key={l.text}>
                    <a href={l.href} className="text-xs transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.42)" }}>{l.text}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.28)" }}>
          <span>© 2026 Gym Pilot. All rights reserved.</span>
          <span>Made with ❤️ for gym owners across India</span>
        </div>
      </footer>

      {/* ── Fixed stats ticker ─────────────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-40 overflow-hidden"
        style={{
          background: "rgba(8,11,16,0.88)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }}>
        <div className="flex animate-lp-marquee py-3" style={{ width: "max-content" }}>
          {[...STATS, ...STATS, ...STATS, ...STATS].map((s, i) => (
            <div key={i} className="flex items-center gap-8 px-10 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-black animate-lp-gradient-x"
                  style={{ background: "linear-gradient(135deg,#10b981,#8b5cf6,#10b981)", backgroundSize: "200% 200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  {s.value}
                </span>
                <span className="text-xs whitespace-nowrap" style={{ color: "rgba(255,255,255,0.38)" }}>{s.label}</span>
              </div>
              <div className="h-3 w-px flex-shrink-0" style={{ background: "rgba(255,255,255,0.12)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
