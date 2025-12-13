-- Step 1: Drop the plaintext business_context column from profiles
-- The encrypted data is already stored in business_context_encrypted via trigger
ALTER TABLE public.profiles DROP COLUMN IF EXISTS business_context;

-- Step 2: Update the encrypt_business_context_trigger to accept input via a temporary field
-- and only store encrypted data
DROP TRIGGER IF EXISTS encrypt_business_context ON public.profiles;
DROP FUNCTION IF EXISTS public.encrypt_business_context_trigger();

-- Step 3: Create a secure function to update business_context (encrypts on save)
CREATE OR REPLACE FUNCTION public.update_profile_business_context(
  _user_id uuid,
  _business_context text,
  p_encryption_key text DEFAULT 'CHANGE_THIS_IN_PRODUCTION_USE_SECRET'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
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
    THEN public.encrypt_text(_business_context, p_encryption_key)
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_profile_business_context(uuid, text, text) TO authenticated;