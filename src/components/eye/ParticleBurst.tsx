import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

interface ParticleBurstProps {
  isActive: boolean;
  position: { x: number; y: number };
  particleCount?: number;
  color?: string;
}

export const ParticleBurst = ({
  isActive,
  position,
  particleCount = 16,
  color = 'hsl(var(--primary))',
}: ParticleBurstProps) => {
  // Generate random particles with consistent positions per render
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = 50 + Math.random() * 70;
      const size = 4 + Math.random() * 5;
      const duration = 0.5 + Math.random() * 0.3;
      
      return {
        id: i,
        angle,
        distance,
        size,
        duration,
        // Calculate end position based on angle
        endX: Math.cos(angle) * distance,
        endY: Math.sin(angle) * distance,
        // Randomize initial delay for stagger effect
        delay: Math.random() * 0.05,
      };
    });
  }, [particleCount]);

  // Secondary ring of smaller particles
  const secondaryParticles = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const distance = 30 + Math.random() * 40;
      
      return {
        id: i,
        endX: Math.cos(angle) * distance,
        endY: Math.sin(angle) * distance,
        duration: 0.35 + Math.random() * 0.2,
        delay: 0.05 + Math.random() * 0.05,
      };
    });
  }, []);

  return (
    <AnimatePresence>
      {isActive && (
        <div
          className="fixed pointer-events-none z-[60]"
          style={{ left: position.x, top: position.y }}
        >
          {/* Central flash */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 20,
              height: 20,
              left: -10,
              top: -10,
              background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />

          {/* Expanding ring */}
          <motion.div
            className="absolute rounded-full border-2"
            style={{
              width: 40,
              height: 40,
              left: -20,
              top: -20,
              borderColor: color,
            }}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          />

          {/* Primary particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                width: particle.size,
                height: particle.size,
                left: -particle.size / 2,
                top: -particle.size / 2,
                backgroundColor: color,
                boxShadow: `0 0 ${particle.size * 2}px ${color}`,
              }}
              initial={{
                x: 0,
                y: 0,
                scale: 1,
                opacity: 1,
              }}
              animate={{
                x: particle.endX,
                y: particle.endY,
                scale: 0,
                opacity: 0,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: [0.32, 0.72, 0, 1],
              }}
            />
          ))}

          {/* Secondary smaller particles */}
          {secondaryParticles.map((particle) => (
            <motion.div
              key={`secondary-${particle.id}`}
              className="absolute rounded-full"
              style={{
                width: 3,
                height: 3,
                left: -1.5,
                top: -1.5,
                backgroundColor: color,
                opacity: 0.6,
              }}
              initial={{
                x: 0,
                y: 0,
                scale: 1,
                opacity: 0.6,
              }}
              animate={{
                x: particle.endX,
                y: particle.endY,
                scale: 0,
                opacity: 0,
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};
