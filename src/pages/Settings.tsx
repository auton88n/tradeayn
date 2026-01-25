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
import { SEO, createBreadcrumbSchema } from '@/components/shared/SEO';

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get cached session immediately (no timeout needed - it's synchronous from cache)
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!currentSession?.user) {
        navigate('/');
        return;
      }
      setUser(currentSession.user);
      setSession(currentSession);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return <PageLoader />;
  }

  if (!user || !session) {
    return null;
  }

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', url: 'https://aynn.io/' },
    { name: 'Settings', url: 'https://aynn.io/settings' }
  ]);

  return (
    <>
      <SEO
        title="Account Settings"
        description="Manage your AYN account settings, notifications, privacy preferences, and active sessions."
        canonical="/settings"
        noIndex={true}
        jsonLd={breadcrumbSchema}
      />
      <SettingsLayout>
        {{
          account: <AccountPreferences userId={user.id} userEmail={user.email || ''} accessToken={session.access_token} />,
          notifications: <NotificationSettings userId={user.id} accessToken={session.access_token} />,
          privacy: <PrivacySettings userId={user.id} session={session} />,
          sessions: <SessionManagement userId={user.id} userEmail={user.email || ''} accessToken={session.access_token} />,
        }}
      </SettingsLayout>
    </>
  );
};

export default Settings;
