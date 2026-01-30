-- Fix: Add search_path to function for security
CREATE OR REPLACE FUNCTION public.get_public_creator_profile(p_creator_id uuid)
RETURNS json
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public
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