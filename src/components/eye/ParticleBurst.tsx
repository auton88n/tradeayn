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
  particleCount = 12,
  color = 'hsl(var(--primary))',
}: ParticleBurstProps) => {
  // Generate random particles with consistent positions per render
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = 40 + Math.random() * 60;
      const size = 3 + Math.random() * 4;
      const duration = 0.4 + Math.random() * 0.3;
      
      return {
        id: i,
        angle,
        distance,
        size,
        duration,
        // Calculate end position based on angle
        endX: Math.cos(angle) * distance,
        endY: Math.sin(angle) * distance,
      };
    });
  }, [particleCount]);

  return (
    <AnimatePresence>
      {isActive && (
        <div
          className="fixed pointer-events-none z-[60]"
          style={{ left: position.x, top: position.y }}
        >
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                width: particle.size,
                height: particle.size,
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
                ease: [0.32, 0.72, 0, 1],
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};
