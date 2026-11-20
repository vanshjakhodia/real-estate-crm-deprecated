// ====================================================================
// CRM CONTEXT: State Management, Role Enforcement & RLS Simulation
// ====================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Lead,
  Property,
  Appointment,
  Followup,
  ActivityLog,
  Profile,
  BusinessSettings,
  Message,
  UserRole,
  LeadIntent
} from '../types/crm';
import {
  initialProfiles,
  initialSettings,
  initialProperties,
  initialLeads,
  initialAppointments,
  initialFollowups,
  initialActivityLog,
  initialMessages
} from '../lib/mockData';
import { isAppointmentConflicting, normalizeIndianPhone } from '../lib/utils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { KANPUR_LOCALITIES, KANPUR_INFRASTRUCTURE } from '../lib/kanpurMarketData';

interface CrmContextType {
  currentUser: Profile;
  currentRole: UserRole;
  switchUser: (userId: string) => void;
  isLiveSupabase: boolean;

  // Data
  leads: Lead[];              // Filtered by role (RLS)
  allLeadsForAdmin: Lead[];    // Full dataset for admin analytics/exports
  properties: Property[];
  appointments: Appointment[];
  followups: Followup[];
  activityLogs: ActivityLog[];
  settings: BusinessSettings;
  teamMembers: Profile[];

  // Lead Actions
  addLead: (lead: Partial<Lead>) => Lead;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void; // DPDP compliance (Admin only)
  quickUpdateStatus: (id: string, status: Lead['status']) => void;
  quickUpdateScore: (id: string, score: Lead['lead_score']) => void;

  // Property Actions
  addProperty: (property: Partial<Property>) => void;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  archiveProperty: (id: string) => void;

  // Appointment Actions
  createAppointment: (apt: {
    lead_id: string;
    type: 'call' | 'site_visit';
    property_id?: string | null;
    scheduled_at: string;
    notes?: string;
  }) => { success: boolean; conflict?: boolean; error?: string };
  rescheduleAppointment: (id: string, newTime: string) => { success: boolean; conflict?: boolean; error?: string };
  cancelAppointment: (id: string, reason?: string) => void;

  // Follow-up Actions
  markFollowupDone: (id: string) => void;
  snoozeFollowup: (id: string, days: number) => void;

  // Messages
  getLeadMessages: (leadId: string) => Message[];
  addMessage: (leadId: string, content: string, channel?: 'whatsapp' | 'instagram' | 'email' | 'manual', sender?: 'agent' | 'ai') => void;

  // Settings & Team
  updateSettings: (newSettings: Partial<BusinessSettings>) => void;
  inviteTeamMember: (member: { email: string; full_name: string; role: UserRole; phone?: string }) => void;
  removeTeamMember: (id: string) => void;
  clearAllData: () => void;

  // AI Functionality
  generateFollowupDraft: (leadId: string, language?: 'English' | 'Hindi' | 'Hinglish', tone?: string) => Promise<string>;
  scoreLeadWithAi: (leadId: string) => Promise<{ lead_score: 'hot' | 'warm' | 'cold'; reason: string; ai_summary: string }>;
  askAiAssistant: (question: string) => Promise<string>;

  // Public Booking
  bookPublicSlot: (data: {
    fullName: string;
    phone: string;
    email: string;
    type: 'call' | 'site_visit';
    propertyId?: string;
    scheduledAt: string;
    notes?: string;
    consentGiven: boolean;
    intent?: LeadIntent;
    preferredLocation?: string;
    budgetMin?: number;
    budgetMax?: number;
    timeline?: string;
  }) => { success: boolean; error?: string; appointmentId?: string };
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

export const CrmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Ensure legacy dummy data is completely cleared
  if (typeof window !== 'undefined') {
    const version = localStorage.getItem('crm_clean_slate_version');
    if (version !== 'clean_slate_100') {
      localStorage.removeItem('crm_leads');
      localStorage.removeItem('crm_properties');
      localStorage.removeItem('crm_appointments');
      localStorage.removeItem('crm_followups');
      localStorage.removeItem('crm_messages');
      localStorage.removeItem('crm_activity_logs');
      localStorage.setItem('crm_clean_slate_version', 'clean_slate_100');
    }
  }

  // Profiles & Auth State
  const [teamMembers, setTeamMembers] = useState<Profile[]>(() => {
    const saved = localStorage.getItem('crm_team_members');
    return saved ? JSON.parse(saved) : initialProfiles;
  });

  const [currentUserId, setCurrentUserId] = useState<string>('user-admin-001');

  const currentUser = teamMembers.find((u) => u.id === currentUserId) || teamMembers[0];
  const currentRole = currentUser.role;

  // Business Settings
  const [settings, setSettings] = useState<BusinessSettings>(() => {
    const saved = localStorage.getItem('crm_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.ai_language === 'Hinglish') {
          parsed.ai_language = 'English';
        }
        return parsed;
      } catch (e) {
        return initialSettings;
      }
    }
    return initialSettings;
  });

  // Properties (Zero dummy data - clean state)
  const [properties, setProperties] = useState<Property[]>(() => {
    const saved = localStorage.getItem('crm_properties');
    return saved ? JSON.parse(saved) : [];
  });

  // Leads (Zero dummy data - clean state)
  const [allLeads, setAllLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('crm_leads');
    return saved ? JSON.parse(saved) : [];
  });

  // Appointments (Zero dummy data - clean state)
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('crm_appointments');
    return saved ? JSON.parse(saved) : [];
  });

  // Followups (Zero dummy data - clean state)
  const [followups, setFollowups] = useState<Followup[]>(() => {
    const saved = localStorage.getItem('crm_followups');
    return saved ? JSON.parse(saved) : [];
  });

  // Messages (Zero dummy data - clean state)
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>(() => {
    const saved = localStorage.getItem('crm_messages');
    return saved ? JSON.parse(saved) : {};
  });

  // Activity Log
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('crm_activity_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist to local storage for realistic demonstration and continuity
  useEffect(() => {
    localStorage.setItem('crm_leads', JSON.stringify(allLeads));
  }, [allLeads]);

  useEffect(() => {
    localStorage.setItem('crm_properties', JSON.stringify(properties));
  }, [properties]);

  useEffect(() => {
    localStorage.setItem('crm_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('crm_followups', JSON.stringify(followups));
  }, [followups]);

  useEffect(() => {
    localStorage.setItem('crm_messages', JSON.stringify(messagesMap));
  }, [messagesMap]);

  useEffect(() => {
    localStorage.setItem('crm_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('crm_team_members', JSON.stringify(teamMembers));
  }, [teamMembers]);

  // ROW LEVEL SECURITY ENFORCEMENT:
  // If current role is 'admin', sees all leads.
  // If 'agent', sees ONLY leads where assigned_to === currentUser.id!
  const visibleLeads = currentRole === 'admin'
    ? allLeads
    : allLeads.filter((l) => l.assigned_to === currentUser.id);

  // Attach profile metadata for easy display
  const enrichedLeads = visibleLeads.map((l) => ({
    ...l,
    assigned_profile: teamMembers.find((m) => m.id === l.assigned_to) || null
  }));

  const enrichedAllLeads = allLeads.map((l) => ({
    ...l,
    assigned_profile: teamMembers.find((m) => m.id === l.assigned_to) || null
  }));

  // Enriched appointments with Lead and Property details
  const enrichedAppointments = appointments
    .filter((a) => {
      if (currentRole === 'admin') return true;
      const parentLead = allLeads.find((l) => l.id === a.lead_id);
      return parentLead?.assigned_to === currentUser.id;
    })
    .map((a) => ({
      ...a,
      lead: allLeads.find((l) => l.id === a.lead_id) || null,
      property: properties.find((p) => p.id === a.property_id) || null
    }));

  const logActivity = (action: string, leadId?: string | null, details: Record<string, any> = {}) => {
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      lead_id: leadId || null,
      user_id: currentUser.id,
      action,
      details,
      created_at: new Date().toISOString(),
      user_profile: currentUser
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  const switchUser = (userId: string) => {
    const found = teamMembers.find((m) => m.id === userId);
    if (found) {
      setCurrentUserId(found.id);
    }
  };

  const addLead = (leadData: Partial<Lead>): Lead => {
    const normalizedPhone = normalizeIndianPhone(leadData.phone);
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      source: leadData.source || 'manual',
      ig_handle: leadData.ig_handle || null,
      full_name: leadData.full_name || 'Unnamed Lead',
      phone: normalizedPhone,
      email: leadData.email || null,
      intent: leadData.intent || 'buy',
      property_type: leadData.property_type || 'Apartment',
      preferred_location: leadData.preferred_location || 'Kanpur',
      budget_min: leadData.budget_min || null,
      budget_max: leadData.budget_max || null,
      timeline: leadData.timeline || '1-2 months',
      lead_score: leadData.lead_score || 'warm',
      status: leadData.status || 'new',
      assigned_to: leadData.assigned_to !== undefined ? leadData.assigned_to : (currentRole === 'agent' ? currentUser.id : null),
      consent_given: leadData.consent_given ?? true,
      consent_at: leadData.consent_at || new Date().toISOString(),
      ai_summary: leadData.ai_summary || null,
      notes: leadData.notes || null,
      last_contact_at: new Date().toISOString(),
      next_followup_at: leadData.next_followup_at || new Date(Date.now() + 2 * 86400000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setAllLeads((prev) => [newLead, ...prev]);
    logActivity('lead_created', newLead.id, { source: newLead.source, name: newLead.full_name });
    return newLead;
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setAllLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === id) {
          const updated = { ...lead, ...updates, updated_at: new Date().toISOString() };
          logActivity('lead_updated', id, updates);
          return updated;
        }
        return lead;
      })
    );
  };

  const deleteLead = (id: string) => {
    if (currentRole !== 'admin') {
      alert('Only Admin can delete lead data to comply with DPDP regulations.');
      return;
    }
    const target = allLeads.find((l) => l.id === id);
    setAllLeads((prev) => prev.filter((l) => l.id !== id));
    setAppointments((prev) => prev.filter((a) => a.lead_id !== id));
    setFollowups((prev) => prev.filter((f) => f.lead_id !== id));
    logActivity('lead_deleted_dpdp', null, { lead_name: target?.full_name, phone: target?.phone });
  };

  const quickUpdateStatus = (id: string, status: Lead['status']) => {
    updateLead(id, { status, last_contact_at: new Date().toISOString() });
  };

  const quickUpdateScore = (id: string, lead_score: Lead['lead_score']) => {
    updateLead(id, { lead_score });
  };

  const addProperty = (prop: Partial<Property>) => {
    const newProp: Property = {
      id: `prop-${Date.now()}`,
      project_name: prop.project_name || 'New Kanpur Project',
      location: prop.location || 'Kanpur',
      property_type: prop.property_type || 'Apartment',
      bhk: prop.bhk || null,
      carpet_area: prop.carpet_area || null,
      price_min: prop.price_min || 0,
      price_max: prop.price_max || 0,
      payment_plan: prop.payment_plan || null,
      rera_number: prop.rera_number || null,
      brochure_url: prop.brochure_url || null,
      status: prop.status || 'available',
      description: prop.description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setProperties((prev) => [newProp, ...prev]);
    logActivity('property_added', null, { project_name: newProp.project_name });
  };

  const updateProperty = (id: string, updates: Partial<Property>) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p))
    );
    logActivity('property_updated', null, { property_id: id, updates });
  };

  const archiveProperty = (id: string) => {
    updateProperty(id, { status: 'sold_out' });
  };

  const createAppointment = (aptData: {
    lead_id: string;
    type: 'call' | 'site_visit';
    property_id?: string | null;
    scheduled_at: string;
    notes?: string;
  }) => {
    const bookedTimes = appointments
      .filter((a) => a.status === 'booked' && (!aptData.property_id || a.property_id === aptData.property_id))
      .map((a) => a.scheduled_at);

    const hasConflict = isAppointmentConflicting(aptData.scheduled_at, bookedTimes, 40);

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      lead_id: aptData.lead_id,
      type: aptData.type,
      property_id: aptData.property_id || null,
      scheduled_at: aptData.scheduled_at,
      status: 'booked',
      reminder_sent_24h: false,
      reminder_sent_1h: false,
      notes: aptData.notes || (hasConflict ? '⚠️ Conflicting booking created' : null),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setAppointments((prev) => [newApt, ...prev]);

    // Update lead status to site_visit_booked if applicable
    if (aptData.type === 'site_visit') {
      updateLead(aptData.lead_id, { status: 'site_visit_booked', lead_score: 'hot' });
    }

    logActivity('appointment_created', aptData.lead_id, {
      type: aptData.type,
      scheduled_at: aptData.scheduled_at,
      has_conflict: hasConflict
    });

    return { success: true, conflict: hasConflict };
  };

  const rescheduleAppointment = (id: string, newTime: string) => {
    const existing = appointments.find((a) => a.id === id);
    if (!existing) return { success: false, error: 'Appointment not found' };

    const bookedTimes = appointments
      .filter((a) => a.id !== id && a.status === 'booked' && (!existing.property_id || a.property_id === existing.property_id))
      .map((a) => a.scheduled_at);

    const hasConflict = isAppointmentConflicting(newTime, bookedTimes, 40);

    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, scheduled_at: newTime, updated_at: new Date().toISOString() } : a))
    );

    logActivity('appointment_rescheduled', existing.lead_id, { new_time: newTime, conflict: hasConflict });
    return { success: true, conflict: hasConflict };
  };

  const cancelAppointment = (id: string, reason?: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'cancelled', notes: reason ? `${a.notes || ''} [Cancelled: ${reason}]` : a.notes } : a))
    );
    const existing = appointments.find((a) => a.id === id);
    if (existing) {
      logActivity('appointment_cancelled', existing.lead_id, { reason });
    }
  };

  const markFollowupDone = (id: string) => {
    setFollowups((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'sent', sent_at: new Date().toISOString() } : f))
    );
    const item = followups.find((f) => f.id === id);
    if (item) {
      logActivity('followup_completed', item.lead_id);
    }
  };

  const snoozeFollowup = (id: string, days: number) => {
    setFollowups((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const newDate = new Date(Date.now() + days * 86400000).toISOString();
          return { ...f, scheduled_for: newDate, status: 'pending' };
        }
        return f;
      })
    );
  };

  const getLeadMessages = (leadId: string): Message[] => {
    return messagesMap[leadId] || [];
  };

  const addMessage = (
    leadId: string,
    content: string,
    channel: 'whatsapp' | 'instagram' | 'email' | 'manual' = 'manual',
    sender: 'agent' | 'ai' = 'agent'
  ) => {
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      lead_id: leadId,
      direction: 'out',
      channel,
      sender,
      content,
      created_at: new Date().toISOString()
    };
    setMessagesMap((prev) => ({
      ...prev,
      [leadId]: [...(prev[leadId] || []), newMsg]
    }));
    updateLead(leadId, { last_contact_at: new Date().toISOString() });
    logActivity('message_sent', leadId, { channel, sender, preview: content.slice(0, 30) });
  };

  const updateSettings = (newSettings: Partial<BusinessSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings, updated_at: new Date().toISOString() }));
    logActivity('settings_updated', null, newSettings);
  };

  const inviteTeamMember = (member: { email: string; full_name: string; role: UserRole; phone?: string }) => {
    const newMember: Profile = {
      id: `user-agent-${Date.now()}`,
      email: member.email,
      full_name: member.full_name,
      role: member.role,
      phone: member.phone || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setTeamMembers((prev) => [...prev, newMember]);
    logActivity('team_member_invited', null, { email: member.email, role: member.role });
  };

  const removeTeamMember = (id: string) => {
    if (id === currentUser.id) {
      alert('You cannot remove yourself.');
      return;
    }
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
    logActivity('team_member_removed', null, { user_id: id });
  };

  const clearAllData = () => {
    setAllLeads([]);
    setProperties([]);
    setAppointments([]);
    setFollowups([]);
    setMessagesMap({});
    setActivityLogs([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('crm_leads');
      localStorage.removeItem('crm_properties');
      localStorage.removeItem('crm_appointments');
      localStorage.removeItem('crm_followups');
      localStorage.removeItem('crm_messages');
      localStorage.removeItem('crm_activity_logs');
    }
  };

  // AI Functionality (via Supabase Edge Function with seamless local fallback engine)
  const generateFollowupDraft = async (
    leadId: string,
    language: 'English' | 'Hindi' | 'Hinglish' = settings.ai_language,
    tone: string = settings.ai_tone
  ): Promise<string> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.functions.invoke('gemini-ai', {
          body: { action: 'generate_followup', lead_id: leadId, language, tone }
        });
        if (!error && data?.message) return data.message;
      } catch (e) {
        console.warn('Falling back to local AI generation engine:', e);
      }
    }

    const lead = allLeads.find((l) => l.id === leadId);
    if (!lead) return 'Lead not found.';

    if (language === 'Hindi') {
      return `नमस्ते ${lead.full_name} जी, कानपुर प्राइम रियल्टी से। आशा है आप सपरिवार सकुशल हैं। आपके ${lead.property_type || 'प्रॉपर्टी'} हेतु क्या हम इस हफ्ते एक साइट विज़िट प्लान कर सकते हैं? हम आपके समय अनुसार समय निर्धारित कर देंगे।`;
    }
    return `Dear ${lead.full_name}, greetings from ${settings.company_name}. We noted your interest in premier residential options in ${lead.preferred_location || 'Kanpur'}. We would be honored to host you for an exclusive private property walkthrough at your convenience. Kindly advise if this week suits your schedule.`;
  };

  const scoreLeadWithAi = async (leadId: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.functions.invoke('gemini-ai', {
          body: { action: 'score_lead', lead_id: leadId }
        });
        if (!error && data?.result) {
          updateLead(leadId, {
            lead_score: data.result.lead_score,
            ai_summary: data.result.ai_summary
          });
          return data.result;
        }
      } catch (e) {
        console.warn('Falling back to local scoring rules:', e);
      }
    }

    const lead = allLeads.find((l) => l.id === leadId);
    if (!lead) throw new Error('Lead not found');

    const hasVisit = appointments.some((a) => a.lead_id === leadId && a.status === 'booked');
    const isImmediate = lead.timeline === 'Immediate' || lead.timeline === '1-2 months';
    const hasClearBudget = Boolean(lead.budget_max && lead.budget_max > 0);

    let score: 'hot' | 'warm' | 'cold' = 'warm';
    let reason = '';
    let summary = '';

    if (hasVisit || (isImmediate && hasClearBudget)) {
      score = 'hot';
      reason = 'Clear budget specified, timeline within 1-2 months, and active site visit engagement.';
      summary = `${lead.full_name} is actively looking to finalize a ${lead.property_type || 'property'} in ${lead.preferred_location || 'Kanpur'}. High purchase intent.`;
    } else if (lead.timeline === 'Browsing' || !hasClearBudget) {
      score = 'cold';
      reason = 'Vague requirements and long timeline with no visit booked.';
      summary = `Prospect is in early exploratory research phase. Requires automated drip follow-ups.`;
    } else {
      score = 'warm';
      reason = 'Clear location interest and budget defined, needs consultation to book site visit.';
      summary = `Follow up to schedule site visit for ${lead.preferred_location || 'Kanpur'} projects.`;
    }

    updateLead(leadId, { lead_score: score, ai_summary: summary });
    return { lead_score: score, reason, ai_summary: summary };
  };

  const askAiAssistant = async (question: string): Promise<string> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.functions.invoke('gemini-ai', {
          body: { action: 'chat', prompt: question }
        });
        if (!error && data?.answer) return data.answer;
      } catch (e) {
        console.warn('Fallback to local AI query processor:', e);
      }
    }

    const q = question.toLowerCase();

    // 1. Inquiries about Leads / Clients
    if (q.includes('lead') || q.includes('client') || q.includes('prospect') || q.includes('contact') || q.includes('inquir')) {
      if (allLeads.length === 0) {
        return `There are currently 0 client dossiers registered in your CRM registry. You can add client records via "+ Register New Client" or upload past client spreadsheets using "Import Excel (.xlsx)". Once added, I will track intent, timelines, and follow-up schedules in real time.`;
      }

      if (q.includes('hot')) {
        const hotLeads = allLeads.filter((l) => l.lead_score === 'hot');
        if (hotLeads.length === 0) {
          return `You currently have ${allLeads.length} client(s) on file, but none are scored as 'Hot' yet. Clients are classified as Hot when they have an immediate timeline, defined budget, or confirmed site visit.`;
        }
        return `You have ${hotLeads.length} high-intent (Hot) client(s) registered: ${hotLeads.map((l) => `${l.full_name} (${l.phone || 'No phone'}) looking for ${l.property_type || 'property'} in ${l.preferred_location || 'Kanpur'}`).join('; ')}. Immediate personal outreach is recommended.`;
      }

      if (q.includes('3 days') || q.includes('uncontacted') || q.includes('overdue')) {
        const now = Date.now();
        const uncontacted = allLeads.filter((l) => {
          if (!l.last_contact_at) return true;
          return (now - new Date(l.last_contact_at).getTime()) > 3 * 24 * 60 * 60 * 1000;
        });
        if (uncontacted.length === 0) {
          return `All ${allLeads.length} registered client(s) have been actively contacted within the last 72 hours. Your follow-up cadence is fully up to date.`;
        }
        return `${uncontacted.length} client(s) have not been contacted within the last 3 days: ${uncontacted.slice(0, 3).map((l) => `${l.full_name} (${l.phone || 'No phone'}) - Status: ${l.status}`).join('; ')}${uncontacted.length > 3 ? ` and ${uncontacted.length - 3} others.` : '.'}`;
      }

      return `Client Registry Summary: ${allLeads.length} total client dossier(s) registered (${allLeads.filter((l) => l.lead_score === 'hot').length} Hot, ${allLeads.filter((l) => l.lead_score === 'warm').length} Warm, ${allLeads.filter((l) => l.lead_score === 'cold').length} Cold). Latest registered client: ${allLeads[allLeads.length - 1].full_name}.`;
    }

    // 2. Inquiries about Portfolio / Properties in DB
    const matchingProperty = properties.find((p) =>
      q.includes(p.project_name.toLowerCase()) || (p.location && q.includes(p.location.toLowerCase()))
    );

    if (matchingProperty) {
      return `Portfolio Record for "${matchingProperty.project_name}": Located in ${matchingProperty.location}. Type: ${matchingProperty.property_type} (${matchingProperty.bhk || 'Residential'}). Carpet Area: ${matchingProperty.carpet_area ? `${matchingProperty.carpet_area} sq.ft` : 'N/A'}. Price Range: ₹${(matchingProperty.price_min / 100000).toFixed(0)} Lakhs to ₹${(matchingProperty.price_max / 100000).toFixed(0)} Lakhs. Status: ${matchingProperty.status === 'available' ? 'Active / Available' : 'Archived / Sold'}. RERA Number: ${matchingProperty.rera_number || 'Registration Pending'}. Payment Plan: ${matchingProperty.payment_plan || 'Standard Construction Linked'}.`;
    }

    if (q.includes('property') || q.includes('properties') || q.includes('project') || q.includes('estate') || q.includes('portfolio') || q.includes('inventory')) {
      if (properties.length === 0) {
        return `There are currently 0 verified estates registered in your Estate Portfolio. The AI strictly respects your portfolio as the single source of truth for pricing, RERA verification, and inventory availability. You can add active Kanpur developments under "Estate Portfolio".`;
      }
      return `Your Estate Portfolio currently contains ${properties.length} verified project(s): ${properties.map((p) => `${p.project_name} in ${p.location} (₹${(p.price_min / 100000).toFixed(0)}L – ₹${(p.price_max / 100000).toFixed(0)}L, RERA: ${p.rera_number || 'Pending'})`).join('; ')}.`;
    }

    // 3. Inquiries about Site Visits / Appointments
    if (q.includes('visit') || q.includes('walkthrough') || q.includes('appointment') || q.includes('schedule') || q.includes('booked')) {
      const booked = appointments.filter((a) => a.status === 'booked');
      if (booked.length === 0) {
        return `There are currently 0 upcoming site visits or calls scheduled. When prospects book slots on your public booking page or when an agent creates an appointment, it will appear on your calendar.`;
      }
      return `You have ${booked.length} confirmed upcoming appointment(s): ${booked.slice(0, 3).map((a) => {
        const lead = allLeads.find((l) => l.id === a.lead_id);
        const prop = properties.find((p) => p.id === a.property_id);
        const dt = new Date(a.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
        return `${a.type === 'site_visit' ? 'Site Walkthrough' : 'Consultation Call'} with ${lead?.full_name || 'Client'} for ${prop?.project_name || 'General Inquiry'} on ${dt}`;
      }).join('; ')}.`;
    }

    // 4. Inquiries about Kanpur Market Rates & Real Estate Localities (Real Internet Researched Data)
    const matchingLocality = KANPUR_LOCALITIES.find((loc) =>
      q.includes(loc.name.toLowerCase()) || q.includes(loc.id.replace('-', ' '))
    );

    if (matchingLocality) {
      return `Kanpur Real Estate Market Intelligence for ${matchingLocality.name} (${matchingLocality.zone}): Current market rates average ₹${matchingLocality.avgPricePerSqFt.toLocaleString('en-IN')}/sq.ft (Range: ₹${matchingLocality.priceRangeMin.toLocaleString('en-IN')} – ₹${matchingLocality.priceRangeMax.toLocaleString('en-IN')}/sq.ft). Official UP circle rate: ${matchingLocality.circleRateSqM} (~${matchingLocality.circleRateSqFtApprox}). 3-Year Capital Appreciation: ${matchingLocality.threeYearGrowth}. Gross Rental Yield: ${matchingLocality.rentalYield}. Key Highlights: ${matchingLocality.keyHighlights.slice(0, 2).join('; ')}.`;
    }

    if (q.includes('metro') || q.includes('airport') || q.includes('barrage') || q.includes('infrastructure')) {
      return `Kanpur Infrastructure Overview: 1) Kanpur Metro Orange Line is operational across 14 stations connecting IIT Kanpur, Kalyanpur, Moti Jheel, Chunniganj, and Kanpur Central, with underground tunnel expansion active. 2) Chakeri Civil Airport's new ₹150 Cr terminal is fully operational with daily flights to Delhi, Mumbai, Bengaluru, and Hyderabad. 3) Ganga Barrage to Mandhana 4-lane arterial road and UPSIDA Trans-Ganga City are expanding prime residential demand.`;
    }

    if (q.includes('circle rate') || q.includes('stamp duty') || q.includes('rate') || q.includes('price')) {
      return `Kanpur Real Estate Rates Overview: Civil Lines commands ₹8,500 – ₹11,500+/sq.ft (Circle rate ₹55,000–₹85,000/sq.m); Swaroop Nagar ₹6,500 – ₹22,000/sq.ft (Circle rate ₹48,000–₹68,000/sq.m); Tilak Nagar ₹8,700 – ₹12,500/sq.ft; Kalyanpur ₹3,800 – ₹5,800/sq.ft (Metro terminal hub). Official UP Stamp Duty is 7% for male buyers and 6% for female buyers (1% concession), plus 1% registration fee. You can inspect the interactive Kanpur Market Map from the sidebar for granular spatial details.`;
    }

    // Default professional operational response
    return `Estate Registry Status: ${properties.length} verified estate(s) listed in your portfolio, ${allLeads.length} active client dossier(s) on file, and ${appointments.filter((a) => a.status === 'booked').length} confirmed appointment(s) scheduled. I can assist you with lead qualification, follow-up scheduling, or live Kanpur market intelligence. How may I help?`;
  };

  const bookPublicSlot = (data: {
    fullName: string;
    phone: string;
    email: string;
    type: 'call' | 'site_visit';
    propertyId?: string;
    scheduledAt: string;
    notes?: string;
    consentGiven: boolean;
    intent?: LeadIntent;
    preferredLocation?: string;
    budgetMin?: number;
    budgetMax?: number;
    timeline?: string;
  }) => {
    if (!data.consentGiven) {
      return { success: false, error: 'DPDP consent is required to process contact information.' };
    }

    const normalized = normalizeIndianPhone(data.phone);
    let lead = allLeads.find((l) => l.phone === normalized);

    if (lead) {
      updateLead(lead.id, {
        full_name: data.fullName,
        email: data.email || lead.email,
        intent: data.intent || lead.intent || 'buy',
        preferred_location: data.preferredLocation || lead.preferred_location,
        budget_min: data.budgetMin || lead.budget_min,
        budget_max: data.budgetMax || lead.budget_max,
        timeline: data.timeline || lead.timeline,
        status: 'site_visit_booked',
        lead_score: 'hot',
        consent_given: true,
        last_contact_at: new Date().toISOString()
      });
    } else {
      lead = addLead({
        full_name: data.fullName,
        phone: normalized,
        email: data.email,
        source: 'form',
        status: 'site_visit_booked',
        lead_score: 'hot',
        intent: data.intent || 'buy',
        preferred_location: data.preferredLocation,
        budget_min: data.budgetMin,
        budget_max: data.budgetMax,
        timeline: data.timeline,
        consent_given: true,
        consent_at: new Date().toISOString(),
        notes: data.notes || 'Inquiry and walkthrough requested via Public Client Portal'
      });
    }

    const aptResult = createAppointment({
      lead_id: lead.id,
      type: data.type,
      property_id: data.propertyId,
      scheduled_at: data.scheduledAt,
      notes: data.notes
    });

    if (aptResult.conflict) {
      return { success: false, error: 'This time slot is already reserved. Please select another slot.' };
    }

    return { success: true, appointmentId: `apt-${Date.now()}` };
  };

  return (
    <CrmContext.Provider
      value={{
        currentUser,
        currentRole,
        switchUser,
        isLiveSupabase: isSupabaseConfigured,
        leads: enrichedLeads,
        allLeadsForAdmin: enrichedAllLeads,
        properties,
        appointments: enrichedAppointments,
        followups,
        activityLogs,
        settings,
        teamMembers,
        addLead,
        updateLead,
        deleteLead,
        quickUpdateStatus,
        quickUpdateScore,
        addProperty,
        updateProperty,
        archiveProperty,
        createAppointment,
        rescheduleAppointment,
        cancelAppointment,
        markFollowupDone,
        snoozeFollowup,
        getLeadMessages,
        addMessage,
        updateSettings,
        inviteTeamMember,
        removeTeamMember,
        clearAllData,
        generateFollowupDraft,
        scoreLeadWithAi,
        askAiAssistant,
        bookPublicSlot
      }}
    >
      {children}
    </CrmContext.Provider>
  );
};

export const useCrm = () => {
  const context = useContext(CrmContext);
  if (!context) throw new Error('useCrm must be used within a CrmProvider');
  return context;
};
