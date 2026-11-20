-- ====================================================================
-- PHASE 1: CORE CRM SCHEMA, RLS & RPC (Kanpur Prime Realty CRM)
-- ====================================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Profiles table (tied to Supabase Auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('admin', 'agent')),
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Business Settings table
create table if not exists public.business_settings (
  id uuid primary key default gen_random_uuid(),
  company_name text not null default 'Kanpur Prime Realty',
  city text not null default 'Kanpur',
  working_hours_start text not null default '10:00',
  working_hours_end text not null default '18:00',
  working_days text[] not null default array['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ai_tone text not null default 'Professional, warm, proactive',
  ai_language text not null default 'Hinglish',
  updated_at timestamptz not null default now()
);

-- 4. Properties table (Single source of truth)
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  project_name text not null,
  location text not null,
  property_type text not null,
  bhk text,
  carpet_area numeric,
  price_min numeric not null,
  price_max numeric not null,
  payment_plan text,
  rera_number text,
  brochure_url text,
  status text not null default 'available' check (status in ('available', 'sold_out')),
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Leads table
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('instagram', 'manual', 'form', 'import')),
  ig_handle text,
  full_name text not null,
  phone text not null,
  email text,
  intent text check (intent in ('buy', 'rent', 'invest')),
  property_type text,
  preferred_location text,
  budget_min numeric,
  budget_max numeric,
  timeline text,
  lead_score text not null default 'warm' check (lead_score in ('hot', 'warm', 'cold')),
  status text not null default 'new' check (status in ('new', 'contacted', 'site_visit_booked', 'negotiation', 'won', 'lost')),
  assigned_to uuid references public.profiles(id) on delete set null,
  consent_given boolean not null default false,
  consent_at timestamptz,
  ai_summary text,
  notes text,
  last_contact_at timestamptz,
  next_followup_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Messages table (Multi-channel communication)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  direction text not null check (direction in ('in', 'out')),
  channel text not null check (channel in ('instagram', 'whatsapp', 'email', 'manual')),
  sender text not null check (sender in ('lead', 'ai', 'agent')),
  content text not null,
  created_at timestamptz not null default now()
);

-- 7. Appointments table
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  type text not null check (type in ('call', 'site_visit')),
  property_id uuid references public.properties(id) on delete set null,
  scheduled_at timestamptz not null,
  status text not null default 'booked' check (status in ('booked', 'completed', 'cancelled', 'no_show')),
  reminder_sent_24h boolean not null default false,
  reminder_sent_1h boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. Followups table
create table if not exists public.followups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  step_number integer not null default 1,
  channel text not null default 'email',
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'sent', 'skipped', 'failed')),
  template_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. Activity Log table (Audit & DPDP tracking)
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ====================================================================
-- INDEXES FOR HIGH-PERFORMANCE QUERYING & FILTERING
-- ====================================================================
create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_lead_score on public.leads(lead_score);
create index if not exists idx_leads_assigned_to on public.leads(assigned_to);
create index if not exists idx_leads_phone on public.leads(phone);
create index if not exists idx_leads_ig_handle on public.leads(ig_handle);
create index if not exists idx_leads_created_at on public.leads(created_at desc);
create index if not exists idx_leads_next_followup on public.leads(next_followup_at);

create index if not exists idx_messages_lead_id on public.messages(lead_id);
create index if not exists idx_messages_created_at on public.messages(created_at asc);

create index if not exists idx_appointments_lead_id on public.appointments(lead_id);
create index if not exists idx_appointments_scheduled_at on public.appointments(scheduled_at);
create index if not exists idx_appointments_property_id on public.appointments(property_id);
create index if not exists idx_appointments_status on public.appointments(status);

create index if not exists idx_properties_status on public.properties(status);
create index if not exists idx_properties_location on public.properties(location);

create index if not exists idx_followups_lead_id on public.followups(lead_id);
create index if not exists idx_followups_scheduled_for on public.followups(scheduled_for);
create index if not exists idx_followups_status on public.followups(status);

create index if not exists idx_activity_log_lead_id on public.activity_log(lead_id);
create index if not exists idx_activity_log_created_at on public.activity_log(created_at desc);

-- ====================================================================
-- RLS FUNCTIONS & HELPER DEFINITIONS (Avoiding Recursion)
-- ====================================================================

-- Function to get current user role without triggering RLS recursively
create or replace function public.get_current_role()
returns text
language sql
security definer
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(public.get_current_role() = 'admin', false);
$$;

-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.business_settings enable row level security;
alter table public.properties enable row level security;
alter table public.leads enable row level security;
alter table public.messages enable row level security;
alter table public.appointments enable row level security;
alter table public.followups enable row level security;
alter table public.activity_log enable row level security;

-- ====================================================================
-- ROW LEVEL SECURITY POLICIES
-- ====================================================================

-- PROFILES:
create policy "Users can view their own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can insert/update/delete profiles"
  on public.profiles for all
  using (public.is_admin());

-- BUSINESS SETTINGS:
create policy "Authenticated users can read business settings"
  on public.business_settings for select
  using (auth.role() = 'authenticated');

create policy "Admins can update business settings"
  on public.business_settings for update
  using (public.is_admin());

-- PROPERTIES:
create policy "Authenticated users and public can view properties"
  on public.properties for select
  using (true);

create policy "Admins can insert/update/delete properties"
  on public.properties for all
  using (public.is_admin());

-- LEADS:
-- Admin sees all leads
create policy "Admins can do everything with leads"
  on public.leads for all
  using (public.is_admin());

-- Agents see only their assigned leads
create policy "Agents can view assigned leads"
  on public.leads for select
  using (assigned_to = auth.uid());

create policy "Agents can update assigned leads"
  on public.leads for update
  using (assigned_to = auth.uid());

create policy "Agents can insert new manual leads"
  on public.leads for insert
  with check (auth.role() = 'authenticated');

-- MESSAGES:
create policy "Admins can view all messages"
  on public.messages for all
  using (public.is_admin());

create policy "Agents can view and insert messages for assigned leads"
  on public.messages for select
  using (
    exists (
      select 1 from public.leads
      where leads.id = messages.lead_id and leads.assigned_to = auth.uid()
    )
  );

create policy "Agents can insert messages for assigned leads"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.leads
      where leads.id = messages.lead_id and leads.assigned_to = auth.uid()
    )
  );

-- APPOINTMENTS:
create policy "Admins can manage all appointments"
  on public.appointments for all
  using (public.is_admin());

create policy "Agents can view and update appointments for assigned leads"
  on public.appointments for select
  using (
    exists (
      select 1 from public.leads
      where leads.id = appointments.lead_id and leads.assigned_to = auth.uid()
    )
  );

create policy "Agents can insert appointments for assigned leads"
  on public.appointments for insert
  with check (
    exists (
      select 1 from public.leads
      where leads.id = appointments.lead_id and leads.assigned_to = auth.uid()
    )
  );

create policy "Agents can update their lead appointments"
  on public.appointments for update
  using (
    exists (
      select 1 from public.leads
      where leads.id = appointments.lead_id and leads.assigned_to = auth.uid()
    )
  );

-- FOLLOWUPS:
create policy "Admins can manage all followups"
  on public.followups for all
  using (public.is_admin());

create policy "Agents can view followups for assigned leads"
  on public.followups for select
  using (
    exists (
      select 1 from public.leads
      where leads.id = followups.lead_id and leads.assigned_to = auth.uid()
    )
  );

create policy "Agents can update followups for assigned leads"
  on public.followups for update
  using (
    exists (
      select 1 from public.leads
      where leads.id = followups.lead_id and leads.assigned_to = auth.uid()
    )
  );

-- ACTIVITY LOG:
create policy "Admins can view all activity logs"
  on public.activity_log for all
  using (public.is_admin());

create policy "Agents can view activity logs for assigned leads"
  on public.activity_log for select
  using (
    lead_id is null or exists (
      select 1 from public.leads
      where leads.id = activity_log.lead_id and leads.assigned_to = auth.uid()
    )
  );

create policy "Authenticated users can insert activity logs"
  on public.activity_log for insert
  with check (auth.role() = 'authenticated');

-- ====================================================================
-- TRIGGERS: AUTO PROFILE CREATION & UPDATED_AT
-- ====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  user_count int;
begin
  select count(*) into user_count from public.profiles;
  -- If it's the very first user registered, designate them as Admin. Subsequent are Agents by default.
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when user_count = 0 then 'admin' else coalesce(new.raw_user_meta_data->>'role', 'agent') end
  );
  return new;
end;
$$;

-- Drop existing trigger if any, then recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger for auto updating updated_at timestamp
create or replace function public.update_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger update_profiles_timestamp before update on public.profiles
for each row execute function public.update_timestamp();

create or replace trigger update_leads_timestamp before update on public.leads
for each row execute function public.update_timestamp();

create or replace trigger update_properties_timestamp before update on public.properties
for each row execute function public.update_timestamp();

create or replace trigger update_appointments_timestamp before update on public.appointments
for each row execute function public.update_timestamp();

create or replace trigger update_followups_timestamp before update on public.followups
for each row execute function public.update_timestamp();

-- ====================================================================
-- RPC FUNCTIONS: PUBLIC BOOKING & CONFLICT DETECTION
-- ====================================================================

-- Function to check appointment collision (within 45-minute window for same property or agent)
create or replace function public.check_appointment_conflict(
  p_scheduled_at timestamptz,
  p_property_id uuid default null,
  p_exclude_id uuid default null
)
returns table (
  has_conflict boolean,
  conflicting_appointment_id uuid,
  conflict_time timestamptz
)
language plpgsql
security definer
as $$
begin
  return query
  select
    true as has_conflict,
    a.id as conflicting_appointment_id,
    a.scheduled_at as conflict_time
  from public.appointments a
  where a.status in ('booked')
    and (p_exclude_id is null or a.id <> p_exclude_id)
    and (p_property_id is null or a.property_id = p_property_id)
    and a.scheduled_at >= (p_scheduled_at - interval '40 minutes')
    and a.scheduled_at <= (p_scheduled_at + interval '40 minutes')
  limit 1;

  if not found then
    return query select false, null::uuid, null::timestamptz;
  end if;
end;
$$;

-- Security Definer RPC for Public Booking Page (No login needed)
create or replace function public.book_public_appointment(
  p_full_name text,
  p_phone text,
  p_email text,
  p_type text,
  p_property_id uuid,
  p_scheduled_at timestamptz,
  p_notes text,
  p_consent_given boolean
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_normalized_phone text;
  v_lead_id uuid;
  v_appointment_id uuid;
  v_conflict_count int;
  v_random_agent uuid;
begin
  -- Validate basic inputs
  if p_full_name is null or trim(p_full_name) = '' then
    raise exception 'Full name is required';
  end if;

  if p_phone is null or trim(p_phone) = '' then
    raise exception 'Phone number is required';
  end if;

  if not p_consent_given then
    raise exception 'Consent to contact is required under DPDP regulations';
  end if;

  -- Normalize Indian Phone number (+91 format)
  v_normalized_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
  if length(v_normalized_phone) = 10 then
    v_normalized_phone := '+91' || v_normalized_phone;
  elsif length(v_normalized_phone) = 12 and v_normalized_phone like '91%' then
    v_normalized_phone := '+' || v_normalized_phone;
  elsif not v_normalized_phone like '+%' then
    v_normalized_phone := '+' || v_normalized_phone;
  end if;

  -- Check conflict
  select count(*) into v_conflict_count
  from public.appointments
  where status = 'booked'
    and (p_property_id is null or property_id = p_property_id)
    and scheduled_at >= (p_scheduled_at - interval '40 minutes')
    and scheduled_at <= (p_scheduled_at + interval '40 minutes');

  if v_conflict_count > 0 then
    return jsonb_build_object(
      'success', false,
      'error', 'This time slot was just booked by another visitor. Please select another slot.'
    );
  end if;

  -- Select an active agent to assign (round-robin / least loaded)
  select id into v_random_agent
  from public.profiles
  where role = 'agent'
  order by random()
  limit 1;

  -- If no agent found, assign to an admin
  if v_random_agent is null then
    select id into v_random_agent
    from public.profiles
    where role = 'admin'
    limit 1;
  end if;

  -- Check if lead exists by phone
  select id into v_lead_id
  from public.leads
  where phone = v_normalized_phone
  limit 1;

  if v_lead_id is not null then
    -- Update existing lead
    update public.leads set
      full_name = coalesce(p_full_name, full_name),
      email = coalesce(p_email, email),
      status = 'site_visit_booked',
      lead_score = 'hot',
      consent_given = true,
      consent_at = coalesce(consent_at, now()),
      last_contact_at = now()
    where id = v_lead_id;
  else
    -- Insert new lead
    insert into public.leads (
      source,
      full_name,
      phone,
      email,
      intent,
      lead_score,
      status,
      assigned_to,
      consent_given,
      consent_at,
      last_contact_at,
      notes
    ) values (
      'form',
      p_full_name,
      v_normalized_phone,
      p_email,
      'buy',
      'hot',
      'site_visit_booked',
      v_random_agent,
      true,
      now(),
      now(),
      coalesce(p_notes, 'Booked via public portal')
    )
    returning id into v_lead_id;
  end if;

  -- Create appointment
  insert into public.appointments (
    lead_id,
    type,
    property_id,
    scheduled_at,
    status,
    notes
  ) values (
    v_lead_id,
    p_type,
    p_property_id,
    p_scheduled_at,
    'booked',
    coalesce(p_notes, 'Public booking')
  )
  returning id into v_appointment_id;

  -- Log action
  insert into public.activity_log (
    lead_id,
    action,
    details
  ) values (
    v_lead_id,
    'public_booking_created',
    jsonb_build_object(
      'appointment_id', v_appointment_id,
      'type', p_type,
      'scheduled_at', p_scheduled_at,
      'phone', v_normalized_phone
    )
  );

  return jsonb_build_object(
    'success', true,
    'lead_id', v_lead_id,
    'appointment_id', v_appointment_id,
    'scheduled_at', p_scheduled_at
  );
end;
$$;
