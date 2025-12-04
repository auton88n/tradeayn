-- Add has_completed_tutorial column to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS has_completed_tutorial boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.user_settings.has_completed_tutorial IS 'Tracks whether user has completed the onboarding tutorial';