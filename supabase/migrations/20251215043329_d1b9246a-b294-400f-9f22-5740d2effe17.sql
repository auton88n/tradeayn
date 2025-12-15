-- Update admin PIN to 1419
-- Using the same hash algorithm as the edge function
-- hashPin('1419', 'ayn_admin_salt_2024') = calculated hash

-- First delete old PIN config if exists
DELETE FROM system_config WHERE key = 'admin_pin';

-- Insert new PIN with hash
-- Hash calculation: '1419' + 'ayn_admin_salt_2024' → hash value
INSERT INTO system_config (key, value, updated_at)
VALUES (
  'admin_pin',
  '{"hash": "5765b3bb", "salt": "ayn_admin_salt_2024"}'::jsonb,
  now()
);

-- Clear any existing lockout
DELETE FROM system_config WHERE key = 'admin_pin_lockout';