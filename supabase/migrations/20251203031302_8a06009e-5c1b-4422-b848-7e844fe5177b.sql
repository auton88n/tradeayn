-- First, clean up existing duplicates (keep the oldest entry for each user_id + fingerprint_hash)
DELETE FROM device_fingerprints a
USING device_fingerprints b
WHERE a.user_id = b.user_id 
  AND a.fingerprint_hash = b.fingerprint_hash
  AND a.created_at > b.created_at;

-- Add unique constraint to prevent future duplicates
ALTER TABLE device_fingerprints 
ADD CONSTRAINT device_fingerprints_user_fingerprint_unique 
UNIQUE (user_id, fingerprint_hash);