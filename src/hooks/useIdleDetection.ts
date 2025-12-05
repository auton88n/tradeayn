import { useState, useEffect, useCallback, useRef } from 'react';

interface IdleState {
  isIdle: boolean;
  isDeepIdle: boolean;
  secondsSinceActivity: number;
}

interface UseIdleDetectionOptions {
  idleThreshold?: number; // seconds before considered idle
  deepIdleThreshold?: number; // seconds before deep idle (pause animations)
}

export const useIdleDetection = ({
  idleThreshold = 10,
  deepIdleThreshold = 30,
}: UseIdleDetectionOptions = {}): IdleState => {
  const [state, setState] = useState<IdleState>({
    isIdle: false,
    isDeepIdle: false,
    secondsSinceActivity: 0,
  });
  
  const lastActivityRef = useRef(Date.now());
  const intervalRef = useRef<number | null>(null);

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    // Only update state if we were idle (prevents unnecessary re-renders)
    setState(prev => {
      if (prev.isIdle || prev.isDeepIdle || prev.secondsSinceActivity > 0) {
        return { isIdle: false, isDeepIdle: false, secondsSinceActivity: 0 };
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    
    // Throttle event handling to prevent excessive calls
    let lastEventTime = 0;
    const throttledUpdate = () => {
      const now = Date.now();
      if (now - lastEventTime > 1000) { // Max once per second
        lastEventTime = now;
        updateActivity();
      }
    };

    events.forEach(event => {
      window.addEventListener(event, throttledUpdate, { passive: true });
    });

    // Check idle state every 2 seconds (reduced from 1 second)
    intervalRef.current = window.setInterval(() => {
      const now = Date.now();
      const secondsSince = Math.floor((now - lastActivityRef.current) / 1000);
      
      setState(prev => {
        const newIsIdle = secondsSince >= idleThreshold;
        const newIsDeepIdle = secondsSince >= deepIdleThreshold;
        
        // Only update if values changed
        if (prev.isIdle !== newIsIdle || 
            prev.isDeepIdle !== newIsDeepIdle || 
            prev.secondsSinceActivity !== secondsSince) {
          return {
            isIdle: newIsIdle,
            isDeepIdle: newIsDeepIdle,
            secondsSinceActivity: secondsSince,
          };
        }
        return prev;
      });
    }, 2000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, throttledUpdate);
      });
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [idleThreshold, deepIdleThreshold, updateActivity]);

  return state;
};
