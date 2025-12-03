import { useState, useCallback, useRef } from 'react';
import type { AYNEmotion } from '@/contexts/AYNEmotionContext';
import type { BubbleType } from '@/utils/emotionMapping';

export interface FlyingBubble {
  id: string;
  content: string;
  status: 'flying' | 'absorbing' | 'done';
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
}

export interface ResponseBubble {
  id: string;
  content: string;
  type: BubbleType;
  isVisible: boolean;
  position: { x: number; y: number };
}

interface UseBubbleAnimationReturn {
  flyingBubble: FlyingBubble | null;
  responseBubbles: ResponseBubble[];
  startMessageAnimation: (
    content: string,
    inputPosition: { x: number; y: number },
    eyePosition: { x: number; y: number }
  ) => void;
  completeAbsorption: () => void;
  emitResponseBubble: (content: string, type: BubbleType) => void;
  clearResponseBubbles: () => void;
  dismissBubble: (id: string) => void;
}

export const useBubbleAnimation = (): UseBubbleAnimationReturn => {
  const [flyingBubble, setFlyingBubble] = useState<FlyingBubble | null>(null);
  const [responseBubbles, setResponseBubbles] = useState<ResponseBubble[]>([]);
  const bubbleIdRef = useRef(0);

  const startMessageAnimation = useCallback(
    (
      content: string,
      inputPosition: { x: number; y: number },
      eyePosition: { x: number; y: number }
    ) => {
      const id = `flying-${Date.now()}-${bubbleIdRef.current++}`;
      
      setFlyingBubble({
        id,
        content,
        status: 'flying',
        startPosition: inputPosition,
        endPosition: eyePosition,
      });

      // After flight completes, start absorption
      setTimeout(() => {
        setFlyingBubble((prev) =>
          prev?.id === id ? { ...prev, status: 'absorbing' } : prev
        );
      }, 500);
    },
    []
  );

  const completeAbsorption = useCallback(() => {
    setFlyingBubble((prev) =>
      prev ? { ...prev, status: 'done' } : null
    );
    // Clear after animation
    setTimeout(() => {
      setFlyingBubble(null);
    }, 200);
  }, []);

  const emitResponseBubble = useCallback((content: string, type: BubbleType) => {
    const id = `response-${Date.now()}-${bubbleIdRef.current++}`;
    
    // Calculate position based on existing bubbles - stack vertically from eye level
    const existingCount = responseBubbles.filter((b) => b.isVisible).length;
    const yOffset = existingCount * 50;
    
    const newBubble: ResponseBubble = {
      id,
      content,
      type,
      isVisible: true,
      position: { x: 0, y: yOffset },
    };

    setResponseBubbles((prev) => {
      // Keep max 3 visible bubbles
      const visible = prev.filter((b) => b.isVisible);
      if (visible.length >= 3) {
        // Hide oldest
        const oldest = visible[0];
        return [
          ...prev.map((b) =>
            b.id === oldest.id ? { ...b, isVisible: false } : b
          ),
          newBubble,
        ];
      }
      return [...prev, newBubble];
    });

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      setResponseBubbles((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isVisible: false } : b))
      );
    }, 10000);
  }, [responseBubbles]);

  const clearResponseBubbles = useCallback(() => {
    setResponseBubbles((prev) =>
      prev.map((b) => ({ ...b, isVisible: false }))
    );
  }, []);

  const dismissBubble = useCallback((id: string) => {
    setResponseBubbles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isVisible: false } : b))
    );
  }, []);

  return {
    flyingBubble,
    responseBubbles,
    startMessageAnimation,
    completeAbsorption,
    emitResponseBubble,
    clearResponseBubbles,
    dismissBubble,
  };
};
