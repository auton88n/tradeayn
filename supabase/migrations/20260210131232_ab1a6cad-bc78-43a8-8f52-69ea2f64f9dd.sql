
-- Fix permissive RLS: restrict service-level inserts to AI-generated replies only
DROP POLICY "Service role can insert replies" ON public.support_ticket_replies;

-- Allow inserts only for admins (service role bypasses RLS anyway)
CREATE POLICY "Admins can insert ticket replies"
ON public.support_ticket_replies
FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
