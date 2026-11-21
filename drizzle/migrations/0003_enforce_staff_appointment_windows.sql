CREATE OR REPLACE FUNCTION public.appointment_time_is_valid(p_scheduled_at timestamptz)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_local timestamp without time zone;
  v_local_date date;
  v_start time;
  v_end time;
  v_days text[];
BEGIN
  IF p_scheduled_at IS NULL OR p_scheduled_at <= now() THEN
    RETURN false;
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
  RETURN btrim(to_char(v_local_date, 'Dy')) = ANY(v_days)
    AND v_local::time >= v_start
    AND v_local::time + interval '30 minutes' <= v_end;
END;
$$;
REVOKE ALL ON FUNCTION public.appointment_time_is_valid(timestamptz) FROM PUBLIC, anon, authenticated;

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
  IF p_type NOT IN ('call', 'site_visit') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Choose a valid appointment type.');
  END IF;
  IF NOT public.appointment_time_is_valid(p_scheduled_at) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Choose a future time during the firm’s appointment hours.');
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
  IF v_appointment.status <> 'booked' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only booked appointments can be rescheduled.');
  END IF;
  SELECT l.assigned_to INTO v_assigned_to FROM public.leads l WHERE l.id = v_appointment.lead_id;
  IF NOT public.has_role(auth.uid(), 'admin') AND v_assigned_to IS DISTINCT FROM auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Appointment not found or access denied.');
  END IF;
  IF NOT public.appointment_time_is_valid(p_scheduled_at) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Choose a future time during the firm’s appointment hours.');
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

CREATE INDEX IF NOT EXISTS activity_log_user_created_idx ON public.activity_log(user_id, created_at DESC);