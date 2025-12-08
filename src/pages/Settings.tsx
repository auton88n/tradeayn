import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { AccountPreferences } from '@/components/settings/AccountPreferences';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { PrivacySettings } from '@/components/settings/PrivacySettings';
import { SessionManagement } from '@/components/settings/SessionManagement';
import { PageLoader } from '@/components/ui/page-loader';

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        );
        
        // Use getSession instead of getUser to get both user and session
        const authPromise = supabase.auth.getSession();
        const { data: { session: currentSession } } = await Promise.race([authPromise, timeoutPromise]) as Awaited<ReturnType<typeof supabase.auth.getSession>>;
        
        if (!currentSession?.user) {
          navigate('/');
          return;
        }
        setUser(currentSession.user);
        setSession(currentSession);
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  if (loading) {
    return <PageLoader />;
  }

  if (!user || !session) {
    return null;
  }

  return (
    <SettingsLayout>
      {{
        account: <AccountPreferences userId={user.id} userEmail={user.email || ''} accessToken={session.access_token} />,
        notifications: <NotificationSettings userId={user.id} />,
        privacy: <PrivacySettings userId={user.id} session={session} />,
        sessions: <SessionManagement userId={user.id} userEmail={user.email || ''} />,
      }}
    </SettingsLayout>
  );
};

export default Settings;
