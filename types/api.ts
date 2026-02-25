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

// Profile types
export interface UserProfileResponse {
  id: string;
  email: string;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  status: StatusType;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfileUpdateRequest {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// Staff types
export interface StaffListItem {
  user_id: string;
  participant_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  roles: string[];
  joined_at: string;
}

export interface StaffListResponse {
  items: StaffListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface StaffListParams {
  search?: string;
  page?: number;
  page_size?: number;
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

export interface BulkMemberImportItem {
  phone: string;
  first_name: string;
  last_name?: string;
  email?: string;
  date_of_birth?: string;
  gender?: Gender;
  plan_name: string;
  membership_start_date: string;
}

export interface BulkMemberImportRequest {
  members: BulkMemberImportItem[];
}

export interface BulkMemberImportResultItem {
  row: number;
  success: boolean;
  user_id?: string;
  error?: string;
  phone: string;
  first_name: string;
}

export interface BulkMemberImportResponse {
  total: number;
  success: number;
  failed: number;
  results: BulkMemberImportResultItem[];
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

export interface MembershipHistoryItem {
  id: string;
  plan_id?: string;
  plan_name?: string;
  status: StatusType;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface MembershipHistoryResponse {
  memberships: MembershipHistoryItem[];
  total: number;
}

export interface MemberStatusUpdateRequest {
  status: StatusType;
}

export interface MembershipRenewRequest {
  plan_id: string;
  start_date?: string;
}

export interface MemberUpdateRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: Gender;
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
  currency: string;
  features?: Record<string, any>;
  status: StatusType;
  created_at: string;
  updated_at: string;
}

export interface MembershipPlanListResponse {
  items: MembershipPlanResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface MembershipPlanCreateRequest {
  name: string;
  description?: string;
  duration_days?: number;
  price: number;
  currency?: string;
  features?: Record<string, any>;
}

export interface MembershipPlanUpdateRequest {
  name?: string;
  description?: string;
  duration_days?: number;
  price?: number;
  currency?: string;
  features?: Record<string, any>;
  status?: StatusType;
}

// Reports Types
export interface ExpiringMember {
  user_id: string;
  participant_id: string;
  name: string;
  plan_name: string | null;
  end_date: string; // YYYY-MM-DD
}

export interface AtRiskMember {
  participant_id: string;
  name: string;
  plan_name: string | null;
  last_check_in: string | null; // YYYY-MM-DD, null = never checked in
  days_since_check_in: number;  // -1 = never checked in
}

export interface DashboardResponse {
  // Unique people in the gym (each person counted once regardless of roles)
  total_unique_participants: number;

  // All gym participants, broken down by role (e.g. { member: 6, staff: 1, trainer: 1 })
  participants_by_role: Record<string, number>;

  // Membership subscription status counts
  active_memberships_count: number;
  expired_memberships_count: number;
  cancelled_memberships_count: number;

  // Active members last month (for retention delta)
  active_last_month_count: number;

  // Activity
  check_ins_today: number;
  check_ins_yesterday: number;
  checked_in_now: number;
  revenue_today: number;
  expiring_memberships_7d: number;

  // Top members expiring soon (mini drill-down table)
  expiring_soon_members: ExpiringMember[];

  // Members not checked in for 10+ days with active membership
  at_risk_members: AtRiskMember[];

  // Leads created today
  leads_today_count: number;

  // New vs renewals this month
  new_members_this_month: number;   // first-time members (joined_at this month)
  renewals_this_month: number;      // existing members who started a new plan this month

  revenue_this_month: number;
  revenue_last_month: number; // for % change indicator
}

// Attendance Report Types
export interface DailyAttendance {
  date: string;
  check_in_count: number;
  unique_visitors: number;
}

export interface AttendanceReportResponse {
  total_check_ins: number;
  unique_visitors: number;
  avg_daily_check_ins: number;
  daily_breakdown: DailyAttendance[];
}

// Membership Report Types
export interface MembershipStatusBreakdown {
  active: number;
  expired: number;
  cancelled: number;
  frozen: number;
}

export interface PlanMembershipCount {
  plan_name: string;
  active_count: number;
}

export interface MonthlyMembershipTrend {
  month: string; // "YYYY-MM"
  new_count: number;
}

export interface MembershipReportResponse {
  by_status: MembershipStatusBreakdown;
  by_plan: PlanMembershipCount[];
  expiring_in_7d: number;
  expiring_in_14d: number;
  expiring_in_30d: number;
  monthly_trend: MonthlyMembershipTrend[];
}

// Revenue Report Types
export interface PlanRevenue {
  plan_name: string;
  total_amount: number;
  count: number;
}

export interface MonthlyRevenue {
  month: string; // "YYYY-MM"
  total_revenue: number;
  membership_count: number;
}

export interface RevenueReportResponse {
  total_revenue: number;
  total_memberships: number;
  by_plan: PlanRevenue[];
  monthly_breakdown: MonthlyRevenue[];
}

// Lead Analytics Types
export interface LeadSourceBreakdown {
  source: string;
  total_leads: number;
  converted: number;
  lost: number;
  conversion_rate: number;
  avg_days_to_convert: number | null;
}

export interface LeadStatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

export interface LostReasonBreakdown {
  reason: string;
  count: number;
  percentage: number;
}

export interface MonthlyLeadTrend {
  month: string; // "YYYY-MM"
  total_leads: number;
  converted: number;
  lost: number;
}

export interface LeadAnalyticsResponse {
  total_leads: number;
  total_converted: number;
  total_lost: number;
  total_active: number;
  overall_conversion_rate: number;
  by_source: LeadSourceBreakdown[];
  by_status: LeadStatusBreakdown[];
  lost_reasons: LostReasonBreakdown[];
  monthly_trend: MonthlyLeadTrend[];
}

// Revenue Analytics Types
export interface PaymentMethodRevenue {
  payment_method: string;
  total_amount: number;
  transaction_count: number;
  avg_transaction_value: number;
  percentage_of_total: number;
}

export interface MonthlyRevenueAnalytics {
  month: string; // "YYYY-MM"
  total_revenue: number;
  transaction_count: number;
  avg_transaction_value: number;
}

export interface RevenueAnalyticsResponse {
  total_revenue: number;
  total_transactions: number;
  avg_transaction_value: number;
  by_payment_method: PaymentMethodRevenue[];
  monthly_trend: MonthlyRevenueAnalytics[];
}

// Member Analytics Types
export interface MonthlyMemberGrowth {
  month: string; // "YYYY-MM"
  new_members: number;
  churned_members: number;
  net_growth: number;
  total_active: number;
}

export interface MembershipTypeDistribution {
  plan_name: string;
  active_count: number;
  percentage: number;
}

export interface MemberAnalyticsResponse {
  total_active_members: number;
  total_new_members: number;
  total_churned_members: number;
  by_membership_type: MembershipTypeDistribution[];
  monthly_growth: MonthlyMemberGrowth[];
}

// Lead Types
export type LeadStatus =
  | "new"
  | "contacted"
  | "scheduled_tour"
  | "tour_completed"
  | "trial_started"
  | "converted"
  | "lost";

export type LeadSource =
  | "walk_in"
  | "phone_inquiry"
  | "web_form"
  | "referral"
  | "social_media"
  | "advertisement"
  | "other";

export interface LeadNoteEntry {
  timestamp: string;
  author_id: string | null;
  note: string;
}

export interface LeadResponse {
  id: string;
  gym_id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  interested_in: Record<string, any>;
  fitness_goals: string | null;
  assigned_to_id: string | null;
  next_follow_up_date: string | null;
  last_contact_date: string | null;
  converted_participant_id: string | null;
  converted_at: string | null;
  lost_at: string | null;
  lost_reason: string | null;
  lost_reason_details: string | null;
  notes: { entries: LeadNoteEntry[] };
  created_at: string;
  updated_at: string;
}

export interface LeadListResponse {
  leads: LeadResponse[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface LeadCreateRequest {
  first_name: string;
  last_name?: string;
  email?: string;
  phone: string;
  source: LeadSource;
  interested_in?: Record<string, any>;
  fitness_goals?: string;
  next_follow_up_date?: string;
}

export interface LeadUpdateRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  source?: LeadSource;
  status?: LeadStatus;
  fitness_goals?: string;
  next_follow_up_date?: string;
  last_contact_date?: string;
}

export interface LeadNoteAddRequest {
  note: string;
}

export interface LeadMarkLostRequest {
  lost_reason: string;
  lost_reason_details?: string;
}

export interface LeadConvertRequest {
  participant_id: string;
}

export interface LeadListParams {
  status?: string;
  source?: string;
  page?: number;
  per_page?: number;
}

// Check-in Types
export interface CheckInResponse {
  id: string;
  participant_id: string;
  gym_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface CheckInListResponse {
  items: CheckInResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CheckInCreateRequest {
  participant_id: string;
  notes?: string;
}

export interface CheckInListParams {
  participant_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

// Trainer Types
export interface GymTrainerContractResponse {
  id: string;
  gym_id: string;
  participant_id: string;
  trainer_name: string | null;
  hourly_rate: string | null;
  commission_rate: string | null;
  currency: string;
  weekly_availability: WeeklyAvailability;
  max_sessions_per_day: number | null;
  status: string; // "active" | "inactive"
  onboarding_date: string;
  offboarding_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface GymTrainerContractListResponse {
  trainers: GymTrainerContractResponse[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Used by the trainer onboard flow (creates User + Participant + Role + GymTrainerContract in one step)
export interface GymTrainerContractOnboardRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  hourly_rate?: number;
  commission_rate?: number;
  currency?: string;
  weekly_availability?: WeeklyAvailability;
  max_sessions_per_day?: number;
  onboarding_date: string;
}

export interface GymTrainerContractOnboardResponse {
  trainer: GymTrainerContractResponse;
  is_new_user: boolean;
  invitation_sent: boolean;
}

// Legacy — kept for reference, not used by the POST endpoint anymore
export interface GymTrainerContractCreateRequest {
  participant_id: string;
  hourly_rate?: number;
  commission_rate?: number;
  currency?: string;
  max_sessions_per_day?: number;
  onboarding_date: string;
}

export interface GymTrainerContractUpdateRequest {
  hourly_rate?: number | null;
  commission_rate?: number | null;
  max_sessions_per_day?: number | null;
  weekly_availability?: WeeklyAvailability;
  status?: string;
}

export interface TrainerPerformanceResponse {
  gym_trainer_id: string;
  total_sessions: number;
  completed_sessions: number;
  cancelled_sessions: number;
  no_show_sessions: number;
  completion_rate: string;
  total_revenue: string;
  total_commission_earned: string;
  average_session_duration_minutes: number | null;
  active_clients: number;
}

export interface CommissionSummaryItem {
  period: string; // "YYYY-MM"
  total_sessions: number;
  total_base_amount: string;
  total_commission: string;
  pending_count: number;
  paid_count: number;
}

export interface CommissionSummaryResponse {
  gym_trainer_id: string;
  total_earnings: string;
  total_pending: string;
  total_paid: string;
  by_period: CommissionSummaryItem[];
}

export interface CommissionResponse {
  id: string;
  gym_trainer_id: string;
  base_amount: string;
  commission_rate: string;
  commission_amount: string;
  currency: string;
  commission_period: string; // "YYYY-MM-DD" (first of month)
  status: "pending" | "paid" | "cancelled";
  paid_at: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
}

export interface CommissionListResponse {
  commissions: CommissionResponse[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface MarkCommissionPaidRequest {
  payment_reference?: string;
  notes?: string;
}

export interface CommissionListParams {
  status?: "pending" | "paid" | "cancelled";
  period_from?: string;
  period_to?: string;
  page?: number;
  per_page?: number;
}

export interface GymTrainerContractListParams {
  status?: string;
  page?: number;
  per_page?: number;
}

// Payment Types
export interface PaymentResponse {
  id: string;
  gym_id: string;
  participant_id: string;
  membership_id: string | null;
  amount: string;
  currency: string;
  payment_method: PaymentMethod;
  transaction_reference: string | null;
  status: PaymentStatus;
  receipt_number: string;
  notes: string | null;
  recorded_by_id: string;
  refunded_at: string | null;
  payment_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PaymentListResponse {
  items: PaymentResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PaymentCreateRequest {
  participant_id: string;
  membership_id?: string | null;
  amount: number;
  currency?: string;
  payment_method: PaymentMethod;
  transaction_reference?: string | null;
  notes?: string | null;
}

export interface PaymentRefundRequest {
  notes?: string | null;
}

export interface PaymentReceiptResponse {
  id: string;
  receipt_number: string;
  gym_id: string;
  participant_id: string;
  membership_id: string | null;
  amount: string;
  currency: string;
  payment_method: string;
  transaction_reference: string | null;
  status: string;
  notes: string | null;
  recorded_by_id: string;
  created_at: string;
}

export interface PaymentListParams {
  participant_id?: string;
  membership_id?: string;
  payment_method?: PaymentMethod;
  status?: PaymentStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
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

// Member List Params
export interface MemberListParams extends PaginationParams {
  search?: string;
  status?: string;
  plan_id?: string;
}

// Common Response Types
export interface MessageResponse {
  message: string;
}

// ── Classes Types ─────────────────────────────────────────────────────────────

export type ClassSessionStatus = "scheduled" | "completed" | "cancelled";
export type BookingStatus = "confirmed" | "waitlisted" | "cancelled" | "attended" | "no_show";

export interface GymClassResponse {
  id: string;
  gym_id: string;
  name: string;
  description: string | null;
  default_duration_minutes: number;
  default_capacity: number;
  class_metadata: Record<string, unknown> | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface GymClassListResponse {
  items: GymClassResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface GymClassCreateRequest {
  name: string;
  description?: string | null;
  default_duration_minutes?: number;
  default_capacity?: number;
  class_metadata?: Record<string, unknown> | null;
}

export interface GymClassUpdateRequest {
  name?: string;
  description?: string | null;
  default_duration_minutes?: number;
  default_capacity?: number;
  class_metadata?: Record<string, unknown> | null;
  status?: string;
}

export interface ClassSessionResponse {
  id: string;
  gym_id: string;
  class_id: string;
  trainer_id: string;
  recurring_schedule_id: string | null;
  start_time: string;
  end_time: string;
  capacity: number;
  current_bookings: number;
  notes: string | null;
  status: ClassSessionStatus;
  created_at: string;
  gym_class: GymClassResponse | null;
}

export interface ClassSessionListResponse {
  items: ClassSessionResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ClassSessionCreateRequest {
  class_id: string;
  trainer_id: string;
  start_time: string;
  end_time: string;
  capacity?: number;
  notes?: string | null;
}

export interface ClassSessionUpdateRequest {
  trainer_id?: string;
  start_time?: string;
  end_time?: string;
  capacity?: number;
  notes?: string | null;
}

export interface ClassSessionCancelRequest {
  reason?: string | null;
}

export interface BookingResponse {
  id: string;
  session_id: string;
  participant_id: string;
  status: BookingStatus;
  booked_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  session: ClassSessionResponse | null;
  waitlist_position: number | null;
}

export interface BookingListResponse {
  items: BookingResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ClassSessionListParams {
  class_id?: string;
  trainer_id?: string;
  date_from?: string;
  date_to?: string;
  status?: ClassSessionStatus;
  page?: number;
  page_size?: number;
}

export interface GymClassListParams {
  include_inactive?: boolean;
  page?: number;
  page_size?: number;
}

// ── Gym Settings ─────────────────────────────────────────────────────────────

export interface GymUpdateRequest {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: number;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export type NotificationType =
  | "new_member"
  | "membership_expiring"
  | "membership_expired"
  | "payment_received"
  | "payment_overdue"
  | "class_booking"
  | "check_in"
  | "general";

export interface NotificationResponse {
  id: string;
  gym_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  metadata_: Record<string, unknown>;
  created_at: string;
}

export interface NotificationListResponse {
  items: NotificationResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  unread_count: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface NotificationListParams {
  page?: number;
  page_size?: number;
  unread_only?: boolean;
}

// ── Amenities ─────────────────────────────────────────────────────────────────

export interface AmenityResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AmenityListResponse {
  items: AmenityResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface GymAmenityAddRequest {
  amenity_id: string;
}

export interface GymAmenityResponse {
  id: string;
  gym_id: string;
  amenity_id: string;
  created_at: string;
}

// ── Trainer Portal Types ───────────────────────────────────────────────────────

export interface CertificationItem {
  name: string;
  issuer: string;
  issue_date: string | null;
  expiry_date: string | null;
  credential_id: string | null;
}

export interface TrainerProfileResponse {
  id: string;
  user_id: string;
  bio: string | null;
  years_of_experience: number | null;
  certifications: CertificationItem[];
  specializations: string[];
  qualifications: string | null;
  training_philosophy: string | null;
  languages_spoken: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrainerProfileUpdateRequest {
  bio?: string | null;
  years_of_experience?: number | null;
  certifications?: CertificationItem[];
  specializations?: string[];
  qualifications?: string | null;
  training_philosophy?: string | null;
  languages_spoken?: string[];
  is_public?: boolean;
}

// ── Availability & Schedule ───────────────────────────────────────────────────

export interface AvailabilitySlot {
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
}

export interface WeeklyAvailability {
  monday: AvailabilitySlot[];
  tuesday: AvailabilitySlot[];
  wednesday: AvailabilitySlot[];
  thursday: AvailabilitySlot[];
  friday: AvailabilitySlot[];
  saturday: AvailabilitySlot[];
  sunday: AvailabilitySlot[];
}

export interface AvailabilityUpdateRequest {
  weekly_availability: WeeklyAvailability;
}

export interface PTSessionInSchedule {
  id: string;
  member_id: string;
  package_purchase_id: string;
  member_first_name: string | null;
  member_last_name: string | null;
  start_time: string;
  end_time: string;
  session_type: string | null;
  status: string;
}

export interface DaySchedule {
  date: string;
  availability: AvailabilitySlot[];
  pt_sessions: PTSessionInSchedule[];
}

export interface ScheduleResponse {
  gym_trainer_id: string;
  date_from: string;
  date_to: string;
  schedule: Record<string, DaySchedule>;
}

// ── PT Package Types ──────────────────────────────────────────────────────────

export type PTPlanType = "single" | "bundle" | "monthly_unlimited";
export type PTSessionMode = "in_person" | "online" | "hybrid";

export interface PTPackageResponse {
  id: string;
  trainer_id: string; // TrainerProfile.id
  name: string;
  description: string | null;
  plan_type: PTPlanType;
  session_mode: PTSessionMode;
  session_count: number;       // number of sessions included
  duration_minutes: number;    // duration per session in minutes
  expiry_days: number | null;  // days until expiry (null = no expiry)
  price: string;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PTPackageCreateRequest {
  name: string;
  description?: string;
  plan_type: PTPlanType;
  session_mode: PTSessionMode;
  session_count?: number;
  duration_minutes?: number;
  expiry_days?: number;
  price: number;
  currency?: string;
}

export interface PTPackageUpdateRequest {
  name?: string;
  description?: string | null;
  plan_type?: PTPlanType;
  session_mode?: PTSessionMode;
  session_count?: number | null;
  duration_minutes?: number;
  expiry_days?: number | null;
  price?: number;
  status?: string;
}

export interface PTPackageListResponse {
  items: PTPackageResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PTPackageListParams {
  trainer_profile_id?: string;
  status?: string;
  plan_type?: PTPlanType;
  session_mode?: PTSessionMode;
  page?: number;
  page_size?: number;
}

// ── PT Session Types ──────────────────────────────────────────────────────────

export interface PTSessionResponse {
  id: string;
  gym_id: string | null;
  trainer_id: string;           // GymParticipant.id of trainer
  member_id: string;            // GymParticipant.id of member/client
  package_purchase_id: string;
  start_time: string;           // ISO timestamp
  end_time: string;             // ISO timestamp
  session_mode: PTSessionMode;
  meeting_link: string | null;
  session_type: string | null;
  notes: string | null;
  trainer_notes: string | null;
  status: string; // scheduled | completed | cancelled | no_show
  cancelled_at: string | null;
  cancellation_reason: string | null;
  credit_refunded: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PTSessionListResponse {
  items: PTSessionResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PTSessionCreateRequest {
  trainer_id: string;
  member_id: string;
  package_purchase_id: string;
  start_time: string;
  end_time: string;
  session_type?: string;
  session_mode?: PTSessionMode;
  meeting_link?: string;
  notes?: string;
}

export interface PTSessionUpdateRequest {
  start_time?: string;
  end_time?: string;
  session_mode?: PTSessionMode;
  meeting_link?: string | null;
  notes?: string | null;
}

export interface PTSessionCancelRequest {
  reason?: string;
  refund_credit?: boolean;
}

export interface PTSessionCompleteRequest {
  trainer_notes?: string;
}

export interface PTSessionListParams {
  status?: string;
  page?: number;
  page_size?: number;
}

// ── Team & Members (All Participants Directory) ───────────────────────────────

export interface ParticipantSummary {
  participant_id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  roles: ParticipantRole[];
  status: string;
  joined_at: string;
}

export interface AllParticipantsResponse {
  participants: ParticipantSummary[];
  total: number;
  page: number;
  page_size: number;
}

export interface AllParticipantsListParams {
  page?: number;
  page_size?: number;
  search?: string;
  role?: ParticipantRole;
}
