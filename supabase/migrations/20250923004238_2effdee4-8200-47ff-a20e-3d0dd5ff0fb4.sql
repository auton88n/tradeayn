-- FIX SECURITY LINTER WARNINGS: Set search_path for security functions

-- Fix search_path for log_sensitive_data_audit function
CREATE OR REPLACE FUNCTION log_sensitive_data_audit(_table_name text, _operation text, _details jsonb DEFAULT '{}')
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix search_path for validate_profile_security function
CREATE OR REPLACE FUNCTION validate_profile_security()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix search_path for validate_wallet_security function
CREATE OR REPLACE FUNCTION validate_wallet_security()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;