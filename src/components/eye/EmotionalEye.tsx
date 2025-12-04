import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAYNEmotion } from '@/contexts/AYNEmotionContext';
import { BehaviorConfig } from '@/types/eyeBehavior.types';

interface EmotionalEyeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  gazeTarget?: { x: number; y: number } | null;
  behaviorConfig?: BehaviorConfig | null; // AI-driven behavior from matcher
}

export const EmotionalEye = ({ size = 'lg', className, gazeTarget, behaviorConfig }: EmotionalEyeProps) => {
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
    triggerPulse
  } = useAYNEmotion();
  const [isHovered, setIsHovered] = useState(false);
  const lastBlinkRef = useRef(Date.now());
  const idleBlinkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkInTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Get gaze intensity from behavior or default
  const gazeIntensity = behaviorConfig?.gazeIntensity ?? 0.4;
  const gazeSpeed = behaviorConfig?.gazeSpeed ?? 0.4;

  const springConfig = { 
    damping: 50 - (gazeSpeed * 30), // Higher speed = lower damping
    stiffness: 200 + (gazeSpeed * 200) 
  };
  const eyeX = useSpring(useTransform(mouseX, (v) => v * 0.015 * gazeIntensity * 2), springConfig);
  const eyeY = useSpring(useTransform(mouseY, (v) => v * 0.015 * gazeIntensity * 2), springConfig);
  const smoothAiGazeX = useSpring(aiGazeX, { damping: 40, stiffness: 200 });
  const smoothAiGazeY = useSpring(aiGazeY, { damping: 40, stiffness: 200 });

  // Micro-movement for idle "look around"
  const microX = useMotionValue(0);
  const microY = useMotionValue(0);
  const smoothMicroX = useSpring(microX, { damping: 30, stiffness: 100 });
  const smoothMicroY = useSpring(microY, { damping: 30, stiffness: 100 });

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

  // Micro-movements when idle
  useEffect(() => {
    const gazePattern = behaviorConfig?.gazePattern ?? 'follow_mouse';
    
    if (isUserTyping || isResponding || isAbsorbing) {
      microX.set(0);
      microY.set(0);
      return;
    }

    // Enhanced wandering for certain patterns
    if (gazePattern === 'wander' || gazePattern === 'scan_screen') {
      const { range, interval } = getMicroParams();
      const adjustedRange = gazePattern === 'scan_screen' ? range * 1.5 : range;
      
      const microMovementInterval = setInterval(() => {
        const newX = (Math.random() - 0.5) * adjustedRange;
        const newY = (Math.random() - 0.5) * (adjustedRange * 0.75);
        microX.set(newX);
        microY.set(newY);
      }, interval * 0.7);

      return () => clearInterval(microMovementInterval);
    }

    // Default micro-movements
    const { range, interval } = getMicroParams();
    const microMovementInterval = setInterval(() => {
      const newX = (Math.random() - 0.5) * range;
      const newY = (Math.random() - 0.5) * (range * 0.75);
      microX.set(newX);
      microY.set(newY);
    }, interval + Math.random() * (interval * 0.4));

    return () => clearInterval(microMovementInterval);
  }, [isUserTyping, isResponding, isAbsorbing, microX, microY, getMicroParams, behaviorConfig?.gazePattern]);

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

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <motion.div 
        style={{ 
          x: combinedX, 
          y: combinedY, 
          rotate: smoothTilt,
          filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.08))'
        }}
        className="relative z-10 flex items-center justify-center group cursor-pointer will-change-transform"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ 
          scale: isSurprised ? 1.12 : 1, 
          opacity: 1 
        }}
        transition={{ 
          duration: isSurprised ? 0.2 : 0.6, 
          ease: isSurprised ? [0.34, 1.56, 0.64, 1] : "easeOut" 
        }}
        onMouseEnter={() => setIsHovered(true)} 
        onMouseLeave={() => setIsHovered(false)}
      >
        <div 
          className={cn(
            "relative rounded-full bg-background flex items-center justify-center overflow-hidden animate-eye-breathe will-change-transform",
            sizeClasses[size]
          )}
          style={{
            boxShadow: '0 10px 40px -5px rgba(0,0,0,0.1), 0 4px 20px -8px rgba(0,0,0,0.05)',
            animationDuration: `${breathingDuration}s`
          }}
        >
          {/* Outer pulsing ring */}
          <motion.div
            className="absolute inset-[-8%] rounded-full border-2 border-primary/10"
            animate={{
              scale: [1, 1.04, 1],
              opacity: isResponding ? [0.4, 0.8, 0.4] : [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: isResponding ? 1.5 : 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Layer 1: Soft inner highlight */}
          <motion.div 
            className="absolute inset-0 rounded-full"
            animate={{
              opacity: isResponding ? [0.5, 0.8, 0.5] : 0.5
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 50%)',
            }}
          />

          {/* Layer 2: Light gray outer ring with subtle rotation */}
          <motion.div 
            className="absolute inset-[15%] rounded-full"
            animate={{
              rotate: emotion === 'thinking' ? [0, 360] : 0,
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              backgroundColor: 'hsl(0, 0%, 96%)',
              boxShadow: 'inset 0 2px 8px hsla(0, 0%, 0%, 0.04)',
            }}
          />

          {/* Layer 3: Emotional Ring with enhanced glow */}
          <motion.div 
            className="absolute inset-[30%] rounded-full"
            animate={{ 
              scale: isPulsing 
                ? [1, 1.08, 1] 
                : isResponding || isAbsorbing 
                  ? [1, 1.05, 1] 
                  : [1, 1.02, 1],
              rotate: emotion === 'thinking' ? [0, 360] : 0,
              boxShadow: isResponding || isPulsing
                ? [
                    `inset 0 2px 6px hsla(0, 0%, 0%, 0.08), 0 0 30px ${emotionConfig.glowColor}50`,
                    `inset 0 2px 6px hsla(0, 0%, 0%, 0.08), 0 0 50px ${emotionConfig.glowColor}70`,
                    `inset 0 2px 6px hsla(0, 0%, 0%, 0.08), 0 0 30px ${emotionConfig.glowColor}50`
                  ]
                : isUserTyping || isAttentive
                  ? `inset 0 2px 6px hsla(0, 0%, 0%, 0.08), 0 0 25px ${emotionConfig.glowColor}40`
                  : 'inset 0 2px 6px hsla(0, 0%, 0%, 0.06)'
            }}
            transition={{ 
              scale: { 
                duration: isPulsing ? 0.4 : isResponding ? 1.2 : emotionConfig.breathingSpeed, 
                repeat: isPulsing ? 0 : Infinity, 
                ease: "easeInOut" 
              },
              rotate: { 
                duration: 8, 
                repeat: Infinity, 
                ease: "linear" 
              },
              boxShadow: {
                duration: isPulsing ? 0.4 : 2,
                repeat: isPulsing ? 0 : Infinity,
                ease: "easeInOut"
              }
            }}
            style={{
              backgroundColor: emotion === 'calm' 
                ? 'hsl(0, 0%, 88%)'
                : emotionConfig.glowColor,
              transition: 'background-color 1.2s ease',
            }}
          />

          {/* Layer 4: Black pupil with brain */}
          <motion.svg 
            viewBox="0 0 100 100" 
            className="w-[40%] h-[40%] relative z-10"
            xmlns="http://www.w3.org/2000/svg" 
            animate={{
              scaleY: isBlinking ? 0.05 : 1,
              opacity: isBlinking ? 0.7 : 1
            }} 
            transition={{
              duration: isBlinking ? 0.08 : 0.12,
              ease: isBlinking ? [0.55, 0.055, 0.675, 0.19] : [0.34, 1.56, 0.64, 1]
            }} 
            style={{
              transformOrigin: 'center center'
            }}
          >
            <defs>
              <radialGradient id="emotional-sclera" cx="40%" cy="30%">
                <stop offset="0%" stopColor="hsl(var(--background))" stopOpacity="0.9" />
                <stop offset="80%" stopColor="hsl(var(--foreground))" stopOpacity="0.95" />
              </radialGradient>
            </defs>

            <circle cx="50" cy="50" r="48" fill="url(#emotional-sclera)" opacity="0.06" />

            <defs>
              <radialGradient id="iris-gradient" cx="30%" cy="30%">
                <stop offset="0%" stopColor="#1a1a1a" stopOpacity="1" />
                <stop offset="100%" stopColor="black" stopOpacity="1" />
              </radialGradient>
            </defs>
            <circle 
              cx="50" 
              cy="50" 
              r={irisRadius}
              fill="url(#iris-gradient)"
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
                  color: emotionConfig.color, 
                  transition: 'color 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  filter: `drop-shadow(0 0 8px ${emotionConfig.color}40)`
                }} 
              />
            </foreignObject>
          </motion.svg>
        </div>
      </motion.div>
    </div>
  );
};
