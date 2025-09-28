-- CRITICAL SECURITY FIX 1: Phone Number Encryption and Protection

-- Create extension for encryption (pgcrypto) in extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Create secure functions for phone number encryption/decryption
CREATE OR REPLACE FUNCTION public.encrypt_phone_number(_phone_number text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Use a consistent key for phone number encryption
  -- In production, this should come from a secure key management system
  encryption_key := encode(digest('phone_encryption_key_v1', 'sha256'), 'hex');
  
  IF _phone_number IS NULL OR _phone_number = '' THEN
    RETURN NULL;
  END IF;
  
  -- Encrypt the phone number
  RETURN encode(extensions.pgp_sym_encrypt(_phone_number, encryption_key), 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_phone_number(_encrypted_phone text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Same key used for decryption
  encryption_key := encode(digest('phone_encryption_key_v1', 'sha256'), 'hex');
  
  IF _encrypted_phone IS NULL OR _encrypted_phone = '' THEN
    RETURN NULL;
  END IF;
  
  -- Decrypt the phone number
  RETURN extensions.pgp_sym_decrypt(decode(_encrypted_phone, 'base64'), encryption_key);
EXCEPTION
  WHEN OTHERS THEN
    -- Return NULL if decryption fails
    RETURN NULL;
END;
$$;

-- Add encrypted phone storage column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_encrypted text;

-- Migrate existing phone numbers to encrypted storage
UPDATE public.profiles 
SET phone_encrypted = public.encrypt_phone_number(phone)
WHERE phone IS NOT NULL AND phone != '' AND phone_encrypted IS NULL;

-- Create secure phone access function that logs all access
CREATE OR REPLACE FUNCTION public.get_phone_number_secure(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  encrypted_phone text;
  decrypted_phone text;
BEGIN
  -- Verify access rights
  IF auth.uid() != _user_id AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    PERFORM log_security_event(
      'unauthorized_phone_access_attempt',
      jsonb_build_object(
        'requested_user_id', _user_id,
        'requesting_user_id', auth.uid(),
        'ip_address', inet_client_addr()
      ),
      'critical'
    );
    RAISE EXCEPTION 'Access denied: insufficient permissions to view phone number';
  END IF;

  -- Get encrypted phone number
  SELECT phone_encrypted INTO encrypted_phone
  FROM profiles
  WHERE user_id = _user_id;
  
  IF encrypted_phone IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Decrypt and log access
  decrypted_phone := decrypt_phone_number(encrypted_phone);
  
  PERFORM log_security_event(
    'phone_number_accessed',
    jsonb_build_object(
      'target_user_id', _user_id,
      'accessed_by', auth.uid(),
      'is_admin_access', has_role(auth.uid(), 'admin'::app_role),
      'access_time', now()
    ),
    'info'
  );
  
  RETURN decrypted_phone;
END;
$$;

-- Create function to securely update phone numbers
CREATE OR REPLACE FUNCTION public.update_phone_number_secure(_user_id uuid, _new_phone text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify access rights (users can only update their own phone)
  IF auth.uid() != _user_id THEN
    PERFORM log_security_event(
      'unauthorized_phone_update_attempt',
      jsonb_build_object(
        'target_user_id', _user_id,
        'requesting_user_id', auth.uid(),
        'attempted_phone_preview', left(_new_phone, 3) || 'XXX'
      ),
      'high'
    );
    RAISE EXCEPTION 'Access denied: can only update your own phone number';
  END IF;

  -- Validate phone number format
  IF _new_phone IS NOT NULL AND _new_phone != '' THEN
    IF NOT (regexp_replace(_new_phone, '[^0-9+\-\s\(\)]', '', 'g') ~ '^\+?[0-9\-\s\(\)]{7,20}$') THEN
      PERFORM log_security_event(
        'invalid_phone_format_attempt',
        jsonb_build_object(
          'user_id', _user_id,
          'invalid_format', 'phone_validation_failed'
        ),
        'medium'
      );
      RAISE EXCEPTION 'Invalid phone number format';
    END IF;
  END IF;

  -- Update with encrypted phone number
  UPDATE profiles 
  SET 
    phone_encrypted = encrypt_phone_number(_new_phone),
    updated_at = now()
  WHERE user_id = _user_id;
  
  -- Log the update
  PERFORM log_security_event(
    'phone_number_updated',
    jsonb_build_object(
      'user_id', _user_id,
      'update_time', now()
    ),
    'info'
  );
  
  RETURN true;
END;
$$;