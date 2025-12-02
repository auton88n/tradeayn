import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAYNEmotion } from '@/contexts/AYNEmotionContext';

interface EmotionalEyeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const EmotionalEye = ({ size = 'lg', className }: EmotionalEyeProps) => {
  const { emotionConfig, isAbsorbing, isBlinking } = useAYNEmotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 200 };
  const eyeX = useSpring(mouseX, springConfig);
  const eyeY = useSpring(mouseY, springConfig);

  // Limit eye movement range
  const clampedX = useTransform(eyeX, (v) => Math.max(-12, Math.min(12, v)));
  const clampedY = useTransform(eyeY, (v) => Math.max(-12, Math.min(12, v)));

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      mouseX.set((e.clientX - cx) * 0.03);
      mouseY.set((e.clientY - cy) * 0.03);
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

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32 md:w-40 md:h-40',
    lg: 'w-40 h-40 md:w-48 md:h-48 lg:w-64 lg:h-64',
  };

  const irisSizes = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12 md:w-16 md:h-16',
    lg: 'w-16 h-16 md:w-20 md:h-20',
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Single soft glow halo - same as landing page but with emotion color */}
      <motion.div 
        className="absolute -inset-8 rounded-full blur-3xl"
        animate={{
          scale: isAbsorbing ? 1.2 : 1,
          opacity: isAbsorbing ? 0.5 : 0.3,
        }}
        transition={{ duration: 0.3 }}
        style={{
          background: `radial-gradient(circle, ${emotionConfig.color}30 0%, transparent 70%)`,
        }}
      />

      {/* Main eye - perfect circle with clean Apple-style design */}
      <motion.div 
        className={cn(
          "relative rounded-full",
          "bg-gradient-to-b from-white to-neutral-100",
          "dark:from-neutral-900 dark:to-neutral-950",
          "eye-shadow",
          sizeClasses[size]
        )}
        animate={{
          scaleY: isBlinking ? 0.1 : 1,
          scale: isAbsorbing ? 1.05 : 1,
        }}
        transition={{ 
          scaleY: { duration: 0.15 },
          scale: { duration: 0.3 }
        }}
      >
        {/* Inner shadow ring for depth */}
        <div className="absolute inset-2 rounded-full shadow-[inset_0_4px_16px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_4px_16px_rgba(0,0,0,0.3)]" />

        {/* Iris container - cursor tracking */}
        <motion.div
          style={{ x: clampedX, y: clampedY }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {/* Iris - with subtle emotion color tint */}
          <motion.div 
            className={cn(
              "rounded-full shadow-lg",
              irisSizes[size]
            )}
            style={{
              background: `linear-gradient(to bottom right, ${emotionConfig.color}, hsl(var(--foreground)))`,
            }}
            animate={{
              scale: emotionConfig.irisScale,
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>

        {/* Single highlight reflection - top left */}
        <div className="absolute top-6 left-8 md:top-8 md:left-10 lg:top-10 lg:left-12 w-3 h-3 md:w-4 md:h-4 rounded-full bg-white/60 dark:bg-white/40" />
      </motion.div>
    </div>
  );
};
