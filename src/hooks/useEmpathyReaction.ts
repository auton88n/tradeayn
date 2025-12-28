/**
 * useEmpathyReaction - Real-time empathy detection as user types
 * Analyzes user emotion and triggers appropriate AYN eye reactions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { analyzeUserEmotion, getEmpathyResponse, EmpathyResponse, UserEmotion } from '@/utils/userEmotionDetection';
import { useAYNEmotion, AYNEmotion } from '@/contexts/AYNEmotionContext';
import { useEmotionOrchestrator } from '@/hooks/useEmotionOrchestrator';
import { hapticFeedback, HapticType } from '@/lib/haptics';

interface EmpathyState {
  userEmotion: UserEmotion;
  empathyResponse: EmpathyResponse | null;
  isAnalyzing: boolean;
}

interface UseEmpathyReactionOptions {
  debounceMs?: number;
  minTextLength?: number;
  enabled?: boolean;
}

export const useEmpathyReaction = (
  typingContent: string,
  options: UseEmpathyReactionOptions = {}
) => {
  const {
    debounceMs = 400,
    minTextLength = 3,
    enabled = true,
  } = options;

  const [empathyState, setEmpathyState] = useState<EmpathyState>({
    userEmotion: 'neutral',
    empathyResponse: null,
    isAnalyzing: false,
  });

  const { 
    triggerBlink, 
    triggerEmpathyBlink,
    triggerEmpathyPulse,
    bumpActivity,
  } = useAYNEmotion();
  
  const { orchestrateEmotionChange } = useEmotionOrchestrator();
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastEmotionRef = useRef<UserEmotion>('neutral');
  const lastHapticTimeRef = useRef<number>(0);

  // Map EmpathyResponse aynEmotion to context AYNEmotion
  const mapToContextEmotion = useCallback((empathyEmotion: string): AYNEmotion => {
    const emotionMap: Record<string, AYNEmotion> = {
      'calm': 'calm',
      'happy': 'happy',
      'excited': 'excited',
      'thinking': 'thinking',
      'curious': 'curious',
    };
    return emotionMap[empathyEmotion] || 'calm';
  }, []);

  // Map haptic pattern from empathy response
  const triggerEmpathyHaptic = useCallback((pattern: string) => {
    const now = Date.now();
    // Prevent haptic spam - minimum 800ms between haptics
    if (now - lastHapticTimeRef.current < 800) return;
    lastHapticTimeRef.current = now;

    const hapticMap: Record<string, HapticType> = {
      'empathy': 'empathy',
      'comfort': 'comfort',
      'mirror-joy': 'excited',
      'patience': 'pulse',
      'calm': 'light',
      'curious': 'pulse',
      'celebration': 'excited',
      'reassurance': 'comfort',
    };
    
    const hapticType = hapticMap[pattern] || 'light';
    hapticFeedback(hapticType);
  }, []);

  // Analyze emotion when typing content changes
  useEffect(() => {
    if (!enabled) return;

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Skip if text too short
    if (typingContent.trim().length < minTextLength) {
      // Reset to neutral when input is cleared
      if (typingContent.trim().length === 0 && lastEmotionRef.current !== 'neutral') {
        lastEmotionRef.current = 'neutral';
        setEmpathyState({
          userEmotion: 'neutral',
          empathyResponse: null,
          isAnalyzing: false,
        });
      }
      return;
    }

    setEmpathyState(prev => ({ ...prev, isAnalyzing: true }));

    // Debounced analysis
    debounceRef.current = setTimeout(() => {
      const analysis = analyzeUserEmotion(typingContent);
      const empathyResponse = getEmpathyResponse(analysis.emotion);

      // Only trigger reactions if emotion changed significantly
      const emotionChanged = analysis.emotion !== lastEmotionRef.current;
      const isSignificantEmotion = analysis.emotion !== 'neutral' && analysis.intensity > 0.3;

      if (emotionChanged && isSignificantEmotion) {
        lastEmotionRef.current = analysis.emotion;
        
        // Map to AYN emotion and trigger reaction
        const aynEmotion = mapToContextEmotion(empathyResponse.aynEmotion);
        
        // Orchestrate the emotion change (handles sound + visual sync)
        orchestrateEmotionChange(aynEmotion, { skipSound: true });
        
        // Trigger appropriate blink pattern and pulse
        if (empathyResponse.blinkPattern === 'slow-comfort') {
          triggerEmpathyBlink();
          triggerEmpathyPulse(); // Gentle pulse for comfort
        } else if (empathyResponse.blinkPattern === 'quick-attentive') {
          triggerBlink();
        } else if (empathyResponse.blinkPattern === 'double-understanding') {
          triggerEmpathyBlink();
          triggerEmpathyPulse(); // Pulse for understanding
        }

        // Trigger haptic feedback
        triggerEmpathyHaptic(empathyResponse.hapticType);
        
        // Bump activity for particle effects
        bumpActivity();
      }

      setEmpathyState({
        userEmotion: analysis.emotion,
        empathyResponse,
        isAnalyzing: false,
      });
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [
    typingContent,
    enabled,
    debounceMs,
    minTextLength,
    mapToContextEmotion,
    orchestrateEmotionChange,
    triggerBlink,
    triggerEmpathyBlink,
    triggerEmpathyPulse,
    triggerEmpathyHaptic,
    bumpActivity,
  ]);

  // Reset empathy state when user stops typing for a while
  const resetEmpathy = useCallback(() => {
    lastEmotionRef.current = 'neutral';
    setEmpathyState({
      userEmotion: 'neutral',
      empathyResponse: null,
      isAnalyzing: false,
    });
  }, []);

  return {
    ...empathyState,
    resetEmpathy,
    // Expose for EmotionalEye props
    pupilReaction: empathyState.empathyResponse?.pupilReaction || 'normal',
    blinkPattern: empathyState.empathyResponse?.blinkPattern || 'normal',
    colorIntensity: empathyState.empathyResponse?.colorIntensity || 0.5,
  };
};
