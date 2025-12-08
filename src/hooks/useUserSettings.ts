import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  device_info: Record<string, unknown> | null;
  first_seen: string;
  last_seen: string;
  login_count: number;
  is_trusted: boolean;
}

export const useUserSettings = () => {
  const { toast } = useToast();
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
          // Normalize newly created settings
          const normalizedNewSettings: UserSettings = {
            id: newSettings.id,
            user_id: newSettings.user_id,
            email_system_alerts: newSettings.email_system_alerts ?? true,
            email_usage_warnings: newSettings.email_usage_warnings ?? true,
            email_marketing: newSettings.email_marketing ?? false,
            email_weekly_summary: newSettings.email_weekly_summary ?? false,
            in_app_sounds: newSettings.in_app_sounds ?? true,
            desktop_notifications: newSettings.desktop_notifications ?? false,
            allow_personalization: newSettings.allow_personalization ?? false,
            store_chat_history: newSettings.store_chat_history ?? true,
            share_anonymous_data: newSettings.share_anonymous_data ?? false,
          };
          setSettings(normalizedNewSettings);
        } else {
          throw error;
        }
      } else {
        // Normalize settings data with defaults for boolean fields
        const normalizedSettings: UserSettings = {
          id: data.id,
          user_id: data.user_id,
          email_system_alerts: data.email_system_alerts ?? true,
          email_usage_warnings: data.email_usage_warnings ?? true,
          email_marketing: data.email_marketing ?? false,
          email_weekly_summary: data.email_weekly_summary ?? false,
          in_app_sounds: data.in_app_sounds ?? true,
          desktop_notifications: data.desktop_notifications ?? false,
          allow_personalization: data.allow_personalization ?? false,
          store_chat_history: data.store_chat_history ?? true,
          share_anonymous_data: data.share_anonymous_data ?? false,
        };
        setSettings(normalizedSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
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
      
      // Normalize session data with defaults for nullable fields
      const normalizedSessions: DeviceSession[] = (data || []).map(session => ({
        id: session.id,
        fingerprint_hash: session.fingerprint_hash,
        device_info: session.device_info as Record<string, unknown> | null,
        first_seen: session.first_seen,
        last_seen: session.last_seen,
        login_count: session.login_count ?? 0,
        is_trusted: session.is_trusted ?? false,
      }));
      setSessions(normalizedSessions);
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
        title: 'Success',
        description: 'Settings saved successfully',
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
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
        title: 'Success',
        description: 'Session revoked successfully',
      });
    } catch (error) {
      console.error('Error revoking session:', error);
      toast({
        title: 'Error',
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
        title: 'Success',
        description: 'All devices signed out successfully',
      });
    } catch (error) {
      console.error('Error signing out all devices:', error);
      toast({
        title: 'Error',
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
