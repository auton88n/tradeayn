import { useState, useCallback, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { trackDeviceLogin } from '@/hooks/useDeviceTracking';
import type { UserProfile, UseAuthReturn } from '@/types/dashboard.types';

const QUERY_TIMEOUT_MS = 5000;

export const useAuth = (user: User, session: Session): UseAuthReturn => {
  const [hasAccess, setHasAccess] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const hasTrackedDevice = useRef(false);

  // Check if user has active access
  const checkAccess = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('access_grants')
        .select('is_active, expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('checkAccess error:', error);
        return;
      }

      if (!data) {
        setHasAccess(false);
        return;
      }

      const isActive = data.is_active && (!data.expires_at || new Date(data.expires_at) > new Date());
      setHasAccess(isActive);
    } catch (error) {
      console.error('checkAccess error:', error);
    }
  }, [user.id]);

  // Check if user is admin
  const checkAdminRole = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('checkAdminRole error:', error);
        return;
      }

      setIsAdmin(data?.role === 'admin');
    } catch (error) {
      console.error('checkAdminRole error:', error);
    }
  }, [user.id]);

  // Load user profile
  const loadUserProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, contact_person, company_name, business_type, business_context, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('loadUserProfile error:', error);
        return;
      }

      if (data) {
        setUserProfile(data as UserProfile);
      }
    } catch (error) {
      console.error('loadUserProfile error:', error);
    }
  }, [user.id]);

  // Check terms acceptance from database
  const checkTermsAcceptance = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('has_accepted_terms')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('checkTermsAcceptance error:', error);
        return;
      }

      setHasAcceptedTerms(data?.has_accepted_terms ?? false);
    } catch (error) {
      console.error('checkTermsAcceptance error:', error);
    }
  }, [user.id]);

  // Accept terms and conditions
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

  // Load all auth data on mount - IMMEDIATE execution, NO auth method calls
  useEffect(() => {
    console.log('[useAuth] Starting for user:', user?.id);
    
    if (!user?.id || !session) {
      console.log('[useAuth] No user/session, done');
      setIsAuthLoading(false);
      return;
    }

    let isMounted = true;
    let hasRun = false;

    const runQueries = async () => {
      if (hasRun) return;
      hasRun = true;

      console.log('[useAuth] Running queries immediately');

      try {
        // Race queries against timeout - prevents infinite hang
        const results = await Promise.race([
          Promise.all([
            supabase.from('access_grants').select('is_active, expires_at').eq('user_id', user.id).maybeSingle(),
            supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle(),
            supabase.from('profiles').select('user_id, contact_person, company_name, business_type, business_context, avatar_url').eq('user_id', user.id).maybeSingle(),
            supabase.from('user_settings').select('has_accepted_terms').eq('user_id', user.id).maybeSingle()
          ]),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout')), QUERY_TIMEOUT_MS)
          )
        ]);

        if (!isMounted) return;

        const [accessResult, roleResult, profileResult, settingsResult] = results;

        console.log('[useAuth] Queries complete:', {
          access: !accessResult.error,
          role: !roleResult.error,
          profile: !profileResult.error,
          settings: !settingsResult.error
        });

        // Process access
        if (!accessResult.error && accessResult.data) {
          const isActive = accessResult.data.is_active && 
            (!accessResult.data.expires_at || new Date(accessResult.data.expires_at) > new Date());
          setHasAccess(isActive);
        }

        // Process admin role
        if (!roleResult.error) {
          setIsAdmin(roleResult.data?.role === 'admin');
        }

        // Process profile
        if (!profileResult.error && profileResult.data) {
          setUserProfile(profileResult.data as UserProfile);
        }

        // Process terms
        if (!settingsResult.error) {
          setHasAcceptedTerms(settingsResult.data?.has_accepted_terms ?? false);
        }

      } catch (error) {
        console.error('[useAuth] Error:', error);
      } finally {
        if (isMounted) {
          console.log('[useAuth] Done');
          setIsAuthLoading(false);
        }
      }
    };

    // Execute IMMEDIATELY - no delays
    runQueries();

    // Track device (non-blocking)
    if (!hasTrackedDevice.current) {
      hasTrackedDevice.current = true;
      setTimeout(() => trackDeviceLogin(user.id), 0);
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id, session]);

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
