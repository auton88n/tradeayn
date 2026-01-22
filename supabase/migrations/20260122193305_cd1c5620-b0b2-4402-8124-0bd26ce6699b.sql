-- Add bonus credits column to user_ai_limits
ALTER TABLE user_ai_limits ADD COLUMN IF NOT EXISTS bonus_credits INTEGER DEFAULT 0;

-- Create credit gifts audit table
CREATE TABLE IF NOT EXISTS credit_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  gift_type TEXT DEFAULT 'manual',
  given_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on credit_gifts
ALTER TABLE credit_gifts ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage credit gifts
CREATE POLICY "Admins can manage credit gifts" ON credit_gifts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Create beta feedback table
CREATE TABLE IF NOT EXISTS beta_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  favorite_features TEXT[],
  improvement_suggestions TEXT,
  bugs_encountered TEXT,
  would_recommend BOOLEAN,
  additional_comments TEXT,
  credits_awarded INTEGER DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on beta_feedback
ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can submit own feedback" ON beta_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON beta_feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admins can view all feedback
CREATE POLICY "Admins can view all feedback" ON beta_feedback
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Add beta mode config
INSERT INTO system_config (key, value) 
VALUES ('beta_mode', 'true')
ON CONFLICT (key) DO NOTHING;

-- Add beta feedback reward config (5 credits)
INSERT INTO system_config (key, value) 
VALUES ('beta_feedback_reward', '5')
ON CONFLICT (key) DO NOTHING;

-- Create function to add bonus credits
CREATE OR REPLACE FUNCTION add_bonus_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_gift_type TEXT DEFAULT 'manual',
  p_given_by UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Update or insert bonus credits
  INSERT INTO user_ai_limits (user_id, bonus_credits)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET bonus_credits = COALESCE(user_ai_limits.bonus_credits, 0) + p_amount,
      updated_at = now();
  
  -- Insert audit record
  INSERT INTO credit_gifts (user_id, amount, reason, gift_type, given_by)
  VALUES (p_user_id, p_amount, p_reason, p_gift_type, p_given_by);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;