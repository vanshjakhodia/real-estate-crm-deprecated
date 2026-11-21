CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'agent')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = _role
  );
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated, service_role;

CREATE POLICY user_roles_read_self_or_admin ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  phone text,
  legacy_user_id uuid UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, phone) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_read_self_or_admin ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY profiles_update_self_or_admin ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.business_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'Lineage Properties Pvt Ltd',
  city text NOT NULL DEFAULT 'Kanpur',
  working_hours_start text NOT NULL DEFAULT '10:00',
  working_hours_end text NOT NULL DEFAULT '18:00',
  working_days text[] NOT NULL DEFAULT ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ai_tone text NOT NULL DEFAULT 'Professional, warm, proactive',
  ai_language text NOT NULL DEFAULT 'Hinglish' CHECK (ai_language IN ('English', 'Hindi', 'Hinglish')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.business_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.business_settings TO authenticated;
GRANT ALL ON public.business_settings TO service_role;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_settings_public_read ON public.business_settings
  FOR SELECT TO anon, authenticated
  USING (
    company_name = 'Lineage Properties Pvt Ltd'
    OR (
      auth.uid() IS NOT NULL
      AND (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'agent')
      )
    )
  );
CREATE POLICY business_settings_admin_write ON public.business_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text NOT NULL,
  location text NOT NULL,
  property_type text NOT NULL,
  bhk text,
  carpet_area numeric,
  price_min numeric NOT NULL DEFAULT 0,
  price_max numeric NOT NULL DEFAULT 0,
  payment_plan text,
  rera_number text,
  brochure_url text,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold_out')),
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.properties TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY properties_public_read ON public.properties
  FOR SELECT TO anon, authenticated
  USING (
    status = 'available'
    OR (
      auth.uid() IS NOT NULL
      AND (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'agent')
      )
    )
  );
CREATE POLICY properties_admin_write ON public.properties
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('instagram', 'manual', 'form', 'import')),
  ig_handle text,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  intent text CHECK (intent IN ('buy', 'rent', 'invest')),
  property_type text,
  preferred_location text,
  budget_min numeric,
  budget_max numeric,
  timeline text,
  lead_score text NOT NULL DEFAULT 'warm' CHECK (lead_score IN ('hot', 'warm', 'cold')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'site_visit_booked', 'negotiation', 'won', 'lost')),
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  consent_given boolean NOT NULL DEFAULT false,
  consent_at timestamptz,
  ai_summary text,
  notes text,
  last_contact_at timestamptz,
  next_followup_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('in', 'out')),
  channel text NOT NULL CHECK (channel IN ('instagram', 'whatsapp', 'email', 'manual')),
  sender text NOT NULL CHECK (sender IN ('lead', 'ai', 'agent')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('call', 'site_visit')),
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'completed', 'cancelled', 'no_show')),
  reminder_sent_24h boolean NOT NULL DEFAULT false,
  reminder_sent_1h boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  step_number integer NOT NULL DEFAULT 1,
  channel text NOT NULL DEFAULT 'email',
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'skipped', 'failed')),
  template_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.followups TO authenticated;
GRANT ALL ON public.followups TO service_role;
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY leads_admin_all ON public.leads
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY leads_agent_read_assigned ON public.leads
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'agent') AND assigned_to = auth.uid());
CREATE POLICY leads_agent_insert_self ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'agent') AND assigned_to = auth.uid());
CREATE POLICY leads_agent_update_self ON public.leads
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'agent') AND assigned_to = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'agent') AND assigned_to = auth.uid());

CREATE POLICY messages_admin_all ON public.messages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY messages_agent_read_assigned ON public.messages
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'agent') AND EXISTS (
    SELECT 1 FROM public.leads l WHERE l.id = messages.lead_id AND l.assigned_to = auth.uid()
  ));
CREATE POLICY messages_agent_insert_assigned ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'agent') AND EXISTS (
    SELECT 1 FROM public.leads l WHERE l.id = messages.lead_id AND l.assigned_to = auth.uid()
  ));

CREATE POLICY appointments_admin_all ON public.appointments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY appointments_agent_read_assigned ON public.appointments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'agent') AND EXISTS (
    SELECT 1 FROM public.leads l WHERE l.id = appointments.lead_id AND l.assigned_to = auth.uid()
  ));
CREATE POLICY appointments_agent_update_assigned ON public.appointments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'agent') AND EXISTS (
    SELECT 1 FROM public.leads l WHERE l.id = appointments.lead_id AND l.assigned_to = auth.uid()
  ))
  WITH CHECK (public.has_role(auth.uid(), 'agent') AND EXISTS (
    SELECT 1 FROM public.leads l WHERE l.id = appointments.lead_id AND l.assigned_to = auth.uid()
  ));

CREATE POLICY followups_admin_all ON public.followups
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY followups_agent_read_assigned ON public.followups
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'agent') AND EXISTS (
    SELECT 1 FROM public.leads l WHERE l.id = followups.lead_id AND l.assigned_to = auth.uid()
  ));
CREATE POLICY followups_agent_update_assigned ON public.followups
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'agent') AND EXISTS (
    SELECT 1 FROM public.leads l WHERE l.id = followups.lead_id AND l.assigned_to = auth.uid()
  ))
  WITH CHECK (public.has_role(auth.uid(), 'agent') AND EXISTS (
    SELECT 1 FROM public.leads l WHERE l.id = followups.lead_id AND l.assigned_to = auth.uid()
  ));

CREATE POLICY activity_admin_read ON public.activity_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY activity_agent_read_assigned ON public.activity_log
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'agent') AND (
      (lead_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.leads l WHERE l.id = activity_log.lead_id AND l.assigned_to = auth.uid()
      )) OR (lead_id IS NULL AND user_id = auth.uid())
    )
  );
CREATE POLICY activity_staff_insert_self ON public.activity_log
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'))
  );

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER profiles_touch_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER business_settings_touch_updated_at BEFORE UPDATE ON public.business_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER properties_touch_updated_at BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER leads_touch_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER appointments_touch_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER followups_touch_updated_at BEFORE UPDATE ON public.followups
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(92081006);
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), split_part(COALESCE(NEW.email, ''), '@', 1)),
    NULLIF(NEW.raw_user_meta_data ->> 'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE INDEX leads_status_idx ON public.leads(status);
CREATE INDEX leads_score_idx ON public.leads(lead_score);
CREATE INDEX leads_assigned_to_idx ON public.leads(assigned_to);
CREATE INDEX leads_phone_idx ON public.leads(phone);
CREATE INDEX leads_created_at_idx ON public.leads(created_at DESC);
CREATE INDEX leads_next_followup_idx ON public.leads(next_followup_at);
CREATE INDEX messages_lead_created_idx ON public.messages(lead_id, created_at);
CREATE INDEX appointments_lead_idx ON public.appointments(lead_id);
CREATE INDEX appointments_time_status_idx ON public.appointments(scheduled_at, status);
CREATE INDEX appointments_property_idx ON public.appointments(property_id);
CREATE INDEX followups_lead_idx ON public.followups(lead_id);
CREATE INDEX followups_due_idx ON public.followups(scheduled_for, status);
CREATE INDEX activity_lead_created_idx ON public.activity_log(lead_id, created_at DESC);
CREATE INDEX properties_location_status_idx ON public.properties(location, status);

CREATE OR REPLACE FUNCTION public.get_public_booked_slots(p_date date, p_property_id uuid DEFAULT NULL)
RETURNS TABLE (scheduled_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT a.scheduled_at
  FROM public.appointments a
  WHERE a.status = 'booked'
    AND (p_property_id IS NULL OR a.property_id = p_property_id)
    AND (a.scheduled_at AT TIME ZONE 'Asia/Kolkata')::date = p_date
  ORDER BY a.scheduled_at;
$$;
REVOKE ALL ON FUNCTION public.get_public_booked_slots(date, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_booked_slots(date, uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.book_public_appointment(
  p_full_name text,
  p_phone text,
  p_email text,
  p_type text,
  p_property_id uuid,
  p_scheduled_at timestamptz,
  p_notes text,
  p_consent_given boolean,
  p_intent text DEFAULT 'buy',
  p_preferred_location text DEFAULT NULL,
  p_timeline text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_digits text;
  v_phone text;
  v_lead_id uuid;
  v_appointment_id uuid;
  v_assigned_to uuid;
  v_local timestamp without time zone;
  v_local_date date;
  v_start time;
  v_end time;
  v_days text[];
BEGIN
  IF p_full_name IS NULL OR length(trim(p_full_name)) < 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Enter your full name.');
  END IF;
  IF NOT p_consent_given THEN
    RETURN jsonb_build_object('success', false, 'error', 'Consent is required before booking.');
  END IF;
  IF p_type NOT IN ('call', 'site_visit') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Choose a valid appointment type.');
  END IF;
  IF p_intent NOT IN ('buy', 'rent', 'invest') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Choose a valid inquiry type.');
  END IF;
  IF p_scheduled_at IS NULL OR p_scheduled_at <= now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Choose a future appointment time.');
  END IF;
  IF p_property_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.properties p WHERE p.id = p_property_id AND p.status = 'available'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'That property is no longer available.');
  END IF;

  v_digits := regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g');
  IF length(v_digits) = 10 THEN
    v_phone := '+91' || v_digits;
  ELSIF length(v_digits) = 11 AND left(v_digits, 1) = '0' THEN
    v_phone := '+91' || right(v_digits, 10);
  ELSIF length(v_digits) = 12 AND left(v_digits, 2) = '91' THEN
    v_phone := '+' || v_digits;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Enter a valid Indian mobile number.');
  END IF;
  IF v_phone !~ '^\+91[6-9][0-9]{9}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Enter a valid Indian mobile number.');
  END IF;

  v_local := p_scheduled_at AT TIME ZONE 'Asia/Kolkata';
  v_local_date := v_local::date;
  v_start := time '10:00';
  v_end := time '18:00';
  v_days := ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  SELECT bs.working_hours_start::time, bs.working_hours_end::time, bs.working_days
  INTO v_start, v_end, v_days
  FROM public.business_settings bs
  ORDER BY bs.updated_at DESC
  LIMIT 1;
  IF NOT FOUND THEN
    v_start := time '10:00';
    v_end := time '18:00';
    v_days := ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  END IF;
  IF btrim(to_char(v_local_date, 'Dy')) <> ALL(v_days)
     OR v_local::time < v_start
     OR v_local::time + interval '30 minutes' > v_end THEN
    RETURN jsonb_build_object('success', false, 'error', 'Choose a time during the published appointment hours.');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_local_date::text, 0));
  IF EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.status = 'booked'
      AND (p_property_id IS NULL OR a.property_id = p_property_id)
      AND a.scheduled_at BETWEEN p_scheduled_at - interval '40 minutes' AND p_scheduled_at + interval '40 minutes'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'That time is no longer available. Choose another slot.');
  END IF;

  SELECT ur.user_id INTO v_assigned_to
  FROM public.user_roles ur
  WHERE ur.role = 'agent'
  ORDER BY random()
  LIMIT 1;
  IF v_assigned_to IS NULL THEN
    SELECT ur.user_id INTO v_assigned_to
    FROM public.user_roles ur
    WHERE ur.role = 'admin'
    ORDER BY ur.created_at
    LIMIT 1;
  END IF;

  SELECT l.id INTO v_lead_id
  FROM public.leads l
  WHERE l.phone = v_phone
  ORDER BY l.created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_lead_id IS NULL THEN
    INSERT INTO public.leads (
      source, full_name, phone, email, intent, preferred_location, timeline,
      lead_score, status, assigned_to, consent_given, consent_at, last_contact_at, notes
    ) VALUES (
      'form', trim(p_full_name), v_phone, NULLIF(trim(COALESCE(p_email, '')), ''), p_intent,
      NULLIF(trim(COALESCE(p_preferred_location, '')), ''), NULLIF(trim(COALESCE(p_timeline, '')), ''),
      'hot', 'site_visit_booked', v_assigned_to, true, now(), now(), NULLIF(trim(COALESCE(p_notes, '')), '')
    ) RETURNING id INTO v_lead_id;
  ELSE
    UPDATE public.leads SET
      full_name = trim(p_full_name),
      email = COALESCE(NULLIF(trim(COALESCE(p_email, '')), ''), email),
      intent = p_intent,
      preferred_location = COALESCE(NULLIF(trim(COALESCE(p_preferred_location, '')), ''), preferred_location),
      timeline = COALESCE(NULLIF(trim(COALESCE(p_timeline, '')), ''), timeline),
      status = 'site_visit_booked',
      lead_score = 'hot',
      consent_given = true,
      consent_at = COALESCE(consent_at, now()),
      last_contact_at = now()
    WHERE id = v_lead_id;
  END IF;

  INSERT INTO public.appointments (lead_id, type, property_id, scheduled_at, status, notes)
  VALUES (v_lead_id, p_type, p_property_id, p_scheduled_at, 'booked', NULLIF(trim(COALESCE(p_notes, '')), ''))
  RETURNING id INTO v_appointment_id;

  INSERT INTO public.activity_log (lead_id, action, details)
  VALUES (v_lead_id, 'public_booking_created', jsonb_build_object(
    'appointment_id', v_appointment_id,
    'type', p_type,
    'scheduled_at', p_scheduled_at
  ));

  RETURN jsonb_build_object('success', true, 'appointment_id', v_appointment_id, 'scheduled_at', p_scheduled_at);
END;
$$;
REVOKE ALL ON FUNCTION public.book_public_appointment(text, text, text, text, uuid, timestamptz, text, boolean, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.book_public_appointment(text, text, text, text, uuid, timestamptz, text, boolean, text, text, text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.create_crm_appointment(
  p_lead_id uuid,
  p_type text,
  p_property_id uuid,
  p_scheduled_at timestamptz,
  p_notes text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_assigned_to uuid;
  v_appointment_id uuid;
  v_local_date date;
BEGIN
  IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent')) THEN
    RAISE EXCEPTION 'Staff access required.';
  END IF;
  IF p_type NOT IN ('call', 'site_visit') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Choose a valid appointment type.');
  END IF;
  SELECT l.assigned_to INTO v_assigned_to FROM public.leads l WHERE l.id = p_lead_id;
  IF NOT FOUND OR (NOT public.has_role(auth.uid(), 'admin') AND v_assigned_to <> auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lead not found or access denied.');
  END IF;
  IF p_property_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.properties p WHERE p.id = p_property_id AND p.status = 'available'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'That property is no longer available.');
  END IF;
  v_local_date := (p_scheduled_at AT TIME ZONE 'Asia/Kolkata')::date;
  PERFORM pg_advisory_xact_lock(hashtextextended(v_local_date::text, 0));
  IF EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.status = 'booked'
      AND (p_property_id IS NULL OR a.property_id = p_property_id)
      AND a.scheduled_at BETWEEN p_scheduled_at - interval '40 minutes' AND p_scheduled_at + interval '40 minutes'
  ) THEN
    RETURN jsonb_build_object('success', false, 'conflict', true, 'error', 'Another appointment is scheduled within 40 minutes.');
  END IF;
  INSERT INTO public.appointments (lead_id, type, property_id, scheduled_at, status, notes)
  VALUES (p_lead_id, p_type, p_property_id, p_scheduled_at, 'booked', NULLIF(trim(COALESCE(p_notes, '')), ''))
  RETURNING id INTO v_appointment_id;
  IF p_type = 'site_visit' THEN
    UPDATE public.leads SET status = 'site_visit_booked', lead_score = 'hot' WHERE id = p_lead_id;
  END IF;
  INSERT INTO public.activity_log (lead_id, user_id, action, details)
  VALUES (p_lead_id, auth.uid(), 'appointment_created', jsonb_build_object('appointment_id', v_appointment_id, 'type', p_type, 'scheduled_at', p_scheduled_at));
  RETURN jsonb_build_object('success', true, 'appointment_id', v_appointment_id);
END;
$$;
REVOKE ALL ON FUNCTION public.create_crm_appointment(uuid, text, uuid, timestamptz, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_crm_appointment(uuid, text, uuid, timestamptz, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.reschedule_crm_appointment(p_appointment_id uuid, p_scheduled_at timestamptz)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_appointment public.appointments%ROWTYPE;
  v_assigned_to uuid;
  v_local_date date;
BEGIN
  IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent')) THEN
    RAISE EXCEPTION 'Staff access required.';
  END IF;
  SELECT a.* INTO v_appointment FROM public.appointments a WHERE a.id = p_appointment_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Appointment not found.');
  END IF;
  SELECT l.assigned_to INTO v_assigned_to FROM public.leads l WHERE l.id = v_appointment.lead_id;
  IF NOT public.has_role(auth.uid(), 'admin') AND v_assigned_to <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Appointment not found or access denied.');
  END IF;
  v_local_date := (p_scheduled_at AT TIME ZONE 'Asia/Kolkata')::date;
  PERFORM pg_advisory_xact_lock(hashtextextended(v_local_date::text, 0));
  IF EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id <> p_appointment_id
      AND a.status = 'booked'
      AND (v_appointment.property_id IS NULL OR a.property_id = v_appointment.property_id)
      AND a.scheduled_at BETWEEN p_scheduled_at - interval '40 minutes' AND p_scheduled_at + interval '40 minutes'
  ) THEN
    RETURN jsonb_build_object('success', false, 'conflict', true, 'error', 'Another appointment is scheduled within 40 minutes.');
  END IF;
  UPDATE public.appointments SET scheduled_at = p_scheduled_at WHERE id = p_appointment_id;
  INSERT INTO public.activity_log (lead_id, user_id, action, details)
  VALUES (v_appointment.lead_id, auth.uid(), 'appointment_rescheduled', jsonb_build_object('appointment_id', p_appointment_id, 'scheduled_at', p_scheduled_at));
  RETURN jsonb_build_object('success', true);
END;
$$;
REVOKE ALL ON FUNCTION public.reschedule_crm_appointment(uuid, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reschedule_crm_appointment(uuid, timestamptz) TO authenticated, service_role;
