import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Monitor, Smartphone, Tablet, LogOut, Key } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const SessionManagement = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { sessions, loading, revokeSession, signOutAllDevices } = useUserSettings();
  const [changingPassword, setChangingPassword] = useState(false);

  const handlePasswordChange = async () => {
    try {
      setChangingPassword(true);
      
      // Get current user email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('No email found');
      }
      
      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(
        user.email,
        { redirectTo: `${window.location.origin}/reset-password` }
      );
      
      if (error) throw error;
      
      toast({
        title: t('common.success'),
        description: t('settings.passwordResetEmailSent'),
      });
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to send password reset email',
        variant: 'destructive',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const getDeviceIcon = (deviceInfo: Record<string, unknown> | null) => {
    const type = String(deviceInfo?.type || '').toLowerCase();
    if (type.includes('mobile') || type.includes('phone')) return <Smartphone className="h-5 w-5" />;
    if (type.includes('tablet')) return <Tablet className="h-5 w-5" />;
    return <Monitor className="h-5 w-5" />;
  };

  const getDeviceName = (deviceInfo: Record<string, unknown> | null) => {
    return String(deviceInfo?.browser || deviceInfo?.os || t('settings.unknownDevice'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">{t('settings.activeSessions')}</h2>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <LogOut className="h-4 w-4" />
                {t('settings.signOutAll')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('settings.confirmSignOutAll')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('settings.confirmSignOutAllDesc')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={signOutAllDevices}>
                  {t('settings.signOutAll')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="space-y-4">
          {sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('settings.noActiveSessions')}
            </p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-start justify-between p-4 rounded-lg border border-border bg-background/50 hover:bg-background/80 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-muted-foreground">
                    {getDeviceIcon(session.device_info)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{getDeviceName(session.device_info)}</p>
                      {session.is_trusted && (
                        <Badge variant="secondary" className="text-xs">
                          {t('settings.trusted')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.lastActive')}: {formatDistanceToNow(new Date(session.last_seen), { addSuffix: true })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.loginCount')}: {session.login_count}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revokeSession(session.id)}
                  className="text-destructive hover:text-destructive"
                >
                  {t('settings.revoke')}
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50">
        <h2 className="text-xl font-semibold mb-6">{t('settings.security')}</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="font-medium">{t('settings.changePassword')}</p>
              <p className="text-sm text-muted-foreground">
                {t('settings.changePasswordDesc')}
              </p>
            </div>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handlePasswordChange}
              disabled={changingPassword}
            >
              {changingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('common.sending')}
                </>
              ) : (
                <>
                  <Key className="h-4 w-4" />
                  {t('settings.changePassword')}
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
