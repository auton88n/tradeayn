-- COMPREHENSIVE SECURITY FIX: Address all security warnings

-- 1. Create extensions schema for better organization
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Add wallet address validation constraint (with proper syntax)
DO $$ 
BEGIN
  -- Only add constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'wallet_address_format_check' 
    AND table_name = 'wallet_addresses'
  ) THEN
    ALTER TABLE public.wallet_addresses 
    ADD CONSTRAINT wallet_address_format_check 
    CHECK (length(wallet_address) >= 32 AND length(wallet_address) <= 44 AND wallet_address ~ '^[A-Za-z0-9]+$');
  END IF;
END $$;

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

-- 4. Add enhanced profile validation function
CREATE OR REPLACE FUNCTION validate_profile_security()
RETURNS TRIGGER AS $$
BEGIN
  -- Log profile operations for security monitoring
  PERFORM log_sensitive_data_audit(
    'profiles', 
    TG_OP, 
    jsonb_build_object('user_id', NEW.user_id)
  );
  
  -- Enhanced phone number validation
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    -- Remove common formatting characters for validation
    IF NOT (regexp_replace(NEW.phone, '[^0-9+]', '', 'g') ~ '^\+?[0-9]{7,15}$') THEN
      RAISE EXCEPTION 'Invalid phone number format. Please use international format.';
    END IF;
  END IF;
  
  -- Validate company name length and content
  IF NEW.company_name IS NOT NULL THEN
    IF length(NEW.company_name) > 200 THEN
      RAISE EXCEPTION 'Company name too long (max 200 characters)';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply enhanced validation trigger
DROP TRIGGER IF EXISTS profile_security_trigger ON public.profiles;
CREATE TRIGGER profile_security_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION validate_profile_security();

-- 5. Add wallet security validation function  
CREATE OR REPLACE FUNCTION validate_wallet_security()
RETURNS TRIGGER AS $$
BEGIN
  -- Log wallet operations
  PERFORM log_sensitive_data_audit(
    'wallet_addresses', 
    TG_OP, 
    jsonb_build_object('user_id', NEW.user_id, 'wallet_type', NEW.wallet_type)
  );
  
  -- Additional wallet-specific validations
  IF NEW.wallet_type = 'solana' THEN
    -- Solana addresses are typically 44 characters
    IF length(NEW.wallet_address) != 44 THEN
      RAISE EXCEPTION 'Invalid Solana wallet address length';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply wallet security trigger
DROP TRIGGER IF EXISTS wallet_security_trigger ON public.wallet_addresses;
CREATE TRIGGER wallet_security_trigger
  BEFORE INSERT OR UPDATE ON public.wallet_addresses
  FOR EACH ROW EXECUTE FUNCTION validate_wallet_security();