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
export interface GymTrainerResponse {
  id: string;
  gym_id: string;
  participant_id: string;
  trainer_name: string | null;
  hourly_rate: string | null;
  commission_rate: string | null;
  currency: string;
  weekly_availability: Record<string, { start: string; end: string }[]>;
  max_sessions_per_day: number | null;
  status: string; // "active" | "inactive"
  onboarding_date: string;
  offboarding_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface GymTrainerListResponse {
  trainers: GymTrainerResponse[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface GymTrainerCreateRequest {
  participant_id: string;
  hourly_rate?: number;
  commission_rate?: number;
  currency?: string;
  max_sessions_per_day?: number;
  onboarding_date: string;
}

export interface GymTrainerUpdateRequest {
  hourly_rate?: number | null;
  commission_rate?: number | null;
  max_sessions_per_day?: number | null;
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

export interface GymTrainerListParams {
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
