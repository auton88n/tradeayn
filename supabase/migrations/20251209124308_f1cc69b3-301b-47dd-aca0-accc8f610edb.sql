-- Enable pgcrypto extension (required for encryption)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Add encrypted column for business_context
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS business_context_encrypted bytea;

-- Create generic encryption/decryption functions using extensions schema
CREATE OR REPLACE FUNCTION public.encrypt_text(plaintext text, encryption_key text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  IF plaintext IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN extensions.pgp_sym_encrypt(plaintext, encryption_key, 'cipher-algo=aes256');
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_text(encrypted_data bytea, encryption_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  IF encrypted_data IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN extensions.pgp_sym_decrypt(encrypted_data, encryption_key);
EXCEPTION
  WHEN others THEN
    RETURN NULL;
END;
$$;

-- Create secure accessor function for business_context
CREATE OR REPLACE FUNCTION public.get_profile_business_context(_user_id uuid, p_encryption_key text DEFAULT 'CHANGE_THIS_IN_PRODUCTION_USE_SECRET')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  decrypted_context text;
BEGIN
  -- Verify access rights
  IF auth.uid() != _user_id AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    PERFORM public.log_security_event(
      'unauthorized_business_context_access',
      jsonb_build_object('requested_user_id', _user_id, 'requesting_user_id', auth.uid()),
      'critical'
    );
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get decrypted data
  SELECT public.decrypt_text(business_context_encrypted, p_encryption_key)
  INTO decrypted_context
  FROM public.profiles
  WHERE user_id = _user_id;

  -- Log access
  PERFORM public.log_profiles_sensitive_access(
    'DECRYPT_BUSINESS_CONTEXT',
    _user_id,
    ARRAY['business_context'],
    jsonb_build_object('accessed_by', auth.uid())
  );

  RETURN decrypted_context;
END;
$$;

-- Create trigger to auto-encrypt business_context on insert/update
CREATE OR REPLACE FUNCTION public.encrypt_business_context_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  encryption_key text;
BEGIN
  encryption_key := current_setting('app.email_encryption_key', true);
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := 'CHANGE_THIS_IN_PRODUCTION_USE_SECRET';
  END IF;

  -- Encrypt business_context if provided
  IF NEW.business_context IS NOT NULL AND NEW.business_context != '' THEN
    NEW.business_context_encrypted := public.encrypt_text(NEW.business_context, encryption_key);
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS encrypt_business_context ON public.profiles;
CREATE TRIGGER encrypt_business_context
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_business_context_trigger();

-- Migrate existing data
DO $$
DECLARE
  encryption_key text := 'CHANGE_THIS_IN_PRODUCTION_USE_SECRET';
BEGIN
  UPDATE public.profiles 
  SET business_context_encrypted = public.encrypt_text(business_context, encryption_key)
  WHERE business_context IS NOT NULL 
    AND business_context_encrypted IS NULL;
END $$;