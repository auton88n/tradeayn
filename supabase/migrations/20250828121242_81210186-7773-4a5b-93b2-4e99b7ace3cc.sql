-- Add foreign key relationship between access_grants and profiles tables
-- This will allow proper JOIN operations in the admin panel

-- First, ensure we have proper foreign key constraints
ALTER TABLE public.access_grants 
ADD CONSTRAINT fk_access_grants_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles 
ADD CONSTRAINT fk_profiles_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create an index for better performance on join operations
CREATE INDEX IF NOT EXISTS idx_access_grants_user_id ON public.access_grants(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);