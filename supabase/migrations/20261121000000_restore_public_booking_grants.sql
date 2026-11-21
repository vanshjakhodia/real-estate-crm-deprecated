-- Migration 20261121000000: Restore execution permissions and enable all-week booking windows
-- Fixes public booking authorization for anonymous client visitors

-- 1. Ensure anonymous and authenticated users have execution grants on public booking functions and helper checks
GRANT EXECUTE ON FUNCTION public.get_public_booked_slots(date, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.book_public_appointment(text, text, text, text, uuid, timestamptz, text, boolean, text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO anon, authenticated, service_role;

-- 2. Ensure anonymous and authenticated users can view public properties and business settings
GRANT SELECT ON public.properties TO anon, authenticated, service_role;
GRANT SELECT ON public.business_settings TO anon, authenticated, service_role;

-- 3. Dedicated RLS policies for anonymous and authenticated reads
DROP POLICY IF EXISTS properties_public_read ON public.properties;
DROP POLICY IF EXISTS properties_anon_read ON public.properties;
CREATE POLICY properties_anon_read ON public.properties
  FOR SELECT TO anon
  USING (status = 'available');

CREATE POLICY properties_public_read ON public.properties
  FOR SELECT TO authenticated
  USING (
    status = 'available'
    OR auth.uid() IN (
      SELECT ur.user_id FROM public.user_roles ur WHERE ur.role IN ('admin', 'agent')
    )
  );

DROP POLICY IF EXISTS business_settings_public_read ON public.business_settings;
DROP POLICY IF EXISTS business_settings_anon_read ON public.business_settings;
CREATE POLICY business_settings_anon_read ON public.business_settings
  FOR SELECT TO anon
  USING (company_name = 'Lineage Properties Pvt Ltd');

CREATE POLICY business_settings_public_read ON public.business_settings
  FOR SELECT TO authenticated
  USING (
    company_name = 'Lineage Properties Pvt Ltd'
    OR auth.uid() IN (
      SELECT ur.user_id FROM public.user_roles ur WHERE ur.role IN ('admin', 'agent')
    )
  );

-- 4. Update business settings to support appointments Monday through Sunday (10:00 to 20:00)
UPDATE public.business_settings
SET
  working_hours_start = '10:00',
  working_hours_end = '20:00',
  working_days = ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  company_name = 'Lineage Properties Pvt Ltd',
  updated_at = now();

-- 5. Update book_public_appointment function with full Sunday coverage and fallback hours
CREATE OR REPLACE FUNCTION public.book_public_appointment(
  p_full_name text,
  p_phone text,
  p_email text,
  p_type text,
  p_property_id uuid DEFAULT NULL,
  p_scheduled_at timestamptz DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_consent_given boolean DEFAULT false,
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
  v_start := time '09:00';
  v_end := time '21:00';
  v_days := ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  SELECT bs.working_hours_start::time, bs.working_hours_end::time, bs.working_days
  INTO v_start, v_end, v_days
  FROM public.business_settings bs
  ORDER BY bs.updated_at DESC
  LIMIT 1;

  IF NOT FOUND OR v_days IS NULL OR array_length(v_days, 1) IS NULL THEN
    v_start := time '09:00';
    v_end := time '21:00';
    v_days := ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  END IF;

  -- Ensure Sunday is always allowed for client consultations
  IF NOT ('Sun' = ANY(v_days)) THEN
    v_days := array_append(v_days, 'Sun');
  END IF;

  IF btrim(to_char(v_local_date, 'Dy')) <> ALL(v_days)
     OR v_local::time < v_start
     OR v_local::time + interval '30 minutes' > v_end THEN
    RETURN jsonb_build_object('success', false, 'error', 'Choose a time during published appointment hours.');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_local_date::text, 0));
  IF EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.status = 'booked'
      AND (p_property_id IS NULL OR a.property_id = p_property_id)
      AND a.scheduled_at = p_scheduled_at
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'That time is no longer available. Choose another slot.');
  END IF;

  SELECT ur.user_id INTO v_assigned_to FROM public.user_roles ur WHERE ur.role = 'agent' ORDER BY random() LIMIT 1;
  IF v_assigned_to IS NULL THEN
    SELECT ur.user_id INTO v_assigned_to FROM public.user_roles ur WHERE ur.role = 'admin' ORDER BY ur.created_at LIMIT 1;
  END IF;
  SELECT l.id INTO v_lead_id FROM public.leads l WHERE l.phone = v_phone ORDER BY l.created_at DESC LIMIT 1 FOR UPDATE;

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
      status = 'site_visit_booked', lead_score = 'hot', consent_given = true,
      consent_at = COALESCE(consent_at, now()), last_contact_at = now()
    WHERE id = v_lead_id;
  END IF;

  INSERT INTO public.appointments (lead_id, type, property_id, scheduled_at, status, notes)
  VALUES (v_lead_id, p_type, p_property_id, p_scheduled_at, 'booked', NULLIF(trim(COALESCE(p_notes, '')), ''))
  RETURNING id INTO v_appointment_id;

  INSERT INTO public.activity_log (lead_id, action, details)
  VALUES (v_lead_id, 'public_booking_created', jsonb_build_object('appointment_id', v_appointment_id, 'type', p_type, 'scheduled_at', p_scheduled_at));

  RETURN jsonb_build_object('success', true, 'appointment_id', v_appointment_id, 'scheduled_at', p_scheduled_at);
END;
$$;

-- 6. Update get_public_booked_slots function
CREATE OR REPLACE FUNCTION public.get_public_booked_slots(
  p_date date,
  p_property_id uuid DEFAULT NULL
)
RETURNS TABLE (scheduled_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT a.scheduled_at
  FROM public.appointments a
  WHERE a.status = 'booked'
    AND a.scheduled_at::date = p_date
    AND (p_property_id IS NULL OR a.property_id = p_property_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_booked_slots(date, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.book_public_appointment(text, text, text, text, uuid, timestamptz, text, boolean, text, text, text) TO anon, authenticated, service_role;
