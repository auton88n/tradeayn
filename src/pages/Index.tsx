import { useState, useEffect, lazy, Suspense } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { AYNLoader, DashboardLoader, PageLoader } from '@/components/ui/page-loader';

// Lazy load heavy components for better initial load time
const LandingPage = lazy(() => import('@/components/LandingPage'));
const Dashboard = lazy(() => import('@/components/Dashboard'));

// Validate session by making a test query
const validateSession = async (session: Session): Promise<Session | null> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', session.user.id)
      .maybeSingle();
    
    // If we get a JWT error or auth error, session is invalid
    if (error && (error.code === 'PGRST301' || error.message?.includes('JWT') || error.code === '401')) {
      console.warn('Invalid session detected, clearing auth state');
      localStorage.removeItem('sb-dfkoxuokfkttjhfjcecx-auth-token');
      sessionStorage.clear();
      return null;
    }
    
    return session;
  } catch (err) {
    console.error('Session validation failed:', err);
    localStorage.removeItem('sb-dfkoxuokfkttjhfjcecx-auth-token');
    sessionStorage.clear();
    return null;
  }
};

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Fallback: if auth doesn't respond in 8 seconds, show landing page anyway
    const fallbackTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth check timed out, proceeding to landing page');
        setLoading(false);
      }
    }, 8000);

    // Set up auth state listener - trust Supabase for normal auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        // Trust Supabase auth for normal events (no redundant validation)
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          return;
        }
        
        // Handle sign out
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        
        // For other events, update state normally
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session - trust Supabase without extra validation
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('Auth session check failed:', error);
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <AYNLoader />;
  }

  return user ? (
    <Suspense fallback={<DashboardLoader />}>
      <Dashboard user={user} />
    </Suspense>
  ) : (
    <Suspense fallback={<PageLoader />}>
      <LandingPage />
    </Suspense>
  );
};

export default Index;
