-- Drop broken policies that check access_grants.notes
DROP POLICY IF EXISTS "Admins can insert user subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins can update all user subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins can insert user_ai_limits" ON public.user_ai_limits;
DROP POLICY IF EXISTS "Admins can update all user_ai_limits" ON public.user_ai_limits;

-- Create correct INSERT policy for user_subscriptions
CREATE POLICY "Admins can insert user subscriptions"
ON public.user_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create correct UPDATE policy for user_subscriptions
CREATE POLICY "Admins can update all user subscriptions"
ON public.user_subscriptions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create correct INSERT policy for user_ai_limits
CREATE POLICY "Admins can insert user_ai_limits"
ON public.user_ai_limits
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create correct UPDATE policy for user_ai_limits
CREATE POLICY "Admins can update all user_ai_limits"
ON public.user_ai_limits
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));