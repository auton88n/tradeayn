import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ruler } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DesignWorkspace } from '@/components/design/DesignWorkspace';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileBlockScreen from '@/components/engineering/MobileBlockScreen';

const DesignWorkspacePage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [userId, setUserId] = useState<string | undefined>();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
      setIsCheckingAuth(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setUserId(undefined);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isCheckingAuth && !userId) {
      navigate('/');
    }
  }, [isCheckingAuth, userId, navigate]);

  if (isCheckingAuth || !userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="animate-pulse">
          <Ruler className="w-12 h-12 text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (isMobile) {
    return <MobileBlockScreen />;
  }

  return <DesignWorkspace userId={userId} />;
};

export default DesignWorkspacePage;
