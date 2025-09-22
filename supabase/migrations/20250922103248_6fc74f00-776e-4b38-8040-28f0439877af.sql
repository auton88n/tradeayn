-- SECURITY FIX: Add missing UPDATE and DELETE policies for device_fingerprints
-- Users should be able to manage their own device tracking data for privacy

-- Policy: Users can update their own device fingerprints (e.g., mark as trusted/untrusted)
CREATE POLICY "Users can update their own device fingerprints" ON public.device_fingerprints
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own device fingerprints (privacy - remove old devices)
CREATE POLICY "Users can delete their own device fingerprints" ON public.device_fingerprints
FOR DELETE 
USING (auth.uid() = user_id);