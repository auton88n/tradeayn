import { useState, useCallback, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { trackDeviceLogin } from '@/hooks/useDeviceTracking';
import type { UserProfile, UseAuthReturn } from '@/types/dashboard.types';

// Supabase config - using direct fetch to avoid client deadlocks

// Get URL and key from environment - centralized source of truth
const SUPABASE_URL = 'https://dfkoxuokfkttjhfjcecx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw';

const QUERY_TIMEOUT_MS = 5000;

// Helper function for direct REST API calls
const fetchFromSupabase = async (
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<any> => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': options.method === 'POST' ? 'return=minimal' : 'return=representation',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  // For upserts with return=minimal, there's no body
  if (options.method === 'POST' && response.status === 201) {
    return { success: true };
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

// Retry helper for transient failures
const fetchWithRetry = async (
  endpoint: string,
  token: string,
  retries = 2
): Promise<any> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchFromSupabase(endpoint, token);
    } catch (error) {
      if (attempt === retries) {
        console.error(`Auth query failed after ${retries + 1} attempts:`, endpoint, error);
        return null;
      }
      // Wait before retry
      await new Promise(r => setTimeout(r, 300));
    }
  }
  return null;
};

export const useAuth = (user: User, session: Session): UseAuthReturn => {
  const [hasAccess, setHasAccess] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDuty, setIsDuty] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const { toast } = useToast();
  
  const hasTrackedDevice = useRef(false);

  // Check if user has active access - uses direct fetch
  const checkAccess = useCallback(async () => {
    try {
      const data = await fetchFromSupabase(
        `access_grants?user_id=eq.${user.id}&select=is_active,expires_at`,
        session.access_token
      );

      if (!data || data.length === 0) {
        setHasAccess(false);
        return;
      }

      const record = data[0];
      const isActive = record.is_active && (!record.expires_at || new Date(record.expires_at) > new Date());
      setHasAccess(isActive);
    } catch {
      // Silent failure - access denied by default
    }
  }, [user.id, session.access_token]);

  // Check if user is admin or duty - uses direct fetch
  const checkAdminRole = useCallback(async () => {
    try {
      const data = await fetchFromSupabase(
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
      const data = await fetchFromSupabase(
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

  // Accept terms and conditions - uses direct fetch
  const acceptTerms = useCallback(async () => {
    try {
      // Use POST with upsert via Prefer header
      await fetch(`${SUPABASE_URL}/rest/v1/user_settings`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          user_id: user.id,
          has_accepted_terms: true,
          updated_at: new Date().toISOString()
        }),
      });

      setHasAcceptedTerms(true);
      // Also save to localStorage as backup
      localStorage.setItem(`terms_accepted_${user.id}`, 'true');
      
      toast({
        title: 'Welcome to AYN',
        description: 'Your AI companion is ready to assist you.'
      });
    } catch {
      // Even if DB fails, save to localStorage so modal doesn't show again
      localStorage.setItem(`terms_accepted_${user.id}`, 'true');
      setHasAcceptedTerms(true);
      
      toast({
        title: 'Welcome to AYN',
        description: 'Your AI companion is ready to assist you.'
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
          fetchWithRetry(`access_grants?user_id=eq.${user.id}&select=is_active,expires_at`, session.access_token),
          fetchWithRetry(`user_roles?user_id=eq.${user.id}&select=role`, session.access_token),
          fetchWithRetry(`profiles?user_id=eq.${user.id}&select=user_id,contact_person,company_name,business_type,avatar_url`, session.access_token),
          fetchWithRetry(`user_settings?user_id=eq.${user.id}&select=has_accepted_terms`, session.access_token)
        ]);

        if (!isMounted) return;

        const [accessData, roleData, profileData, settingsData] = results;

        // Process access (with null check)
        if (accessData && accessData.length > 0) {
          const record = accessData[0];
          const isActive = record.is_active && 
            (!record.expires_at || new Date(record.expires_at) > new Date());
          setHasAccess(isActive);
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
          if (dbTermsAccepted) {
            setHasAcceptedTerms(true);
            // Sync to localStorage as backup
            localStorage.setItem(`terms_accepted_${user.id}`, 'true');
          } else {
            // Check localStorage as fallback if DB says not accepted
            const localTermsAccepted = localStorage.getItem(`terms_accepted_${user.id}`) === 'true';
            setHasAcceptedTerms(localTermsAccepted);
          }
        } else {
          // DB query failed - use localStorage fallback
          const localTermsAccepted = localStorage.getItem(`terms_accepted_${user.id}`) === 'true';
          setHasAcceptedTerms(localTermsAccepted);
        }

      } catch (error) {
        console.error('Auth queries batch failed:', error);
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    // Small delay to ensure token is propagated
    const timer = setTimeout(() => {
      runQueries();
    }, 100);

    // Track device (non-blocking)
    if (!hasTrackedDevice.current) {
      hasTrackedDevice.current = true;
      setTimeout(() => trackDeviceLogin(user.id, session.access_token), 0);
    }

    return () => {
      isMounted = false;
      clearTimeout(timer);
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
    checkAccess,
    checkAdminRole,
    loadUserProfile,
    acceptTerms
  };
};
