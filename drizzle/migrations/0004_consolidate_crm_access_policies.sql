CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF _role NOT IN ('admin', 'agent') THEN
    RETURN false;
  END IF;
  IF auth.uid() IS NOT NULL AND _user_id IS DISTINCT FROM auth.uid() THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = _role
  );
END;
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated, service_role;
COMMENT ON FUNCTION public.has_role(uuid, text) IS 'SECURITY DEFINER: checks only the signed-in caller role, avoiding recursive role-table RLS.';

DROP POLICY IF EXISTS business_settings_admin_write ON public.business_settings;
DROP POLICY IF EXISTS business_settings_public_read ON public.business_settings;
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
CREATE POLICY business_settings_admin_insert ON public.business_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY business_settings_admin_update ON public.business_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY business_settings_admin_delete ON public.business_settings
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS properties_admin_write ON public.properties;
DROP POLICY IF EXISTS properties_public_read ON public.properties;
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
CREATE POLICY properties_admin_insert ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY properties_admin_update ON public.properties
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY properties_admin_delete ON public.properties
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS leads_admin_all ON public.leads;
DROP POLICY IF EXISTS leads_agent_read_assigned ON public.leads;
DROP POLICY IF EXISTS leads_agent_insert_self ON public.leads;
DROP POLICY IF EXISTS leads_agent_update_self ON public.leads;
CREATE POLICY leads_staff_read_assigned ON public.leads
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'agent') AND assigned_to = auth.uid()));
CREATE POLICY leads_staff_insert_assigned ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'agent') AND assigned_to = auth.uid()));
CREATE POLICY leads_staff_update_assigned ON public.leads
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'agent') AND assigned_to = auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'agent') AND assigned_to = auth.uid()));
CREATE POLICY leads_admin_delete ON public.leads
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS messages_admin_all ON public.messages;
DROP POLICY IF EXISTS messages_agent_read_assigned ON public.messages;
DROP POLICY IF EXISTS messages_agent_insert_assigned ON public.messages;
CREATE POLICY messages_staff_read_assigned ON public.messages
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    (public.has_role(auth.uid(), 'agent') AND EXISTS (
      SELECT 1 FROM public.leads l WHERE l.id = messages.lead_id AND l.assigned_to = auth.uid()
    ))
  );
CREATE POLICY messages_staff_insert_assigned ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    (public.has_role(auth.uid(), 'agent') AND EXISTS (
      SELECT 1 FROM public.leads l WHERE l.id = messages.lead_id AND l.assigned_to = auth.uid()
    ))
  );
CREATE POLICY messages_admin_update ON public.messages
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY messages_admin_delete ON public.messages
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS appointments_admin_all ON public.appointments;
DROP POLICY IF EXISTS appointments_agent_read_assigned ON public.appointments;
DROP POLICY IF EXISTS appointments_agent_update_assigned ON public.appointments;
CREATE POLICY appointments_staff_read_assigned ON public.appointments
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    (public.has_role(auth.uid(), 'agent') AND EXISTS (
      SELECT 1 FROM public.leads l WHERE l.id = appointments.lead_id AND l.assigned_to = auth.uid()
    ))
  );
CREATE POLICY appointments_staff_update_assigned ON public.appointments
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    (public.has_role(auth.uid(), 'agent') AND EXISTS (
      SELECT 1 FROM public.leads l WHERE l.id = appointments.lead_id AND l.assigned_to = auth.uid()
    ))
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    (public.has_role(auth.uid(), 'agent') AND EXISTS (
      SELECT 1 FROM public.leads l WHERE l.id = appointments.lead_id AND l.assigned_to = auth.uid()
    ))
  );
CREATE POLICY appointments_admin_delete ON public.appointments
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS followups_admin_all ON public.followups;
DROP POLICY IF EXISTS followups_agent_read_assigned ON public.followups;
DROP POLICY IF EXISTS followups_agent_update_assigned ON public.followups;
CREATE POLICY followups_staff_read_assigned ON public.followups
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    (public.has_role(auth.uid(), 'agent') AND EXISTS (
      SELECT 1 FROM public.leads l WHERE l.id = followups.lead_id AND l.assigned_to = auth.uid()
    ))
  );
CREATE POLICY followups_admin_insert ON public.followups
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY followups_staff_update_assigned ON public.followups
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    (public.has_role(auth.uid(), 'agent') AND EXISTS (
      SELECT 1 FROM public.leads l WHERE l.id = followups.lead_id AND l.assigned_to = auth.uid()
    ))
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    (public.has_role(auth.uid(), 'agent') AND EXISTS (
      SELECT 1 FROM public.leads l WHERE l.id = followups.lead_id AND l.assigned_to = auth.uid()
    ))
  );
CREATE POLICY followups_admin_delete ON public.followups
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS activity_admin_read ON public.activity_log;
DROP POLICY IF EXISTS activity_agent_read_assigned ON public.activity_log;
DROP POLICY IF EXISTS activity_staff_insert_self ON public.activity_log;
CREATE POLICY activity_staff_read_assigned ON public.activity_log
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    (public.has_role(auth.uid(), 'agent') AND (
      (lead_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.leads l WHERE l.id = activity_log.lead_id AND l.assigned_to = auth.uid()
      )) OR (lead_id IS NULL AND user_id = auth.uid())
    ))
  );
CREATE POLICY activity_staff_insert_self ON public.activity_log
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND (
      public.has_role(auth.uid(), 'admin') OR
      (public.has_role(auth.uid(), 'agent') AND (
        lead_id IS NULL OR EXISTS (
          SELECT 1 FROM public.leads l WHERE l.id = activity_log.lead_id AND l.assigned_to = auth.uid()
        )
      ))
    )
  );