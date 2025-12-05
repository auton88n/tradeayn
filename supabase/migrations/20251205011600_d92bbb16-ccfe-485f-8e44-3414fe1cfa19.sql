-- Fix 1: Add explicit policy blocking anonymous access to profiles
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false);

-- Fix 2: Add location data cleanup function for privacy compliance
CREATE OR REPLACE FUNCTION public.cleanup_location_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clear location_info older than 30 days for privacy
  UPDATE public.device_fingerprints 
  SET location_info = '{}'::jsonb
  WHERE last_seen < now() - interval '30 days'
    AND location_info != '{}'::jsonb;
    
  -- Log the cleanup action
  PERFORM log_security_event(
    'location_data_cleanup',
    jsonb_build_object(
      'cleanup_time', now(),
      'automated', true
    ),
    'info'
  );
END;
$$;