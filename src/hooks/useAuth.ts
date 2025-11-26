import { useState, useCallback, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import type { UserProfile, UseAuthReturn } from '@/types/dashboard.types';

export const useAuth = (user: User): UseAuthReturn => {
  const [hasAccess, setHasAccess] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

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

  // Load all auth data on mount
  useEffect(() => {
    checkAccess();
    checkAdminRole();
    loadUserProfile();
  }, [checkAccess, checkAdminRole, loadUserProfile]);

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
