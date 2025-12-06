import { useState, useCallback, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { trackDeviceLogin } from '@/hooks/useDeviceTracking';
import type { UserProfile, UseAuthReturn } from '@/types/dashboard.types';

const MAX_AUTH_FAILURES = 2;

export const useAuth = (user: User, session: Session): UseAuthReturn => {
  const [hasAccess, setHasAccess] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // Refs for tracking device and auth failures
  const hasTrackedDevice = useRef(false);
  const authFailureCount = useRef(0);
  
  
  // Stable error handler using ref pattern
  const handleAuthFailure = useCallback((error: { code?: string; message?: string }, context: string) => {
    console.error(`Auth error in ${context}:`, error);
    
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

      authFailureCount.current = 0;

      if (!data) {
        setHasAccess(false);
        return;
      }

      const isActive = data.is_active && (!data.expires_at || new Date(data.expires_at) > new Date());
      setHasAccess(isActive);
    } catch (error) {
      handleAuthFailure(error as { code?: string; message?: string }, 'checkAccess');
    }
  }, [user.id, handleAuthFailure]);

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

      authFailureCount.current = 0;
      setIsAdmin(data?.role === 'admin');
    } catch (error) {
      handleAuthFailure(error as { code?: string; message?: string }, 'checkAdminRole');
    }
  }, [user.id, handleAuthFailure]);

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

      authFailureCount.current = 0;
      if (data) {
        setUserProfile(data as UserProfile);
      }
    } catch (error) {
      handleAuthFailure(error as { code?: string; message?: string }, 'loadUserProfile');
    }
  }, [user.id, handleAuthFailure]);

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

      authFailureCount.current = 0;
      setHasAcceptedTerms(data?.has_accepted_terms ?? false);
    } catch (error) {
      handleAuthFailure(error as { code?: string; message?: string }, 'checkTermsAcceptance');
    }
  }, [user.id, handleAuthFailure]);

  // Accept terms and conditions - save to database
  const acceptTerms = useCallback(async () => {
    try {
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

  // Load all auth data on mount
  useEffect(() => {
    console.log('[useAuth] Effect triggered for user:', user?.id);
    
    if (!user?.id) {
      console.log('[useAuth] No user ID, setting loading false');
      setIsAuthLoading(false);
      return;
    }

    // Local flag prevents StrictMode double-run (resets on unmount)
    let hasRun = false;
    let isMounted = true;
    
    // Timeout IDs declared at top level for proper cleanup
    let initDelay: NodeJS.Timeout;
    let safetyTimeout: NodeJS.Timeout;

    const runAuthChecks = async () => {
      // Prevent double-run in StrictMode
      if (hasRun) {
        console.log('[useAuth] Already ran, skipping');
        return;
      }
      hasRun = true;

      // Start safety timeout before queries
      safetyTimeout = setTimeout(() => {
        if (isMounted) {
          console.warn('[useAuth] ⚠️ Safety timeout - queries taking >10s');
          setIsAuthLoading(false);
        }
      }, 10000);

      try {
        // Session is passed from Index.tsx - no need to fetch it again
        // This avoids the getSession() deadlock that was causing queries to hang
        console.log('[useAuth] Session available ✓ Starting queries for user:', user.id);

        // Run all queries in parallel
        const [accessResult, roleResult, profileResult, settingsResult] = await Promise.all([
          supabase.from('access_grants').select('is_active, expires_at').eq('user_id', user.id).maybeSingle(),
          supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle(),
          supabase.from('profiles').select('user_id, contact_person, company_name, business_type, business_context, avatar_url').eq('user_id', user.id).maybeSingle(),
          supabase.from('user_settings').select('has_accepted_terms').eq('user_id', user.id).maybeSingle()
        ]);

        console.log('[useAuth] ✓ Queries complete:', {
          access: !!accessResult.data,
          role: !!roleResult.data,
          profile: !!profileResult.data,
          settings: !!settingsResult.data
        });

        if (!isMounted) {
          console.log('[useAuth] Unmounted after queries');
          return;
        }

        // Process access
        if (!accessResult.error && accessResult.data) {
          const isActive = accessResult.data.is_active && 
            (!accessResult.data.expires_at || new Date(accessResult.data.expires_at) > new Date());
          console.log('[useAuth] → hasAccess:', isActive);
          setHasAccess(isActive);
        } else {
          console.log('[useAuth] → No access grant or error:', accessResult.error);
        }

        // Process admin role
        if (!roleResult.error) {
          const isAdminRole = roleResult.data?.role === 'admin';
          console.log('[useAuth] → isAdmin:', isAdminRole);
          setIsAdmin(isAdminRole);
        }

        // Process profile
        if (!profileResult.error && profileResult.data) {
          console.log('[useAuth] → userProfile:', profileResult.data);
          setUserProfile(profileResult.data as UserProfile);
        } else {
          console.log('[useAuth] → No profile or error:', profileResult.error);
        }

        // Process terms
        if (!settingsResult.error) {
          const hasTerms = settingsResult.data?.has_accepted_terms ?? false;
          console.log('[useAuth] → hasAcceptedTerms:', hasTerms);
          setHasAcceptedTerms(hasTerms);
        }

      } catch (error) {
        console.error('[useAuth] ❌ Error in auth checks:', error);
      } finally {
        clearTimeout(safetyTimeout);
        if (isMounted) {
          console.log('[useAuth] ✓ Complete - setting isAuthLoading = false');
          setIsAuthLoading(false);
        }
      }
    };

    // Start after 100ms delay to ensure Supabase client is ready
    initDelay = setTimeout(() => {
      console.log('[useAuth] Init delay complete, starting checks');
      runAuthChecks();
    }, 100);

    // Track device login (non-blocking)
    if (!hasTrackedDevice.current) {
      hasTrackedDevice.current = true;
      setTimeout(() => trackDeviceLogin(user.id), 0);
    }

    // Cleanup - clear both timeouts and prevent stale updates
    return () => {
      console.log('[useAuth] Cleanup called');
      isMounted = false;
      clearTimeout(initDelay);
      clearTimeout(safetyTimeout);
      // hasRun resets automatically (local variable)
    };
  }, [user.id]);

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
