import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { AccountPreferences } from '@/components/settings/AccountPreferences';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { PrivacySettings } from '@/components/settings/PrivacySettings';
import { SessionManagement } from '@/components/settings/SessionManagement';
import { MFASettings } from '@/components/settings/MFASettings';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Settings = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      setIsAdmin(data?.role === 'admin');
    };

    checkAdminRole();
  }, []);

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
