-- SECURITY FIX: Comprehensive security hardening

-- 1. Add wallet address format validation for better security
ALTER TABLE public.wallet_addresses 
ADD CONSTRAINT IF NOT EXISTS wallet_address_format_check 
CHECK (wallet_address ~ '^[A-Za-z0-9]{25,50}$');

-- 2. Create extensions schema for moving pg_net extension (manual step required)
CREATE SCHEMA IF NOT EXISTS extensions;

-- 3. Add enhanced security logging function
CREATE OR REPLACE FUNCTION public.enhanced_security_audit()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all data modifications on sensitive tables
  INSERT INTO public.security_logs (
    user_id,
    action,
    details,
    severity,
    ip_address
  ) VALUES (
    auth.uid(),
    format('%s_%s', lower(TG_TABLE_NAME), lower(TG_OP)),
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'user_id', COALESCE(NEW.user_id, OLD.user_id),
      'timestamp', now()
    ),
    CASE 
      WHEN TG_TABLE_NAME IN ('profiles', 'wallet_addresses') THEN 'medium'
      ELSE 'low'
    END,
    inet_client_addr()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Apply security audit triggers to sensitive tables
DROP TRIGGER IF EXISTS security_audit_profiles ON public.profiles;
CREATE TRIGGER security_audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION enhanced_security_audit();

DROP TRIGGER IF EXISTS security_audit_wallets ON public.wallet_addresses;
CREATE TRIGGER security_audit_wallets
  AFTER INSERT OR UPDATE OR DELETE ON public.wallet_addresses
  FOR EACH ROW EXECUTE FUNCTION enhanced_security_audit();

-- 5. Add comment documentation for manual extension move
COMMENT ON SCHEMA extensions IS 'Schema for extensions - pg_net should be moved here from public schema by Supabase admin';