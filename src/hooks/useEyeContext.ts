// Eye Context Collector
// Gathers real-time signals for behavior matching

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

  // Refs for tracking
  const lastKeystrokeRef = useRef<number>(Date.now());
  const keystrokeCountRef = useRef<number>(0);
  const deletionCountRef = useRef<number>(0);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastMouseMoveRef = useRef<number>(Date.now());
  const lastActivityRef = useRef<number>(Date.now());
  const lastActionRef = useRef<{ action: EyeContext['lastAction']; time: number }>({ action: 'none', time: Date.now() });

  // Track typing
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

  // Track mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const timeDelta = now - lastMouseMoveRef.current;
      
      // Calculate velocity
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const velocity = timeDelta > 0 ? (distance / timeDelta) * 1000 : 0;
      
      // Calculate distance from eye
      let eyeDistance = 500;
      if (eyeRef?.current) {
        const rect = eyeRef.current.getBoundingClientRect();
        const eyeCenterX = rect.left + rect.width / 2;
        const eyeCenterY = rect.top + rect.height / 2;
        eyeDistance = Math.sqrt(
          Math.pow(e.clientX - eyeCenterX, 2) + 
          Math.pow(e.clientY - eyeCenterY, 2)
        );
      }
      
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      lastMouseMoveRef.current = now;
      lastActivityRef.current = now;
      
      setContext(prev => ({
        ...prev,
        mouseDistanceFromEye: eyeDistance,
        mouseVelocity: velocity,
        isMouseIdle: false,
      }));
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [eyeRef]);

  // Update context periodically - optimized to 500ms (2x/sec) instead of 200ms (5x/sec)
  useEffect(() => {
    const updateContext = () => {
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
      
      setContext(prev => ({
        ...prev,
        typingSpeed,
        typingPauseDuration: isUserTyping ? timeSinceLastKeystroke : 0,
        deletionCount: deletionCountRef.current,
        isMouseIdle: timeSinceLastMouseMove > 2000,
        idleDuration: timeSinceLastActivity,
        currentMode,
        lastAction: lastActionRef.current.action,
        timeSinceLastAction,
        messageCount,
        hasActiveResponse: isResponding,
        isWaitingForResponse: isUserTyping && !isResponding,
      }));
      
      // Decay deletion count over time
      if (deletionCountRef.current > 0 && timeSinceLastKeystroke > 3000) {
        deletionCountRef.current = Math.max(0, deletionCountRef.current - 1);
      }
      
      // Decay keystroke count
      if (timeSinceLastKeystroke > 5000) {
        keystrokeCountRef.current = 0;
      }
    };

    // Use requestIdleCallback when available for non-critical updates
    const scheduleUpdate = () => {
      if ('requestIdleCallback' in window) {
        (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(updateContext, { timeout: 500 });
      } else {
        updateContext();
      }
    };

    const updateInterval = setInterval(scheduleUpdate, 500); // Update 2x per second instead of 5x

    return () => clearInterval(updateInterval);
  }, [currentMode, isResponding, isUserTyping, messageCount]);

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
