import { useState, useCallback, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { trackDeviceLogin } from '@/hooks/useDeviceTracking';
import type { UserProfile, UseAuthReturn } from '@/types/dashboard.types';

export const useAuth = (user: User): UseAuthReturn => {
  const [hasAccess, setHasAccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Initialize hasAcceptedTerms synchronously from localStorage
  const termsKey = `ayn_terms_accepted_${user.id}`;
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(() => {
    return localStorage.getItem(termsKey) === 'true';
  });

  // Check if user has active access
  const checkAccess = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('access_grants')
        .select('is_active, expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking access:', error);
        return;
      }

      if (!data) {
        setHasAccess(false);
        return;
      }

      const isActive = data.is_active && (!data.expires_at || new Date(data.expires_at) > new Date());
      setHasAccess(isActive);
    } catch (error) {
      console.error('Access check error:', error);
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
        console.error('Error checking role:', error);
        return;
      }

      if (!data) {
        setIsAdmin(false);
        return;
      }

      setIsAdmin(data.role === 'admin');
    } catch (error) {
      console.error('Role check error:', error);
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
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setUserProfile(data as UserProfile);
      }
    } catch (error) {
      console.error('Profile loading error:', error);
    }
  }, [user.id]);

  // Accept terms and conditions
  const acceptTerms = useCallback(() => {
    localStorage.setItem(termsKey, 'true');
    setHasAcceptedTerms(true);

    toast({
      title: t('auth.welcomeTitle'),
      description: t('auth.welcomeDesc')
    });
  }, [termsKey, toast, t]);

  // Refs to prevent multiple calls
  const hasTrackedDevice = useRef(false);
  const hasInitialized = useRef(false);

  // Load all auth data on mount and track device login
  useEffect(() => {
    const initAuth = async () => {
      // Only set loading true on first initialization
      if (!hasInitialized.current) {
        setIsLoading(true);
      }
      
      // Run all checks in parallel
      await Promise.all([
        checkAccess(),
        checkAdminRole(),
        loadUserProfile()
      ]);
      
      hasInitialized.current = true;
      setIsLoading(false);
    };
    
    initAuth();
    
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
    isLoading,
    userProfile,
    checkAccess,
    checkAdminRole,
    loadUserProfile,
    acceptTerms
  };
};
