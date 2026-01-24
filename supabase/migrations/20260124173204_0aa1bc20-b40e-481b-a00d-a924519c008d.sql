-- Performance Optimization Indexes
-- These indexes address the 877,000+ sequential scans identified in database analysis

-- CRITICAL: user_roles lookups (will reduce 877K sequential scans to index scans)
-- This table is queried on every page load for auth checks
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
ON public.user_roles(user_id);

-- HIGH: usage_logs lookups on large table (2.7M+ rows, 4.4K seq scans)
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id 
ON public.usage_logs(user_id);

-- MEDIUM: usage_logs date filtering for analytics queries
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at 
ON public.usage_logs(created_at);

-- MEDIUM: user_settings lookups (5.3K seq scans)
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id 
ON public.user_settings(user_id);

-- MEDIUM: user_ai_limits lookups
CREATE INDEX IF NOT EXISTS idx_user_ai_limits_user_id 
ON public.user_ai_limits(user_id);