-- Security Hardening Migration: Restrict public reads on properties and business_settings

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

COMMENT ON FUNCTION public.get_public_booked_slots(date, uuid) IS 'Public appointment availability: returns only scheduled_at timestamps; masks all client and internal appointment data.';
COMMENT ON FUNCTION public.book_public_appointment(text, text, text, text, uuid, timestamptz, text, boolean, text, text, text) IS 'Public appointment reservation: securely inserts appointment and lead without exposing private customer or role records.';
