-- Block anonymous access to profiles table
DROP POLICY IF EXISTS "Block anonymous profiles access" ON public.profiles;
CREATE POLICY "Block anonymous profiles access"
  ON public.profiles
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Block anonymous access to alert_history table  
DROP POLICY IF EXISTS "Block anonymous alert_history access" ON public.alert_history;
CREATE POLICY "Block anonymous alert_history access"
  ON public.alert_history
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Block anonymous access to messages table
DROP POLICY IF EXISTS "Block anonymous messages access" ON public.messages;
CREATE POLICY "Block anonymous messages access"
  ON public.messages
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Block anonymous access to user_settings table
DROP POLICY IF EXISTS "Block anonymous user_settings access" ON public.user_settings;
CREATE POLICY "Block anonymous user_settings access"
  ON public.user_settings
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Block anonymous access to device_fingerprints table
DROP POLICY IF EXISTS "Block anonymous device_fingerprints access" ON public.device_fingerprints;
CREATE POLICY "Block anonymous device_fingerprints access"
  ON public.device_fingerprints
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Block anonymous access to access_grants table
DROP POLICY IF EXISTS "Block anonymous access_grants access" ON public.access_grants;
CREATE POLICY "Block anonymous access_grants access"
  ON public.access_grants
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Block anonymous access to saved_responses table
DROP POLICY IF EXISTS "Block anonymous saved_responses access" ON public.saved_responses;
CREATE POLICY "Block anonymous saved_responses access"
  ON public.saved_responses
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Block anonymous access to favorite_chats table
DROP POLICY IF EXISTS "Block anonymous favorite_chats access" ON public.favorite_chats;
CREATE POLICY "Block anonymous favorite_chats access"
  ON public.favorite_chats
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Block anonymous access to saved_insights table
DROP POLICY IF EXISTS "Block anonymous saved_insights access" ON public.saved_insights;
CREATE POLICY "Block anonymous saved_insights access"
  ON public.saved_insights
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Block anonymous access to pinned_sessions table
DROP POLICY IF EXISTS "Block anonymous pinned_sessions access" ON public.pinned_sessions;
CREATE POLICY "Block anonymous pinned_sessions access"
  ON public.pinned_sessions
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);