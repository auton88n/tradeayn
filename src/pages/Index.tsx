import { useState, useEffect, lazy, Suspense } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { AYNLoader, DashboardLoader, PageLoader } from '@/components/ui/page-loader';

// Lazy load heavy components for better initial load time
const LandingPage = lazy(() => import('@/components/LandingPage'));
const Dashboard = lazy(() => import('@/components/Dashboard'));

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

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    // Check for existing session with error handling
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
          setLoading(false); // Show landing page instead of hanging
        }
      });

    return () => {
      mounted = false;
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, [loading]);

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
