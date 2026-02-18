import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AYNLoader } from '@/components/ui/page-loader';
import LandingPage from '@/components/LandingPage';

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    const isRecoveryFlow = window.location.pathname === '/reset-password' ||
                           window.location.hash.includes('type=recovery');
    if (isRecoveryFlow) return;

    let mounted = true;

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        if (data.session) {
          navigate('/chart-analyzer', { replace: true });
        } else {
          setShowLanding(true);
        }
      } catch {
        if (mounted) setShowLanding(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' && session) {
        navigate('/chart-analyzer', { replace: true });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) return <AYNLoader />;
  if (showLanding) return <LandingPage />;
  return null;
};

export default Index;
