import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAYNEmotion } from '@/contexts/AYNEmotionContext';

interface EmotionalEyeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const EmotionalEye = ({ size = 'lg', className }: EmotionalEyeProps) => {
  const { 
    emotionConfig,
    emotion,
    isAbsorbing, 
    isBlinking, 
    triggerBlink, 
    isResponding,
    isUserTyping,
    isAttentive,
    lastActivityTime
  } = useAYNEmotion();
  const [isHovered, setIsHovered] = useState(false);
  const lastBlinkRef = useRef(Date.now());
  const idleBlinkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkInTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mouse tracking for gaze
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 50, stiffness: 300 };
  const eyeX = useSpring(useTransform(mouseX, (v) => v * 0.015), springConfig);
  const eyeY = useSpring(useTransform(mouseY, (v) => v * 0.015), springConfig);

  // Micro-movement for idle "look around"
  const microX = useMotionValue(0);
  const microY = useMotionValue(0);
  const smoothMicroX = useSpring(microX, { damping: 30, stiffness: 100 });
  const smoothMicroY = useSpring(microY, { damping: 30, stiffness: 100 });

  // Combined eye movement
  const combinedX = useTransform([eyeX, smoothMicroX], ([eye, micro]) => (eye as number) + (micro as number));
  const combinedY = useTransform([eyeY, smoothMicroY], ([eye, micro]) => (eye as number) + (micro as number));

  // Mouse tracking effect
  useEffect(() => {
    function onMove(e: MouseEvent) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      mouseX.set(e.clientX - cx);
      mouseY.set(e.clientY - cy);
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
    };
  }, [mouseX, mouseY]);

  // Smart blinking system - get random blink interval based on state
  const getBlinkInterval = useCallback(() => {
    if (isUserTyping) return null; // Don't blink while user is typing (attentive listening)
    if (isResponding) return 800 + Math.random() * 400; // Faster blinks while responding (0.8-1.2s)
    return 3000 + Math.random() * 2000; // Natural idle blinks (3-5s)
  }, [isUserTyping, isResponding]);

  // Idle blinking effect
  useEffect(() => {
    // Clear existing interval
    if (idleBlinkIntervalRef.current) {
      clearInterval(idleBlinkIntervalRef.current);
      idleBlinkIntervalRef.current = null;
    }

    const scheduleNextBlink = () => {
      const interval = getBlinkInterval();
      if (interval === null) return; // Don't blink if null (user typing)

      idleBlinkIntervalRef.current = setTimeout(() => {
        if (!isAbsorbing && !isAttentive) {
          const now = Date.now();
          // Prevent too rapid blinking
          if (now - lastBlinkRef.current > 500) {
            triggerBlink();
            lastBlinkRef.current = now;
          }
        }
        scheduleNextBlink(); // Schedule next blink
      }, interval);
    };

    scheduleNextBlink();

    return () => {
      if (idleBlinkIntervalRef.current) {
        clearTimeout(idleBlinkIntervalRef.current);
      }
    };
  }, [isAbsorbing, isAttentive, getBlinkInterval, triggerBlink]);

  // "Check-in" blink after long user inactivity (10+ seconds)
  useEffect(() => {
    if (checkInTimeoutRef.current) {
      clearTimeout(checkInTimeoutRef.current);
    }

    checkInTimeoutRef.current = setTimeout(() => {
      if (!isUserTyping && !isResponding && !isAbsorbing) {
        // Gentle double-blink "are you still there?"
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

  // Get emotion-based micro-expression parameters
  const getEmotionMicroParams = useCallback(() => {
    switch (emotion) {
      case 'curious':
        return { range: 6, interval: 3000, tilt: 3 }; // More movement, slight tilt
      case 'excited':
        return { range: 8, interval: 1500, tilt: 0 }; // Quick, energetic movements
      case 'happy':
        return { range: 5, interval: 4000, tilt: 1 }; // Gentle, pleasant movements
      case 'thinking':
        return { range: 3, interval: 6000, tilt: -2 }; // Slow, focused, slight opposite tilt
      case 'frustrated':
        return { range: 2, interval: 8000, tilt: 0 }; // Minimal movement
      default:
        return { range: 4, interval: 5000, tilt: 0 }; // Calm default
    }
  }, [emotion]);

  // Head tilt based on emotion
  const tiltRotation = useMotionValue(0);
  const smoothTilt = useSpring(tiltRotation, { damping: 40, stiffness: 80 });

  // Update tilt when emotion changes
  useEffect(() => {
    const { tilt } = getEmotionMicroParams();
    tiltRotation.set(tilt);
  }, [emotion, getEmotionMicroParams, tiltRotation]);

  // Micro-movements when idle (subtle "look around") - emotion-aware
  useEffect(() => {
    if (isUserTyping || isResponding || isAbsorbing) {
      // Reset to center when not idle
      microX.set(0);
      microY.set(0);
      return;
    }

    const { range, interval } = getEmotionMicroParams();
    
    const microMovementInterval = setInterval(() => {
      // Emotion-based movement range
      const newX = (Math.random() - 0.5) * range;
      const newY = (Math.random() - 0.5) * (range * 0.75);
      microX.set(newX);
      microY.set(newY);
    }, interval + Math.random() * (interval * 0.4));

    return () => clearInterval(microMovementInterval);
  }, [isUserTyping, isResponding, isAbsorbing, microX, microY, getEmotionMicroParams]);

  const sizeClasses = {
    sm: 'w-[100px] h-[100px] md:w-[120px] md:h-[120px]',
    md: 'w-[140px] h-[140px] md:w-[180px] md:h-[180px]',
    lg: 'w-[160px] h-[160px] md:w-[220px] md:h-[220px] lg:w-[260px] lg:h-[260px]',
  };

  // Calculate iris radius based on state - dilates for attention, contracts when thinking
  const getIrisRadius = () => {
    if (isAbsorbing) return 16; // Contract during absorption
    if (isAttentive) return 34; // Dilate when user starts typing (attention/interest)
    if (isUserTyping) return 32; // Slightly dilated while listening
    if (isResponding) return 30; // Normal while responding
    if (isBlinking) return 28;
    if (isHovered) return 30;
    return 28; // Default calm state
  };

  const irisRadius = getIrisRadius();

  // Breathing animation speed based on emotion
  const breathingDuration = emotionConfig.breathingSpeed;

  // Get emotion-aware glow parameters
  const getEmotionGlow = useCallback(() => {
    const color = emotionConfig.color;
    
    switch (emotion) {
      case 'happy':
        return {
          shadows: [
            `0 10px 30px rgba(0,0,0,0.12), 0 0 20px ${color}15, 0 0 40px ${color}08`,
            `0 10px 40px rgba(0,0,0,0.18), 0 0 50px ${color}25, 0 0 80px ${color}12`,
            `0 10px 30px rgba(0,0,0,0.12), 0 0 20px ${color}15, 0 0 40px ${color}08`
          ],
          duration: 3.5
        };
      case 'excited':
        return {
          shadows: [
            `0 10px 30px rgba(0,0,0,0.15), 0 0 25px ${color}20, 0 0 50px ${color}10`,
            `0 10px 50px rgba(0,0,0,0.22), 0 0 60px ${color}35, 0 0 100px ${color}18`,
            `0 10px 30px rgba(0,0,0,0.15), 0 0 25px ${color}20, 0 0 50px ${color}10`
          ],
          duration: 2
        };
      case 'thinking':
        return {
          shadows: [
            `0 10px 25px rgba(0,0,0,0.1), 0 0 15px ${color}12, 0 0 30px ${color}06`,
            `0 10px 35px rgba(0,0,0,0.15), 0 0 35px ${color}20, 0 0 60px ${color}10`,
            `0 10px 25px rgba(0,0,0,0.1), 0 0 15px ${color}12, 0 0 30px ${color}06`
          ],
          duration: 5
        };
      case 'curious':
        return {
          shadows: [
            `0 10px 28px rgba(0,0,0,0.12), 0 0 18px ${color}15, 0 0 35px ${color}08`,
            `0 10px 42px rgba(0,0,0,0.18), 0 0 45px ${color}25, 0 0 70px ${color}12`,
            `0 10px 28px rgba(0,0,0,0.12), 0 0 18px ${color}15, 0 0 35px ${color}08`
          ],
          duration: 3
        };
      case 'frustrated':
        return {
          shadows: [
            `0 10px 20px rgba(0,0,0,0.08), 0 0 10px ${color}08`,
            `0 10px 28px rgba(0,0,0,0.12), 0 0 20px ${color}15`,
            `0 10px 20px rgba(0,0,0,0.08), 0 0 10px ${color}08`
          ],
          duration: 6
        };
      default: // calm
        return {
          shadows: [
            '0 10px 25px rgba(0,0,0,0.1), 0 0 15px rgba(0,0,0,0.05)',
            '0 10px 40px rgba(0,0,0,0.16), 0 0 40px rgba(0,0,0,0.08), 0 0 60px rgba(0,0,0,0.04)',
            '0 10px 25px rgba(0,0,0,0.1), 0 0 15px rgba(0,0,0,0.05)'
          ],
          duration: 4
        };
    }
  }, [emotion, emotionConfig.color]);

  const glowParams = getEmotionGlow();

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Eye - centered with spring physics and emotion tilt */}
      <motion.div 
        style={{ x: combinedX, y: combinedY, rotate: smoothTilt }}
        className="relative z-10 flex items-center justify-center group cursor-pointer will-change-transform"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        onMouseEnter={() => setIsHovered(true)} 
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Outer casing with breathing and pulse-glow animation */}
        <motion.div 
          className={cn(
            "relative rounded-full bg-background flex items-center justify-center overflow-hidden",
            sizeClasses[size]
          )}
          animate={{ 
            scale: [1, 1.015, 1],
            opacity: [1, 0.98, 1],
            boxShadow: glowParams.shadows
          }}
          transition={{ 
            duration: glowParams.duration, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          {/* soft inner ring */}
          <div className="absolute inset-4 rounded-full bg-background/80 shadow-inner" />

          {/* actual eye (pupil + iris) - state-controlled blink */}
          <motion.svg 
            viewBox="0 0 100 100" 
            className="w-[70%] h-[70%] relative" 
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
            {/* sclera subtle gradient */}
            <defs>
              <radialGradient id="emotional-sclera" cx="40%" cy="30%">
                <stop offset="0%" stopColor="hsl(var(--background))" stopOpacity="0.9" />
                <stop offset="80%" stopColor="hsl(var(--foreground))" stopOpacity="0.95" />
              </radialGradient>
            </defs>

            {/* sclera subtle */}
            <circle cx="50" cy="50" r="48" fill="url(#emotional-sclera)" opacity="0.06" />

            {/* iris / pupil - PURE BLACK */}
            <circle 
              cx="50" 
              cy="50" 
              r={irisRadius}
              fill="black"
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
              
            {/* Brain logo centered inside the black pupil */}
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
              <Brain className="w-full h-full" style={{ color: emotionConfig.color, transition: 'color 0.5s ease' }} />
            </foreignObject>
          </motion.svg>
        </motion.div>
      </motion.div>
    </div>
  );
};
