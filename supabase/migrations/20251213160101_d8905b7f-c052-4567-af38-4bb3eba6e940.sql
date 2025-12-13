-- Fix SECRETS_EXPOSED: Remove hard-coded encryption key fallback from all affected functions
-- Functions will now fail if encryption key is not properly configured via Supabase settings

-- 1. Update get_profile_business_context to fail if key not configured
CREATE OR REPLACE FUNCTION public.get_profile_business_context(
  _user_id uuid,
  p_encryption_key text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  decrypted_context text;
  effective_key text;
BEGIN
  -- Get encryption key from parameter or config setting
  effective_key := COALESCE(p_encryption_key, current_setting('app.encryption_key', true));
  
  -- SECURITY: Fail if no encryption key is configured
  IF effective_key IS NULL OR effective_key = '' THEN
    PERFORM public.log_security_event(
      'encryption_key_not_configured',
      jsonb_build_object('function', 'get_profile_business_context', 'user_id', _user_id),
      'critical'
    );
    RAISE EXCEPTION 'Encryption key not configured. Contact administrator.';
  END IF;

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
  SELECT public.decrypt_text(business_context_encrypted, effective_key)
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

-- 2. Update update_profile_business_context to fail if key not configured
CREATE OR REPLACE FUNCTION public.update_profile_business_context(
  _user_id uuid,
  _business_context text,
  p_encryption_key text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  effective_key text;
BEGIN
  -- Get encryption key from parameter or config setting
  effective_key := COALESCE(p_encryption_key, current_setting('app.encryption_key', true));
  
  -- SECURITY: Fail if no encryption key is configured
  IF effective_key IS NULL OR effective_key = '' THEN
    PERFORM public.log_security_event(
      'encryption_key_not_configured',
      jsonb_build_object('function', 'update_profile_business_context', 'user_id', _user_id),
      'critical'
    );
    RAISE EXCEPTION 'Encryption key not configured. Contact administrator.';
  END IF;

  -- Verify access rights
  IF auth.uid() != _user_id AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    PERFORM public.log_security_event(
      'unauthorized_business_context_update',
      jsonb_build_object('target_user_id', _user_id, 'requesting_user_id', auth.uid()),
      'critical'
    );
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Update with encrypted data
  UPDATE public.profiles
  SET business_context_encrypted = CASE 
    WHEN _business_context IS NOT NULL AND _business_context != '' 
    THEN public.encrypt_text(_business_context, effective_key)
    ELSE NULL
  END,
  updated_at = now()
  WHERE user_id = _user_id;

  -- Log the update
  PERFORM public.log_profiles_sensitive_access(
    'UPDATE_BUSINESS_CONTEXT',
    _user_id,
    ARRAY['business_context'],
    jsonb_build_object('updated_by', auth.uid())
  );
END;
$$;

-- 3. Update create_system_alert to fail if key not configured
CREATE OR REPLACE FUNCTION public.create_system_alert(
  p_alert_type text,
  p_recipient_email text,
  p_subject text,
  p_content text,
  p_user_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  alert_id uuid;
  encryption_key text;
BEGIN
  -- Get encryption key from config setting
  encryption_key := current_setting('app.encryption_key', true);
  
  -- SECURITY: Fail if no encryption key is configured
  IF encryption_key IS NULL OR encryption_key = '' THEN
    PERFORM public.log_security_event(
      'encryption_key_not_configured',
      jsonb_build_object('function', 'create_system_alert', 'alert_type', p_alert_type),
      'critical'
    );
    RAISE EXCEPTION 'Encryption key not configured. Contact administrator.';
  END IF;

  -- Insert with encrypted email only
  INSERT INTO public.alert_history (
    alert_type,
    recipient_email_encrypted,
    subject,
    content,
    user_id,
    metadata,
    status
  ) VALUES (
    p_alert_type,
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

-- 4. Update get_alert_history_with_emails to fail if key not configured
CREATE OR REPLACE FUNCTION public.get_alert_history_with_emails(
  p_alert_id uuid DEFAULT NULL,
  p_encryption_key text DEFAULT NULL
)
RETURNS TABLE(
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
SET search_path TO 'public'
AS $$
DECLARE
  effective_key text;
BEGIN
  -- Only admins can access
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  -- Get encryption key from parameter or config setting
  effective_key := COALESCE(p_encryption_key, current_setting('app.encryption_key', true));
  
  -- SECURITY: Fail if no encryption key is configured
  IF effective_key IS NULL OR effective_key = '' THEN
    PERFORM public.log_security_event(
      'encryption_key_not_configured',
      jsonb_build_object('function', 'get_alert_history_with_emails'),
      'critical'
    );
    RAISE EXCEPTION 'Encryption key not configured. Contact administrator.';
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
    public.decrypt_email(ah.recipient_email_encrypted, effective_key) as recipient_email_decrypted,
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_profile_business_context(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_profile_business_context(uuid, text, text) TO authenticated;