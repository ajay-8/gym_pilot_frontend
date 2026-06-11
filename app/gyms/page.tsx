"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { MapPin, Search, Navigation, Dumbbell, IndianRupee, Star, Loader2, X } from "lucide-react";
import { searchGyms, PublicGymCard } from "@/lib/api/public";

export default function FindGymsPage() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [radiusKm, setRadiusKm] = useState(5);

  const searchParams = {
    ...(userLocation ? { lat: userLocation.lat, lng: userLocation.lng, radius_km: radiusKm } : {}),
    ...(cityInput && !userLocation ? { city: cityInput } : {}),
    ...(nameQuery ? { q: nameQuery } : {}),
    limit: 30,
  };

  const hasSearch = !!userLocation || !!cityInput || !!nameQuery;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["public-gyms", searchParams],
    queryFn: () => searchGyms(searchParams),
    enabled: hasSearch,
    staleTime: 30_000,
  });

  const handleFindNearMe = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Your browser doesn't support location access.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setCityInput("");
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError("Location access denied. Please allow location in your browser settings.");
        } else {
          setLocationError("Unable to get your location. Try searching by city instead.");
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const clearLocation = () => {
    setUserLocation(null);
    setLocationError(null);
  };

  const gyms = data?.items ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-emerald-400" />
            <span className="font-bold text-white">Gym Pilot</span>
          </Link>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-white transition-colors">
            Gym Owner? Sign In
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Find Gyms Near You</h1>
          <p className="text-muted-foreground">
            Discover gyms in your area with pricing, amenities, and contact info.
          </p>
        </div>

        {/* Search Controls */}
        <div className="bg-card border border-white/[0.06] rounded-2xl p-5 mb-8 space-y-4">

          {/* Location button + status */}
          <div className="flex items-center gap-3 flex-wrap">
            {!userLocation ? (
              <button
                onClick={handleFindNearMe}
                disabled={locating}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 disabled:opacity-50"
              >
                {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                {locating ? "Getting your location…" : "Find gyms near me"}
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                <Navigation className="h-4 w-4" />
                <span>Using your location</span>
                <button onClick={clearLocation} className="ml-1 hover:text-white transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {userLocation && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Radius:</span>
                {[2, 5, 10, 20].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadiusKm(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                      radiusKm === r
                        ? "bg-emerald-500/18 text-emerald-400 border-emerald-500/30"
                        : "bg-white/5 text-muted-foreground border-white/[0.08]"
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            )}
          </div>

          {locationError && (
            <p className="text-sm text-red-400">{locationError}</p>
          )}

          <div className="flex gap-3">
            {/* City search (when no GPS) */}
            {!userLocation && (
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  placeholder="Search by city (e.g. Delhi, Mumbai)"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-transparent border border-white/10 outline-none text-white placeholder:text-muted-foreground"
                />
              </div>
            )}

            {/* Name search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                placeholder="Search gym name…"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-transparent border border-white/10 outline-none text-white placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        {!hasSearch && (
          <div className="text-center py-16 text-muted-foreground">
            <Navigation className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Allow location access or type a city to find gyms near you.</p>
          </div>
        )}

        {hasSearch && (isLoading || isFetching) && (
          <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Searching gyms…</span>
          </div>
        )}

        {hasSearch && !isLoading && !isFetching && gyms.length === 0 && (
          <div className="text-center py-16">
            <Dumbbell className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">No gyms found in this area.</p>
            {userLocation && (
              <p className="text-sm text-muted-foreground mt-1">
                Try increasing the radius or search by name.
              </p>
            )}
          </div>
        )}

        {gyms.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">{gyms.length} gym{gyms.length !== 1 ? "s" : ""} found</p>
            {gyms.map((gym) => (
              <GymCard key={gym.slug} gym={gym} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GymCard({ gym }: { gym: PublicGymCard }) {
  return (
    <Link href={`/gyms/${gym.slug}`}>
      <div className="bg-card border border-white/[0.06] rounded-2xl p-5 flex items-start justify-between gap-4 cursor-pointer transition-all hover:scale-[1.01] hover:border-emerald-500/30">
        {/* Left: gym info */}
        <div className="flex gap-4 min-w-0">
          {/* Icon */}
          <div className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-500/[0.12]">
            <Dumbbell className="h-6 w-6 text-emerald-400" />
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-white truncate">{gym.name}</h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">
                {[gym.address, gym.city, gym.state].filter(Boolean).join(", ")}
              </span>
            </div>
            {gym.amenity_count > 0 && (
              <div className="flex items-center gap-1 mt-1.5">
                <Star className="h-3 w-3 text-amber-400" />
                <span className="text-xs text-muted-foreground">{gym.amenity_count} amenities</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: distance + price */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {gym.distance_km !== null && gym.distance_km !== undefined && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/[0.12] text-emerald-400">
              {gym.distance_km} km away
            </span>
          )}
          {gym.min_price && (
            <div className="flex items-center gap-0.5 text-sm font-medium text-white">
              <IndianRupee className="h-3.5 w-3.5" />
              <span>{Number(gym.min_price).toLocaleString("en-IN")}</span>
              <span className="text-xs text-muted-foreground font-normal ml-0.5">onwards</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
