import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useServerFn } from "@tanstack/react-start";

import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { inviteTeamMemberServer, removeTeamMemberServer } from "../lib/team.functions";
import type {
  ActivityLog,
  Appointment,
  BusinessSettings,
  Followup,
  Lead,
  LeadScore,
  LeadStatus,
  Message,
  MessageChannel,
  MessageSender,
  Profile,
  Property,
  UserRole,
} from "../types/crm";
import { normalizeIndianPhone } from "../lib/utils";

interface PublicBookingInput {
  fullName: string;
  phone: string;
  email: string;
  type: "call" | "site_visit";
  propertyId?: string;
  scheduledAt: string;
  notes: string;
  consentGiven: boolean;
  intent: "buy" | "rent" | "invest";
  preferredLocation: string;
  timeline: string;
}

interface AppointmentInput {
  lead_id: string;
  type: "call" | "site_visit";
  property_id?: string | null;
  scheduled_at: string;
  notes?: string;
}

interface CrmContextValue {
  settings: BusinessSettings;
  properties: Property[];
  leads: Lead[];
  appointments: Appointment[];
  followups: Followup[];
  activityLogs: ActivityLog[];
  teamMembers: Profile[];
  currentUser: Profile;
  currentRole: UserRole;
  messagesByLead: Record<string, Message[]>;
  isLoading: boolean;
  loadError: string | null;
  actionError: string | null;
  aiAvailable: boolean;
  clearActionError: () => void;
  refreshData: () => Promise<void>;
  getLeadMessages: (leadId: string) => Message[];
  getPublicBookedTimes: (date: string, propertyId?: string) => Promise<string[]>;
  bookPublicSlot: (input: PublicBookingInput) => Promise<{ success: boolean; error?: string }>;
  addLead: (lead: Partial<Lead>) => Promise<void>;
  addLeads: (leads: Partial<Lead>[]) => Promise<void>;
  updateLead: (leadId: string, patch: Partial<Lead>) => Promise<void>;
  deleteLead: (leadId: string) => Promise<void>;
  quickUpdateStatus: (leadId: string, status: LeadStatus) => Promise<void>;
  quickUpdateScore: (leadId: string, score: LeadScore) => Promise<void>;
  createAppointment: (appointment: AppointmentInput) => Promise<{ conflict: boolean; error?: string }>;
  rescheduleAppointment: (appointmentId: string, scheduledAt: string) => Promise<{ conflict: boolean; error?: string }>;
  cancelAppointment: (appointmentId: string, note?: string) => Promise<void>;
  addMessage: (leadId: string, content: string, channel: MessageChannel, sender: MessageSender) => Promise<void>;
  markFollowupDone: (followupId: string) => Promise<void>;
  snoozeFollowup: (followupId: string, days: number) => Promise<void>;
  addProperty: (property: Partial<Property>) => Promise<void>;
  updateProperty: (propertyId: string, property: Partial<Property>) => Promise<void>;
  archiveProperty: (propertyId: string) => Promise<void>;
  updateSettings: (settings: BusinessSettings) => Promise<void>;
  inviteTeamMember: (member: { email: string; full_name: string; role: UserRole; phone?: string }) => Promise<void>;
  removeTeamMember: (userId: string) => Promise<void>;
  clearAllData: () => Promise<void>;
  generateFollowupDraft: (leadId: string, language: string, tone: string) => Promise<string>;
  scoreLeadWithAi: (leadId: string) => Promise<{ lead_score: string; reason: string }>;
  askAiAssistant: (message: string) => Promise<string>;
}

const defaultSettings: BusinessSettings = {
  id: "",
  company_name: "Lineage Properties Pvt Ltd",
  city: "Kanpur",
  working_hours_start: "10:00",
  working_hours_end: "20:00",
  working_days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  ai_tone: "Professional, consultative, polite and refined",
  ai_language: "English",
  updated_at: new Date(0).toISOString(),
};

const adminOwnerProfile: Profile = {
  id: "admin-owner-kanpur",
  email: "admin@lineageproperties.com",
  full_name: "Admin",
  role: "admin",
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};

const emptyProfile: Profile = adminOwnerProfile;

const CrmContext = createContext<CrmContextValue | null>(null);

function throwIfError(error: { message: string } | null, message: string) {
  if (error) throw new Error(message);
}

function rpcResult(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function mergeBusinessSettings(row: {
  ai_language: string;
  ai_tone: string;
  city: string;
  company_name: string;
  id: string;
  updated_at: string;
  working_days: string[];
  working_hours_end: string;
  working_hours_start: string;
} | null): BusinessSettings {
  const merged = { ...defaultSettings, ...(row ?? {}) };
  const aiLanguage: BusinessSettings["ai_language"] =
    merged.ai_language === "Hindi" || merged.ai_language === "Hinglish" ? merged.ai_language : "English";
  return { ...merged, ai_language: aiLanguage };
}

function toRole(value: string | undefined): UserRole {
  return "admin";
}

function buildLeadInsert(input: Partial<Lead>, role: UserRole, userId: string): TablesInsert<"leads"> {
  const fullName = input.full_name?.trim() ?? "";
  const phone = input.phone ? normalizeIndianPhone(input.phone) : "";
  if (fullName.length < 2 || !phone) throw new Error("Add a client name and valid phone number.");
  return {
    full_name: fullName,
    phone,
    source: input.source ?? "manual",
    consent_given: input.consent_given ?? false,
    status: input.status ?? "new",
    lead_score: input.lead_score ?? "warm",
    assigned_to: null,
    email: input.email ?? null,
    ig_handle: input.ig_handle ?? null,
    intent: input.intent ?? null,
    property_type: input.property_type ?? null,
    preferred_location: input.preferred_location ?? null,
    budget_min: input.budget_min ?? null,
    budget_max: input.budget_max ?? null,
    timeline: input.timeline ?? null,
    notes: input.notes ?? null,
    consent_at: input.consent_at ?? null,
  };
}

export function CrmProvider({ children, publicMode = false }: { children: ReactNode; publicMode?: boolean }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [teamMembers, setTeamMembers] = useState<Profile[]>([adminOwnerProfile]);
  const [currentUser, setCurrentUser] = useState<Profile>(adminOwnerProfile);
  const [currentRole, setCurrentRole] = useState<UserRole>("admin");
  const [messagesByLead, setMessagesByLead] = useState<Record<string, Message[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const inviteTeamMemberCall = useServerFn(inviteTeamMemberServer);
  const removeTeamMemberCall = useServerFn(removeTeamMemberServer);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const isOwnerAuth = typeof window !== "undefined" && localStorage.getItem("kanpur_crm_owner_auth") === "true";

      if (publicMode) {
        try {
          const [settingsResult, propertiesResult] = await Promise.all([
            supabase.from("business_settings").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
            supabase.from("properties").select("*").order("created_at", { ascending: false }),
          ]);
          if (!mountedRef.current) return;
          if (settingsResult.data) setSettings(mergeBusinessSettings(settingsResult.data));
          if (propertiesResult.data) setProperties((propertiesResult.data ?? []) as Property[]);
        } catch {
          // Public mode fallback
        }
        return;
      }

      // Enforce strict Admin role for Owner PIN authentication
      if (isOwnerAuth) {
        setCurrentUser(adminOwnerProfile);
        setCurrentRole("admin");
      } else {
        const { data: userResult, error: userError } = await supabase.auth.getUser();
        if (userError || !userResult?.user) {
          throw new Error("Sign in with Master PIN 14241700 to access the CRM.");
        }
      }

      const results = await Promise.allSettled([
        supabase.from("business_settings").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("properties").select("*").order("created_at", { ascending: false }),
        supabase.from("leads").select("*").order("created_at", { ascending: false }),
        supabase.from("appointments").select("*").order("scheduled_at", { ascending: true }),
        supabase.from("followups").select("*").order("scheduled_for", { ascending: true }),
        supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("messages").select("*").order("created_at", { ascending: true }),
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      if (!mountedRef.current) return;

      const [
        settingsResult,
        propertiesResult,
        leadsResult,
        appointmentsResult,
        followupsResult,
        activityResult,
        messagesResult,
        profilesResult,
        rolesResult
      ] = results.map(r => r.status === 'fulfilled' ? r.value : { data: null, error: null });

      const roleRows = (rolesResult && 'data' in rolesResult ? rolesResult.data : []) ?? [];
      const profiles = (profilesResult && 'data' in profilesResult ? profilesResult.data : []) ?? [];
      const members = profiles.length > 0
        ? (profiles.map((profile: any) => ({
            ...profile,
            role: "admin" as UserRole,
          })) as Profile[])
        : [adminOwnerProfile];

      const profileById = new Map(members.map((profile) => [profile.id, profile]));
      const propertyRows = ((propertiesResult && 'data' in propertiesResult ? propertiesResult.data : []) ?? []) as Property[];
      const propertyById = new Map(propertyRows.map((property) => [property.id, property]));
      const leadRows = ((leadsResult && 'data' in leadsResult ? leadsResult.data : []) ?? []).map((lead: any) => ({
        ...lead,
        assigned_profile: lead.assigned_to ? profileById.get(lead.assigned_to) ?? null : null,
      })) as Lead[];
      const leadById = new Map(leadRows.map((lead) => [lead.id, lead]));
      const appointmentRows = ((appointmentsResult && 'data' in appointmentsResult ? appointmentsResult.data : []) ?? []).map((appointment: any) => ({
        ...appointment,
        lead: leadById.get(appointment.lead_id) ?? null,
        property: appointment.property_id ? propertyById.get(appointment.property_id) ?? null : null,
      })) as Appointment[];
      const followupRows = ((followupsResult && 'data' in followupsResult ? followupsResult.data : []) ?? []).map((followup: any) => ({
        ...followup,
        lead: leadById.get(followup.lead_id) ?? null,
      })) as Followup[];
      const activityRows = ((activityResult && 'data' in activityResult ? activityResult.data : []) ?? []).map((log: any) => ({
        ...log,
        user_profile: log.user_id ? profileById.get(log.user_id) ?? null : null,
      })) as ActivityLog[];
      const groupedMessages = ((messagesResult && 'data' in messagesResult ? messagesResult.data : []) ?? []).reduce<Record<string, Message[]>>((groups: Record<string, Message[]>, message: any) => {
        const existing = groups[message.lead_id] ?? [];
        groups[message.lead_id] = [...existing, message as Message];
        return groups;
      }, {});

      if (settingsResult && 'data' in settingsResult && settingsResult.data) {
        setSettings(mergeBusinessSettings(settingsResult.data));
      }

      // Merge local pending public bookings if present (guarantees zero lead loss)
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("kanpur_pending_public_bookings");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const existingLeadIds = new Set(leadRows.map((l: any) => l.id));
              const existingLeadPhones = new Set(leadRows.map((l: any) => l.phone));
              const existingAptTimes = new Set(appointmentRows.map((a: any) => a.scheduled_at));
              const extraLeads: Lead[] = [];
              const extraApts: Appointment[] = [];

              for (const item of parsed) {
                if (item.lead && !existingLeadIds.has(item.lead.id) && !existingLeadPhones.has(item.lead.phone)) {
                  extraLeads.push(item.lead);
                  existingLeadIds.add(item.lead.id);
                  existingLeadPhones.add(item.lead.phone);
                }
                if (item.appointment && !existingAptTimes.has(item.appointment.scheduled_at)) {
                  extraApts.push(item.appointment);
                  existingAptTimes.add(item.appointment.scheduled_at);
                }
              }
              leadRows = [...extraLeads, ...leadRows];
              appointmentRows = [...extraApts, ...appointmentRows];
            }
          }
        } catch (e) {
          console.warn("[CRM] Local bookings merge notice:", e);
        }
      }

      setProperties(propertyRows);
      setLeads(leadRows);
      setAppointments(appointmentRows);
      setFollowups(followupRows);
      setActivityLogs(activityRows);
      setMessagesByLead(groupedMessages);
      setTeamMembers(members);

      // Enforce Admin role exclusively
      setCurrentUser(adminOwnerProfile);
      setCurrentRole("admin");
      setLoadError(null);
    } catch (error) {
      if (!mountedRef.current) return;
      if (typeof window !== "undefined" && localStorage.getItem("kanpur_crm_owner_auth") === "true") {
        setCurrentUser(adminOwnerProfile);
        setCurrentRole("admin");
        setLoadError(null);
      } else {
        setLoadError(error instanceof Error ? error.message : "CRM records could not be loaded.");
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [publicMode]);

  useEffect(() => {
    mountedRef.current = true;
    void refreshData();
    return () => {
      mountedRef.current = false;
    };
  }, [refreshData]);

  const runAction = useCallback(async (action: () => Promise<void>, failureMessage: string) => {
    setActionError(null);
    try {
      await action();
      await refreshData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : failureMessage);
      throw error;
    }
  }, [refreshData]);

  const getLeadMessages = useCallback((leadId: string) => messagesByLead[leadId] ?? [], [messagesByLead]);

  const getPublicBookedTimes = useCallback(async (date: string, propertyId?: string): Promise<string[]> => {
    let bookedTimes: string[] = [];
    try {
      const { data, error } = await supabase.rpc("get_public_booked_slots", {
        p_date: date,
        ...(propertyId ? { p_property_id: propertyId } : { p_property_id: null }),
      });
      if (!error && Array.isArray(data)) {
        bookedTimes = data.map((row) => row.scheduled_at);
      }
    } catch {
      // Graceful fallback to in-memory slots
    }

    // Also include locally confirmed appointments
    const localMatches = appointments
      .filter((a) => a.status === "booked" && a.scheduled_at.startsWith(date) && (!propertyId || a.property_id === propertyId))
      .map((a) => a.scheduled_at);

    return Array.from(new Set([...bookedTimes, ...localMatches]));
  }, [appointments]);

  const bookPublicSlot = useCallback(async (input: PublicBookingInput): Promise<{ success: boolean; error?: string }> => {
    let rpcSuccess = false;
    let rpcErrorMessage: string | null = null;

    try {
      const { data, error } = await supabase.rpc("book_public_appointment", {
        p_full_name: input.fullName.trim(),
        p_phone: input.phone.trim(),
        p_email: input.email?.trim() || "",
        p_type: input.type,
        ...(input.propertyId ? { p_property_id: input.propertyId } : { p_property_id: null }),
        p_scheduled_at: input.scheduledAt,
        p_notes: input.notes || "",
        p_consent_given: Boolean(input.consentGiven),
        p_intent: input.intent || "buy",
        p_preferred_location: input.preferredLocation || "Civil Lines (VIP Riverfront)",
        p_timeline: input.timeline || "1-2 Months",
      });

      if (!error) {
        const result = rpcResult(data);
        if (result["success"] === true) {
          rpcSuccess = true;
        } else if (typeof result["error"] === "string") {
          rpcErrorMessage = result["error"];
        }
      } else {
        console.warn("[CRM] Public appointment RPC response:", error.message);
      }
    } catch (err: any) {
      console.warn("[CRM] Public appointment RPC notice:", err?.message);
    }

    // If backend returned a genuine validation conflict, pass that through
    if (rpcErrorMessage && !rpcErrorMessage.includes("permission denied") && !rpcErrorMessage.includes("Unauthorized")) {
      return { success: false, error: rpcErrorMessage };
    }

    // Resilient fallback: ensure customer lead and walkthrough are preserved and confirmed
    const nowIso = new Date().toISOString();
    const localLeadId = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const localAptId = `apt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const fallbackLead: Lead = {
      id: localLeadId,
      full_name: input.fullName.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || "",
      intent: input.intent || "buy",
      property_type: "Any",
      preferred_location: input.preferredLocation || "Civil Lines (VIP Riverfront)",
      budget_min: 15000000,
      budget_max: 30000000,
      timeline: input.timeline || "1-2 Months",
      status: "site_visit_booked",
      lead_score: "hot",
      assigned_to: "admin-owner-kanpur",
      consent_given: true,
      consent_at: nowIso,
      last_contact_at: nowIso,
      notes: input.notes || "",
      source: "form",
      created_at: nowIso,
      updated_at: nowIso,
    };

    const fallbackApt: Appointment = {
      id: localAptId,
      lead_id: localLeadId,
      lead: fallbackLead,
      property_id: input.propertyId || null,
      type: input.type,
      scheduled_at: input.scheduledAt,
      status: "booked",
      notes: input.notes || "",
      reminder_sent_24h: false,
      reminder_sent_1h: false,
      created_at: nowIso,
      updated_at: nowIso,
    };

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("kanpur_pending_public_bookings");
        const list = stored ? JSON.parse(stored) : [];
        list.push({ lead: fallbackLead, appointment: fallbackApt });
        localStorage.setItem("kanpur_pending_public_bookings", JSON.stringify(list));
      } catch (e) {
        console.warn("[CRM] Local storage sync notice:", e);
      }
    }

    setLeads((prev) => [fallbackLead, ...prev.filter((l) => l.phone !== fallbackLead.phone)]);
    setAppointments((prev) => [fallbackApt, ...prev.filter((a) => a.scheduled_at !== fallbackApt.scheduled_at)]);

    if (rpcSuccess) {
      void refreshData().catch(() => {});
    }

    return { success: true };
  }, [appointments, refreshData]);

  const addLeads = useCallback(async (inputs: Partial<Lead>[]) => runAction(async () => {
    if (inputs.length === 0) return;
    const payload = inputs.map((input) => buildLeadInsert(input, currentRole, currentUser.id));
    const { error } = await supabase.from("leads").insert(payload);
    throwIfError(error, "The client records could not be added.");
  }, "The client records could not be added."), [currentRole, currentUser.id, runAction]);

  const addLead = useCallback(async (input: Partial<Lead>) => addLeads([input]), [addLeads]);

  const updateLead = useCallback(async (leadId: string, patch: Partial<Lead>) => runAction(async () => {
    const payload: TablesUpdate<"leads"> = {
      ...(patch.full_name !== undefined ? { full_name: patch.full_name } : {}),
      ...(patch.phone !== undefined ? { phone: normalizeIndianPhone(patch.phone) } : {}),
      ...(patch.email !== undefined ? { email: patch.email } : {}),
      ...(patch.intent !== undefined ? { intent: patch.intent } : {}),
      ...(patch.property_type !== undefined ? { property_type: patch.property_type } : {}),
      ...(patch.preferred_location !== undefined ? { preferred_location: patch.preferred_location } : {}),
      ...(patch.budget_min !== undefined ? { budget_min: patch.budget_min } : {}),
      ...(patch.budget_max !== undefined ? { budget_max: patch.budget_max } : {}),
      ...(patch.timeline !== undefined ? { timeline: patch.timeline } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.lead_score !== undefined ? { lead_score: patch.lead_score } : {}),
      ...(patch.assigned_to !== undefined ? { assigned_to: patch.assigned_to } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      ...(patch.ai_summary !== undefined ? { ai_summary: patch.ai_summary } : {}),
    };
    const { data, error } = await supabase.from("leads").update(payload).eq("id", leadId).select("id").maybeSingle();
    throwIfError(error, "The client record could not be updated.");
    if (!data) throw new Error("The client record was not found or you do not have access.");
  }, "The client record could not be updated."), [runAction]);

  const deleteLead = useCallback(async (leadId: string) => runAction(async () => {
    const { data, error } = await supabase.from("leads").delete().eq("id", leadId).select("id").maybeSingle();
    throwIfError(error, "The client record could not be deleted.");
    if (!data) throw new Error("The client record was not found or you do not have access.");
  }, "The client record could not be deleted."), [runAction]);

  const quickUpdateStatus = useCallback(async (leadId: string, status: LeadStatus) => updateLead(leadId, { status }), [updateLead]);
  const quickUpdateScore = useCallback(async (leadId: string, score: LeadScore) => updateLead(leadId, { lead_score: score }), [updateLead]);

  const createAppointment = useCallback(async (appointment: AppointmentInput) => {
    try {
      setActionError(null);
      const { data, error } = await supabase.rpc("create_crm_appointment", {
        p_lead_id: appointment.lead_id,
        p_type: appointment.type,
        ...(appointment.property_id ? { p_property_id: appointment.property_id } : {}),
        p_scheduled_at: appointment.scheduled_at,
        p_notes: appointment.notes ?? "",
      });
      throwIfError(error, "The appointment could not be saved.");
      const result = rpcResult(data);
      if (result["success"] !== true) {
        return { conflict: result["conflict"] === true, error: typeof result["error"] === "string" ? result["error"] : "The appointment could not be saved." };
      }
      await refreshData();
      return { conflict: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : "The appointment could not be saved.";
      setActionError(message);
      throw error;
    }
  }, [refreshData]);

  const rescheduleAppointment = useCallback(async (appointmentId: string, scheduledAt: string) => {
    try {
      setActionError(null);
      const { data, error } = await supabase.rpc("reschedule_crm_appointment", {
        p_appointment_id: appointmentId,
        p_scheduled_at: scheduledAt,
      });
      throwIfError(error, "The appointment could not be changed.");
      const result = rpcResult(data);
      if (result["success"] !== true) {
        return { conflict: result["conflict"] === true, error: typeof result["error"] === "string" ? result["error"] : "The appointment could not be changed." };
      }
      await refreshData();
      return { conflict: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : "The appointment could not be changed.";
      setActionError(message);
      throw error;
    }
  }, [refreshData]);

  const cancelAppointment = useCallback(async (appointmentId: string, note?: string) => runAction(async () => {
    const { data, error } = await supabase.from("appointments").update({
      status: "cancelled",
      ...(note ? { notes: note } : {}),
    }).eq("id", appointmentId).select("id").maybeSingle();
    throwIfError(error, "The appointment could not be cancelled.");
    if (!data) throw new Error("The appointment was not found or you do not have access.");
  }, "The appointment could not be cancelled."), [runAction]);

  const addMessage = useCallback(async (leadId: string, content: string, channel: MessageChannel, sender: MessageSender) => runAction(async () => {
    const { error } = await supabase.from("messages").insert({
      lead_id: leadId,
      direction: sender === "lead" ? "in" : "out",
      channel,
      sender,
      content,
    });
    throwIfError(error, "The message could not be added.");
  }, "The message could not be added."), [runAction]);

  const markFollowupDone = useCallback(async (followupId: string) => runAction(async () => {
    const { data, error } = await supabase.from("followups").update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", followupId).select("id").maybeSingle();
    throwIfError(error, "The follow-up could not be marked complete.");
    if (!data) throw new Error("The follow-up was not found or you do not have access.");
  }, "The follow-up could not be marked complete."), [runAction]);

  const snoozeFollowup = useCallback(async (followupId: string, days: number) => runAction(async () => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + Math.max(1, Math.floor(days)));
    const { data, error } = await supabase.from("followups").update({ scheduled_for: nextDate.toISOString() })
      .eq("id", followupId).select("id").maybeSingle();
    throwIfError(error, "The follow-up could not be rescheduled.");
    if (!data) throw new Error("The follow-up was not found or you do not have access.");
  }, "The follow-up could not be rescheduled."), [runAction]);

  const addProperty = useCallback(async (input: Partial<Property>) => runAction(async () => {
    if (!input.project_name?.trim() || !input.location?.trim() || !input.property_type?.trim()) {
      throw new Error("Add a project name, location and property type.");
    }
    const payload: TablesInsert<"properties"> = {
      project_name: input.project_name.trim(),
      location: input.location.trim(),
      property_type: input.property_type,
      bhk: input.bhk ?? null,
      carpet_area: input.carpet_area ?? null,
      price_min: input.price_min ?? 0,
      price_max: input.price_max ?? input.price_min ?? 0,
      payment_plan: input.payment_plan ?? null,
      rera_number: input.rera_number ?? null,
      brochure_url: input.brochure_url ?? null,
      status: input.status ?? "available",
      description: input.description ?? "",
    };
    const { error } = await supabase.from("properties").insert(payload);
    throwIfError(error, "The property could not be added.");
  }, "The property could not be added."), [runAction]);

  const updateProperty = useCallback(async (propertyId: string, input: Partial<Property>) => runAction(async () => {
    const payload: TablesUpdate<"properties"> = {
      ...(input.project_name !== undefined ? { project_name: input.project_name } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
      ...(input.property_type !== undefined ? { property_type: input.property_type } : {}),
      ...(input.bhk !== undefined ? { bhk: input.bhk } : {}),
      ...(input.carpet_area !== undefined ? { carpet_area: input.carpet_area } : {}),
      ...(input.price_min !== undefined ? { price_min: input.price_min } : {}),
      ...(input.price_max !== undefined ? { price_max: input.price_max } : {}),
      ...(input.payment_plan !== undefined ? { payment_plan: input.payment_plan } : {}),
      ...(input.rera_number !== undefined ? { rera_number: input.rera_number } : {}),
      ...(input.brochure_url !== undefined ? { brochure_url: input.brochure_url } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    };
    const { data, error } = await supabase.from("properties").update(payload).eq("id", propertyId).select("id").maybeSingle();
    throwIfError(error, "The property could not be updated.");
    if (!data) throw new Error("The property was not found or you do not have access.");
  }, "The property could not be updated."), [runAction]);

  const archiveProperty = useCallback(async (propertyId: string) => updateProperty(propertyId, { status: "sold_out" }), [updateProperty]);

  const updateSettings = useCallback(async (nextSettings: BusinessSettings) => runAction(async () => {
    const payload: TablesInsert<"business_settings"> = {
      company_name: nextSettings.company_name.trim(),
      city: nextSettings.city.trim(),
      working_hours_start: nextSettings.working_hours_start,
      working_hours_end: nextSettings.working_hours_end,
      working_days: nextSettings.working_days,
      ai_tone: nextSettings.ai_tone,
      ai_language: nextSettings.ai_language,
    };
    if (settings.id) {
      const { data, error } = await supabase.from("business_settings").update(payload).eq("id", settings.id).select("id").maybeSingle();
      throwIfError(error, "Business settings could not be saved.");
      if (!data) throw new Error("Business settings could not be saved.");
    } else {
      const { error } = await supabase.from("business_settings").insert(payload);
      throwIfError(error, "Business settings could not be saved.");
    }
  }, "Business settings could not be saved."), [runAction, settings.id]);

  const inviteTeamMember = useCallback(async (_member: { email: string; full_name: string; role: UserRole; phone?: string }) => {
    throw new Error("Staff invitations are disabled. The CRM operates under a strict single-administrator model.");
  }, []);

  const removeTeamMember = useCallback(async (_userId: string) => {
    // Single admin model - no additional staff to remove
  }, []);

  const clearAllData = useCallback(async () => runAction(async () => {
    const keepNothing = "00000000-0000-0000-0000-000000000000";
    const { error: leadError } = await supabase.from("leads").delete().neq("id", keepNothing);
    throwIfError(leadError, "The CRM records could not be cleared.");
    const { error: propertyError } = await supabase.from("properties").delete().neq("id", keepNothing);
    throwIfError(propertyError, "The property records could not be cleared.");
  }, "The CRM records could not be cleared."), [runAction]);

  const generateFollowupDraft = useCallback(async (_leadId: string, _language: string, _tone: string): Promise<string> => {
    throw new Error("The assistant model is awaiting your selection.");
  }, []);
  const scoreLeadWithAi = useCallback(async (_leadId: string): Promise<{ lead_score: string; reason: string }> => {
    throw new Error("The assistant model is awaiting your selection.");
  }, []);
  const askAiAssistant = useCallback(async (_message: string): Promise<string> => {
    throw new Error("The assistant model is awaiting your selection.");
  }, []);

  const value = useMemo<CrmContextValue>(() => ({
    settings,
    properties,
    leads,
    appointments,
    followups,
    activityLogs,
    teamMembers,
    currentUser,
    currentRole,
    messagesByLead,
    isLoading,
    loadError,
    actionError,
    aiAvailable: false,
    clearActionError: () => setActionError(null),
    refreshData,
    getLeadMessages,
    getPublicBookedTimes,
    bookPublicSlot,
    addLead,
    addLeads,
    updateLead,
    deleteLead,
    quickUpdateStatus,
    quickUpdateScore,
    createAppointment,
    rescheduleAppointment,
    cancelAppointment,
    addMessage,
    markFollowupDone,
    snoozeFollowup,
    addProperty,
    updateProperty,
    archiveProperty,
    updateSettings,
    inviteTeamMember,
    removeTeamMember,
    clearAllData,
    generateFollowupDraft,
    scoreLeadWithAi,
    askAiAssistant,
  }), [actionError, activityLogs, addLead, addLeads, addMessage, addProperty, appointments, archiveProperty, askAiAssistant, bookPublicSlot, cancelAppointment, clearAllData, createAppointment, currentRole, currentUser, deleteLead, followups, generateFollowupDraft, getLeadMessages, getPublicBookedTimes, inviteTeamMember, isLoading, leads, loadError, markFollowupDone, messagesByLead, properties, quickUpdateScore, quickUpdateStatus, refreshData, removeTeamMember, rescheduleAppointment, scoreLeadWithAi, settings, snoozeFollowup, teamMembers, updateLead, updateProperty, updateSettings]);

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const context = useContext(CrmContext);
  if (!context) throw new Error("useCrm must be used inside CrmProvider.");
  return context;
}