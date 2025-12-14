// Unified emotion orchestration - coordinates eye visuals, sounds, and haptics in sync
import { useCallback, useRef } from 'react';
import { AYNEmotion, useAYNEmotion, EMOTION_CONFIGS } from '@/contexts/AYNEmotionContext';
import { useSoundContextOptional } from '@/contexts/SoundContext';
import { hapticFeedback } from '@/lib/haptics';

// Transition timing per emotion (matches sound duration for sync)
export const EMOTION_TRANSITION_TIMING: Record<AYNEmotion, number> = {
  calm: 200,
  happy: 150,
  excited: 120,
  thinking: 250,
  frustrated: 200,
  curious: 180,
  sad: 400,
  mad: 150,
  bored: 350,
  comfort: 300,
  supportive: 250,
};

// Precise timing for perfect synchronization
const SOUND_DELAY = 50; // ms after eye starts changing - reduced for tighter sync
const HAPTIC_DELAY = 80; // ms after eye starts changing

export const useEmotionOrchestrator = () => {
  const { setEmotion, triggerPulse, emotion: currentEmotion } = useAYNEmotion();
  const soundContext = useSoundContextOptional();
  const lastOrchestrationRef = useRef<{ emotion: AYNEmotion; time: number } | null>(null);
  const orchestrationTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Clear pending orchestrations
  const clearPendingOrchestrations = useCallback(() => {
    orchestrationTimeoutsRef.current.forEach(clearTimeout);
    orchestrationTimeoutsRef.current = [];
  }, []);

  // Main orchestration function - coordinates all emotion feedback in sync
  const orchestrateEmotionChange = useCallback((newEmotion: AYNEmotion, options?: {
    skipSound?: boolean;
    skipHaptic?: boolean;
    immediate?: boolean;
  }) => {
    // Prevent rapid duplicate orchestrations (within 150ms)
    const now = Date.now();
    if (
      lastOrchestrationRef.current?.emotion === newEmotion &&
      now - lastOrchestrationRef.current.time < 150
    ) {
      return;
    }

    // Clear any pending orchestrations from previous emotion change
    clearPendingOrchestrations();

    // Track this orchestration
    lastOrchestrationRef.current = { emotion: newEmotion, time: now };

    // 1. IMMEDIATE: Eye starts transitioning (visual cue begins)
    setEmotion(newEmotion);

    if (options?.immediate) {
      // For immediate mode, play sound and haptic right away
      if (!options?.skipSound && soundContext?.enabled) {
        soundContext.playEmotion(newEmotion);
      }
      if (!options?.skipHaptic) {
        hapticFeedback(newEmotion);
      }
      return;
    }

    // 2. DELAYED: Sound plays as eye is mid-transition (more impactful)
    if (!options?.skipSound && soundContext?.enabled) {
      const soundTimeout = setTimeout(() => {
        soundContext.playEmotion(newEmotion);
      }, SOUND_DELAY);
      orchestrationTimeoutsRef.current.push(soundTimeout);
    }

    // 3. DELAYED: Haptic confirms the emotion (tactile sync)
    if (!options?.skipHaptic) {
      const hapticTimeout = setTimeout(() => {
        hapticFeedback(newEmotion);
      }, HAPTIC_DELAY);
      orchestrationTimeoutsRef.current.push(hapticTimeout);
    }

    // 4. DELAYED: Quick pulse for emphasis on strong emotions
    if (['excited', 'mad', 'happy'].includes(newEmotion)) {
      const pulseTimeout = setTimeout(() => {
        triggerPulse();
      }, EMOTION_TRANSITION_TIMING[newEmotion] * 0.4);
      orchestrationTimeoutsRef.current.push(pulseTimeout);
    }
  }, [setEmotion, soundContext, triggerPulse, clearPendingOrchestrations]);

  // Quick emotion flash (for typing detection - faster response)
  const flashEmotion = useCallback((newEmotion: AYNEmotion) => {
    // Skip if same emotion (no duplicate reactions)
    if (currentEmotion === newEmotion) return;
    
    orchestrateEmotionChange(newEmotion, {
      skipHaptic: false,
      skipSound: false,
    });
  }, [currentEmotion, orchestrateEmotionChange]);

  // Reset to calm with graceful transition (no sound)
  const resetToCalm = useCallback(() => {
    clearPendingOrchestrations();
    setEmotion('calm');
    // Optional: play calm sound for smooth transition
    if (soundContext?.enabled) {
      setTimeout(() => {
        soundContext.playEmotion('calm');
      }, 100);
    }
  }, [setEmotion, clearPendingOrchestrations, soundContext]);

  return {
    orchestrateEmotionChange,
    flashEmotion,
    resetToCalm,
    clearPendingOrchestrations,
    getTransitionTiming: (emotion: AYNEmotion) => EMOTION_TRANSITION_TIMING[emotion],
  };
};
