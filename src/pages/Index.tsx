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
    // Timeout after 8 seconds if auth doesn't respond
    const timeoutId = setTimeout(() => {
      if (!loadingResolved.current) {
        console.log('Auth timeout - showing landing page');
        setHasTimeout(false); // Don't show error, just show landing
        setLoading(false);
      }
    }, 8000);

    // Check for existing session first (faster)
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth error:', error);
        }
        
        if (!loadingResolved.current) {
          loadingResolved.current = true;
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth init error:', err);
        if (!loadingResolved.current) {
          loadingResolved.current = true;
          setLoading(false);
        }
      }
    };

    initAuth();

    // Set up auth state listener for subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only handle auth changes after initial load
        if (loadingResolved.current) {
          setSession(session);
          setUser(session?.user ?? null);
        } else {
          // Also resolve initial loading if auth state fires first
          loadingResolved.current = true;
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

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
