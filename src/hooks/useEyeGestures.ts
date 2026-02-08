import { useRef, useCallback, useState } from 'react';
import { useAYNEmotion } from '@/contexts/AYNEmotionContext';
import { useSoundStore } from '@/stores/soundStore';
import { hapticFeedback } from '@/lib/haptics';

interface UseEyeGesturesOptions {
  onWink?: () => void;
  onSquish?: () => void;
  rapidClickThreshold?: number;
}

export const useEyeGestures = (options: UseEyeGesturesOptions = {}) => {
  const { rapidClickThreshold = 5 } = options;
  const { triggerSurprise, triggerBlink, triggerWink } = useAYNEmotion();
  const soundContext = useSoundStore();
  
  const [isSquished, setIsSquished] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef<number>(0);

  // Single click - playful wink
  const handleClick = useCallback(() => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current;
    lastClickTimeRef.current = now;

    // Count rapid clicks
    if (timeSinceLastClick < 400) {
      setClickCount(prev => {
        const newCount = prev + 1;
        
        // Easter egg: 5 rapid clicks = eye roll
        if (newCount >= rapidClickThreshold) {
          triggerSurprise();
          soundContext?.playSound('response-received');
          hapticFeedback('success');
          setClickCount(0);
          return 0;
        }
        return newCount;
      });
    } else {
      setClickCount(1);
    }

    // Reset click count after delay
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => setClickCount(0), 600);

    // Normal click - wink
    triggerWink?.();
    soundContext?.playSound('suggestion-click');
    hapticFeedback('light');
    options.onWink?.();
  }, [triggerWink, triggerSurprise, soundContext, options, rapidClickThreshold]);

  // Double click - surprise reaction
  const handleDoubleClick = useCallback(() => {
    triggerSurprise();
    soundContext?.playSound('message-absorb');
    hapticFeedback('medium');
  }, [triggerSurprise, soundContext]);

  // Long press start - squish effect
  const handlePressStart = useCallback(() => {
    longPressTimerRef.current = setTimeout(() => {
      setIsSquished(true);
      hapticFeedback('medium');
      options.onSquish?.();
    }, 500);
  }, [options]);

  // Long press end - release squish
  const handlePressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isSquished) {
      setIsSquished(false);
      triggerBlink();
      soundContext?.playSound('message-absorb');
      hapticFeedback('light');
    }
  }, [isSquished, triggerBlink, soundContext]);

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handlePressStart();
  }, [handlePressStart]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    handlePressEnd();
  }, [handlePressEnd]);

  // Mouse handlers for desktop
  const handleMouseDown = useCallback(() => {
    handlePressStart();
  }, [handlePressStart]);

  const handleMouseUp = useCallback(() => {
    handlePressEnd();
  }, [handlePressEnd]);

  const handleMouseLeave = useCallback(() => {
    handlePressEnd();
  }, [handlePressEnd]);

  return {
    isSquished,
    clickCount,
    handlers: {
      onClick: handleClick,
      onDoubleClick: handleDoubleClick,
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
    },
  };
};
