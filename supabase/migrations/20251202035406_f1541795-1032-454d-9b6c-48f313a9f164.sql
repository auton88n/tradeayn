-- =====================================================
-- PROFILES TABLE SECURITY HARDENING MIGRATION (FIXED)
-- =====================================================
-- This migration strengthens RLS policies and adds comprehensive security controls

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS enhanced_profile_security_validation ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS prevent_system_field_modification ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS log_admin_profile_access_trigger ON public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.enhanced_profile_security_validation() CASCADE;
DROP FUNCTION IF EXISTS public.prevent_system_field_modification() CASCADE;
DROP FUNCTION IF EXISTS public.log_admin_profile_access() CASCADE;

-- =====================================================
-- 1. FIX VALIDATION TRIGGER (Remove phone field validation)
-- =====================================================
CREATE OR REPLACE FUNCTION public.enhanced_profile_security_validation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log all profile operations for security monitoring
  PERFORM public.log_profiles_sensitive_access(
    TG_OP,
    COALESCE(NEW.user_id, OLD.user_id),
    CASE TG_OP
      WHEN 'INSERT' THEN ARRAY['company_name', 'contact_person', 'business_type', 'business_context']
      WHEN 'UPDATE' THEN ARRAY(
        SELECT unnest(ARRAY['company_name', 'contact_person', 'business_type', 'business_context'])
        WHERE (OLD.company_name IS DISTINCT FROM NEW.company_name) OR
              (OLD.contact_person IS DISTINCT FROM NEW.contact_person) OR
              (OLD.business_type IS DISTINCT FROM NEW.business_type) OR
              (OLD.business_context IS DISTINCT FROM NEW.business_context)
      )
      ELSE NULL
    END,
    jsonb_build_object(
      'authenticated_user', auth.uid(),
      'is_admin', has_role(auth.uid(), 'admin'::app_role),
      'is_own_profile', auth.uid() = COALESCE(NEW.user_id, OLD.user_id)
    )
  );

  -- Enhanced validation for INSERT/UPDATE operations
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    -- Validate company name
    IF NEW.company_name IS NOT NULL THEN
      IF length(NEW.company_name) > 200 THEN
        RAISE EXCEPTION 'Company name exceeds maximum length (200 characters)';
      END IF;
      
      IF NOT public.validate_input_sanitization(NEW.company_name) THEN
        PERFORM public.log_security_event(
          'malicious_input_blocked',
          jsonb_build_object(
            'field', 'company_name',
            'user_id', NEW.user_id,
            'blocked_content', left(NEW.company_name, 100)
          ),
          'high'
        );
        RAISE EXCEPTION 'Invalid characters detected in company name';
      END IF;
    END IF;

    -- Validate contact person
    IF NEW.contact_person IS NOT NULL THEN
      IF length(NEW.contact_person) > 100 THEN
        RAISE EXCEPTION 'Contact person name exceeds maximum length (100 characters)';
      END IF;
      
      IF NOT public.validate_input_sanitization(NEW.contact_person) THEN
        PERFORM public.log_security_event(
          'malicious_input_blocked',
          jsonb_build_object(
            'field', 'contact_person',
            'user_id', NEW.user_id,
            'blocked_content', left(NEW.contact_person, 100)
          ),
          'high'
        );
        RAISE EXCEPTION 'Invalid characters detected in contact person name';
      END IF;
    END IF;

    -- Validate business context
    IF NEW.business_context IS NOT NULL THEN
      IF length(NEW.business_context) > 2000 THEN
        RAISE EXCEPTION 'Business context exceeds maximum length (2000 characters)';
      END IF;
      
      IF NOT public.validate_input_sanitization(NEW.business_context) THEN
        PERFORM public.log_security_event(
          'malicious_input_blocked',
          jsonb_build_object(
            'field', 'business_context',
            'user_id', NEW.user_id
          ),
          'high'
        );
        RAISE EXCEPTION 'Invalid characters detected in business context';
      END IF;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER enhanced_profile_security_validation
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enhanced_profile_security_validation();

COMMENT ON FUNCTION public.enhanced_profile_security_validation() IS 'Validates profile data and logs security events for audit trail';

-- =====================================================
-- 2. PREVENT SYSTEM FIELD MODIFICATION (Non-admin users)
-- =====================================================
CREATE OR REPLACE FUNCTION public.prevent_system_field_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only apply to non-admin users
  IF NOT has_role(auth.uid(), 'admin'::app_role) AND TG_OP = 'UPDATE' THEN
    -- Prevent modification of system-managed fields
    IF OLD.account_status IS DISTINCT FROM NEW.account_status THEN
      RAISE EXCEPTION 'Cannot modify account_status field';
    END IF;
    
    IF OLD.last_login IS DISTINCT FROM NEW.last_login THEN
      RAISE EXCEPTION 'Cannot modify last_login field';
    END IF;
    
    IF OLD.total_sessions IS DISTINCT FROM NEW.total_sessions THEN
      RAISE EXCEPTION 'Cannot modify total_sessions field';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_system_field_modification
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_system_field_modification();

COMMENT ON FUNCTION public.prevent_system_field_modification() IS 'Prevents non-admin users from modifying system-managed fields';

-- =====================================================
-- 3. REMOVE USER DELETE PERMISSION (Admin-only)
-- =====================================================
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

COMMENT ON TABLE public.profiles IS 'User profiles with admin-only delete permission and protected system fields';

-- =====================================================
-- 4. UPDATE USER UPDATE POLICY (Simplified)
-- =====================================================
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile fields" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can update own profile" ON public.profiles IS 
'Users can update their own profile. System fields are protected by trigger function.';

-- =====================================================
-- 5. ADD ADMIN ACCESS LOGGING
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_admin_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log when admin accesses another user's profile
  IF has_role(auth.uid(), 'admin'::app_role) AND auth.uid() != COALESCE(NEW.user_id, OLD.user_id) THEN
    PERFORM public.log_security_event(
      'admin_profile_access',
      jsonb_build_object(
        'admin_user_id', auth.uid(),
        'target_user_id', COALESCE(NEW.user_id, OLD.user_id),
        'operation', TG_OP,
        'changed_fields', CASE 
          WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
            'company_name_changed', OLD.company_name IS DISTINCT FROM NEW.company_name,
            'contact_person_changed', OLD.contact_person IS DISTINCT FROM NEW.contact_person,
            'business_type_changed', OLD.business_type IS DISTINCT FROM NEW.business_type,
            'account_status_changed', OLD.account_status IS DISTINCT FROM NEW.account_status
          )
          ELSE NULL
        END
      ),
      'high'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER log_admin_profile_access_trigger
AFTER UPDATE OR DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.log_admin_profile_access();

COMMENT ON FUNCTION public.log_admin_profile_access() IS 'Logs admin access to user profiles for audit trail';

-- =====================================================
-- 6. ADD INDEX FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- =====================================================
-- 7. VERIFY RLS POLICIES
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;