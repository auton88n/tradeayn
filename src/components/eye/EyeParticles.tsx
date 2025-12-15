import { motion } from 'framer-motion';
import { memo, useMemo } from 'react';

interface EyeParticlesProps {
  isActive: boolean;
  size?: number;
  glowColor?: string;
  activityLevel?: 'idle' | 'low' | 'medium' | 'high';
}

// Particle counts per activity level
const PARTICLE_COUNTS = {
  idle: 0,
  low: 4,
  medium: 6,
  high: 8,
};

const EyeParticlesComponent = ({ 
  isActive, 
  size = 260,
  glowColor = 'hsl(210, 60%, 70%)',
  activityLevel = 'idle',
}: EyeParticlesProps) => {
  const particleCount = PARTICLE_COUNTS[activityLevel];
  
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      return {
        id: i,
        angle,
        size: 4 + Math.random() * 4, // Bigger: 4-8px
        delay: Math.random() * 2,
        duration: 4 + Math.random() * 3,
      };
    });
  }, [particleCount, size]);

  if (!isActive || particleCount === 0) return null;

  return (
    <div 
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: size * 2,
        height: size * 2,
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      {particles.map((p) => {
        // Start near eye center, drift outward
        const startRadius = size * 0.3;
        const endRadius = size * 0.9;
        const startX = Math.cos(p.angle) * startRadius;
        const startY = Math.sin(p.angle) * startRadius;
        const endX = Math.cos(p.angle) * endRadius;
        const endY = Math.sin(p.angle) * endRadius;

        return (
          <motion.div
            key={p.id}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: glowColor,
              boxShadow: `0 0 ${p.size * 2}px ${glowColor}`,
            }}
            initial={{ 
              x: startX - p.size / 2, 
              y: startY - p.size / 2, 
              opacity: 0, 
              scale: 0.3 
            }}
            animate={{
              x: [startX - p.size / 2, endX - p.size / 2],
              y: [startY - p.size / 2, endY - p.size / 2],
              opacity: [0, 0.5, 0],
              scale: [0.3, 0.8, 0.2],
            }}
            transition={{ 
              duration: p.duration, 
              delay: p.delay, 
              repeat: Infinity, 
              ease: 'easeOut' 
            }}
          />
        );
      })}
    </div>
  );
};

export const EyeParticles = memo(EyeParticlesComponent);
