import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAYNEmotion } from '@/contexts/AYNEmotionContext';

interface EmotionalEyeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const EmotionalEye = ({ size = 'lg', className }: EmotionalEyeProps) => {
  const { emotionConfig, isAbsorbing, isBlinking, triggerBlink, isResponding } = useAYNEmotion();
  const [isHovered, setIsHovered] = useState(false);

  // Mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 50, stiffness: 300 };
  const eyeX = useSpring(useTransform(mouseX, (v) => v * 0.015), springConfig);
  const eyeY = useSpring(useTransform(mouseY, (v) => v * 0.015), springConfig);

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

  // Blink only when AYN is responding
  useEffect(() => {
    if (!isResponding) return;
    
    const interval = setInterval(() => {
      if (!isAbsorbing) {
        triggerBlink();
      }
    }, 800 + Math.random() * 400); // Faster blinks while responding (0.8-1.2s)

    return () => clearInterval(interval);
  }, [isAbsorbing, triggerBlink, isResponding]);

  const sizeClasses = {
    sm: 'w-[100px] h-[100px] md:w-[120px] md:h-[120px]',
    md: 'w-[140px] h-[140px] md:w-[180px] md:h-[180px]',
    lg: 'w-[160px] h-[160px] md:w-[220px] md:h-[220px] lg:w-[260px] lg:h-[260px]',
  };

  // Calculate iris radius based on state - contract on absorb, expand on respond
  const irisRadius = isAbsorbing ? 18 : isResponding ? 34 : isBlinking ? 30 : isHovered ? 32 : 28;

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Eye - centered with spring physics */}
      <motion.div 
        style={{ x: eyeX, y: eyeY }}
        className="relative z-10 flex items-center justify-center group cursor-pointer will-change-transform" 
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        onMouseEnter={() => setIsHovered(true)} 
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Outer casing - emotion color on border ONLY */}
        <motion.div 
          className={cn(
            "relative rounded-full bg-background flex items-center justify-center overflow-hidden transition-all duration-500",
            sizeClasses[size]
          )}
          style={{
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          }}
          animate={{ scale: [1, 1.01, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
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
