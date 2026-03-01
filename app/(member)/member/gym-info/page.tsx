"use client";

import { useGymAmenities } from "@/lib/hooks/use-amenities";
import { useAuth } from "@/lib/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Sparkles, CheckCircle2 } from "lucide-react";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GymInfoPage() {
  const { gymContext } = useAuth();
  const { data: amenities, isLoading } = useGymAmenities();

  return (
    <div className="space-y-6">
      {/* ── Header card ───────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #3b82f620 0%, #10b98120 100%)" }}
            >
              <Building2 className="h-6 w-6" style={{ color: "#3b82f6" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{gymContext?.gym_name}</h2>
              <p className="text-sm text-muted-foreground">
                {amenities && amenities.length > 0
                  ? `${amenities.length} amenity${amenities.length !== 1 ? "s" : ""} available`
                  : "Gym facilities & amenities"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Amenities grid ────────────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Facilities &amp; Amenities
        </h3>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-xl animate-pulse"
                style={{ background: "hsl(var(--border))" }}
              />
            ))}
          </div>
        ) : !amenities || amenities.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No amenities listed for this gym yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {amenities.map((amenity) => (
              <Card key={amenity.id} className="transition-all duration-150 hover:border-blue-500/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "#3b82f615" }}
                    >
                      <CheckCircle2 className="h-4 w-4" style={{ color: "#3b82f6" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{amenity.name}</p>
                      {amenity.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {amenity.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
