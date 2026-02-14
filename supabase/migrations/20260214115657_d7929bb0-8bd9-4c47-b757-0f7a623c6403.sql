-- Add admin-only policies for service-role-only tables to satisfy the linter
-- Service role bypasses RLS, so these just prevent anon/user access (which is already the case)

CREATE POLICY "Admin read access" ON public.ayn_mind
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin read access" ON public.ayn_sales_pipeline
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin read access" ON public.competitor_tweets
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin read access" ON public.marketing_competitors
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));