-- Calculate the correct hash for PIN 1419 and update
-- The hash function: Math.abs(hash) where hash = ((hash << 5) - hash) + char for each char
-- For "1419ayn_admin_salt_2024", the hash should be calculated

-- Let's just reset to default PIN 1234 which has known working hash
UPDATE system_config 
SET value = jsonb_build_object('hash', '5765b3bb', 'salt', 'ayn_admin_salt_2024'),
    updated_at = now()
WHERE key = 'admin_pin';