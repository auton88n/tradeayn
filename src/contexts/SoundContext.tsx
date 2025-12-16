import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { getSoundGenerator, SoundType } from '@/lib/soundGenerator';
import { supabase } from '@/integrations/supabase/client';
import { supabaseApi } from '@/lib/supabaseApi';

interface SoundContextType {
  playSound: (soundType: SoundType) => void;
  playInstant: (soundType: SoundType) => void;
  playModeChange: (mode: string) => void;
  playEmotion: (emotion: string) => void;
  enabled: boolean;
  volume: number;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  toggleEnabled: () => void;
  isLoading: boolean;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

const VOLUME_STORAGE_KEY = 'ayn-sound-volume';

export const SoundProvider = ({ children }: { children: ReactNode }) => {
  const [enabled, setEnabledState] = useState(true);
  const [volume, setVolumeState] = useState(() => {
    if (typeof window === 'undefined') return 0.5;
    try {
      const stored = localStorage.getItem(VOLUME_STORAGE_KEY);
      return stored ? parseFloat(stored) : 0.5;
    } catch {
      return 0.5;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const soundGenerator = getSoundGenerator();

  // Load initial state from database using REST API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setIsLoading(false);
          return;
        }
        
        setUserId(session.user.id);
        setAccessToken(session.access_token);

        const data = await supabaseApi.get<{ in_app_sounds: boolean }[]>(
          `user_settings?user_id=eq.${session.user.id}&select=in_app_sounds`,
          session.access_token
        );

        if (data && data.length > 0) {
          setEnabledState(data[0].in_app_sounds ?? true);
        }
      } catch {
        // Silently fail, use default
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUserId(session.user.id);
        setAccessToken(session.access_token);
        
        try {
          const data = await supabaseApi.get<{ in_app_sounds: boolean }[]>(
            `user_settings?user_id=eq.${session.user.id}&select=in_app_sounds`,
            session.access_token
          );
          
          if (data && data.length > 0) {
            setEnabledState(data[0].in_app_sounds ?? true);
          }
        } catch {
          // Silently fail
        }
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        setAccessToken(null);
        setEnabledState(true); // Reset to default
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync with sound generator
  useEffect(() => {
    soundGenerator.setEnabled(enabled);
    soundGenerator.setVolume(volume);
  }, [enabled, volume, soundGenerator]);

  // Persist volume to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, volume.toString());
    } catch {
      // Ignore storage errors
    }
  }, [volume]);

  const setEnabled = useCallback(async (newEnabled: boolean) => {
    setEnabledState(newEnabled);
    
    // Sync to database if logged in using REST API
    if (userId && accessToken) {
      try {
        await supabaseApi.patch(
          `user_settings?user_id=eq.${userId}`,
          accessToken,
          { in_app_sounds: newEnabled, updated_at: new Date().toISOString() }
        );
      } catch {
        // Silently fail, local state already updated
      }
    }
  }, [userId, accessToken]);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, newVolume)));
  }, []);

  const toggleEnabled = useCallback(() => {
    setEnabled(!enabled);
  }, [enabled, setEnabled]);

  const playSound = useCallback((soundType: SoundType) => {
    if (!enabled) {
      return;
    }
    soundGenerator.play(soundType);
  }, [soundGenerator, enabled]);

  const playInstant = useCallback((soundType: SoundType) => {
    if (!enabled) {
      return;
    }
    soundGenerator.playInstant(soundType);
  }, [soundGenerator, enabled]);

  const playModeChange = useCallback((mode: string) => {
    if (!enabled) {
      return;
    }
    soundGenerator.playModeChange(mode);
  }, [soundGenerator, enabled]);

  const playEmotion = useCallback((emotion: string) => {
    if (!enabled) {
      return;
    }
    soundGenerator.playEmotion(emotion);
  }, [soundGenerator, enabled]);

  return (
    <SoundContext.Provider value={{
      playSound,
      playInstant,
      playModeChange,
      playEmotion,
      enabled,
      volume,
      setEnabled,
      setVolume,
      toggleEnabled,
      isLoading,
    }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSoundContext = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSoundContext must be used within SoundProvider');
  }
  return context;
};

// Optional hook that doesn't throw if outside provider
export const useSoundContextOptional = () => {
  return useContext(SoundContext);
};
