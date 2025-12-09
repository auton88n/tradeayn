-- Drop the overly permissive service role policy
DROP POLICY IF EXISTS "Service role can insert messages" ON public.ticket_messages;

-- Create a more restrictive policy that validates sender_type = 'ai_bot'
CREATE POLICY "Service role can insert AI bot messages only"
ON public.ticket_messages
FOR INSERT
TO service_role
WITH CHECK (sender_type = 'ai_bot'::ticket_sender_type);