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
  particleCount = 10, // Reduced from 16
  color = 'hsl(var(--primary))',
}: ParticleBurstProps) => {
  // Generate fewer particles for better performance
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = 40 + Math.random() * 50; // Shorter distance
      const size = 3 + Math.random() * 4;
      const duration = 0.35 + Math.random() * 0.2; // Faster
      
      return {
        id: i,
        angle,
        distance,
        size,
        duration,
        endX: Math.cos(angle) * distance,
        endY: Math.sin(angle) * distance,
        delay: Math.random() * 0.03,
      };
    });
  }, [particleCount]);

  // Reduced secondary particles
  const secondaryParticles = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => { // Reduced from 8
      const angle = (i / 5) * Math.PI * 2 + Math.PI / 5;
      const distance = 25 + Math.random() * 30;
      
      return {
        id: i,
        endX: Math.cos(angle) * distance,
        endY: Math.sin(angle) * distance,
        duration: 0.25 + Math.random() * 0.15,
        delay: 0.03 + Math.random() * 0.03,
      };
    });
  }, []);

  // Reduced imploding particles
  const implosionParticles = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => { // Reduced from 10
      const angle = (i / 6) * Math.PI * 2;
      const startDistance = 45 + Math.random() * 20;
      
      return {
        id: i,
        startX: Math.cos(angle) * startDistance,
        startY: Math.sin(angle) * startDistance,
        size: 2 + Math.random() * 2,
        duration: 0.18 + Math.random() * 0.1,
        delay: Math.random() * 0.05,
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
          {/* Bright central flash */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 30,
              height: 30,
              left: -15,
              top: -15,
              background: `radial-gradient(circle, white 0%, ${color} 40%, transparent 70%)`,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />

          {/* Secondary white impact flash */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 16,
              height: 16,
              left: -8,
              top: -8,
              background: 'radial-gradient(circle, white 0%, transparent 70%)',
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          />

          {/* Pulsing afterglow */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 24,
              height: 24,
              left: -12,
              top: -12,
              background: `radial-gradient(circle, ${color} 0%, transparent 60%)`,
            }}
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: [0.5, 1.5, 0], opacity: [0.8, 0.4, 0] }}
            transition={{ duration: 0.5, ease: 'easeOut', times: [0, 0.6, 1] }}
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
            initial={{ scale: 0, opacity: 0.9 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
          />

          {/* Second thinner ring */}
          <motion.div
            className="absolute rounded-full border"
            style={{
              width: 50,
              height: 50,
              left: -25,
              top: -25,
              borderColor: color,
              opacity: 0.5,
            }}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.05, ease: [0.32, 0.72, 0, 1] }}
          />

          {/* Imploding particles - move FROM outside TO center */}
          {implosionParticles.map((particle) => (
            <motion.div
              key={`implode-${particle.id}`}
              className="absolute rounded-full"
              style={{
                width: particle.size,
                height: particle.size,
                left: -particle.size / 2,
                top: -particle.size / 2,
                backgroundColor: color,
                boxShadow: `0 0 ${particle.size * 3}px ${color}`,
              }}
              initial={{
                x: particle.startX,
                y: particle.startY,
                scale: 1,
                opacity: 0.9,
              }}
              animate={{
                x: 0,
                y: 0,
                scale: 0,
                opacity: 0,
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: [0.55, 0.055, 0.675, 0.19],
              }}
            />
          ))}

          {/* Energy trail removed for performance */}

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
