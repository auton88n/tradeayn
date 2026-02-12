
-- Fix RLS: Replace permissive "true" policies with service-role-only write access
-- These tables are only written to by edge functions (service role bypasses RLS)
-- So we just need admin SELECT policies (already created) and can drop the overly permissive ones

DROP POLICY "Service role full access on employee_states" ON public.employee_states;
DROP POLICY "Service role full access on employee_reflections" ON public.employee_reflections;
DROP POLICY "Service role full access on employee_discussions" ON public.employee_discussions;
DROP POLICY "Service role full access on company_objectives" ON public.company_objectives;
DROP POLICY "Service role full access on service_economics" ON public.service_economics;
DROP POLICY "Service role full access on company_state" ON public.company_state;
DROP POLICY "Service role full access on company_journal" ON public.company_journal;

-- Admin can manage objectives and economics (CRUD for admin)
CREATE POLICY "Admins can manage company_objectives"
  ON public.company_objectives FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage service_economics"
  ON public.service_economics FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage company_state"
  ON public.company_state FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage company_journal"
  ON public.company_journal FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
