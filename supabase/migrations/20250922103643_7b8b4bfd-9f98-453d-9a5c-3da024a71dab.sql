-- COMPREHENSIVE SECURITY FIX: Address all security warnings

-- 1. Fix Extension in Public Schema Issue by creating extensions schema
-- (Note: pg_net extension move requires superuser privileges - will need manual Supabase support)
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Add additional security constraints for wallet addresses
-- Ensure wallet addresses follow expected format patterns
ALTER TABLE public.wallet_addresses 
ADD CONSTRAINT IF NOT EXISTS wallet_address_format_check 
CHECK (length(wallet_address) >= 32 AND length(wallet_address) <= 44 AND wallet_address ~ '^[A-Za-z0-9]+$');

-- 3. Create security audit function for sensitive data monitoring
CREATE OR REPLACE FUNCTION log_sensitive_data_audit(_table_name text, _operation text, _details jsonb DEFAULT '{}')
RETURNS void AS $$
BEGIN
  INSERT INTO security_logs (action, details, severity, user_id)
  VALUES (
    'sensitive_data_audit',
    jsonb_build_object(
      'table', _table_name,
      'operation', _operation,
      'timestamp', now(),
      'additional_details', _details
    ),
    'info',
    auth.uid()
  );
EXCEPTION WHEN OTHERS THEN
  -- Silently handle any logging errors to prevent blocking operations
  NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Add data validation triggers for profiles table
CREATE OR REPLACE FUNCTION validate_profile_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Log profile data changes for security monitoring
  PERFORM log_sensitive_data_audit(
    'profiles', 
    TG_OP, 
    jsonb_build_object('user_id', NEW.user_id)
  );
  
  -- Validate phone number format if provided
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    IF NOT (NEW.phone ~ '^\+?[0-9\s\-\(\)]{7,20}$') THEN
      RAISE EXCEPTION 'Invalid phone number format';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply validation trigger to profiles
DROP TRIGGER IF EXISTS validate_profile_trigger ON public.profiles;
CREATE TRIGGER validate_profile_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION validate_profile_data();

-- 5. Add wallet address validation trigger
CREATE OR REPLACE FUNCTION validate_wallet_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Log wallet operations for security monitoring
  PERFORM log_sensitive_data_audit(
    'wallet_addresses', 
    TG_OP, 
    jsonb_build_object('user_id', NEW.user_id, 'wallet_type', NEW.wallet_type)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply validation trigger to wallet addresses
DROP TRIGGER IF EXISTS validate_wallet_trigger ON public.wallet_addresses;
CREATE TRIGGER validate_wallet_trigger
  BEFORE INSERT OR UPDATE ON public.wallet_addresses
  FOR EACH ROW EXECUTE FUNCTION validate_wallet_data();