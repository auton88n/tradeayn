-- Fix function search path for add_bonus_credits
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
  INSERT INTO public.user_ai_limits (user_id, bonus_credits)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET bonus_credits = COALESCE(public.user_ai_limits.bonus_credits, 0) + p_amount,
      updated_at = now();
  
  -- Insert audit record
  INSERT INTO public.credit_gifts (user_id, amount, reason, gift_type, given_by)
  VALUES (p_user_id, p_amount, p_reason, p_gift_type, p_given_by);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;