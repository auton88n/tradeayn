-- Add admin SELECT policy for user_subscriptions
CREATE POLICY "Admins can select all user subscriptions"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin SELECT policy for user_ai_limits
CREATE POLICY "Admins can select all user_ai_limits"
ON public.user_ai_limits
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));