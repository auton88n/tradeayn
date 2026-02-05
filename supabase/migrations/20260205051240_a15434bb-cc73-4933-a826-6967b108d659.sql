-- Drop old constraint
ALTER TABLE user_subscriptions 
DROP CONSTRAINT IF EXISTS user_subscriptions_subscription_tier_check;

-- Add new constraint with all tiers including enterprise and unlimited
ALTER TABLE user_subscriptions 
ADD CONSTRAINT user_subscriptions_subscription_tier_check 
CHECK (subscription_tier = ANY (ARRAY['free', 'starter', 'pro', 'business', 'enterprise', 'unlimited']));