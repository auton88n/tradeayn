// Unified emotion orchestration - coordinates eye visuals, sounds, and haptics in sync
import { useCallback, useRef } from 'react';
import { AYNEmotion, useAYNEmotion, EMOTION_CONFIGS } from '@/contexts/AYNEmotionContext';
import { useSoundContextOptional } from '@/contexts/SoundContext';
import { hapticFeedback } from '@/lib/haptics';

// Transition timing per emotion - longer for natural flowing colors
export const EMOTION_TRANSITION_TIMING: Record<AYNEmotion, number> = {
  calm: 600,
  happy: 500,
  excited: 400,
  thinking: 600,
  frustrated: 500,
  curious: 500,
  sad: 800,
  mad: 400,
  bored: 700,
  comfort: 700,
  supportive: 600,
};

// Precise timing for perfect synchronization - sound plays at 30% of transition
const HAPTIC_DELAY = 40; // ms after eye starts changing - tight sync

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
    // Prevent rapid duplicate orchestrations (within 500ms for stability)
    const now = Date.now();
    if (
      lastOrchestrationRef.current?.emotion === newEmotion &&
      now - lastOrchestrationRef.current.time < 500
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

    // 2. DELAYED: Sound plays at 30% of transition (synchronized with eye movement)
    if (!options?.skipSound && soundContext?.enabled) {
      const soundDelay = Math.round(EMOTION_TRANSITION_TIMING[newEmotion] * 0.3);
      const soundTimeout = setTimeout(() => {
        soundContext.playEmotion(newEmotion);
      }, soundDelay);
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
