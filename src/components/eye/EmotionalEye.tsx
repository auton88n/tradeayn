import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAYNEmotion, EMOTION_CONFIGS } from '@/contexts/AYNEmotionContext';

interface EmotionalEyeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-24 h-24',
  md: 'w-40 h-40 md:w-48 md:h-48',
  lg: 'w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80',
};

const irisSizes = {
  sm: 'w-8 h-8',
  md: 'w-14 h-14 md:w-16 md:h-16',
  lg: 'w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24',
};

export const EmotionalEye = ({ size = 'lg', className }: EmotionalEyeProps) => {
  const { emotion, emotionConfig, isAbsorbing, isBlinking } = useAYNEmotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 20, mass: 0.5 };
  const eyeX = useSpring(mouseX, springConfig);
  const eyeY = useSpring(mouseY, springConfig);

  // Limit eye movement range
  const maxMove = size === 'lg' ? 15 : size === 'md' ? 10 : 6;
  const clampedX = useTransform(eyeX, (v) => Math.max(-maxMove, Math.min(maxMove, v)));
  const clampedY = useTransform(eyeY, (v) => Math.max(-maxMove, Math.min(maxMove, v)));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let lastUpdate = 0;
    const throttleMs = 16;

    function onMove(e: MouseEvent) {
      const now = Date.now();
      if (now - lastUpdate < throttleMs) return;
      lastUpdate = now;

      const rect = el!.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      mouseX.set((e.clientX - cx) * 0.08);
      mouseY.set((e.clientY - cy) * 0.08);
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

  return (
    <div ref={containerRef} className={cn("relative flex items-center justify-center", className)}>
      {/* Emotion glow ring */}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-full ring-4 transition-all duration-500",
          emotionConfig.ringClass,
          emotionConfig.glowClass
        )}
        animate={{
          scale: isAbsorbing ? [1, 1.15, 1] : 1,
        }}
        transition={{
          duration: 0.3,
          ease: [0.32, 0.72, 0, 1],
        }}
        style={{
          boxShadow: `0 0 ${isAbsorbing ? 60 : 40}px ${emotionConfig.color}`,
        }}
      />

      {/* Main eye container */}
      <motion.div
        className={cn(
          "relative rounded-full",
          "bg-gradient-to-b from-background to-muted",
          "dark:from-neutral-900 dark:to-neutral-950",
          "shadow-[inset_0_4px_16px_rgba(0,0,0,0.1)]",
          "dark:shadow-[inset_0_4px_16px_rgba(0,0,0,0.3)]",
          sizeClasses[size]
        )}
        animate={{
          scaleY: isBlinking ? 0.1 : 1,
        }}
        transition={{
          duration: 0.15,
          ease: 'easeInOut',
        }}
      >
        {/* Iris container - cursor tracking */}
        <motion.div
          style={{ x: clampedX, y: clampedY }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {/* Iris with emotion-based scaling */}
          <motion.div
            className={cn(
              "rounded-full",
              "bg-gradient-to-br from-neutral-800 to-black",
              "dark:from-neutral-200 dark:to-white",
              "shadow-lg",
              irisSizes[size]
            )}
            animate={{
              scale: emotionConfig.irisScale,
            }}
            transition={{
              duration: 0.3,
              ease: 'easeOut',
            }}
          />
        </motion.div>

        {/* Highlight reflection */}
        <div
          className={cn(
            "absolute rounded-full bg-white/60 dark:bg-white/40",
            size === 'lg' ? "top-10 left-12 w-4 h-4" : size === 'md' ? "top-6 left-8 w-3 h-3" : "top-4 left-5 w-2 h-2"
          )}
        />
      </motion.div>

      {/* Breathing animation ring */}
      <motion.div
        className="absolute inset-0 rounded-full border border-foreground/5"
        animate={{
          scale: [1, 1.02, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: emotionConfig.breathingSpeed,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};
