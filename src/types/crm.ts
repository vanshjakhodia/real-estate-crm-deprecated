// ====================================================================
// CORE TYPES: Kanpur Prime Realty CRM
// ====================================================================

export type UserRole = 'admin' | 'agent';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export type LeadSource = 'instagram' | 'manual' | 'form' | 'import';
export type LeadIntent = 'buy' | 'rent' | 'invest';
export type LeadScore = 'hot' | 'warm' | 'cold';
export type LeadStatus = 'new' | 'contacted' | 'site_visit_booked' | 'negotiation' | 'won' | 'lost';

export interface Lead {
  id: string;
  source: LeadSource;
  ig_handle?: string | null;
  full_name: string;
  phone: string;
  email?: string | null;
  intent?: LeadIntent | null;
  property_type?: string | null;
  preferred_location?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  timeline?: string | null;
  lead_score: LeadScore;
  status: LeadStatus;
  assigned_to?: string | null;
  consent_given: boolean;
  consent_at?: string | null;
  ai_summary?: string | null;
  notes?: string | null;
  last_contact_at?: string | null;
  next_followup_at?: string | null;
  created_at: string;
  updated_at: string;
  assigned_profile?: Profile | null;
}

export type MessageDirection = 'in' | 'out';
export type MessageChannel = 'instagram' | 'whatsapp' | 'email' | 'manual';
export type MessageSender = 'lead' | 'ai' | 'agent';

export interface Message {
  id: string;
  lead_id: string;
  direction: MessageDirection;
  channel: MessageChannel;
  sender: MessageSender;
  content: string;
  created_at: string;
}

export type AppointmentType = 'call' | 'site_visit';
export type AppointmentStatus = 'booked' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  lead_id: string;
  type: AppointmentType;
  property_id?: string | null;
  scheduled_at: string;
  status: AppointmentStatus;
  reminder_sent_24h: boolean;
  reminder_sent_1h: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  lead?: Lead | null;
  property?: Property | null;
}

export type PropertyStatus = 'available' | 'sold_out';

export interface Property {
  id: string;
  project_name: string;
  location: string;
  property_type: string;
  bhk?: string | null;
  carpet_area?: number | null;
  price_min: number;
  price_max: number;
  payment_plan?: string | null;
  rera_number?: string | null;
  brochure_url?: string | null;
  status: PropertyStatus;
  description: string;
  created_at: string;
  updated_at: string;
}

export type FollowupStatus = 'pending' | 'sent' | 'skipped' | 'failed';

export interface Followup {
  id: string;
  lead_id: string;
  step_number: number;
  channel: string;
  scheduled_for: string;
  sent_at?: string | null;
  status: FollowupStatus;
  template_key?: string | null;
  created_at: string;
  updated_at: string;
  lead?: Lead | null;
}

export interface ActivityLog {
  id: string;
  lead_id?: string | null;
  user_id?: string | null;
  action: string;
  details: Record<string, any>;
  created_at: string;
  user_profile?: Profile | null;
}

export interface BusinessSettings {
  id: string;
  company_name: string;
  city: string;
  working_hours_start: string; // e.g. "10:00"
  working_hours_end: string;   // e.g. "18:00"
  working_days: string[];      // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  ai_tone: string;
  ai_language: 'English' | 'Hindi' | 'Hinglish';
  updated_at: string;
}

export interface LeadFilterState {
  search: string;
  status: string;
  score: string;
  source: string;
  assigned_to: string;
  dateRange: 'all' | 'today' | 'this_week' | 'this_month';
}
