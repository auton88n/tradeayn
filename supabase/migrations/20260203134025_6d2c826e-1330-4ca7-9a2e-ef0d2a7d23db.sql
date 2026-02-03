-- Add RLS policy to allow admins to INSERT into user_subscriptions
CREATE POLICY "Admins can insert user subscriptions"
ON public.user_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM access_grants
    WHERE access_grants.user_id = auth.uid()
    AND access_grants.is_active = true
    AND (
      access_grants.notes ILIKE '%admin%' 
      OR access_grants.notes ILIKE '%duty%'
    )
  )
);

-- Add RLS policy to allow admins to UPDATE user_subscriptions for any user
CREATE POLICY "Admins can update all user subscriptions"
ON public.user_subscriptions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM access_grants
    WHERE access_grants.user_id = auth.uid()
    AND access_grants.is_active = true
    AND (
      access_grants.notes ILIKE '%admin%' 
      OR access_grants.notes ILIKE '%duty%'
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM access_grants
    WHERE access_grants.user_id = auth.uid()
    AND access_grants.is_active = true
    AND (
      access_grants.notes ILIKE '%admin%' 
      OR access_grants.notes ILIKE '%duty%'
    )
  )
);

-- Also ensure admins can UPSERT into user_ai_limits
CREATE POLICY "Admins can insert user_ai_limits"
ON public.user_ai_limits
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM access_grants
    WHERE access_grants.user_id = auth.uid()
    AND access_grants.is_active = true
    AND (
      access_grants.notes ILIKE '%admin%' 
      OR access_grants.notes ILIKE '%duty%'
    )
  )
);

CREATE POLICY "Admins can update all user_ai_limits"
ON public.user_ai_limits
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM access_grants
    WHERE access_grants.user_id = auth.uid()
    AND access_grants.is_active = true
    AND (
      access_grants.notes ILIKE '%admin%' 
      OR access_grants.notes ILIKE '%duty%'
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM access_grants
    WHERE access_grants.user_id = auth.uid()
    AND access_grants.is_active = true
    AND (
      access_grants.notes ILIKE '%admin%' 
      OR access_grants.notes ILIKE '%duty%'
    )
  )
);