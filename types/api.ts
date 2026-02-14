// Core API Types matching backend models

export type StatusType =
  | "active"
  | "inactive"
  | "suspended"
  | "left"
  | "expired"
  | "cancelled"
  | "frozen";

export type ParticipantRole = "member" | "trainer" | "staff" | "admin" | "owner";

export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export type PaymentStatus = "pending" | "processing" | "completed" | "failed" | "refunded";

export type PaymentMethod = "cash" | "upi" | "card" | "bank_transfer" | "other";

// User Types
export interface User {
  id: string;
  email: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  status: StatusType;
  gender?: Gender;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AccessTokenResponse {
  access_token: string;
  token_type: "bearer";
}

export interface AuthUserResponse {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface GymContextResponse {
  gym_id: string;
  gym_name: string;
  participant_id: string;
  roles: ParticipantRole[];
}

export interface AuthMeResponse {
  user: AuthUserResponse;
  gym_context?: GymContextResponse;
}

export interface SetSessionGymRequest {
  gym_id: string;
}

export interface PasswordResetRequestSchema {
  email: string;
}

export interface PasswordResetConfirmSchema {
  token: string;
  new_password: string;
}

// Gym Types
export interface GymResponse {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: number;
  latitude?: number;
  longitude?: number;
  status: StatusType;
  created_at: string;
  updated_at: string;
}

export interface GymListResponse {
  items: GymResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface GymOnboardRequest {
  gym: {
    name: string;
    brand_name?: string;
    description?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: number;
    latitude?: number;
    longitude?: number;
  };
  owner: {
    email: string;
    password: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
    gender?: Gender;
  };
}

export interface GymOnboardResponse {
  gym: GymResponse;
  owner: AuthUserResponse;
  role: string;
}

// Member Types
export interface MemberListItem {
  user_id: string;
  participant_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  membership_status: StatusType;
  membership_start_date: string;
  membership_end_date?: string;
}

export interface MemberListResponse {
  items: MemberListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface MemberOnboardRequest {
  phone: string;
  email?: string;
  first_name: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: Gender;
  membership_start_date?: string;
  plan_id?: string;
  roles?: ParticipantRole[];
}

export interface MemberOnboardResponse {
  user_id: string;
  participant_id: string;
  membership_id?: string;
  status: StatusType;
  roles: ParticipantRole[];
}

export interface MembershipSummary {
  id: string;
  plan_id?: string;
  status: StatusType;
  start_date: string;
  end_date?: string;
}

export interface MemberDetailResponse {
  user_id: string;
  participant_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  status: StatusType;
  joined_at: string;
  roles: ParticipantRole[];
  membership?: MembershipSummary;
  total_check_ins: number;
  total_payments: number;
}

export interface MemberStatusUpdateRequest {
  status: StatusType;
}

export interface EmergencyContact {
  name?: string;
  relationship?: string;
  phone?: string;
}

export interface MedicalCondition {
  condition?: string;
  severity?: string;
  notes?: string;
}

export interface MemberHealthRecordsResponse {
  medical_conditions?: MedicalCondition[];
  emergency_contact?: EmergencyContact;
  fitness_goals?: string[];
  injuries_limitations?: string;
}

export interface MemberHealthRecordsUpdateRequest {
  medical_conditions?: MedicalCondition[];
  emergency_contact?: EmergencyContact;
  fitness_goals?: string[];
  injuries_limitations?: string;
}

// Membership Plan Types
export interface MembershipPlanResponse {
  id: string;
  gym_id: string;
  name: string;
  description?: string;
  duration_days?: number;
  price: number;
  status: StatusType;
  created_at: string;
  updated_at: string;
}

// Reports Types
export interface DashboardResponse {
  active_members_count: number;
  check_ins_today: number;
  checked_in_now: number;
  expiring_memberships_7d: number;
  new_members_this_month: number;
  revenue_this_month: number;
}

// API Error Types
export interface APIError {
  detail: string;
  status?: number;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  page_size?: number;
}

// Common Response Types
export interface MessageResponse {
  message: string;
}
