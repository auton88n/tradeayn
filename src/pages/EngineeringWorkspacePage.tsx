import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HardHat } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EngineeringWorkspace } from '@/components/engineering/workspace/EngineeringWorkspace';

const EngineeringWorkspacePage = () => {
  const navigate = useNavigate();
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
      navigate('/services/civil-engineering');
    }
  }, [isCheckingAuth, userId, navigate]);

  if (isCheckingAuth || !userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="animate-pulse">
          <HardHat className="w-12 h-12 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return <EngineeringWorkspace userId={userId} />;
};

export default EngineeringWorkspacePage;
