
DROP POLICY "Service role can insert analyses" ON public.chart_analyses;

CREATE POLICY "Authenticated users can insert own analyses"
  ON public.chart_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);
