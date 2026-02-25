"use client";

import { useState, useEffect } from "react";
import {
  useMyTrainerProfile,
  useUpdateMyProfile,
  useMyGymTrainerContract,
} from "@/lib/hooks/use-trainer-portal";
import type { CertificationItem } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Loader2, Save, X, Building2 } from "lucide-react";

// ── Tag Input ─────────────────────────────────────────────────────────────────

function TagInput({
  label,
  tags,
  onChange,
}: {
  label: string;
  tags: string[];
  onChange: (t: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  };

  return (
    <div>
      <Label className="mb-1 block">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
          placeholder="Type and press Enter"
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={addTag} disabled={!input.trim()}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
              style={{ background: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}
            >
              {tag}
              <button onClick={() => onChange(tags.filter((t) => t !== tag))} className="hover:text-foreground transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Certifications Editor ─────────────────────────────────────────────────────

function CertificationsEditor({
  certs,
  onChange,
}: {
  certs: CertificationItem[];
  onChange: (c: CertificationItem[]) => void;
}) {
  const addCert = () => {
    onChange([...certs, { name: "", issuer: "", issue_date: null, expiry_date: null, credential_id: null }]);
  };

  const updateCert = (i: number, field: keyof CertificationItem, val: string) => {
    onChange(certs.map((c, idx) => (idx === i ? { ...c, [field]: val || null } : c)));
  };

  const removeCert = (i: number) => {
    onChange(certs.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label>Certifications</Label>
        <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={addCert}>
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>
      {certs.length === 0 ? (
        <p className="text-xs text-muted-foreground">No certifications added</p>
      ) : (
        <div className="space-y-3">
          {certs.map((cert, i) => (
            <div
              key={i}
              className="p-3 rounded-lg space-y-2"
              style={{ background: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border)/0.5)" }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Certification {i + 1}</p>
                <button
                  onClick={() => removeCert(i)}
                  className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Name *</Label>
                  <Input
                    value={cert.name}
                    onChange={(e) => updateCert(i, "name", e.target.value)}
                    placeholder="e.g. ACE CPT"
                    className="mt-0.5 h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Issuer</Label>
                  <Input
                    value={cert.issuer}
                    onChange={(e) => updateCert(i, "issuer", e.target.value)}
                    placeholder="e.g. ACE"
                    className="mt-0.5 h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Issue Date</Label>
                  <Input
                    type="date"
                    value={cert.issue_date ?? ""}
                    onChange={(e) => updateCert(i, "issue_date", e.target.value)}
                    className="mt-0.5 h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Expiry Date</Label>
                  <Input
                    type="date"
                    value={cert.expiry_date ?? ""}
                    onChange={(e) => updateCert(i, "expiry_date", e.target.value)}
                    className="mt-0.5 h-8 text-xs"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Credential ID</Label>
                <Input
                  value={cert.credential_id ?? ""}
                  onChange={(e) => updateCert(i, "credential_id", e.target.value)}
                  placeholder="Optional"
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TrainerProfilePage() {
  const { data: profile, isLoading: loadingProfile } = useMyTrainerProfile();
  const { data: gymTrainer, isLoading: loadingGymTrainer } = useMyGymTrainerContract();
  const updateProfile = useUpdateMyProfile();

  // Form state
  const [bio, setBio] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [qualifications, setQualifications] = useState("");
  const [philosophy, setPhilosophy] = useState("");
  const [certifications, setCertifications] = useState<CertificationItem[]>([]);
  const [isPublic, setIsPublic] = useState(false);

  // Seed form when data arrives
  useEffect(() => {
    if (!profile) return;
    setBio(profile.bio ?? "");
    setYearsExp(profile.years_of_experience?.toString() ?? "");
    setSpecializations(profile.specializations ?? []);
    setLanguages(profile.languages_spoken ?? []);
    setQualifications(profile.qualifications ?? "");
    setPhilosophy(profile.training_philosophy ?? "");
    setCertifications(profile.certifications ?? []);
    setIsPublic(profile.is_public ?? false);
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile.mutateAsync({
      bio: bio.trim() || null,
      years_of_experience: yearsExp ? Number(yearsExp) : null,
      specializations,
      languages_spoken: languages,
      qualifications: qualifications.trim() || null,
      training_philosophy: philosophy.trim() || null,
      certifications,
      is_public: isPublic,
    });
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">My Profile</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your trainer profile and gym assignment details</p>
      </div>

      {/* Trainer Profile Section */}
      <form onSubmit={handleSave}>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Trainer Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Bio */}
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell clients about yourself, your experience, and your training style..."
                className="mt-1 resize-none"
                rows={4}
              />
            </div>

            {/* Years of Experience */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="years">Years of Experience</Label>
                <Input
                  id="years"
                  type="number"
                  min="0"
                  max="50"
                  value={yearsExp}
                  onChange={(e) => setYearsExp(e.target.value)}
                  placeholder="e.g. 5"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Specializations */}
            <TagInput
              label="Specializations"
              tags={specializations}
              onChange={setSpecializations}
            />

            {/* Languages */}
            <TagInput
              label="Languages Spoken"
              tags={languages}
              onChange={setLanguages}
            />

            {/* Qualifications */}
            <div>
              <Label htmlFor="qualifications">Qualifications</Label>
              <Textarea
                id="qualifications"
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                placeholder="List your formal qualifications and education..."
                className="mt-1 resize-none"
                rows={2}
              />
            </div>

            {/* Training Philosophy */}
            <div>
              <Label htmlFor="philosophy">Training Philosophy</Label>
              <Textarea
                id="philosophy"
                value={philosophy}
                onChange={(e) => setPhilosophy(e.target.value)}
                placeholder="Describe your approach to training and how you help clients achieve their goals..."
                className="mt-1 resize-none"
                rows={3}
              />
            </div>

            {/* Certifications */}
            <CertificationsEditor
              certs={certifications}
              onChange={setCertifications}
            />

            {/* Public profile toggle */}
            <div className="flex items-center justify-between py-3 rounded-lg px-3" style={{ background: "hsl(var(--muted)/0.3)" }}>
              <div>
                <p className="text-sm font-medium text-foreground">Public Profile</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Allow members to discover your profile when booking sessions
                </p>
              </div>
              <Checkbox
                checked={isPublic}
                onCheckedChange={(v) => setIsPublic(!!v)}
                className="h-5 w-5"
              />
            </div>

            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </Button>
          </CardContent>
        </Card>
      </form>

      {/* Gym Assignment (read-only) */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Gym Assignment</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loadingGymTrainer ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : !gymTrainer ? (
            <p className="text-sm text-muted-foreground">No gym assignment found.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "Status", value: (gymTrainer as any).status ?? "—" },
                {
                  label: "Hourly Rate",
                  value: (gymTrainer as any).hourly_rate
                    ? `${(gymTrainer as any).currency ?? "USD"} ${Number((gymTrainer as any).hourly_rate).toFixed(2)}/hr`
                    : "—",
                },
                {
                  label: "Commission Rate",
                  value: (gymTrainer as any).commission_rate
                    ? `${(Number((gymTrainer as any).commission_rate) * 100).toFixed(0)}%`
                    : "—",
                },
                {
                  label: "Onboarded",
                  value: (gymTrainer as any).onboarding_date
                    ? new Date((gymTrainer as any).onboarding_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—",
                },
                { label: "Specialty", value: (gymTrainer as any).specialty ?? "—" },
                { label: "Employment Type", value: (gymTrainer as any).employment_type ?? "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-semibold text-foreground mt-1 capitalize">{value}</p>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-4">
            Contact your gym administrator to update assignment details.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
