
-- Fix 1: alert_history - drop the redundant permissive service_role INSERT policy
-- The other policy "Only service role can insert alerts" already handles this correctly
DROP POLICY IF EXISTS "alert_history_service_insert" ON public.alert_history;

-- Fix 2: error_logs - replace "Anyone can insert" with authenticated-only insert
-- Client-side error logging should still work but only for logged-in users
DROP POLICY IF EXISTS "Anyone can insert errors" ON public.error_logs;

CREATE POLICY "Authenticated users can insert errors"
  ON public.error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also add anon block for error_logs
CREATE POLICY "Block anonymous error_logs access"
  ON public.error_logs
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Fix 3: agent_telegram_bots - add admin-only policies
CREATE POLICY "Admins can select agent_telegram_bots"
  ON public.agent_telegram_bots
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert agent_telegram_bots"
  ON public.agent_telegram_bots
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update agent_telegram_bots"
  ON public.agent_telegram_bots
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete agent_telegram_bots"
  ON public.agent_telegram_bots
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Block anonymous agent_telegram_bots"
  ON public.agent_telegram_bots
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);
