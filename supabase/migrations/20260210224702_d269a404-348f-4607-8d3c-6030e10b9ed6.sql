
-- Tighten insert policy to service role only
DROP POLICY "Service role can insert inbound replies" ON public.inbound_email_replies;
CREATE POLICY "Service role can insert inbound replies"
  ON public.inbound_email_replies
  FOR INSERT
  WITH CHECK ((SELECT (auth.jwt() ->> 'role'::text)) = 'service_role'::text);
