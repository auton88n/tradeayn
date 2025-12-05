// Eye Context Collector - Optimized for performance
// Gathers real-time signals for behavior matching with reduced update frequency

import { useState, useEffect, useCallback, useRef } from 'react';
import { EyeContext } from '@/types/eyeBehavior.types';

interface UseEyeContextProps {
  eyeRef?: React.RefObject<HTMLDivElement>;
  currentMode: string;
  isResponding: boolean;
  isUserTyping: boolean;
  messageCount: number;
}

export const useEyeContext = ({
  eyeRef,
  currentMode,
  isResponding,
  isUserTyping,
  messageCount,
}: UseEyeContextProps) => {
  const [context, setContext] = useState<EyeContext>({
    typingSpeed: 0,
    typingPauseDuration: 0,
    deletionCount: 0,
    mouseDistanceFromEye: 500,
    mouseVelocity: 0,
    isMouseIdle: true,
    idleDuration: 0,
    currentMode,
    lastAction: 'none',
    timeSinceLastAction: 0,
    messageCount,
    hasActiveResponse: false,
    isWaitingForResponse: false,
  });

  // Refs for tracking (prevents re-renders)
  const lastKeystrokeRef = useRef<number>(Date.now());
  const keystrokeCountRef = useRef<number>(0);
  const deletionCountRef = useRef<number>(0);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastMouseMoveRef = useRef<number>(Date.now());
  const lastActivityRef = useRef<number>(Date.now());
  const lastActionRef = useRef<{ action: EyeContext['lastAction']; time: number }>({ action: 'none', time: Date.now() });
  const mountedRef = useRef(true);

  // Track typing - no state updates, just refs
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const now = Date.now();
      lastActivityRef.current = now;
      
      if (e.key === 'Backspace' || e.key === 'Delete') {
        deletionCountRef.current++;
      } else if (e.key.length === 1) {
        keystrokeCountRef.current++;
      }
      
      lastKeystrokeRef.current = now;
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  // Track mouse - throttled, no frequent state updates
  useEffect(() => {
    let lastUpdate = 0;
    
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      // Throttle to 5fps max for mouse tracking
      if (now - lastUpdate < 200) return;
      lastUpdate = now;
      
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      lastMouseMoveRef.current = now;
      lastActivityRef.current = now;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Update context periodically - REDUCED to 500ms
  useEffect(() => {
    mountedRef.current = true;
    
    const updateInterval = setInterval(() => {
      if (!mountedRef.current) return;
      
      const now = Date.now();
      const timeSinceLastKeystroke = now - lastKeystrokeRef.current;
      const timeSinceLastMouseMove = now - lastMouseMoveRef.current;
      const timeSinceLastActivity = now - lastActivityRef.current;
      const timeSinceLastAction = now - lastActionRef.current.time;
      
      // Calculate typing speed (chars in last 5 seconds)
      const typingWindow = 5000;
      const typingSpeed = timeSinceLastKeystroke < typingWindow
        ? keystrokeCountRef.current / (typingWindow / 1000)
        : 0;
      
      // Calculate mouse distance from eye - only when needed
      let mouseDistanceFromEye = 500;
      if (eyeRef?.current) {
        const rect = eyeRef.current.getBoundingClientRect();
        const eyeCenterX = rect.left + rect.width / 2;
        const eyeCenterY = rect.top + rect.height / 2;
        mouseDistanceFromEye = Math.sqrt(
          Math.pow(lastMousePosRef.current.x - eyeCenterX, 2) + 
          Math.pow(lastMousePosRef.current.y - eyeCenterY, 2)
        );
      }
      
      const newIsMouseIdle = timeSinceLastMouseMove > 2000;
      
      // Only update state if meaningful values changed
      setContext(prev => {
        const hasChanged = 
          prev.typingSpeed !== typingSpeed ||
          prev.isMouseIdle !== newIsMouseIdle ||
          prev.hasActiveResponse !== isResponding ||
          prev.messageCount !== messageCount ||
          prev.currentMode !== currentMode ||
          prev.lastAction !== lastActionRef.current.action;
        
        if (!hasChanged) return prev;
        
        return {
          typingSpeed,
          typingPauseDuration: isUserTyping ? timeSinceLastKeystroke : 0,
          deletionCount: deletionCountRef.current,
          mouseDistanceFromEye,
          mouseVelocity: 0, // Removed velocity calculation for performance
          isMouseIdle: newIsMouseIdle,
          idleDuration: timeSinceLastActivity,
          currentMode,
          lastAction: lastActionRef.current.action,
          timeSinceLastAction,
          messageCount,
          hasActiveResponse: isResponding,
          isWaitingForResponse: isUserTyping && !isResponding,
        };
      });
      
      // Decay deletion count over time
      if (deletionCountRef.current > 0 && timeSinceLastKeystroke > 3000) {
        deletionCountRef.current = Math.max(0, deletionCountRef.current - 1);
      }
      
      // Decay keystroke count
      if (timeSinceLastKeystroke > 5000) {
        keystrokeCountRef.current = 0;
      }
    }, 500); // Reduced from 200ms to 500ms

    return () => {
      mountedRef.current = false;
      clearInterval(updateInterval);
    };
  }, [eyeRef, currentMode, isResponding, isUserTyping, messageCount]);

  // Track specific actions
  const recordAction = useCallback((action: EyeContext['lastAction']) => {
    const now = Date.now();
    lastActionRef.current = { action, time: now };
    lastActivityRef.current = now;
    
    setContext(prev => ({
      ...prev,
      lastAction: action,
      timeSinceLastAction: 0,
      idleDuration: 0,
    }));
  }, []);

  return { context, recordAction };
};
