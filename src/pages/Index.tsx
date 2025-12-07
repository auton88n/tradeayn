import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { AYNLoader, DashboardLoader } from '@/components/ui/page-loader';
import { lazy, Suspense } from 'react';

// Lazy load Dashboard (authenticated users), direct import LandingPage (most common first view)
import LandingPage from '@/components/LandingPage';
const Dashboard = lazy(() => import('@/components/Dashboard'));

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false); // Start false - show landing page immediately
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session with 3-second timeout
        const timeoutPromise = new Promise<null>((resolve) => 
          setTimeout(() => resolve(null), 3000)
        );

        const sessionPromise = supabase.auth.getSession();
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (mounted && result && 'data' in result && result.data.session) {
          setSession(result.data.session);
          setUser(result.data.session.user);
          setLoading(true); // Only show loader when actually loading dashboard
        }
      } catch {
        // Silent failure - show landing page
      } finally {
        if (mounted) {
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session) {
          setSession(session);
          setUser(session.user);
          setLoading(true);
          setIsInitialized(true);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setLoading(false);
        } else if ((event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session) {
          setSession(session);
          setUser(session.user);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Show loader only during initial check OR when transitioning to dashboard
  if (!isInitialized || (loading && !user)) {
    return <AYNLoader />;
  }

  // Show dashboard if authenticated, landing page otherwise
  return user && session ? (
    <Suspense fallback={<DashboardLoader />}>
      <Dashboard user={user} session={session} />
    </Suspense>
  ) : (
    <LandingPage />
  );
};

export default Index;
