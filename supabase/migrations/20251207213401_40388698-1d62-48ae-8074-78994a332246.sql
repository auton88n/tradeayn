-- Create pinned sessions table for persistent chat pinning
CREATE TABLE pinned_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  pinned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, session_id)
);

-- Create index for fast queries
CREATE INDEX idx_pinned_sessions_user ON pinned_sessions(user_id);

-- Enable RLS
ALTER TABLE pinned_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only manage their own pins
CREATE POLICY "Users can manage own pinned sessions"
ON pinned_sessions FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);