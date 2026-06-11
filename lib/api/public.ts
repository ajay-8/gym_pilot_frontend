import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const publicClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

export interface PublicPlan {
  id: string;
  name: string;
  description: string | null;
  duration_days: number | null;
  price: string;
  currency: string;
}

export interface PublicAmenity {
  name: string;
  slug: string;
  description: string | null;
}

export interface PublicGymCard {
  slug: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  distance_km: number | null;
  min_price: string | null;
  amenity_count: number;
}

export interface PublicGymDetail {
  slug: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: number | null;
  latitude: number | null;
  longitude: number | null;
  contact_phone: string | null;
  contact_email: string | null;
  website: string | null;
  plans: PublicPlan[];
  amenities: PublicAmenity[];
}

export interface GymSearchResponse {
  items: PublicGymCard[];
  total: number;
}

export interface EnquiryPayload {
  first_name: string;
  last_name?: string;
  phone: string;
  email?: string;
  plan_id?: string;
  message?: string;
}

export async function searchGyms(params: {
  lat?: number;
  lng?: number;
  radius_km?: number;
  city?: string;
  q?: string;
  limit?: number;
}): Promise<GymSearchResponse> {
  const { data } = await publicClient.get("/public/gyms", { params });
  return data;
}

export async function getGymProfile(slug: string): Promise<PublicGymDetail> {
  const { data } = await publicClient.get(`/public/gyms/${slug}`);
  return data;
}

export async function submitEnquiry(slug: string, payload: EnquiryPayload): Promise<void> {
  await publicClient.post(`/public/gyms/${slug}/enquire`, payload);
}
