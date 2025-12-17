import { useEffect, useState, useRef, useCallback, memo } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAYNEmotion } from '@/contexts/AYNEmotionContext';
import { useSoundContextOptional } from '@/contexts/SoundContext';

import { useIdleDetection } from '@/hooks/useIdleDetection';
import { useEyeGestures } from '@/hooks/useEyeGestures';
import { EyeParticles } from './EyeParticles';
import { ThinkingDots } from './ThinkingDots';
import { useIsMobile } from '@/hooks/use-mobile';

// AI-powered empathy response types
export type PupilReaction = 'normal' | 'dilate-slightly' | 'dilate-more' | 'contract';
export type BlinkPattern = 'normal' | 'slow-comfort' | 'quick-attentive' | 'double-understanding';

interface EmotionalEyeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  gazeTarget?: { x: number; y: number } | null;
  // AI empathy micro-behaviors
  pupilReaction?: PupilReaction;
  blinkPattern?: BlinkPattern;
  colorIntensity?: number;
}

const EmotionalEyeComponent = ({ 
  size = 'lg', 
  className, 
  gazeTarget, 
  pupilReaction = 'normal',
  blinkPattern = 'normal',
  colorIntensity = 0.5
}: EmotionalEyeProps) => {
  const { 
    emotionConfig,
    emotion,
    emotionSource,
    setEmotionWithSource,
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
    isWinking,
    activityLevel,
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

  // Particle tracking for smart eye response
  const particleGazeX = useMotionValue(0);
  const particleGazeY = useMotionValue(0);
  const smoothParticleGazeX = useSpring(particleGazeX, { damping: 80, stiffness: 300, mass: 0.4 });
  const smoothParticleGazeY = useSpring(particleGazeY, { damping: 80, stiffness: 300, mass: 0.4 });
  const particleNearEyeRef = useRef(false);

  // Activity-based glow intensity multipliers
  const ACTIVITY_GLOW = {
    idle: 0.3,
    low: 0.45,
    medium: 0.6,
    high: 0.8,
  };
  
  const baseGlowIntensity = ACTIVITY_GLOW[activityLevel];
  const [particleBoost, setParticleBoost] = useState(0);
  const glowIntensity = Math.min(baseGlowIntensity + particleBoost, 1);

  // Handle particle approaching eye - pupil micro-tracks toward particle
  const handleParticleNearEye = useCallback((angle: number) => {
    if (!particleNearEyeRef.current) {
      particleNearEyeRef.current = true;
      
      // Convert angle to slight gaze offset (subtle tracking)
      const angleRad = (angle * Math.PI) / 180;
      const gazeOffset = 3; // Subtle offset
      particleGazeX.set(Math.cos(angleRad) * gazeOffset);
      particleGazeY.set(Math.sin(angleRad) * gazeOffset);
      
      // Pulse glow intensity when particles are near
      setParticleBoost(0.2);
      
      // Reset after particle passes
      setTimeout(() => {
        particleNearEyeRef.current = false;
        particleGazeX.set(0);
        particleGazeY.set(0);
        setParticleBoost(0);
      }, 400);
    }
  }, [particleGazeX, particleGazeY]);


  // Safe sound player that respects enabled state
  const playSoundSafe = useCallback((type: 'blink' | 'listening' | 'attentive-blink' | 'processing' | 'thoughtful-blink') => {
    if (soundContext && soundContext.enabled) {
      soundContext.playSound(type);
    }
  }, [soundContext]);

  // Play blink sound when blinking starts - use instant for perfect sync
  useEffect(() => {
    if (isBlinking && !prevBlinkingRef.current) {
      // Use instant sound for perfect visual sync (no async delay)
      if (soundContext?.playInstant) {
        soundContext.playInstant('blink');
      }
    }
    prevBlinkingRef.current = isBlinking;
  }, [isBlinking, soundContext]);

  // Gaze intensity defaults (AI-driven)
  const gazeIntensity = 0.4;
  const gazeSpeed = 0.4;

  // Optimized spring config - higher damping for faster, smoother settling
  const springConfig = { 
    damping: 90 - (gazeSpeed * 15), // Higher damping = faster, smoother settling
    stiffness: 250 + (gazeSpeed * 80),
    mass: 0.8 // Lower mass for quicker response
  };
  const eyeX = useSpring(useTransform(mouseX, (v) => v * 0.012 * gazeIntensity * 2), springConfig);
  const eyeY = useSpring(useTransform(mouseY, (v) => v * 0.012 * gazeIntensity * 2), springConfig);
  const smoothAiGazeX = useSpring(aiGazeX, { damping: 70, stiffness: 200, mass: 0.6 });
  const smoothAiGazeY = useSpring(aiGazeY, { damping: 70, stiffness: 200, mass: 0.6 });

  // Micro-movement for idle "look around" - optimized for smoothness
  const microX = useMotionValue(0);
  const microY = useMotionValue(0);
  const smoothMicroX = useSpring(microX, { damping: 60, stiffness: 120, mass: 0.5 });
  const smoothMicroY = useSpring(microY, { damping: 60, stiffness: 120, mass: 0.5 });

  // Combined eye movement (mouse + AI gaze + micro + particle tracking)
  const combinedX = useTransform(
    [eyeX, smoothMicroX, smoothAiGazeX, smoothParticleGazeX], 
    ([eye, micro, ai, particle]) => (eye as number) + (micro as number) + (ai as number) + (particle as number)
  );
  const combinedY = useTransform(
    [eyeY, smoothMicroY, smoothAiGazeY, smoothParticleGazeY], 
    ([eye, micro, ai, particle]) => (eye as number) + (micro as number) + (ai as number) + (particle as number)
  );

  // Mouse tracking effect - throttled for performance
  useEffect(() => {
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
  }, [mouseX, mouseY]);

  // AI gaze towards suggestions or input field
  useEffect(() => {
    if (isUserTyping) {
      // Look slightly down toward input field when user is typing
      aiGazeX.set(0);
      aiGazeY.set(8); // Subtle downward gaze toward input
    } else if (gazeTarget && !isResponding) {
      aiGazeX.set(gazeTarget.x * 0.8);
      aiGazeY.set(gazeTarget.y * 0.3);
    } else {
      aiGazeX.set(0);
      aiGazeY.set(0);
    }
  }, [gazeTarget, isUserTyping, isResponding, aiGazeX, aiGazeY]);

  // Track typing state for contextual blinks
  const typingStartRef = useRef<number | null>(null);
  const lastTypingPauseRef = useRef<number>(Date.now());
  const pauseBlinkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasPlayedListeningRef = useRef(false);

  // Track when user starts/stops typing for contextual blinks with sounds
  useEffect(() => {
    if (isUserTyping) {
      if (!typingStartRef.current) {
        typingStartRef.current = Date.now();
        hasPlayedListeningRef.current = false;
        
        // Play subtle "listening" sound when user starts typing
        playSoundSafe('listening');
      }
      lastTypingPauseRef.current = Date.now();
      
      // Clear any pending pause blink
      if (pauseBlinkTimeoutRef.current) {
        clearTimeout(pauseBlinkTimeoutRef.current);
        pauseBlinkTimeoutRef.current = null;
      }
    } else if (typingStartRef.current) {
      // User stopped typing - trigger quick attentive blink after short pause
      const typingDuration = Date.now() - typingStartRef.current;
      typingStartRef.current = null;
      
      // Quick attentive blink when user pauses (300-500ms after pause)
      pauseBlinkTimeoutRef.current = setTimeout(() => {
        if (!isAbsorbing && !isResponding) {
          triggerBlink();
          // Play attentive blink sound
          playSoundSafe('attentive-blink');
          
          // If they typed a lot, add a second "processing" blink with sound
          if (typingDuration > 3000) {
            setTimeout(() => {
              triggerBlink();
              playSoundSafe('processing');
            }, 250);
          }
        }
      }, 300 + Math.random() * 200);
    }
    
    return () => {
      if (pauseBlinkTimeoutRef.current) {
        clearTimeout(pauseBlinkTimeoutRef.current);
      }
    };
  }, [isUserTyping, isAbsorbing, isResponding, triggerBlink, playSoundSafe]);

  // Get blink frequency based on AI empathy pattern or state
  const getBlinkInterval = useCallback(() => {
    // AI empathy blink patterns take priority
    switch (blinkPattern) {
      case 'slow-comfort':
        // Slow, gentle blinks for comfort/empathy
        return 4000 + Math.random() * 2000; // 4-6 seconds
      case 'quick-attentive':
        // Quick, alert blinks showing attention
        return 1200 + Math.random() * 600; // 1.2-1.8 seconds
      case 'double-understanding':
        // Normal timing, double blink handled separately
        return 2500 + Math.random() * 1000;
      case 'normal':
      default:
        break; // Fall through to other logic
    }
    
    // During active typing - much slower blinks (AYN is focused on reading)
    if (isUserTyping) {
      const typingDuration = typingStartRef.current ? Date.now() - typingStartRef.current : 0;
      if (typingDuration > 5000) {
        return 6000 + Math.random() * 2000;
      } else if (typingDuration > 2000) {
        return 4500 + Math.random() * 1500;
      }
      return 3500 + Math.random() * 1000;
    }
    
    // While responding - quick blinks
    if (isResponding) return 800 + Math.random() * 400;
    
    // Idle state - frequent natural blinks
    return 1800 + Math.random() * 1200;
  }, [isUserTyping, isResponding, blinkPattern]);

  // Idle blinking effect with contextual sounds
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
            
            // Play thoughtful blink sound during typing (slow blinks while "reading")
            if (isUserTyping && interval > 2000) {
              playSoundSafe('thoughtful-blink');
            }
            
            // Double blink for AI empathy patterns
            if (blinkPattern === 'double-understanding') {
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
  }, [isAbsorbing, isAttentive, getBlinkInterval, triggerBlink, isUserTyping, playSoundSafe, blinkPattern]);

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

  // Get micro-movement params based on emotion
  const getMicroParams = useCallback(() => {
    // Emotion-based params
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
  }, [emotion]);

  // Head tilt based on behavior/emotion - smoother spring
  const tiltRotation = useMotionValue(0);
  const smoothTilt = useSpring(tiltRotation, { damping: 50, stiffness: 60, mass: 0.8 });

  useEffect(() => {
    const { tilt } = getMicroParams();
    tiltRotation.set(tilt);
  }, [emotion, getMicroParams, tiltRotation]);

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

  // Activity-based pupil dilation bonus
  const ACTIVITY_PUPIL_BONUS = {
    idle: 0,
    low: 1,
    medium: 2,
    high: 4,
  };

  // Calculate iris radius based on AI pupil reaction, behavior state, or current state
  const getIrisRadius = () => {
    const activityBonus = ACTIVITY_PUPIL_BONUS[activityLevel];
    
    // AI empathy pupil reactions take highest priority
    switch (pupilReaction) {
      case 'dilate-more':
        return 36 + activityBonus; // Very engaged/emotional
      case 'dilate-slightly':
        return 32 + activityBonus; // Attentive/interested
      case 'contract':
        return 20; // Focused/analytical - no bonus
      case 'normal':
      default:
        break; // Fall through to other logic
    }
    
    // Default state-based calculation with activity bonus
    if (isAbsorbing) return 16;
    if (isAttentive) return 34 + activityBonus;
    if (isUserTyping) return 32 + activityBonus;
    if (isResponding) return 30 + activityBonus;
    if (isBlinking) return 28;
    if (isHovered) return 30 + activityBonus;
    return 28 + activityBonus;
  };

  const irisRadius = getIrisRadius();
  
  // Activity-based breathing speed multipliers (lower = faster)
  const ACTIVITY_BREATHING_MULT = {
    idle: 1.2,    // Slower, relaxed
    low: 1.0,     // Normal
    medium: 0.8,  // Slightly faster
    high: 0.6,    // Quick, energetic
  };
  const breathingDuration = emotionConfig.breathingSpeed * ACTIVITY_BREATHING_MULT[activityLevel];

  // Activity-based saturation boost (percentage increase)
  const ACTIVITY_SATURATION_BOOST = {
    idle: 0,
    low: 5,
    medium: 12,
    high: 20,
  };
  const saturationBoost = ACTIVITY_SATURATION_BOOST[activityLevel];

  // Helper to boost HSL saturation
  const boostSaturation = (hslColor: string, boostPercent: number): string => {
    // Parse HSL color like "hsl(210, 60%, 50%)" or "210 60% 50%"
    const match = hslColor.match(/(\d+)[,\s]+(\d+)%[,\s]+(\d+)%/);
    if (!match) return hslColor;
    const [, h, s, l] = match;
    const newSat = Math.min(100, parseInt(s) + boostPercent);
    return `hsl(${h}, ${newSat}%, ${l}%)`;
  };

  // Apply saturation boost to colors
  const boostedGlowColor = boostSaturation(emotionConfig.glowColor, saturationBoost);
  const boostedColor = boostSaturation(emotionConfig.color, saturationBoost);

  // Calculate eye size for particles
  const eyeSizeMap = { sm: 120, md: 180, lg: 260 };
  const eyeSize = eyeSizeMap[size];

  return (
    <div className={cn("relative flex items-center justify-center overflow-visible", className)}>
      {/* Thinking dots when processing */}
      <ThinkingDots 
        isVisible={isResponding && !prefersReducedMotion} 
        color={emotionConfig.glowColor}
        size={eyeSize}
      />
      
      <motion.div
        style={{ 
          x: combinedX, 
          y: combinedY, 
          rotate: smoothTilt,
          willChange: 'transform'
        }}
        className="relative z-10 flex items-center justify-center group cursor-pointer overflow-visible"
        initial={{ opacity: 0, y: 8 }}
        animate={{ 
          scale: isSurprised ? 1.1 : isSquished ? 0.92 : 1, 
          opacity: 1,
          y: 0
        }}
        transition={{ 
          opacity: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
          y: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
          scale: { duration: isSurprised ? 0.15 : isSquished ? 0.08 : 0.4, ease: [0.25, 0.1, 0.25, 1] }
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
        {/* Soft outer glow halo - syncs with breathing */}
        <motion.div 
          className="absolute -inset-8 rounded-full pointer-events-none animate-glow-breathe"
          style={{
            background: `radial-gradient(circle, ${boostedGlowColor}50 0%, transparent 70%)`,
            filter: 'blur(24px)',
            transition: 'background 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            '--breathing-duration': `${breathingDuration}s`,
          } as React.CSSProperties}
        />
        
        <div 
          className={cn(
            "relative rounded-full bg-gradient-to-b from-white to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 flex items-center justify-center overflow-hidden will-change-transform",
            sizeClasses[size],
            // Always animate breathing unless reduced motion preference
            !prefersReducedMotion && "animate-eye-breathe"
          )}
          style={{
            // CSS custom property for dynamic breathing speed based on emotion
            '--breathing-duration': `${breathingDuration}s`,
            animationDuration: `${breathingDuration}s`
          } as React.CSSProperties}
        >
          {/* Inner shadow ring - matching landing page dark mode */}
          <div className="absolute inset-2 rounded-full shadow-[inset_0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_4px_16px_rgba(0,0,0,0.3)]" />

          {/* Emotional color ring - always visible with emotion color for engagement */}
          <motion.div 
            className="absolute inset-[15%] rounded-full"
            animate={{ 
              scale: isPulsing ? [1, 1.06, 1] : [1, 1.01, 1],
            }}
            transition={{ 
              scale: isPulsing 
                ? { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }
                : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
            }}
            style={{
              backgroundColor: boostedGlowColor,
              boxShadow: `0 0 20px ${boostedGlowColor}70, inset 0 0 10px ${boostedGlowColor}40`,
              transition: 'background-color 0.8s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />

          {/* SVG with pupil and brain - optimized transitions */}
          <motion.svg 
            viewBox="0 0 100 100" 
            className="w-[70%] h-[70%] relative z-10"
            xmlns="http://www.w3.org/2000/svg" 
            animate={{
              scaleY: isBlinking ? 0.05 : isSquished ? 0.75 : 1,
              scaleX: isWinking ? 0.88 : isSquished ? 1.08 : 1,
              opacity: isBlinking ? 0.8 : 1,
              skewX: isWinking ? 4 : 0,
            }} 
            transition={{
              duration: isBlinking ? 0.06 : isWinking ? 0.1 : 0.15,
              ease: [0.25, 0.1, 0.25, 1]
            }} 
            style={{
              transformOrigin: 'center center',
              willChange: 'transform'
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
              
            {/* Pure SVG Brain icon - Safari compatible (no foreignObject) */}
            {(() => {
              const brainScale = (irisRadius * 0.7) / 24;
              const strokeColor = emotion === 'calm' ? '#FFFFFF' : boostedColor;
              const pathStyle = { transition: 'stroke 0.8s cubic-bezier(0.4, 0, 0.2, 1)' };
              return (
                <g 
                  transform={`translate(${50 - 12 * brainScale}, ${50 - 12 * brainScale}) scale(${brainScale})`}
                  style={{
                    transition: isAbsorbing 
                      ? "all 0.15s cubic-bezier(0.55, 0.055, 0.675, 0.19)" 
                      : isAttentive
                        ? "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)"
                        : isBlinking 
                          ? "all 0.08s cubic-bezier(0.55, 0.055, 0.675, 0.19)" 
                          : "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    opacity: 0.92,
                    filter: emotion !== 'calm' ? `drop-shadow(0 0 6px ${boostedColor}30)` : 'none'
                  }}
                >
                  <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" stroke={strokeColor} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={pathStyle} />
                  <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" stroke={strokeColor} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={pathStyle} />
                  <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" stroke={strokeColor} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={pathStyle} />
                  <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" stroke={strokeColor} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={pathStyle} />
                  <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" stroke={strokeColor} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={pathStyle} />
                  <path d="M3.477 10.896a4 4 0 0 1 .585-.396" stroke={strokeColor} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={pathStyle} />
                  <path d="M19.938 10.5a4 4 0 0 1 .585.396" stroke={strokeColor} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={pathStyle} />
                  <path d="M6 18a4 4 0 0 1-1.967-.516" stroke={strokeColor} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={pathStyle} />
                  <path d="M19.967 17.484A4 4 0 0 1 18 18" stroke={strokeColor} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={pathStyle} />
                </g>
              );
            })()}
          </motion.svg>
        </div>
        
        {/* Particle effects - emotion-aware with activity scaling */}
        <EyeParticles 
          isActive={true}  /* Always active to feel alive */
          size={eyeSize}
          glowColor={boostedGlowColor}
          activityLevel={activityLevel}
          emotion={emotion}
        />
      </motion.div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const EmotionalEye = memo(EmotionalEyeComponent);
