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
