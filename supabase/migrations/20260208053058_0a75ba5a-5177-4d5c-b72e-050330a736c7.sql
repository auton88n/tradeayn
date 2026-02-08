CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component_stack TEXT,
  url TEXT,
  user_id UUID REFERENCES auth.users(id),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert errors"
  ON error_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read all errors"
  ON error_logs FOR SELECT USING (
    public.has_role(auth.uid(), 'admin')
  );

CREATE INDEX idx_error_logs_created_at ON error_logs(created_at);