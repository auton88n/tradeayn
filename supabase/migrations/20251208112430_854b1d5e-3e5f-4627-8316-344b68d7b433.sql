-- Remove unused wallet infrastructure to eliminate security warning

-- Drop wallet_addresses table (empty, never used)
DROP TABLE IF EXISTS public.wallet_addresses CASCADE;

-- Remove wallet_address column from access_grants (unused)
ALTER TABLE public.access_grants DROP COLUMN IF EXISTS wallet_address;

-- Drop wallet-related functions
DROP FUNCTION IF EXISTS public.validate_wallet_security() CASCADE;
DROP FUNCTION IF EXISTS public.authenticate_or_create_solana_user(text, jsonb);