-- Allow admins to view all access grants
DROP POLICY IF EXISTS "Admins can view all access grants" ON public.access_grants;
CREATE POLICY "Admins can view all access grants"
  ON public.access_grants
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all messages (for analytics)
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins can view all messages"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));