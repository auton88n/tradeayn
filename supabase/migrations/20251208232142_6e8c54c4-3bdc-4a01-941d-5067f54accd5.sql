-- Add 'ai_employee' to service_applications service_type constraint
-- First drop existing constraint if any
ALTER TABLE public.service_applications 
DROP CONSTRAINT IF EXISTS service_applications_service_type_check;

-- Add updated constraint with ai_employee
ALTER TABLE public.service_applications 
ADD CONSTRAINT service_applications_service_type_check 
CHECK (service_type IN ('content_creator', 'ai_agents', 'automation', 'ai_employee'));

-- Create creator_profiles table for content creator marketplace
CREATE TABLE public.creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  application_id UUID REFERENCES public.service_applications(id) ON DELETE SET NULL,
  
  -- Profile Data
  display_name TEXT NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  
  -- Social Stats
  instagram_handle TEXT,
  tiktok_handle TEXT,
  youtube_handle TEXT,
  twitter_handle TEXT,
  
  follower_count TEXT,
  engagement_rate DECIMAL,
  
  -- Categories
  content_niche TEXT[],
  
  -- Visibility
  is_published BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for creator_profiles

-- Anyone can view published profiles (marketplace browsing)
CREATE POLICY "Anyone can view published creator profiles"
ON public.creator_profiles
FOR SELECT
USING (is_published = true);

-- Authenticated users can view all published profiles
CREATE POLICY "Authenticated users can view published profiles"
ON public.creator_profiles
FOR SELECT
TO authenticated
USING (is_published = true);

-- Users can manage their own profile
CREATE POLICY "Users can insert own creator profile"
ON public.creator_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own creator profile"
ON public.creator_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own creator profile"
ON public.creator_profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all creator profiles"
ON public.creator_profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for better query performance
CREATE INDEX idx_creator_profiles_published ON public.creator_profiles(is_published) WHERE is_published = true;
CREATE INDEX idx_creator_profiles_niche ON public.creator_profiles USING GIN(content_niche);
CREATE INDEX idx_creator_profiles_user_id ON public.creator_profiles(user_id);

-- Add updated_at trigger
CREATE TRIGGER update_creator_profiles_updated_at
BEFORE UPDATE ON public.creator_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();