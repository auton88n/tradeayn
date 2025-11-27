import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export interface UserSettings {
  id: string;
  user_id: string;
  email_system_alerts: boolean;
  email_usage_warnings: boolean;
  email_marketing: boolean;
  email_weekly_summary: boolean;
  in_app_sounds: boolean;
  desktop_notifications: boolean;
  allow_personalization: boolean;
  store_chat_history: boolean;
  share_anonymous_data: boolean;
}

export interface DeviceSession {
  id: string;
  fingerprint_hash: string;
  device_info: any;
  first_seen: string;
  last_seen: string;
  login_count: number;
  is_trusted: boolean;
}

export const useUserSettings = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no settings exist, create default settings
        if (error.code === 'PGRST116') {
          const { data: newSettings, error: insertError } = await supabase
            .from('user_settings')
            .insert({ user_id: user.id })
            .select()
            .single();

          if (insertError) throw insertError;
          setSettings(newSettings);
        } else {
          throw error;
        }
      } else {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('device_fingerprints')
        .select('*')
        .eq('user_id', user.id)
        .order('last_seen', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!settings) return;

    setUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings({ ...settings, ...updates });
      toast({
        title: t('common.success'),
        description: t('settings.settingsSaved'),
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('device_fingerprints')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(sessions.filter(s => s.id !== sessionId));
      toast({
        title: t('common.success'),
        description: t('settings.sessionRevoked'),
      });
    } catch (error) {
      console.error('Error revoking session:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to revoke session',
        variant: 'destructive',
      });
    }
  };

  const signOutAllDevices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('device_fingerprints')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      await supabase.auth.signOut();
      
      toast({
        title: t('common.success'),
        description: t('settings.allDevicesSignedOut'),
      });
    } catch (error) {
      console.error('Error signing out all devices:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to sign out all devices',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchSessions();
  }, []);

  return {
    settings,
    sessions,
    loading,
    updating,
    updateSettings,
    revokeSession,
    signOutAllDevices,
    refetchSessions: fetchSessions,
  };
};
