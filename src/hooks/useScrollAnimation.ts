import { useEffect, useRef, useState, useCallback } from 'react';
import { useDebugStore } from '@/stores/debugStore';

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  debugLabel?: string;
}

export const useScrollAnimation = (options: UseScrollAnimationOptions = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -100px 0px',
    triggerOnce = true,
    debugLabel = 'ScrollAnimation'
  } = options;

  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  // Use getState() to avoid subscribing to store changes
  const debugRef = useRef(useDebugStore.getState());

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const debug = debugRef.current;

    // Add debug yellow border to observed elements
    if (debug?.isDebugMode) {
      element.style.outline = '2px dotted hsl(50, 100%, 50%)';
      element.style.outlineOffset = '-2px';
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          
          // Debug logging (read current value from ref)
          const currentDebug = debugRef.current;
          if (currentDebug?.isDebugMode) {
            currentDebug.addIntersectionTrigger(debugLabel);
            console.log(`[ScrollAnimation] ${debugLabel} triggered`);
            // Flash green when triggered
            element.style.outline = '2px solid hsl(120, 100%, 40%)';
            setTimeout(() => {
              if (currentDebug?.isDebugMode) {
                element.style.outline = '2px dotted hsl(50, 100%, 50%)';
              } else {
                element.style.outline = '';
              }
            }, 500);
          }
          
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      element.style.outline = '';
      element.style.outlineOffset = '';
    };
  }, [threshold, rootMargin, triggerOnce, debugLabel]); // Removed debug from deps

  return [ref, isVisible] as const;
};
