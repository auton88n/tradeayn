
# Security Remediation Plan: 3 Critical Findings

## Overview
I will address three security findings identified by the security scanner:
1. **ERROR**: Customer Business Data Could Be Stolen by Competitors (profiles table)
2. **ERROR**: Customer Email Addresses Could Be Exposed Through Alert System (alert_history table)  
3. **WARNING**: Analytics System Could Be Poisoned with Fake Data (visitor_analytics table)

---

## Current State Analysis

### Issue 1: Profiles Table Security
**Current Protection:**
- RLS policies exist: Users can only access their own profile (`auth.uid() = user_id`)
- Admins can access all profiles
- Anonymous access is blocked
- `business_context_encrypted` column uses AES-256 encryption

**Remaining Concern:** The security scanner flags this because business-sensitive fields (company_name, business_type, contact_person) are stored as plain text, and the encrypted business_context requires a properly configured encryption key.

### Issue 2: Alert History Email Exposure
**Current Protection:**
- Admin-only RLS policies for SELECT/INSERT/UPDATE/DELETE
- Anonymous access is blocked
- Emails stored as encrypted bytea

**Remaining Concern:** The encryption key is not configured in Supabase settings (`app.encryption_key` returns null). Without proper key configuration, the `get_alert_history_with_emails` function cannot decrypt emails.

### Issue 3: Analytics Data Poisoning
**Current Protection:**
- Basic validation: `page_path IS NOT NULL AND length(page_path) > 0`
- Edge function (`track-visit`) sanitizes input and runs server-side

**Remaining Concern:** Public INSERT policy allows anyone to submit fake analytics data. While the edge function provides some validation, direct database access could bypass this.

---

## Remediation Plan

### 1. Strengthen Profiles Table Security

**Database Migration:**
```sql
-- Add audit logging for all profile access
CREATE OR REPLACE FUNCTION public.log_profile_access_trigger()
RETURNS trigger AS $$
BEGIN
  -- Only log when accessing another user's profile
  IF auth.uid() != COALESCE(NEW.user_id, OLD.user_id) THEN
    PERFORM public.log_security_event(
      'profile_access',
      jsonb_build_object(
        'operation', TG_OP,
        'target_user', COALESCE(NEW.user_id, OLD.user_id),
        'accessor', auth.uid()
      ),
      'medium'
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**Action Required (Manual):** Configure the encryption key in Supabase Dashboard:
- Navigate to Database Settings > Project Settings
- Add database parameter: `app.encryption_key` = [your secure 32+ character key]

### 2. Secure Alert History Emails

**Database Migration:**
```sql
-- Add explicit policy to block service role abuse
-- Ensure all INSERT operations go through create_system_alert function
DROP POLICY IF EXISTS "Admins can insert alert history" ON public.alert_history;

CREATE POLICY "Only system functions can insert alerts" 
ON public.alert_history 
FOR INSERT 
WITH CHECK (
  -- Inserts should only happen via service role (edge functions)
  (SELECT (auth.jwt() ->> 'role'::text)) = 'service_role'::text
);

-- Add decryption audit logging
CREATE POLICY "Admins can select alert history with logging" 
ON public.alert_history 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND (
    SELECT public.log_security_event(
      'alert_history_access',
      jsonb_build_object('admin_id', auth.uid(), 'timestamp', now()),
      'high'
    ) IS NOT NULL OR true
  )
);
```

### 3. Prevent Analytics Data Poisoning

**Database Migration - Add Rate Limiting:**
```sql
-- Create rate limiting function for visitor analytics
CREATE OR REPLACE FUNCTION public.check_visitor_analytics_rate_limit(_visitor_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
  max_per_minute INTEGER := 10;  -- Allow 10 page views per minute per visitor
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM visitor_analytics
  WHERE visitor_id = _visitor_id
    AND created_at > now() - interval '1 minute';
  
  IF recent_count >= max_per_minute THEN
    -- Log potential abuse
    INSERT INTO security_logs (action, details, severity)
    VALUES (
      'analytics_rate_limit_exceeded',
      jsonb_build_object(
        'visitor_id', _visitor_id,
        'count', recent_count
      ),
      'high'
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Update RLS policy to include rate limiting
DROP POLICY IF EXISTS "Allow public inserts for tracking" ON public.visitor_analytics;

CREATE POLICY "Allow rate-limited public inserts for tracking" 
ON public.visitor_analytics 
FOR INSERT 
WITH CHECK (
  page_path IS NOT NULL 
  AND length(page_path) > 0
  AND length(page_path) <= 500
  AND length(visitor_id) <= 100
  AND check_visitor_analytics_rate_limit(visitor_id)
);
```

**Edge Function Update - Add Server-Side Validation:**
Update `supabase/functions/track-visit/index.ts` to add additional validation:
- Validate visitor_id format
- Add request throttling
- Block suspicious patterns

---

## Files to Modify

| File | Changes |
|------|---------|
| Database Migration | New migration for rate limiting, audit logging, and policy updates |
| `supabase/functions/track-visit/index.ts` | Add visitor_id format validation and request throttling |
| `supabase/config.toml` | Already correct - no changes needed |

---

## Manual Configuration Required

After the code changes, the admin needs to:

1. **Set Encryption Key in Supabase Dashboard:**
   - Go to Project Settings > Database > Database Settings
   - Add configuration parameter: `app.encryption_key`
   - Generate a secure 32+ character key using a password generator

2. **Monitor Security Logs:**
   - Check `security_logs` table for rate limit violations
   - Review alert access logs periodically

---

## Security Verification

After implementation, verify:
1. Non-admin users cannot see other profiles' business data
2. Alert history emails remain encrypted and admin-only accessible
3. Analytics rate limiting blocks flood attacks (test with rapid requests)
4. Security logs capture all access attempts

---

## Technical Implementation Summary

```text
+-----------------------+     +------------------------+
|   profiles table      |     |   alert_history table  |
+-----------------------+     +------------------------+
| - Add access logging  |     | - Service role INSERT  |
| - Verify encryption   |     | - Admin-only SELECT    |
| - Configure key       |     | - Access audit logging |
+-----------------------+     +------------------------+

+---------------------------+
|   visitor_analytics table |
+---------------------------+
| - Rate limit function     |
| - Enhanced validation     |
| - Abuse detection         |
+---------------------------+
```

This plan provides defense-in-depth security with:
- Database-level rate limiting
- Enhanced input validation
- Comprehensive audit logging
- Proper encryption key management
