-- Add privacy toggle columns to creator_profiles
ALTER TABLE public.creator_profiles 
ADD COLUMN IF NOT EXISTS show_instagram boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_tiktok boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_youtube boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_twitter boolean DEFAULT true;

-- Create helper function using SECURITY INVOKER (safe - no user input)
CREATE OR REPLACE FUNCTION public.get_public_creator_profile(p_creator_id uuid)
RETURNS json
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT json_build_object(
    'id', id,
    'display_name', display_name,
    'bio', bio,
    'profile_image_url', profile_image_url,
    'instagram_handle', CASE WHEN show_instagram = true THEN instagram_handle ELSE NULL END,
    'tiktok_handle', CASE WHEN show_tiktok = true THEN tiktok_handle ELSE NULL END,
    'youtube_handle', CASE WHEN show_youtube = true THEN youtube_handle ELSE NULL END,
    'twitter_handle', CASE WHEN show_twitter = true THEN twitter_handle ELSE NULL END,
    'follower_count', follower_count,
    'content_niche', content_niche,
    'is_verified', is_verified
  )
  FROM public.creator_profiles
  WHERE id = p_creator_id 
    AND is_published = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_creator_profile(uuid) TO anon, authenticated;