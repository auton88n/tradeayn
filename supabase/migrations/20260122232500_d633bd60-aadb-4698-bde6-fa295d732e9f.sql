-- =====================================================
-- SECURITY FIX: Remaining RLS policies
-- (handle_new_user already fixed in previous partial migration)
-- =====================================================

-- 6. Fix visitor_analytics INSERT policy - add basic validation
DROP POLICY IF EXISTS "Allow public inserts for tracking" ON public.visitor_analytics;
CREATE POLICY "Allow public inserts for tracking" 
ON public.visitor_analytics 
FOR INSERT 
WITH CHECK (
  -- Validate that basic fields exist (use correct column name: page_path)
  page_path IS NOT NULL AND length(page_path) > 0
);

-- 7. Add rate limiting for contact_messages (defense in depth)
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can insert contact messages"
ON public.contact_messages
FOR INSERT
WITH CHECK (
  check_contact_rate_limit(email)
);