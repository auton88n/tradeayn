import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Loader2 } from 'lucide-react';
export const NotificationSettings = () => {
  const {
    t
  } = useLanguage();
  const {
    settings,
    loading,
    updating,
    updateSettings
  } = useUserSettings();
  if (loading || !settings) {
    return <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>;
  }
  return <div className="space-y-6">
      <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50">
        <h2 className="text-xl font-semibold mb-6">{t('settings.emailNotifications')}</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings.systemAlerts')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.systemAlertsDesc')}
              </p>
            </div>
            <Switch checked={settings.email_system_alerts} onCheckedChange={checked => updateSettings({
            email_system_alerts: checked
          })} disabled={updating} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings.usageWarnings')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.usageWarningsDesc')}
              </p>
            </div>
            <Switch checked={settings.email_usage_warnings} onCheckedChange={checked => updateSettings({
            email_usage_warnings: checked
          })} disabled={updating} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings.marketing')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.marketingDesc')}
              </p>
            </div>
            <Switch checked={settings.email_marketing} onCheckedChange={checked => updateSettings({
            email_marketing: checked
          })} disabled={updating} />
          </div>

          
        </div>
      </Card>

      <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50">
        <h2 className="text-xl font-semibold mb-6">{t('settings.inAppNotifications')}</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings.sounds')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.soundsDesc')}
              </p>
            </div>
            <Switch checked={settings.in_app_sounds} onCheckedChange={checked => updateSettings({
            in_app_sounds: checked
          })} disabled={updating} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings.desktopNotifications')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.desktopNotificationsDesc')}
              </p>
            </div>
            <Switch checked={settings.desktop_notifications} onCheckedChange={checked => updateSettings({
            desktop_notifications: checked
          })} disabled={updating} />
          </div>
        </div>
      </Card>
    </div>;
};