-- Fix policy conflict by dropping and recreating properly
DROP POLICY IF EXISTS "Only admin can insert system reports" ON public.system_reports;

-- Drop conflicting usage logs policy
DROP POLICY IF EXISTS "System functions can insert usage logs" ON public.usage_logs;

-- Create proper admin-only system reports policy  
CREATE POLICY "Admin only system reports" 
ON public.system_reports 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);