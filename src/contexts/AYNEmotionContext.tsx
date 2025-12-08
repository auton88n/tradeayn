import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useMemo } from 'react';
import { hapticFeedback } from '@/lib/haptics';

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
    breathingSpeed: 4,
    particleType: 'none',
  },
  happy: {
    color: 'hsl(142, 71%, 45%)',
    glowColor: 'hsl(142, 71%, 65%)',
    ringClass: 'ring-green-400/50',
    glowClass: 'shadow-[0_0_40px_hsl(142,71%,45%,0.4)]',
    irisScale: 1.05,
    breathingSpeed: 3,
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
    breathingSpeed: 2.5,
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

// Keywords that trigger excitement/surprise reaction
const EXCITING_KEYWORDS = [
  'amazing', 'incredible', 'perfect', 'excellent', 'brilliant', 'fantastic',
  'wow', 'awesome', 'great', 'success', 'achievement', 'breakthrough',
  'important', 'urgent', 'critical', 'milestone', 'winner', 'congratulations',
  'exciting', 'love', 'best', 'outstanding', 'exceptional', 'remarkable',
  'رائع', 'ممتاز', 'مذهل', 'عظيم', 'مبروك', 'نجاح', 'إنجاز'
];

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
  // New smart life states
  isUserTyping: boolean;
  setIsUserTyping: (typing: boolean) => void;
  isAttentive: boolean;
  setIsAttentive: (attentive: boolean) => void;
  triggerAttentionBlink: () => void;
  lastActivityTime: number;
  updateActivity: () => void;
  // Surprise/excitement reaction
  isSurprised: boolean;
  triggerSurprise: () => void;
  detectExcitement: (text: string) => boolean;
  // Pulse effect for new messages
  isPulsing: boolean;
  triggerPulse: () => void;
  // Wink interaction
  isWinking: boolean;
  triggerWink: () => void;
}

const AYNEmotionContext = createContext<AYNEmotionContextType | undefined>(undefined);

export const AYNEmotionProvider = ({ children }: { children: ReactNode }) => {
  const [emotion, setEmotionState] = useState<AYNEmotion>('calm');
  const [isAbsorbing, setIsAbsorbing] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [isAttentive, setIsAttentive] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [isSurprised, setIsSurprised] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isWinking, setIsWinking] = useState(false);
  const blinkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const surpriseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pulseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const winkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setEmotion = useCallback((newEmotion: AYNEmotion) => {
    setEmotionState(prevEmotion => {
      // Trigger haptic feedback when emotion changes
      if (newEmotion !== prevEmotion) {
        hapticFeedback(newEmotion);
      }
      return newEmotion;
    });
  }, []);

  const triggerAbsorption = useCallback(() => {
    setIsAbsorbing(true);
    hapticFeedback('light'); // Subtle feedback when message absorbed
    setTimeout(() => setIsAbsorbing(false), 300);
  }, []);

  const triggerBlink = useCallback(() => {
    setIsBlinking(true);
    setTimeout(() => setIsBlinking(false), 150);
  }, []);

  // Double-blink for attention (when user starts typing)
  const triggerAttentionBlink = useCallback(() => {
    // Clear any existing blink timeout
    if (blinkTimeoutRef.current) {
      clearTimeout(blinkTimeoutRef.current);
    }
    
    // First blink
    setIsBlinking(true);
    setTimeout(() => {
      setIsBlinking(false);
      // Second blink after short pause
      blinkTimeoutRef.current = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 100);
      }, 150);
    }, 100);
  }, []);

  const updateActivity = useCallback(() => {
    setLastActivityTime(Date.now());
  }, []);

  // Trigger brief surprise/excitement enlargement
  const triggerSurprise = useCallback(() => {
    if (surpriseTimeoutRef.current) {
      clearTimeout(surpriseTimeoutRef.current);
    }
    setIsSurprised(true);
    hapticFeedback('excited'); // Two quick bursts for excitement
    surpriseTimeoutRef.current = setTimeout(() => {
      setIsSurprised(false);
    }, 600);
  }, []);

  // Detect exciting keywords in text
  const detectExcitement = useCallback((text: string): boolean => {
    const lowerText = text.toLowerCase();
    const hasExcitingKeyword = EXCITING_KEYWORDS.some(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
    if (hasExcitingKeyword) {
      triggerSurprise();
    }
    return hasExcitingKeyword;
  }, [triggerSurprise]);

  // Trigger pulse effect for new message receive
  const triggerPulse = useCallback(() => {
    if (pulseTimeoutRef.current) {
      clearTimeout(pulseTimeoutRef.current);
    }
    setIsPulsing(true);
    hapticFeedback('pulse'); // Subtle pulse for new message
    pulseTimeoutRef.current = setTimeout(() => {
      setIsPulsing(false);
    }, 400);
  }, []);

  // Empathetic response triggers - AYN responds to USER emotions
  const triggerEmpathyBlink = useCallback(() => {
    // Slow, understanding double-blink for when user is sad/anxious
    triggerBlink();
    setTimeout(() => triggerBlink(), 400);
  }, [triggerBlink]);

  const triggerEmpathyPulse = useCallback(() => {
    // Gentle pulse showing "I understand your feelings"
    hapticFeedback('empathy');
    triggerPulse();
  }, [triggerPulse]);

  // Trigger wink (asymmetric blink)
  const triggerWink = useCallback(() => {
    if (winkTimeoutRef.current) {
      clearTimeout(winkTimeoutRef.current);
    }
    setIsWinking(true);
    winkTimeoutRef.current = setTimeout(() => {
      setIsWinking(false);
    }, 250);
  }, []);

  // Memoize emotionConfig to prevent unnecessary re-renders
  const emotionConfig = useMemo(() => EMOTION_CONFIGS[emotion], [emotion]);

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
        isUserTyping,
        setIsUserTyping,
        isAttentive,
        setIsAttentive,
        triggerAttentionBlink,
        lastActivityTime,
        updateActivity,
        isSurprised,
        triggerSurprise,
        detectExcitement,
        isPulsing,
        triggerPulse,
        isWinking,
        triggerWink,
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
