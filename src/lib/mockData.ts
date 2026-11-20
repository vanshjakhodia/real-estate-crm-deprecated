// ====================================================================
// CLEAN SLATE: NO DUMMY DATA
// Only real records entered by user, imported via Excel, or booked via forms
// ====================================================================

import { Lead, Property, Appointment, Followup, ActivityLog, Profile, BusinessSettings, Message } from '../types/crm';

export const initialProfiles: Profile[] = [
  {
    id: 'user-admin-001',
    email: 'admin@kanpurprimerealty.com',
    full_name: 'Admin',
    role: 'admin',
    phone: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const initialSettings: BusinessSettings = {
  id: 'settings-001',
  company_name: 'Kanpur Prime Realty CRM',
  city: 'Kanpur',
  working_hours_start: '11:00',
  working_hours_end: '19:00',
  working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ai_tone: 'Professional, consultative, polite and refined',
  ai_language: 'English',
  updated_at: new Date().toISOString()
};

// 100% Clean Slate - Zero dummy data
export const initialProperties: Property[] = [];
export const initialLeads: Lead[] = [];
export const initialMessages: Record<string, Message[]> = {};
export const initialAppointments: Appointment[] = [];
export const initialFollowups: Followup[] = [];
export const initialActivityLog: ActivityLog[] = [];
