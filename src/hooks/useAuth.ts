import { useState, useCallback, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { trackDeviceLogin } from '@/hooks/useDeviceTracking';
import type { UserProfile, UseAuthReturn } from '@/types/dashboard.types';

import { supabaseApi } from '@/lib/supabaseApi';

export const useAuth = (user: User, session: Session): UseAuthReturn => {
  const [hasAccess, setHasAccess] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDuty, setIsDuty] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentMonthUsage, setCurrentMonthUsage] = useState(0);
  const [monthlyLimit, setMonthlyLimit] = useState<number | null>(null);
  const [usageResetDate, setUsageResetDate] = useState<string | null>(null);
  const { toast } = useToast();
  
  const hasTrackedDevice = useRef(false);

  // Check if user has active access - uses direct fetch
  const checkAccess = useCallback(async () => {
    try {
      const data = await supabaseApi.get<any[]>(
        `access_grants?user_id=eq.${user.id}&select=is_active,expires_at,current_month_usage,monthly_limit,usage_reset_date`,
        session.access_token
      );

      if (!data || data.length === 0) {
        setHasAccess(false);
        return;
      }

      const record = data[0];
      const isActive = record.is_active && (!record.expires_at || new Date(record.expires_at) > new Date());
      setHasAccess(isActive);
      setCurrentMonthUsage(record.current_month_usage ?? 0);
      setMonthlyLimit(record.monthly_limit ?? null);
      setUsageResetDate(record.usage_reset_date ?? null);
    } catch {
      // Silent failure - access denied by default
    }
  }, [user.id, session.access_token]);

  // Check if user is admin or duty - uses direct fetch
  const checkAdminRole = useCallback(async () => {
    try {
      const data = await supabaseApi.get<any[]>(
        `user_roles?user_id=eq.${user.id}&select=role`,
        session.access_token
      );

      const role = data?.[0]?.role;
      setIsAdmin(role === 'admin');
      setIsDuty(role === 'duty');
    } catch {
      // Silent failure - non-admin by default
    }
  }, [user.id, session.access_token]);

  // Load user profile - uses direct fetch
  const loadUserProfile = useCallback(async () => {
    try {
      const data = await supabaseApi.get<any[]>(
        `profiles?user_id=eq.${user.id}&select=user_id,contact_person,company_name,business_type,avatar_url`,
        session.access_token
      );

      if (data && data.length > 0) {
        setUserProfile(data[0] as UserProfile);
      }
    } catch {
      // Silent failure - no profile
    }
  }, [user.id, session.access_token]);

  // Accept terms and conditions - uses direct fetch with verification
  const acceptTerms = useCallback(async (consent: { privacy: boolean; terms: boolean; aiDisclaimer: boolean }) => {
    try {
      const now = new Date().toISOString();

      // Try PATCH first with return=representation to verify it worked
      const updated = await supabaseApi.fetch<any[]>(
        `user_settings?user_id=eq.${user.id}`,
        session.access_token,
        {
          method: 'PATCH',
          body: { has_accepted_terms: true, updated_at: now },
          headers: { 'Prefer': 'return=representation' }
        }
      );

      // If PATCH returned empty (no row existed), fall back to POST insert
      if (!updated || updated.length === 0) {
        await supabaseApi.post(
          'user_settings',
          session.access_token,
          { user_id: user.id, has_accepted_terms: true, updated_at: now }
        );
      }

      // Write immutable consent audit log
      await supabaseApi.post(
        'terms_consent_log',
        session.access_token,
        {
          user_id: user.id,
          terms_version: '2026-02-07',
          privacy_accepted: consent.privacy,
          terms_accepted: consent.terms,
          ai_disclaimer_accepted: consent.aiDisclaimer,
          user_agent: navigator.userAgent
        }
      );

      setHasAcceptedTerms(true);
      localStorage.setItem(`terms_accepted_${user.id}`, 'true');
      
      toast({
        title: 'Welcome to AYN',
        description: 'Your AI companion is ready to assist you.'
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to save terms acceptance:', error);
      }
      toast({
        title: 'Error',
        description: 'Could not save your acceptance. Please try again.',
        variant: 'destructive',
      });
    }
  }, [user.id, session.access_token, toast]);

  // Load all auth data on mount - DIRECT FETCH, no Supabase client
  useEffect(() => {
    if (!user?.id || !session?.access_token) {
      setIsAuthLoading(false);
      return;
    }

    let isMounted = true;
    let hasRun = false;

    const runQueries = async () => {
      if (hasRun) return;
      hasRun = true;

      try {
        // Use retry logic for all queries
        const results = await Promise.all([
          supabaseApi.getWithRetry<any[]>(`access_grants?user_id=eq.${user.id}&select=is_active,expires_at,current_month_usage,monthly_limit,usage_reset_date`, session.access_token),
          supabaseApi.getWithRetry<any[]>(`user_roles?user_id=eq.${user.id}&select=role`, session.access_token),
          supabaseApi.getWithRetry<any[]>(`profiles?user_id=eq.${user.id}&select=user_id,contact_person,company_name,business_type,avatar_url`, session.access_token),
          supabaseApi.getWithRetry<any[]>(`user_settings?user_id=eq.${user.id}&select=has_accepted_terms`, session.access_token)
        ]);

        if (!isMounted) return;

        const [accessData, roleData, profileData, settingsData] = results;

        // Process access (with null check)
        if (accessData && accessData.length > 0) {
          const record = accessData[0];
          const isActive = record.is_active && 
            (!record.expires_at || new Date(record.expires_at) > new Date());
          setHasAccess(isActive);
          setCurrentMonthUsage(record.current_month_usage ?? 0);
          setMonthlyLimit(record.monthly_limit ?? null);
          setUsageResetDate(record.usage_reset_date ?? null);
        }

        // Process admin/duty role (with null check)
        if (roleData) {
          const role = roleData?.[0]?.role;
          setIsAdmin(role === 'admin');
          setIsDuty(role === 'duty');
        }

        // Process profile (with null check)
        if (profileData && profileData.length > 0) {
          setUserProfile(profileData[0] as UserProfile);
        }

        // Process terms (with null check + localStorage fallback)
        if (settingsData) {
          const dbTermsAccepted = settingsData?.[0]?.has_accepted_terms ?? false;
          setHasAcceptedTerms(dbTermsAccepted);
          if (dbTermsAccepted) {
            localStorage.setItem(`terms_accepted_${user.id}`, 'true');
          } else {
            localStorage.removeItem(`terms_accepted_${user.id}`);
          }
        } else {
          // DB query failed - use localStorage as temporary fallback
          const localTermsAccepted = localStorage.getItem(`terms_accepted_${user.id}`) === 'true';
          setHasAcceptedTerms(localTermsAccepted);
        }

      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Auth queries batch failed:', error);
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    // Run immediately - no delay needed
    runQueries();

    // Track device (non-blocking)
    if (!hasTrackedDevice.current) {
      hasTrackedDevice.current = true;
      setTimeout(() => trackDeviceLogin(user.id, session.access_token), 0);
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id, session?.access_token]);

  return {
    hasAccess,
    hasAcceptedTerms,
    isAdmin,
    isDuty,
    hasDutyAccess: isAdmin || isDuty,
    isAuthLoading,
    userProfile,
    currentMonthUsage,
    monthlyLimit,
    usageResetDate,
    checkAccess,
    checkAdminRole,
    loadUserProfile,
    acceptTerms
  };
};
