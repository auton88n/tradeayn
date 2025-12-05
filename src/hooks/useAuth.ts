import { useState, useCallback, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { trackDeviceLogin } from '@/hooks/useDeviceTracking';
import type { UserProfile, UseAuthReturn } from '@/types/dashboard.types';

const MAX_AUTH_FAILURES = 2;

export const useAuth = (user: User): UseAuthReturn => {
  const [hasAccess, setHasAccess] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // Track consecutive auth failures to detect invalid sessions
  const authFailureCount = useRef(0);
  
  const handleAuthFailure = useCallback((error: { code?: string; message?: string }, context: string) => {
    console.error(`Auth error in ${context}:`, error);
    
    // Check if this is an auth-related error
    if (error.code === 'PGRST301' || error.message?.includes('JWT') || error.code === '401') {
      authFailureCount.current++;
      
      if (authFailureCount.current >= MAX_AUTH_FAILURES) {
        console.warn('Multiple auth failures detected, forcing session reset');
        localStorage.removeItem('sb-dfkoxuokfkttjhfjcecx-auth-token');
        sessionStorage.clear();
        window.location.href = '/';
      }
    }
  }, []);
  
  // Reset failure count on successful queries
  const resetAuthFailures = useCallback(() => {
    authFailureCount.current = 0;
  }, []);

  // Check if user has active access
  const checkAccess = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('access_grants')
        .select('is_active, expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        handleAuthFailure(error, 'checkAccess');
        return;
      }

      // Success - reset failure count
      resetAuthFailures();

      if (!data) {
        setHasAccess(false);
        return;
      }

      const isActive = data.is_active && (!data.expires_at || new Date(data.expires_at) > new Date());
      setHasAccess(isActive);
    } catch (error) {
      handleAuthFailure(error as { code?: string; message?: string }, 'checkAccess');
    }
  }, [user.id, handleAuthFailure, resetAuthFailures]);

  // Check if user is admin
  const checkAdminRole = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        handleAuthFailure(error, 'checkAdminRole');
        return;
      }

      // Success - reset failure count
      resetAuthFailures();

      if (!data) {
        setIsAdmin(false);
        return;
      }

      setIsAdmin(data.role === 'admin');
    } catch (error) {
      handleAuthFailure(error as { code?: string; message?: string }, 'checkAdminRole');
    }
  }, [user.id, handleAuthFailure, resetAuthFailures]);

  // Load user profile
  const loadUserProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, contact_person, company_name, business_type, business_context, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        handleAuthFailure(error, 'loadUserProfile');
        return;
      }

      // Success - reset failure count
      resetAuthFailures();

      if (data) {
        setUserProfile(data as UserProfile);
      }
    } catch (error) {
      handleAuthFailure(error as { code?: string; message?: string }, 'loadUserProfile');
    }
  }, [user.id, handleAuthFailure, resetAuthFailures]);

  // Accept terms and conditions
  const acceptTerms = useCallback(() => {
    const termsKey = `ayn_terms_accepted_${user.id}`;
    localStorage.setItem(termsKey, 'true');
    setHasAcceptedTerms(true);

    toast({
      title: t('auth.welcomeTitle'),
      description: t('auth.welcomeDesc')
    });
  }, [user.id, toast, t]);

  // Check terms acceptance on mount
  useEffect(() => {
    const termsKey = `ayn_terms_accepted_${user.id}`;
    const accepted = localStorage.getItem(termsKey) === 'true';
    setHasAcceptedTerms(accepted);
  }, [user.id]);

  // Ref to prevent multiple device tracking calls
  const hasTrackedDevice = useRef(false);

  // Load all auth data on mount and track device login
  useEffect(() => {
    checkAccess();
    checkAdminRole();
    loadUserProfile();
    
    // Track device login only once per session
    if (!hasTrackedDevice.current) {
      hasTrackedDevice.current = true;
      trackDeviceLogin(user.id);
    }
  }, [checkAccess, checkAdminRole, loadUserProfile, user.id]);

  return {
    hasAccess,
    hasAcceptedTerms,
    isAdmin,
    userProfile,
    checkAccess,
    checkAdminRole,
    loadUserProfile,
    acceptTerms
  };
};
