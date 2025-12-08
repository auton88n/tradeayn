import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { AccountPreferences } from '@/components/settings/AccountPreferences';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { PrivacySettings } from '@/components/settings/PrivacySettings';
import { SessionManagement } from '@/components/settings/SessionManagement';

const Settings = () => {
  return (
    <SettingsLayout>
      {{
        account: <AccountPreferences />,
        notifications: <NotificationSettings />,
        privacy: <PrivacySettings />,
        sessions: <SessionManagement />,
      }}
    </SettingsLayout>
  );
};

export default Settings;
