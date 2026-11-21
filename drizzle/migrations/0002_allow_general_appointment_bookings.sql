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

CREATE OR REPLACE FUNCTION public.create_crm_appointment(
  p_lead_id uuid,
  p_type text,
  p_property_id uuid DEFAULT NULL,
  p_scheduled_at timestamptz DEFAULT NULL,
  p_notes text DEFAULT NULL
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
  IF p_type NOT IN ('call', 'site_visit') OR p_scheduled_at IS NULL OR p_scheduled_at <= now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Choose a future appointment time.');
  END IF;
  SELECT l.assigned_to INTO v_assigned_to FROM public.leads l WHERE l.id = p_lead_id;
  IF NOT FOUND OR (NOT public.has_role(auth.uid(), 'admin') AND v_assigned_to IS DISTINCT FROM auth.uid()) THEN
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