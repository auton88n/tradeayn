import { useEffect, useState, useRef, useCallback, memo } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAYNEmotion } from '@/contexts/AYNEmotionContext';
import { useSoundContextOptional } from '@/contexts/SoundContext';
import { BehaviorConfig } from '@/types/eyeBehavior.types';
import { useIdleDetection } from '@/hooks/useIdleDetection';
import { useEyeGestures } from '@/hooks/useEyeGestures';
import { EyeParticles } from './EyeParticles';
import { ThinkingDots } from './ThinkingDots';
import { useIsMobile } from '@/hooks/use-mobile';

interface EmotionalEyeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  gazeTarget?: { x: number; y: number } | null;
  behaviorConfig?: BehaviorConfig | null; // AI-driven behavior from matcher
}

const EmotionalEyeComponent = ({ size = 'lg', className, gazeTarget, behaviorConfig }: EmotionalEyeProps) => {
  const { 
    emotionConfig,
    emotion,
    setEmotion,
    isAbsorbing, 
    isBlinking, 
    triggerBlink, 
    isResponding,
    isUserTyping,
    isAttentive,
    lastActivityTime,
    isSurprised,
    triggerSurprise,
    isPulsing,
    triggerPulse,
    isWinking
  } = useAYNEmotion();
  const soundContext = useSoundContextOptional();
  const [isHovered, setIsHovered] = useState(false);
  const lastBlinkRef = useRef(Date.now());
  const idleBlinkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkInTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevBlinkingRef = useRef(false);
  const isMobile = useIsMobile();
  
  // Performance optimizations
  const prefersReducedMotion = useReducedMotion();
  const { isDeepIdle } = useIdleDetection({ idleThreshold: 15, deepIdleThreshold: 30 });
  
  // Eye gestures for click interactions
  const { isSquished, handlers: gestureHandlers } = useEyeGestures();

  // Mouse tracking for gaze
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // AI gaze target (for looking at suggestions)
  const aiGazeX = useMotionValue(0);
  const aiGazeY = useMotionValue(0);

  // Apply behavior config overrides
  useEffect(() => {
    if (behaviorConfig) {
      // Apply emotion from behavior
      if (behaviorConfig.emotion && behaviorConfig.emotion !== emotion) {
        setEmotion(behaviorConfig.emotion);
      }
      
      // Trigger surprise if behavior requests it
      if (behaviorConfig.triggerSurprise) {
        triggerSurprise();
      }
      
      // Trigger pulse if behavior requests it
      if (behaviorConfig.triggerPulse) {
        triggerPulse();
      }
    }
  }, [behaviorConfig, emotion, setEmotion, triggerSurprise, triggerPulse]);

  // Play blink sound when blinking starts
  useEffect(() => {
    if (isBlinking && !prevBlinkingRef.current) {
      soundContext?.playSound('blink');
    }
    prevBlinkingRef.current = isBlinking;
  }, [isBlinking, soundContext]);

  // Get gaze intensity from behavior or default
  const gazeIntensity = behaviorConfig?.gazeIntensity ?? 0.4;
  const gazeSpeed = behaviorConfig?.gazeSpeed ?? 0.4;

  // Optimized spring config - higher damping for faster settling
  const springConfig = { 
    damping: 80 - (gazeSpeed * 20), // Higher damping = faster settling
    stiffness: 300 + (gazeSpeed * 100) 
  };
  const eyeX = useSpring(useTransform(mouseX, (v) => v * 0.015 * gazeIntensity * 2), springConfig);
  const eyeY = useSpring(useTransform(mouseY, (v) => v * 0.015 * gazeIntensity * 2), springConfig);
  const smoothAiGazeX = useSpring(aiGazeX, { damping: 60, stiffness: 250 });
  const smoothAiGazeY = useSpring(aiGazeY, { damping: 60, stiffness: 250 });

  // Micro-movement for idle "look around" - higher damping
  const microX = useMotionValue(0);
  const microY = useMotionValue(0);
  const smoothMicroX = useSpring(microX, { damping: 50, stiffness: 150 });
  const smoothMicroY = useSpring(microY, { damping: 50, stiffness: 150 });

  // Combined eye movement (mouse + AI gaze + micro)
  const combinedX = useTransform([eyeX, smoothMicroX, smoothAiGazeX], ([eye, micro, ai]) => (eye as number) + (micro as number) + (ai as number));
  const combinedY = useTransform([eyeY, smoothMicroY, smoothAiGazeY], ([eye, micro, ai]) => (eye as number) + (micro as number) + (ai as number));

  // Mouse tracking effect - throttled for performance
  useEffect(() => {
    const gazePattern = behaviorConfig?.gazePattern ?? 'follow_mouse';
    
    if (gazePattern !== 'follow_mouse' && gazePattern !== 'wander' && gazePattern !== 'scan_screen') {
      mouseX.set(0);
      mouseY.set(0);
      return;
    }

    let rafId: number | null = null;
    let lastX = 0;
    let lastY = 0;

    function onMove(e: MouseEvent) {
      // Throttle with RAF for 60fps max
      if (rafId !== null) return;
      
      rafId = requestAnimationFrame(() => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const newX = e.clientX - cx;
        const newY = e.clientY - cy;
        
        // Only update if moved significantly (reduces repaints)
        if (Math.abs(newX - lastX) > 2 || Math.abs(newY - lastY) > 2) {
          mouseX.set(newX);
          mouseY.set(newY);
          lastX = newX;
          lastY = newY;
        }
        rafId = null;
      });
    }

    function onLeave() {
      mouseX.set(0);
      mouseY.set(0);
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [mouseX, mouseY, behaviorConfig?.gazePattern]);

  // AI gaze towards suggestions when visible
  useEffect(() => {
    if (gazeTarget && !isUserTyping && !isResponding) {
      aiGazeX.set(gazeTarget.x * 0.8);
      aiGazeY.set(gazeTarget.y * 0.3);
    } else {
      aiGazeX.set(0);
      aiGazeY.set(0);
    }
  }, [gazeTarget, isUserTyping, isResponding, aiGazeX, aiGazeY]);

  // Get blink frequency from behavior or calculate based on state
  const getBlinkInterval = useCallback(() => {
    // Use behavior config if available
    if (behaviorConfig?.blinkPattern === 'none') return null;
    if (behaviorConfig?.blinkFrequency) {
      // Convert blinks per minute to interval in ms
      return (60 / behaviorConfig.blinkFrequency) * 1000 + (Math.random() * 500);
    }
    
    // Default behavior
    if (isUserTyping) return null;
    if (isResponding) return 800 + Math.random() * 400;
    return 3000 + Math.random() * 2000;
  }, [isUserTyping, isResponding, behaviorConfig?.blinkFrequency, behaviorConfig?.blinkPattern]);

  // Idle blinking effect
  useEffect(() => {
    if (idleBlinkIntervalRef.current) {
      clearInterval(idleBlinkIntervalRef.current);
      idleBlinkIntervalRef.current = null;
    }

    const scheduleNextBlink = () => {
      const interval = getBlinkInterval();
      if (interval === null) return;

      idleBlinkIntervalRef.current = setTimeout(() => {
        if (!isAbsorbing && !isAttentive) {
          const now = Date.now();
          if (now - lastBlinkRef.current > 500) {
            triggerBlink();
            lastBlinkRef.current = now;
            
            // Double blink for certain patterns
            if (behaviorConfig?.blinkPattern === 'double') {
              setTimeout(() => triggerBlink(), 200);
            }
          }
        }
        scheduleNextBlink();
      }, interval);
    };

    scheduleNextBlink();

    return () => {
      if (idleBlinkIntervalRef.current) {
        clearTimeout(idleBlinkIntervalRef.current);
      }
    };
  }, [isAbsorbing, isAttentive, getBlinkInterval, triggerBlink, behaviorConfig?.blinkPattern]);

  // "Check-in" blink after long user inactivity
  useEffect(() => {
    if (checkInTimeoutRef.current) {
      clearTimeout(checkInTimeoutRef.current);
    }

    checkInTimeoutRef.current = setTimeout(() => {
      if (!isUserTyping && !isResponding && !isAbsorbing) {
        triggerBlink();
        setTimeout(() => {
          triggerBlink();
        }, 300);
      }
    }, 10000);

    return () => {
      if (checkInTimeoutRef.current) {
        clearTimeout(checkInTimeoutRef.current);
      }
    };
  }, [lastActivityTime, isUserTyping, isResponding, isAbsorbing, triggerBlink]);

  // Get micro-movement params from behavior or emotion
  const getMicroParams = useCallback(() => {
    // Use behavior config if available
    if (behaviorConfig) {
      const intensity = behaviorConfig.microMovementIntensity ?? 0.4;
      const speed = behaviorConfig.microMovementSpeed ?? 0.3;
      return {
        range: intensity * 12,
        interval: (1 - speed) * 8000 + 2000, // 2-10s based on speed
        tilt: behaviorConfig.headTilt ?? 0,
      };
    }
    
    // Fall back to emotion-based params
    switch (emotion) {
      case 'curious':
        return { range: 6, interval: 3000, tilt: 3 };
      case 'excited':
        return { range: 8, interval: 1500, tilt: 0 };
      case 'happy':
        return { range: 5, interval: 4000, tilt: 1 };
      case 'thinking':
        return { range: 3, interval: 6000, tilt: -2 };
      case 'frustrated':
        return { range: 2, interval: 8000, tilt: 0 };
      default:
        return { range: 4, interval: 5000, tilt: 0 };
    }
  }, [emotion, behaviorConfig]);

  // Head tilt based on behavior/emotion
  const tiltRotation = useMotionValue(0);
  const smoothTilt = useSpring(tiltRotation, { damping: 40, stiffness: 80 });

  useEffect(() => {
    const { tilt } = getMicroParams();
    tiltRotation.set(tilt);
  }, [emotion, getMicroParams, tiltRotation, behaviorConfig]);

  // Micro-movements when idle - DISABLED on mobile for performance
  useEffect(() => {
    // Disable micro-movements on mobile devices for better performance
    if (isMobile || isUserTyping || isResponding || isAbsorbing || isDeepIdle || prefersReducedMotion) {
      microX.set(0);
      microY.set(0);
      return;
    }

    const { range, interval } = getMicroParams();
    // Longer intervals when idle to reduce CPU
    const adjustedInterval = interval * 2;

    const microMovementInterval = setInterval(() => {
      const newX = (Math.random() - 0.5) * range;
      const newY = (Math.random() - 0.5) * (range * 0.75);
      microX.set(newX);
      microY.set(newY);
    }, adjustedInterval);

    return () => clearInterval(microMovementInterval);
  }, [isMobile, isUserTyping, isResponding, isAbsorbing, isDeepIdle, prefersReducedMotion, microX, microY, getMicroParams]);

  const sizeClasses = {
    sm: 'w-[100px] h-[100px] md:w-[120px] md:h-[120px]',
    md: 'w-[140px] h-[140px] md:w-[180px] md:h-[180px]',
    lg: 'w-[160px] h-[160px] md:w-[220px] md:h-[220px] lg:w-[260px] lg:h-[260px]',
  };

  // Calculate iris radius based on behavior pupil state or current state
  const getIrisRadius = () => {
    // Use behavior pupil dilation if available
    if (behaviorConfig?.pupilDilation) {
      switch (behaviorConfig.pupilDilation) {
        case 'contracted': return 18;
        case 'normal': return 28;
        case 'dilated': return 32;
        case 'very_dilated': return 36;
      }
    }
    
    // Default state-based calculation
    if (isAbsorbing) return 16;
    if (isAttentive) return 34;
    if (isUserTyping) return 32;
    if (isResponding) return 30;
    if (isBlinking) return 28;
    if (isHovered) return 30;
    return 28;
  };

  const irisRadius = getIrisRadius();
  const breathingDuration = emotionConfig.breathingSpeed;

  // Calculate eye size for particles
  const eyeSizeMap = { sm: 120, md: 180, lg: 260 };
  const eyeSize = eyeSizeMap[size];

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Particle effects based on emotion */}
      <EyeParticles 
        emotion={emotion} 
        isActive={!prefersReducedMotion && (emotion !== 'calm' || isResponding)} 
        size={eyeSize}
      />
      
      {/* Thinking dots when processing */}
      <ThinkingDots 
        isVisible={isResponding && !prefersReducedMotion} 
        color={emotionConfig.glowColor}
        size={eyeSize}
      />
      
      <motion.div 
        style={{ x: combinedX, y: combinedY, rotate: smoothTilt }}
        className="relative z-10 flex items-center justify-center group cursor-pointer will-change-transform"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ 
          scale: isSurprised ? 1.12 : isSquished ? 0.9 : 1, 
          opacity: 1 
        }}
        transition={{ 
          duration: isSurprised ? 0.2 : isSquished ? 0.1 : 0.6, 
          ease: isSurprised ? [0.34, 1.56, 0.64, 1] : "easeOut" 
        }}
        onMouseEnter={() => setIsHovered(true)} 
        onMouseLeave={() => { setIsHovered(false); gestureHandlers.onMouseLeave(); }}
        onClick={gestureHandlers.onClick}
        onDoubleClick={gestureHandlers.onDoubleClick}
        onMouseDown={gestureHandlers.onMouseDown}
        onMouseUp={gestureHandlers.onMouseUp}
        onTouchStart={gestureHandlers.onTouchStart}
        onTouchEnd={gestureHandlers.onTouchEnd}
      >
        {/* Soft outer glow halo - radial gradient for smooth edges */}
        <div className="absolute -inset-8 rounded-full blur-3xl pointer-events-none bg-[radial-gradient(circle,_rgba(229,229,229,0.4)_0%,_transparent_70%)] dark:bg-[radial-gradient(circle,_rgba(38,38,38,0.2)_0%,_transparent_70%)]" />
        
        <div 
          className={cn(
            "relative rounded-full bg-gradient-to-b from-white to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 flex items-center justify-center overflow-hidden will-change-transform eye-shadow",
            sizeClasses[size],
            // Only animate breathing when not deep idle and no reduced motion preference
            !isDeepIdle && !prefersReducedMotion && "animate-eye-breathe"
          )}
          style={{
            animationDuration: `${breathingDuration}s`
          }}
        >
          {/* Inner shadow ring - matching landing page dark mode */}
          <div className="absolute inset-2 rounded-full shadow-[inset_0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_4px_16px_rgba(0,0,0,0.3)]" />

          {/* Emotional color ring - changes color based on AYN's state */}
          <motion.div 
            className="absolute inset-[15%] rounded-full bg-neutral-200 dark:bg-neutral-800"
            animate={{ 
              // Only animate scale when actively pulsing, no infinite animations
              scale: isPulsing ? [1, 1.08, 1] : 1,
            }}
            transition={{ 
              scale: { duration: 0.4, ease: "easeInOut" }
            }}
            style={{
              backgroundColor: emotion === 'calm' 
                ? undefined // Let className handle it
                : emotionConfig.glowColor,
              boxShadow: emotion !== 'calm' 
                ? `0 0 20px ${emotionConfig.glowColor}, inset 0 0 10px ${emotionConfig.glowColor}40`
                : 'none',
              transition: 'background-color 0.6s ease, box-shadow 0.6s ease',
            }}
          />

          {/* SVG with pupil and brain */}
          <motion.svg 
            viewBox="0 0 100 100" 
            className="w-[70%] h-[70%] relative z-10"
            xmlns="http://www.w3.org/2000/svg" 
            animate={{
              scaleY: isBlinking ? 0.05 : isSquished ? 0.7 : 1,
              scaleX: isWinking ? 0.85 : isSquished ? 1.1 : 1,
              opacity: isBlinking ? 0.7 : 1,
              skewX: isWinking ? 5 : 0,
            }} 
            transition={{
              duration: isBlinking ? 0.08 : isWinking ? 0.12 : 0.12,
              ease: isBlinking ? [0.55, 0.055, 0.675, 0.19] : [0.34, 1.56, 0.64, 1]
            }} 
            style={{
              transformOrigin: 'center center'
            }}
          >
            {/* Sclera gradient removed to eliminate border lines */}

            {/* Solid black pupil - always black regardless of theme */}
            <circle 
              cx="50" 
              cy="50" 
              r={irisRadius}
              fill="#000000"
              style={{
                transition: isAbsorbing 
                  ? "r 0.15s cubic-bezier(0.55, 0.055, 0.675, 0.19)" 
                  : isAttentive
                    ? "r 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)"
                    : isBlinking 
                      ? "r 0.08s cubic-bezier(0.55, 0.055, 0.675, 0.19)" 
                      : "r 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
              }} 
            />
              
            <foreignObject 
              x={50 - irisRadius * 0.6} 
              y={50 - irisRadius * 0.6} 
              width={irisRadius * 1.2} 
              height={irisRadius * 1.2} 
              style={{
                transition: isAbsorbing 
                  ? "all 0.15s cubic-bezier(0.55, 0.055, 0.675, 0.19)" 
                  : isAttentive
                    ? "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)"
                    : isBlinking 
                      ? "all 0.08s cubic-bezier(0.55, 0.055, 0.675, 0.19)" 
                      : "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
              }}
            >
              <Brain 
                className="w-full h-full" 
                style={{ 
                  color: emotion === 'calm' ? '#FFFFFF' : emotionConfig.color,
                  opacity: 0.9,
                  transition: 'color 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  filter: emotion !== 'calm' ? `drop-shadow(0 0 8px ${emotionConfig.color}40)` : 'none'
                }} 
              />
            </foreignObject>
          </motion.svg>
        </div>
      </motion.div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const EmotionalEye = memo(EmotionalEyeComponent);
