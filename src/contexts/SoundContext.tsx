import React, { createContext, useContext, ReactNode } from 'react';
import { useAYNSounds } from '@/hooks/useAYNSounds';
import { SoundType } from '@/lib/soundGenerator';

interface SoundContextType {
  playSound: (soundType: SoundType) => void;
  playModeChange: (mode: string) => void;
  playEmotion: (emotion: string) => void;
  enabled: boolean;
  volume: number;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  toggleEnabled: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider = ({ children }: { children: ReactNode }) => {
  const sounds = useAYNSounds();

  return (
    <SoundContext.Provider value={sounds}>
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
