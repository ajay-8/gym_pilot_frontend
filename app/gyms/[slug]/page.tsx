"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import {
  MapPin, Dumbbell, IndianRupee, ChevronLeft, Loader2,
  Clock, AlertCircle, CheckCircle, Phone, Mail, Globe,
  MessageSquare, Send, LogIn, X,
} from "lucide-react";
import { getGymProfile, submitEnquiry, PublicPlan, PublicAmenity, PublicGymDetail } from "@/lib/api/public";

export default function GymProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [showEnquiry, setShowEnquiry] = useState(false);

  const { data: gym, isLoading, isError } = useQuery({
    queryKey: ["public-gym", slug],
    queryFn: () => getGymProfile(slug),
    staleTime: 60_000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (isError || !gym) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-white font-medium">Gym not found</p>
        <Link href="/gyms" className="text-sm text-emerald-400 hover:underline">
          ← Back to search
        </Link>
      </div>
    );
  }

  const fullAddress = [gym.address, gym.city, gym.state, gym.country].filter(Boolean).join(", ");
  const hasContact = gym.contact_phone || gym.contact_email || gym.website;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-emerald-400" />
            <span className="font-bold text-white">Gym Pilot</span>
          </Link>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-white transition-colors">
            Gym Owner? Sign In
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Back */}
        <Link href="/gyms" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to search
        </Link>

        {/* Gym header */}
        <div className="bg-card border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-start gap-5">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center flex-shrink-0 bg-emerald-500/[0.12]">
              <Dumbbell className="h-8 w-8 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white">{gym.name}</h1>
              {fullAddress && (
                <div className="flex items-start gap-1.5 mt-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{fullAddress}{gym.pincode ? ` — ${gym.pincode}` : ""}</span>
                </div>
              )}
              {gym.description && (
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{gym.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plans */}
          <div className="bg-card border border-white/[0.06] rounded-2xl p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-emerald-400" />
              Membership Plans
            </h2>
            {gym.plans.length === 0 ? (
              <p className="text-sm text-muted-foreground">Contact gym for pricing details.</p>
            ) : (
              <div className="space-y-3">
                {gym.plans.map((plan) => <PlanCard key={plan.id} plan={plan} />)}
              </div>
            )}
          </div>

          {/* Amenities */}
          <div className="bg-card border border-white/[0.06] rounded-2xl p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              Amenities
            </h2>
            {gym.amenities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No amenities listed yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {gym.amenities.map((a) => <AmenityChip key={a.slug} amenity={a} />)}
              </div>
            )}
          </div>
        </div>

        {/* Contact Info */}
        {hasContact && (
          <div className="bg-card border border-white/[0.06] rounded-2xl p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Phone className="h-4 w-4 text-blue-400" />
              Contact
            </h2>
            <div className="flex flex-wrap gap-4">
              {gym.contact_phone && (
                <a
                  href={`tel:${gym.contact_phone}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {gym.contact_phone}
                </a>
              )}
              {gym.contact_phone && (
                <a
                  href={`https://wa.me/${gym.contact_phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </a>
              )}
              {gym.contact_email && (
                <a
                  href={`mailto:${gym.contact_email}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {gym.contact_email}
                </a>
              )}
              {gym.website && (
                <a
                  href={gym.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  Website
                </a>
              )}
            </div>
          </div>
        )}

        {/* CTA — Enquire + Login */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setShowEnquiry(true)}
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
          >
            <Send className="h-4 w-4" />
            Enquire to Join
          </button>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-semibold bg-white/[0.05] text-white border border-white/10 hover:bg-white/[0.08] transition-all"
          >
            <LogIn className="h-4 w-4" />
            Already a Member? Log In
          </Link>
        </div>
      </div>

      {/* Enquiry Modal */}
      {showEnquiry && (
        <EnquiryModal gym={gym} onClose={() => setShowEnquiry(false)} />
      )}
    </div>
  );
}

function EnquiryModal({ gym, onClose }: { gym: PublicGymDetail; onClose: () => void }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    plan_id: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      submitEnquiry(gym.slug, {
        first_name: form.first_name,
        last_name: form.last_name || undefined,
        phone: form.phone,
        email: form.email || undefined,
        plan_id: form.plan_id || undefined,
        message: form.message || undefined,
      }),
    onSuccess: () => setSubmitted(true),
  });

  const valid = form.first_name.trim() && form.phone.trim().length >= 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div>
            <h2 className="font-semibold text-white">Enquire to Join</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{gym.name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto" />
            <p className="font-semibold text-white">Enquiry Submitted!</p>
            <p className="text-sm text-muted-foreground">
              The gym team will reach out to you soon on your phone number.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
            >
              Close
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); if (valid) mutation.mutate(); }}
            className="p-5 space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <EnqField label="First Name *" value={form.first_name} onChange={(v) => setForm((f) => ({ ...f, first_name: v }))} placeholder="Rahul" />
              <EnqField label="Last Name" value={form.last_name} onChange={(v) => setForm((f) => ({ ...f, last_name: v }))} placeholder="Sharma" />
            </div>
            <EnqField label="Phone *" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="+91 98765 43210" type="tel" />
            <EnqField label="Email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="you@email.com" type="email" />

            {gym.plans.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Interested In</label>
                <select
                  value={form.plan_id}
                  onChange={(e) => setForm((f) => ({ ...f, plan_id: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-white/10 outline-none text-white"
                >
                  <option value="">Any plan</option>
                  {gym.plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{Number(p.price).toLocaleString("en-IN")}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Message (optional)</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Any questions or special requirements…"
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-transparent border border-white/10 outline-none text-white placeholder:text-muted-foreground resize-none"
              />
            </div>

            {mutation.isError && (
              <p className="text-xs text-red-400">Something went wrong. Please try again.</p>
            )}

            <button
              type="submit"
              disabled={!valid || mutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all disabled:opacity-40"
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {mutation.isPending ? "Submitting…" : "Submit Enquiry"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function EnqField({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm bg-transparent border border-white/10 outline-none text-white placeholder:text-muted-foreground"
      />
    </div>
  );
}

function PlanCard({ plan }: { plan: PublicPlan }) {
  const durationLabel = plan.duration_days
    ? plan.duration_days >= 365
      ? `${Math.round(plan.duration_days / 365)} year`
      : plan.duration_days >= 28
      ? `${Math.round(plan.duration_days / 30)} month`
      : `${plan.duration_days} days`
    : "Lifetime";

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <div>
        <p className="text-sm font-medium text-white">{plan.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{durationLabel}</span>
        </div>
        {plan.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{plan.description}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0 ml-4">
        <div className="flex items-center gap-0.5 text-emerald-400 font-semibold">
          <IndianRupee className="h-3.5 w-3.5" />
          <span>{Number(plan.price).toLocaleString("en-IN")}</span>
        </div>
        <span className="text-xs text-muted-foreground">{plan.currency}</span>
      </div>
    </div>
  );
}

function AmenityChip({ amenity }: { amenity: PublicAmenity }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/[0.08] text-emerald-400 border border-emerald-500/20">
      <CheckCircle className="h-3 w-3" />
      {amenity.name}
    </div>
  );
}
