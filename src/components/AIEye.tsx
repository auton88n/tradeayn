import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

export const AIEye = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Map mouse position to eye movement (reduced range for subtle effect)
  const eyeX = useTransform(mouseX, [0, window.innerWidth], [-12, 12]);
  const eyeY = useTransform(mouseY, [0, window.innerHeight], [-12, 12]);

  // Smooth spring physics
  const springConfig = { damping: 30, stiffness: 200 };
  const smoothX = useSpring(eyeX, springConfig);
  const smoothY = useSpring(eyeY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="relative">
        {/* Single soft glow halo - radial gradient for smooth edges */}
        <div className="absolute -inset-8 rounded-full blur-3xl bg-[radial-gradient(circle,_rgba(229,229,229,0.3)_0%,_transparent_85%)] dark:bg-[radial-gradient(circle,_rgba(38,38,38,0.15)_0%,_transparent_85%)]" />

        {/* Main eye - perfect circle with clean Apple-style design */}
        <div className="relative w-40 h-40 md:w-48 md:h-48 lg:w-64 lg:h-64 rounded-full bg-gradient-to-b from-white to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 eye-shadow">
          {/* Inner shadow ring for depth */}
          <div className="absolute inset-2 rounded-full shadow-[inset_0_4px_16px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_4px_16px_rgba(0,0,0,0.3)]" />

          {/* Iris container - cursor tracking */}
          <motion.div
            style={{ x: smoothX, y: smoothY }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* Iris */}
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-neutral-800 to-black dark:from-neutral-200 dark:to-white shadow-lg" />
          </motion.div>

          {/* Single highlight reflection - top left */}
          <div className="absolute top-6 left-8 md:top-8 md:left-10 lg:top-10 lg:left-12 w-3 h-3 md:w-4 md:h-4 rounded-full bg-white/60 dark:bg-white/40" />
        </div>
      </div>
    </div>
  );
};
