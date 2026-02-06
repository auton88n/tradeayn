UPDATE user_ai_limits SET is_unlimited = true
WHERE user_id IN (
  SELECT user_id FROM user_subscriptions
  WHERE subscription_tier IN ('unlimited', 'enterprise')
);