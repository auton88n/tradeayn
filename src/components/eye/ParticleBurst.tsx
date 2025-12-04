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

  // Imploding particles that move FROM outer edge TO center
  const implosionParticles = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => {
      const angle = (i / 10) * Math.PI * 2;
      const startDistance = 60 + Math.random() * 30;
      
      return {
        id: i,
        startX: Math.cos(angle) * startDistance,
        startY: Math.sin(angle) * startDistance,
        size: 2 + Math.random() * 3,
        duration: 0.2 + Math.random() * 0.15,
        delay: Math.random() * 0.08,
      };
    });
  }, []);

  // Energy trail dots
  const energyTrail = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      angle: Math.random() * Math.PI * 2,
      distance: 15 + i * 8,
      size: 4 - i * 0.5,
      delay: i * 0.03,
    }));
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

          {/* Energy trail dots */}
          {energyTrail.map((dot) => (
            <motion.div
              key={`trail-${dot.id}`}
              className="absolute rounded-full"
              style={{
                width: dot.size,
                height: dot.size,
                left: -dot.size / 2,
                top: -dot.size / 2,
                background: `linear-gradient(135deg, white, ${color})`,
              }}
              initial={{
                x: Math.cos(dot.angle) * dot.distance,
                y: Math.sin(dot.angle) * dot.distance,
                scale: 1,
                opacity: 0.8,
              }}
              animate={{
                x: 0,
                y: 0,
                scale: 0,
                opacity: 0,
              }}
              transition={{
                duration: 0.25,
                delay: dot.delay,
                ease: [0.55, 0.055, 0.675, 0.19],
              }}
            />
          ))}

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
