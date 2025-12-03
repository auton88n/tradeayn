import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAYNEmotion } from '@/contexts/AYNEmotionContext';

interface EmotionalEyeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const EmotionalEye = ({ size = 'lg', className }: EmotionalEyeProps) => {
  const { 
    emotion,
    emotionConfig, 
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

  // Eyelid animation (0 = open, 1 = closed)
  const eyelidProgress = useMotionValue(0);
  const smoothEyelid = useSpring(eyelidProgress, { damping: 40, stiffness: 400 });

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

  // Emotion-based head tilt (rotation)
  const headTilt = useMotionValue(0);
  const smoothTilt = useSpring(headTilt, { damping: 25, stiffness: 150 });

  // Combined eye movement
  const combinedX = useTransform([eyeX, smoothMicroX], ([eye, micro]) => (eye as number) + (micro as number));
  const combinedY = useTransform([eyeY, smoothMicroY], ([eye, micro]) => (eye as number) + (micro as number));

  // Eyelid clip path based on blink progress
  const eyelidClipTop = useTransform(smoothEyelid, [0, 1], [0, 50]);
  const eyelidClipBottom = useTransform(smoothEyelid, [0, 1], [100, 50]);

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

  // Animate eyelid when blinking
  useEffect(() => {
    if (isBlinking) {
      // Close eyelid
      animate(eyelidProgress, 1, { duration: 0.08, ease: [0.55, 0.055, 0.675, 0.19] });
    } else {
      // Open eyelid
      animate(eyelidProgress, 0, { duration: 0.12, ease: [0.34, 1.56, 0.64, 1] });
    }
  }, [isBlinking, eyelidProgress]);

  // Emotion-based micro-expressions
  useEffect(() => {
    let tiltInterval: NodeJS.Timeout | null = null;
    
    switch (emotion) {
      case 'curious':
        // Curious = slight head tilt that shifts occasionally
        headTilt.set(5);
        tiltInterval = setInterval(() => {
          const newTilt = (Math.random() - 0.5) * 12; // -6 to +6 degrees
          headTilt.set(newTilt);
        }, 3000);
        break;
      case 'excited':
        // Excited = quick, energetic micro-movements
        headTilt.set(0);
        const excitedMoveInterval = setInterval(() => {
          microX.set((Math.random() - 0.5) * 8);
          microY.set((Math.random() - 0.5) * 6);
        }, 800 + Math.random() * 400); // Faster movements
        tiltInterval = excitedMoveInterval;
        break;
      case 'thinking':
        // Thinking = look up and to the side
        headTilt.set(-3);
        microX.set(3);
        microY.set(-2);
        break;
      case 'happy':
        // Happy = slight upward tilt (like a smile)
        headTilt.set(-2);
        break;
      case 'frustrated':
        // Frustrated = slight downward, narrow focus
        headTilt.set(2);
        microX.set(0);
        microY.set(1);
        break;
      default:
        // Calm = neutral
        headTilt.set(0);
    }

    return () => {
      if (tiltInterval) clearInterval(tiltInterval);
    };
  }, [emotion, headTilt, microX, microY]);

  // Smart blinking system - get random blink interval based on state
  const getBlinkInterval = useCallback(() => {
    if (isUserTyping) return null; // Don't blink while user is typing (attentive listening)
    if (isResponding) {
      // Emotion affects blink speed while responding
      if (emotion === 'excited') return 500 + Math.random() * 300; // Very fast
      if (emotion === 'thinking') return 2000 + Math.random() * 1000; // Slower, contemplative
      return 800 + Math.random() * 400; // Normal responding
    }
    return 3000 + Math.random() * 2000; // Natural idle blinks (3-5s)
  }, [isUserTyping, isResponding, emotion]);

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
  }, [isAbsorbing, isAttentive, getBlinkInterval, triggerBlink]);

  // "Check-in" blink after long user inactivity (10+ seconds)
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

  // Micro-movements when idle (subtle "look around")
  useEffect(() => {
    if (isUserTyping || isResponding || isAbsorbing || emotion === 'excited') {
      if (emotion !== 'excited') {
        microX.set(0);
        microY.set(0);
      }
      return;
    }

    const microMovementInterval = setInterval(() => {
      const newX = (Math.random() - 0.5) * 4;
      const newY = (Math.random() - 0.5) * 3;
      microX.set(newX);
      microY.set(newY);
    }, 5000 + Math.random() * 3000);

    return () => clearInterval(microMovementInterval);
  }, [isUserTyping, isResponding, isAbsorbing, emotion, microX, microY]);

  const sizeClasses = {
    sm: 'w-[100px] h-[100px] md:w-[120px] md:h-[120px]',
    md: 'w-[140px] h-[140px] md:w-[180px] md:h-[180px]',
    lg: 'w-[160px] h-[160px] md:w-[220px] md:h-[220px] lg:w-[260px] lg:h-[260px]',
  };

  // Calculate iris radius based on state
  const getIrisRadius = () => {
    if (isAbsorbing) return 16;
    if (isAttentive) return 34;
    if (isUserTyping) return 32;
    if (emotion === 'curious') return 33; // Wider pupils when curious
    if (emotion === 'excited') return 32;
    if (isResponding) return 30;
    if (isHovered) return 30;
    return 28;
  };

  const irisRadius = getIrisRadius();
  const breathingDuration = emotionConfig.breathingSpeed;

  // Breathing scale based on emotion
  const breathingScale = useMemo(() => {
    if (emotion === 'excited') return [1, 1.025, 1];
    if (emotion === 'calm') return [1, 1.01, 1];
    return [1, 1.015, 1];
  }, [emotion]);

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Eye container with head tilt */}
      <motion.div 
        style={{ x: combinedX, y: combinedY, rotate: smoothTilt }}
        className="relative z-10 flex items-center justify-center group cursor-pointer will-change-transform" 
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        onMouseEnter={() => setIsHovered(true)} 
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Outer casing with breathing animation */}
        <motion.div 
          className={cn(
            "relative rounded-full bg-background flex items-center justify-center overflow-hidden transition-all duration-500",
            sizeClasses[size]
          )}
          style={{
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          }}
          animate={{ 
            scale: breathingScale,
            opacity: [1, 0.98, 1]
          }}
          transition={{ 
            duration: breathingDuration, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          {/* soft inner ring */}
          <div className="absolute inset-4 rounded-full bg-background/80 shadow-inner" />

          {/* Eyelid overlay - top */}
          <motion.div 
            className="absolute inset-0 bg-background z-20 origin-top"
            style={{
              clipPath: useTransform(eyelidClipTop, (v) => `inset(0% 0% ${100 - v}% 0%)`),
            }}
          />
          
          {/* Eyelid overlay - bottom */}
          <motion.div 
            className="absolute inset-0 bg-background z-20 origin-bottom"
            style={{
              clipPath: useTransform(eyelidClipBottom, (v) => `inset(${v}% 0% 0% 0%)`),
            }}
          />

          {/* Eyelid edge shadows for depth */}
          <motion.div 
            className="absolute inset-x-0 h-8 bg-gradient-to-b from-foreground/10 to-transparent z-21 pointer-events-none"
            style={{
              top: 0,
              opacity: smoothEyelid,
              transform: useTransform(eyelidClipTop, (v) => `translateY(${v - 50}%)`),
            }}
          />
          <motion.div 
            className="absolute inset-x-0 h-8 bg-gradient-to-t from-foreground/10 to-transparent z-21 pointer-events-none"
            style={{
              bottom: 0,
              opacity: smoothEyelid,
              transform: useTransform(eyelidClipBottom, (v) => `translateY(${50 - v}%)`),
            }}
          />

          {/* actual eye (pupil + iris) */}
          <svg 
            viewBox="0 0 100 100" 
            className="w-[70%] h-[70%] relative z-10" 
            xmlns="http://www.w3.org/2000/svg"
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
                    : "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
              }}
            >
              <Brain className="w-full h-full" style={{ color: emotionConfig.color, transition: 'color 0.5s ease' }} />
            </foreignObject>
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
};
