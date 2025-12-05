import { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { AYNLoader, DashboardLoader, PageLoader, TimeoutError } from '@/components/ui/page-loader';

// Lazy load heavy components for better initial load time
const LandingPage = lazy(() => import('@/components/LandingPage'));
const Dashboard = lazy(() => import('@/components/Dashboard'));

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasTimeout, setHasTimeout] = useState(false);
  const loadingResolved = useRef(false);

  useEffect(() => {
    // Timeout after 10 seconds if auth doesn't respond
    const timeoutId = setTimeout(() => {
      if (!loadingResolved.current) {
        setHasTimeout(true);
        setLoading(false);
      }
    }, 10000);

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        loadingResolved.current = true;
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadingResolved.current = true;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // Show timeout error with retry option
  if (hasTimeout) {
    return <TimeoutError onRetry={() => window.location.reload()} />;
  }

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
