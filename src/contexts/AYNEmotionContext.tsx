import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type AYNEmotion = 'calm' | 'happy' | 'excited' | 'thinking' | 'frustrated' | 'curious';

export interface EmotionConfig {
  color: string;
  glowColor: string;
  ringClass: string;
  glowClass: string;
  irisScale: number;
  breathingSpeed: number;
  particleType: 'sparkle' | 'orbit' | 'energy' | 'none';
}

export const EMOTION_CONFIGS: Record<AYNEmotion, EmotionConfig> = {
  calm: {
    color: 'hsl(0, 0%, 100%)',
    glowColor: 'hsl(0, 0%, 100%)',
    ringClass: 'ring-foreground/20',
    glowClass: 'shadow-[0_0_30px_hsl(0,0%,50%,0.2)]',
    irisScale: 1,
    breathingSpeed: 3,
    particleType: 'none',
  },
  happy: {
    color: 'hsl(142, 71%, 45%)',
    glowColor: 'hsl(142, 71%, 65%)',
    ringClass: 'ring-green-400/50',
    glowClass: 'shadow-[0_0_40px_hsl(142,71%,45%,0.4)]',
    irisScale: 1.05,
    breathingSpeed: 2.5,
    particleType: 'sparkle',
  },
  excited: {
    color: 'hsl(25, 95%, 53%)',
    glowColor: 'hsl(25, 95%, 70%)',
    ringClass: 'ring-orange-400/50',
    glowClass: 'shadow-[0_0_50px_hsl(25,95%,53%,0.5)]',
    irisScale: 1.15,
    breathingSpeed: 2,
    particleType: 'energy',
  },
  thinking: {
    color: 'hsl(217, 91%, 60%)',
    glowColor: 'hsl(217, 91%, 75%)',
    ringClass: 'ring-blue-400/50',
    glowClass: 'shadow-[0_0_45px_hsl(217,91%,60%,0.45)]',
    irisScale: 0.85,
    breathingSpeed: 4,
    particleType: 'orbit',
  },
  frustrated: {
    color: 'hsl(0, 72%, 51%)',
    glowColor: 'hsl(0, 72%, 70%)',
    ringClass: 'ring-red-400/30',
    glowClass: 'shadow-[0_0_25px_hsl(0,72%,51%,0.25)]',
    irisScale: 0.9,
    breathingSpeed: 1.5,
    particleType: 'none',
  },
  curious: {
    color: 'hsl(270, 76%, 60%)',
    glowColor: 'hsl(270, 76%, 75%)',
    ringClass: 'ring-purple-400/40',
    glowClass: 'shadow-[0_0_35px_hsl(270,76%,60%,0.35)]',
    irisScale: 1.1,
    breathingSpeed: 2.8,
    particleType: 'sparkle',
  },
};

interface AYNEmotionContextType {
  emotion: AYNEmotion;
  emotionConfig: EmotionConfig;
  setEmotion: (emotion: AYNEmotion) => void;
  isAbsorbing: boolean;
  triggerAbsorption: () => void;
  isBlinking: boolean;
  triggerBlink: () => void;
  isResponding: boolean;
  setIsResponding: (responding: boolean) => void;
}

const AYNEmotionContext = createContext<AYNEmotionContextType | undefined>(undefined);

export const AYNEmotionProvider = ({ children }: { children: ReactNode }) => {
  const [emotion, setEmotionState] = useState<AYNEmotion>('calm');
  const [isAbsorbing, setIsAbsorbing] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isResponding, setIsResponding] = useState(false);

  const setEmotion = useCallback((newEmotion: AYNEmotion) => {
    setEmotionState(newEmotion);
  }, []);

  const triggerAbsorption = useCallback(() => {
    setIsAbsorbing(true);
    setTimeout(() => setIsAbsorbing(false), 300);
  }, []);

  const triggerBlink = useCallback(() => {
    setIsBlinking(true);
    setTimeout(() => setIsBlinking(false), 150);
  }, []);

  const emotionConfig = EMOTION_CONFIGS[emotion];

  return (
    <AYNEmotionContext.Provider
      value={{
        emotion,
        emotionConfig,
        setEmotion,
        isAbsorbing,
        triggerAbsorption,
        isBlinking,
        triggerBlink,
        isResponding,
        setIsResponding,
      }}
    >
      {children}
    </AYNEmotionContext.Provider>
  );
};

export const useAYNEmotion = () => {
  const context = useContext(AYNEmotionContext);
  if (!context) {
    throw new Error('useAYNEmotion must be used within an AYNEmotionProvider');
  }
  return context;
};
