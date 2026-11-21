-- ====================================================================
-- CLEAN SLATE RESET: WIPE ALL DEMO / DUMMY RECORDS
-- Run this in Supabase SQL Editor if you ever need a 100% empty database
-- ====================================================================

truncate table public.activity_log cascade;
truncate table public.followups cascade;
truncate table public.appointments cascade;
truncate table public.messages cascade;
truncate table public.leads cascade;
truncate table public.properties cascade;

-- Reset default company settings
update public.business_settings set
  company_name = 'Lineage Properties Pvt Ltd',
  city = 'Kanpur',
  working_hours_start = '10:00',
  working_hours_end = '18:00',
  ai_tone = 'Professional, warm, proactive and polite',
  ai_language = 'Hinglish',
  updated_at = now();
