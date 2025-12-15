-- Create chat_sessions table to store permanent chat titles
CREATE TABLE public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own chat sessions
CREATE POLICY "Users can manage own chat sessions" ON public.chat_sessions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Block anonymous access
CREATE POLICY "Block anonymous chat_sessions access" ON public.chat_sessions
  FOR ALL USING (false) WITH CHECK (false);

-- Indexes for fast lookups
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_session_id ON public.chat_sessions(session_id);

-- Trigger for updated_at
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();