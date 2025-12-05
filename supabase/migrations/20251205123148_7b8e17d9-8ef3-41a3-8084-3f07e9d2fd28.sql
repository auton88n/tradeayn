-- Add has_accepted_terms column to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS has_accepted_terms boolean DEFAULT false;