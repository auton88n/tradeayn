import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { getSoundGenerator, SoundType } from '@/lib/soundGenerator';
import { supabase } from '@/integrations/supabase/client';

interface SoundContextType {
  playSound: (soundType: SoundType) => void;
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

  const soundGenerator = getSoundGenerator();

  // Load initial state from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }
        
        setUserId(user.id);

        const { data, error } = await supabase
          .from('user_settings')
          .select('in_app_sounds')
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          setEnabledState(data.in_app_sounds ?? true);
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
        // Reload settings for new user
        const { data } = await supabase
          .from('user_settings')
          .select('in_app_sounds')
          .eq('user_id', session.user.id)
          .single();
        
        if (data) {
          setEnabledState(data.in_app_sounds ?? true);
        }
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
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
    
    // Sync to database if logged in
    if (userId) {
      try {
        await supabase
          .from('user_settings')
          .update({ in_app_sounds: newEnabled, updated_at: new Date().toISOString() })
          .eq('user_id', userId);
      } catch {
        // Silently fail, local state already updated
      }
    }
  }, [userId]);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, newVolume)));
  }, []);

  const toggleEnabled = useCallback(() => {
    setEnabled(!enabled);
  }, [enabled, setEnabled]);

  const playSound = useCallback((soundType: SoundType) => {
    soundGenerator.play(soundType);
  }, [soundGenerator]);

  const playModeChange = useCallback((mode: string) => {
    soundGenerator.playModeChange(mode);
  }, [soundGenerator]);

  const playEmotion = useCallback((emotion: string) => {
    soundGenerator.playEmotion(emotion);
  }, [soundGenerator]);

  return (
    <SoundContext.Provider value={{
      playSound,
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
