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
    let subscription: { unsubscribe: () => void } | null = null;

    // Safety timeout - if auth doesn't resolve in 3 seconds, show landing page
    const authTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('[Index] Auth timeout, showing landing page');
        setLoading(false);
      }
    }, 3000);

    try {
      // Set up auth state listener
      const { data } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (!mounted) return;
          clearTimeout(authTimeout);
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );
      subscription = data.subscription;
    } catch (err) {
      console.error('[Index] onAuthStateChange setup failed:', err);
      if (mounted) setLoading(false);
    }

    // Check for existing session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (mounted) {
          clearTimeout(authTimeout);
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('[Index] Auth session check failed:', error);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      clearTimeout(authTimeout);
      subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return <AYNLoader />;
  }

  return user && session ? (
    <Suspense fallback={<DashboardLoader />}>
      <Dashboard user={user} session={session} />
    </Suspense>
  ) : (
    <Suspense fallback={<PageLoader />}>
      <LandingPage />
    </Suspense>
  );
};

export default Index;
