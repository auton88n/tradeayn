-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted email column
ALTER TABLE public.alert_history 
ADD COLUMN IF NOT EXISTS recipient_email_encrypted bytea;

-- Create secure encryption/decryption functions
CREATE OR REPLACE FUNCTION public.encrypt_email(email text, encryption_key text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgp_sym_encrypt(email, encryption_key, 'cipher-algo=aes256');
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_email(encrypted_email bytea, encryption_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted_email, encryption_key);
EXCEPTION
  WHEN others THEN
    RETURN NULL;
END;
$$;

-- Migrate existing plaintext emails to encrypted format
DO $$
DECLARE
  encryption_key text := 'CHANGE_THIS_IN_PRODUCTION_USE_SECRET';
BEGIN
  UPDATE public.alert_history
  SET recipient_email_encrypted = public.encrypt_email(recipient_email, encryption_key)
  WHERE recipient_email IS NOT NULL 
    AND recipient_email_encrypted IS NULL;
END $$;

-- Update create_system_alert to use encryption
CREATE OR REPLACE FUNCTION public.create_system_alert(
  p_alert_type text, 
  p_recipient_email text, 
  p_subject text, 
  p_content text, 
  p_user_id uuid DEFAULT NULL::uuid, 
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alert_id uuid;
  encryption_key text;
BEGIN
  -- Get encryption key from environment or use default
  encryption_key := current_setting('app.email_encryption_key', true);
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := 'CHANGE_THIS_IN_PRODUCTION_USE_SECRET';
  END IF;

  -- Insert with encrypted email (keep plaintext temporarily for compatibility)
  INSERT INTO public.alert_history (
    alert_type,
    recipient_email,
    recipient_email_encrypted,
    subject,
    content,
    user_id,
    metadata,
    status
  ) VALUES (
    p_alert_type,
    p_recipient_email,
    public.encrypt_email(p_recipient_email, encryption_key),
    p_subject,
    p_content,
    p_user_id,
    p_metadata,
    'sent'
  ) RETURNING id INTO alert_id;
  
  -- Log alert creation without exposing email
  PERFORM public.log_security_event(
    'system_alert_created',
    jsonb_build_object(
      'alert_id', alert_id,
      'alert_type', p_alert_type,
      'created_via', 'system_function'
    ),
    'info'
  );
  
  RETURN alert_id;
END;
$$;

-- Create function to get decrypted emails with audit logging
CREATE OR REPLACE FUNCTION public.get_alert_history_with_emails(
  p_alert_id uuid DEFAULT NULL,
  p_encryption_key text DEFAULT 'CHANGE_THIS_IN_PRODUCTION_USE_SECRET'
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  alert_type text,
  recipient_email_decrypted text,
  subject text,
  content text,
  status text,
  error_message text,
  metadata jsonb,
  sent_at timestamp with time zone,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  -- Log the access
  PERFORM public.log_security_event(
    'alert_history_email_access',
    jsonb_build_object(
      'alert_id', p_alert_id,
      'accessed_by', auth.uid(),
      'timestamp', now()
    ),
    'high'
  );

  -- Return decrypted data
  RETURN QUERY
  SELECT 
    ah.id,
    ah.user_id,
    ah.alert_type,
    public.decrypt_email(ah.recipient_email_encrypted, p_encryption_key) as recipient_email_decrypted,
    ah.subject,
    ah.content,
    ah.status,
    ah.error_message,
    ah.metadata,
    ah.sent_at,
    ah.created_at
  FROM public.alert_history ah
  WHERE p_alert_id IS NULL OR ah.id = p_alert_id;
END;
$$;

-- Add trigger to log UPDATE operations on alert_history
CREATE OR REPLACE FUNCTION public.log_alert_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.log_security_event(
    'alert_history_modified',
    jsonb_build_object(
      'alert_id', NEW.id,
      'alert_type', NEW.alert_type,
      'operation', TG_OP,
      'modified_by', auth.uid()
    ),
    'high'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_alert_history_updates ON public.alert_history;
CREATE TRIGGER audit_alert_history_updates
  AFTER UPDATE ON public.alert_history
  FOR EACH ROW
  EXECUTE FUNCTION public.log_alert_update();

-- Add documentation comments
COMMENT ON COLUMN public.alert_history.recipient_email_encrypted IS 
  'Encrypted email using AES-256. Use get_alert_history_with_emails() to access decrypted data with proper audit logging.';

COMMENT ON COLUMN public.alert_history.recipient_email IS 
  'DEPRECATED: Will be removed. Use recipient_email_encrypted instead.';