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
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();
  
  console.log('🔵 [useAuth] Hook initialized with user.id:', user?.id);
  
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
    console.log('🔵 [checkAccess] Starting query for user.id:', user.id);
    try {
      const { data, error } = await supabase
        .from('access_grants')
        .select('is_active, expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('🔵 [checkAccess] Query result:', { data, error });

      if (error) {
        console.error('❌ [checkAccess] Query error:', error);
        handleAuthFailure(error, 'checkAccess');
        return;
      }

      // Success - reset failure count
      resetAuthFailures();

      if (!data) {
        console.log('⚠️ [checkAccess] No data found, setting hasAccess=false');
        setHasAccess(false);
        return;
      }

      const isActive = data.is_active && (!data.expires_at || new Date(data.expires_at) > new Date());
      console.log('🟢 [checkAccess] Setting hasAccess to:', isActive);
      setHasAccess(isActive);
    } catch (error) {
      console.error('❌ [checkAccess] Caught exception:', error);
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

  // Check terms acceptance from database
  const checkTermsAcceptance = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('has_accepted_terms')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        handleAuthFailure(error, 'checkTermsAcceptance');
        return;
      }

      resetAuthFailures();
      setHasAcceptedTerms(data?.has_accepted_terms ?? false);
    } catch (error) {
      handleAuthFailure(error as { code?: string; message?: string }, 'checkTermsAcceptance');
    }
  }, [user.id, handleAuthFailure, resetAuthFailures]);

  // Accept terms and conditions - save to database
  const acceptTerms = useCallback(async () => {
    try {
      // Upsert user_settings with has_accepted_terms = true
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          has_accepted_terms: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving terms acceptance:', error);
        toast({
          title: 'Error',
          description: 'Failed to save terms acceptance. Please try again.',
          variant: 'destructive'
        });
        return;
      }

      setHasAcceptedTerms(true);
      toast({
        title: t('auth.welcomeTitle'),
        description: t('auth.welcomeDesc')
      });
    } catch (error) {
      console.error('Error accepting terms:', error);
    }
  }, [user.id, toast, t]);

  // Ref to prevent multiple device tracking calls
  const hasTrackedDevice = useRef(false);

  // Load all auth data on mount in parallel and track device login non-blocking
  useEffect(() => {
    console.log('🔵 [useAuth] useEffect triggered, user.id:', user.id);
    
    // Run all auth checks in parallel for faster loading
    Promise.all([
      checkAccess().then(() => console.log('✅ [useAuth] checkAccess complete')),
      checkAdminRole().then(() => console.log('✅ [useAuth] checkAdminRole complete')),
      loadUserProfile().then(() => console.log('✅ [useAuth] loadUserProfile complete')),
      checkTermsAcceptance().then(() => console.log('✅ [useAuth] checkTermsAcceptance complete'))
    ]).finally(() => {
      console.log('🟢 [useAuth] All checks complete, setting isAuthLoading=false');
      setIsAuthLoading(false);
    });
    
    // Track device login non-blocking (don't wait for it)
    if (!hasTrackedDevice.current) {
      hasTrackedDevice.current = true;
      // Use setTimeout to make it non-blocking
      setTimeout(() => {
        trackDeviceLogin(user.id);
      }, 0);
    }
  }, [checkAccess, checkAdminRole, loadUserProfile, checkTermsAcceptance, user.id]);

  return {
    hasAccess,
    hasAcceptedTerms,
    isAdmin,
    isAuthLoading,
    userProfile,
    checkAccess,
    checkAdminRole,
    loadUserProfile,
    acceptTerms
  };
};
