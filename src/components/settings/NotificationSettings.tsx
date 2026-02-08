import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useSoundStore } from '@/stores/soundStore';
import { useDesktopNotifications } from '@/hooks/useDesktopNotifications';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Volume1, Volume2, Bell, BellOff } from 'lucide-react';

interface NotificationSettingsProps {
  userId: string;
  accessToken: string;
}

export const NotificationSettings = ({ userId, accessToken }: NotificationSettingsProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { settings, loading, updating, updateSettings } = useUserSettings(userId, accessToken);
  const soundContext = useSoundStore();
  const { isSupported, permission, requestPermission } = useDesktopNotifications();

  const handleSoundToggle = (checked: boolean) => {
    updateSettings({ in_app_sounds: checked });
    // Also update SoundContext for immediate effect
    soundContext?.setEnabled(checked);
  };

  const handleDesktopNotificationsToggle = async (checked: boolean) => {
    if (checked) {
      // Request permission when enabling
      const granted = await requestPermission();
      if (!granted) {
        toast({
          title: t('settings.notificationPermissionDenied') || 'Permission Denied',
          description: t('settings.notificationPermissionDeniedDesc') || 'Please enable notifications in your browser settings',
          variant: 'destructive',
        });
        return; // Don't save if permission denied
      }
    }
    updateSettings({ desktop_notifications: checked });
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            <Switch
              checked={settings.email_system_alerts}
              onCheckedChange={(checked) => updateSettings({ email_system_alerts: checked })}
              disabled={updating}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings.usageWarnings')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.usageWarningsEmailDesc') || 'Get notified by email when you reach 75% or 90% of your monthly message limit'}
              </p>
            </div>
            <Switch
              checked={settings.email_usage_warnings}
              onCheckedChange={(checked) => updateSettings({ email_usage_warnings: checked })}
              disabled={updating}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings.marketing')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.marketingDesc')}
              </p>
            </div>
            <Switch
              checked={settings.email_marketing}
              onCheckedChange={(checked) => updateSettings({ email_marketing: checked })}
              disabled={updating}
            />
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
            <Switch
              checked={settings.in_app_sounds}
              onCheckedChange={handleSoundToggle}
              disabled={updating}
            />
          </div>

          {settings.in_app_sounds && soundContext && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Volume</Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(soundContext.volume * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Volume1 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Slider
                  value={[soundContext.volume]}
                  onValueChange={([value]) => soundContext.setVolume(value)}
                  min={0}
                  max={1}
                  step={0.05}
                  className="flex-1"
                />
                <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                {settings.desktop_notifications && permission === 'granted' ? (
                  <Bell className="h-4 w-4 text-primary" />
                ) : (
                  <BellOff className="h-4 w-4 text-muted-foreground" />
                )}
                {t('settings.desktopNotifications')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.desktopNotificationsDesc')}
              </p>
              {!isSupported && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  {t('settings.browserNotSupported') || "Your browser doesn't support desktop notifications"}
                </p>
              )}
              {permission === 'denied' && (
                <p className="text-xs text-destructive">
                  {t('settings.notificationsBlocked') || 'Notifications blocked - check browser settings'}
                </p>
              )}
            </div>
            <Switch
              checked={settings.desktop_notifications && permission === 'granted'}
              onCheckedChange={handleDesktopNotificationsToggle}
              disabled={updating || !isSupported || permission === 'denied'}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
