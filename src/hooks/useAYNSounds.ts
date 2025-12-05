import { useCallback, useEffect, useState } from 'react';
import { getSoundGenerator, SoundType } from '@/lib/soundGenerator';

const STORAGE_KEY = 'ayn-sound-preferences';

interface SoundPreferences {
  enabled: boolean;
  volume: number;
}

const DEFAULT_PREFERENCES: SoundPreferences = {
  enabled: true,
  volume: 0.5,
};

export const useAYNSounds = () => {
  const [preferences, setPreferences] = useState<SoundPreferences>(() => {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
    }
    return DEFAULT_PREFERENCES;
  });

  const soundGenerator = getSoundGenerator();

  // Sync preferences with sound generator
  useEffect(() => {
    soundGenerator.setEnabled(preferences.enabled);
    soundGenerator.setVolume(preferences.volume);
  }, [preferences, soundGenerator]);

  // Persist preferences
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Ignore storage errors
    }
  }, [preferences]);

  const playSound = useCallback((soundType: SoundType) => {
    soundGenerator.play(soundType);
  }, [soundGenerator]);

  const playModeChange = useCallback((mode: string) => {
    soundGenerator.playModeChange(mode);
  }, [soundGenerator]);

  const playEmotion = useCallback((emotion: string) => {
    soundGenerator.playEmotion(emotion);
  }, [soundGenerator]);

  const setEnabled = useCallback((enabled: boolean) => {
    setPreferences(prev => ({ ...prev, enabled }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setPreferences(prev => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  const toggleEnabled = useCallback(() => {
    setPreferences(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  return {
    // Playback
    playSound,
    playModeChange,
    playEmotion,
    
    // Preferences
    enabled: preferences.enabled,
    volume: preferences.volume,
    setEnabled,
    setVolume,
    toggleEnabled,
  };
};
