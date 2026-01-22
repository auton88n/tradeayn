-- Fix chat_sessions RLS policies
-- The current policy blocks ALL users (public role) instead of just anonymous users

-- Drop the broken policy that targets public role
DROP POLICY IF EXISTS "Block anonymous chat_sessions access" ON public.chat_sessions;

-- Recreate with correct role targeting (anon only)
CREATE POLICY "Block anonymous chat_sessions access" ON public.chat_sessions
  FOR ALL TO anon USING (false) WITH CHECK (false);

-- Also fix the user policy to explicitly target authenticated role
DROP POLICY IF EXISTS "Users can manage own chat sessions" ON public.chat_sessions;

CREATE POLICY "Users can manage own chat sessions" ON public.chat_sessions
  FOR ALL TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);