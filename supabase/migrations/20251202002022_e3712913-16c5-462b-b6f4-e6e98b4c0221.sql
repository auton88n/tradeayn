-- Add explicit anonymous access protection by updating RLS policies to target 'authenticated' role
-- This provides defense-in-depth security by explicitly denying unauthenticated access

-- 1. Update messages table policies
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can create their own messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own messages" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" ON messages
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 2. Update device_fingerprints table policies
DROP POLICY IF EXISTS "Users can view their own device fingerprints" ON device_fingerprints;
DROP POLICY IF EXISTS "Users can insert their own device fingerprints" ON device_fingerprints;
DROP POLICY IF EXISTS "Users can update their own device fingerprints" ON device_fingerprints;
DROP POLICY IF EXISTS "Users can delete their own device fingerprints" ON device_fingerprints;

CREATE POLICY "Users can view their own device fingerprints" ON device_fingerprints
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own device fingerprints" ON device_fingerprints
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device fingerprints" ON device_fingerprints
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own device fingerprints" ON device_fingerprints
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 3. Update wallet_addresses table policies
DROP POLICY IF EXISTS "Users can view their own wallet addresses" ON wallet_addresses;
DROP POLICY IF EXISTS "Users can create their own wallet addresses" ON wallet_addresses;
DROP POLICY IF EXISTS "Users can update their own wallet addresses" ON wallet_addresses;
DROP POLICY IF EXISTS "Users can delete their own wallet addresses" ON wallet_addresses;

CREATE POLICY "Users can view their own wallet addresses" ON wallet_addresses
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wallet addresses" ON wallet_addresses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet addresses" ON wallet_addresses
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wallet addresses" ON wallet_addresses
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 4. Update user_settings table policies
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- 5. Update access_grants table policies
DROP POLICY IF EXISTS "Users can view own access grants" ON access_grants;

CREATE POLICY "Users can view own access grants" ON access_grants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 6. Update favorite_chats table policies
DROP POLICY IF EXISTS "Users can view their own favorite chats" ON favorite_chats;
DROP POLICY IF EXISTS "Users can create their own favorite chats" ON favorite_chats;
DROP POLICY IF EXISTS "Users can update their own favorite chats" ON favorite_chats;
DROP POLICY IF EXISTS "Users can delete their own favorite chats" ON favorite_chats;

CREATE POLICY "Users can view their own favorite chats" ON favorite_chats
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorite chats" ON favorite_chats
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorite chats" ON favorite_chats
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite chats" ON favorite_chats
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 7. Update saved_insights table policies
DROP POLICY IF EXISTS "Users can manage their own insights" ON saved_insights;

CREATE POLICY "Users can manage their own insights" ON saved_insights
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- 8. Update usage_logs table policies
DROP POLICY IF EXISTS "Users can view own usage logs" ON usage_logs;
DROP POLICY IF EXISTS "Users can insert own usage logs" ON usage_logs;

CREATE POLICY "Users can view own usage logs" ON usage_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage logs" ON usage_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 9. Update rate_limits table policies
DROP POLICY IF EXISTS "Users can view own rate limits" ON rate_limits;
DROP POLICY IF EXISTS "Users can insert rate limit records" ON rate_limits;

CREATE POLICY "Users can view own rate limits" ON rate_limits
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert rate limit records" ON rate_limits
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 10. Update user_roles table policies
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;

CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 11. Update webhook_rate_limits table policies
DROP POLICY IF EXISTS "Users can view webhook rate limits" ON webhook_rate_limits;
DROP POLICY IF EXISTS "Users can insert webhook rate limits" ON webhook_rate_limits;

CREATE POLICY "Users can view webhook rate limits" ON webhook_rate_limits
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert webhook rate limits" ON webhook_rate_limits
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 12. Update profiles table policies (already targets authenticated, but recreate for consistency)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);