-- Fix the last function without search_path
-- This completes the database function security hardening

ALTER FUNCTION trigger_set_updated_at() 
SET search_path = public, pg_temp;