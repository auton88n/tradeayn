import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { AccountPreferences } from '@/components/settings/AccountPreferences';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { PrivacySettings } from '@/components/settings/PrivacySettings';
import { SessionManagement } from '@/components/settings/SessionManagement';
import { MFASettings } from '@/components/settings/MFASettings';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const Settings = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking admin role:', error);
        }

        setIsAdmin(data?.role === 'admin');
      } catch (err) {
        console.error('Failed to check admin role:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminRole();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <SettingsLayout showSecurityTab={isAdmin}>
      {{
        account: <AccountPreferences />,
        notifications: <NotificationSettings />,
        privacy: <PrivacySettings />,
        sessions: <SessionManagement />,
        security: isAdmin ? <MFASettings /> : undefined,
      }}
    </SettingsLayout>
  );
};

export default Settings;
