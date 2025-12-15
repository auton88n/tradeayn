import { motion } from 'framer-motion';
import { memo, useMemo } from 'react';

interface EyeParticlesProps {
  isActive: boolean;
  size?: number;
  glowColor?: string;
  activityLevel?: 'idle' | 'low' | 'medium' | 'high';
}

// Activity-based particle count
const PARTICLE_COUNTS = {
  idle: 0,
  low: 3,
  medium: 5,
  high: 7,
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
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
      const radius = size * (0.55 + Math.random() * 0.15); // 1.1x to 1.4x from center
      return {
        id: i,
        angle,
        radius,
        size: 3 + Math.random() * 3, // 3-6px
        delay: Math.random() * 2,
        duration: 6 + Math.random() * 4, // 6-10s for gentle movement
        floatOffset: Math.random() * 20 - 10, // Random vertical float range
        driftAmount: 0.2 + Math.random() * 0.3, // How much it drifts around orbit
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
        width: size * 1.5,
        height: size * 1.5,
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      {particles.map((p) => {
        // Calculate positions for gentle orbital drift
        const x1 = Math.cos(p.angle) * p.radius;
        const y1 = Math.sin(p.angle) * p.radius;
        const x2 = Math.cos(p.angle + p.driftAmount) * p.radius;
        const y2 = Math.sin(p.angle + p.driftAmount) * p.radius;
        const x3 = Math.cos(p.angle - p.driftAmount * 0.5) * p.radius;
        const y3 = Math.sin(p.angle - p.driftAmount * 0.5) * p.radius;

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
              boxShadow: `0 0 ${p.size * 3}px ${glowColor}, 0 0 ${p.size * 6}px ${glowColor}`,
            }}
            initial={{ 
              x: x1 - p.size / 2, 
              y: y1 - p.size / 2, 
              opacity: 0, 
              scale: 0.5 
            }}
            animate={{
              x: [
                x1 - p.size / 2, 
                x2 - p.size / 2, 
                x3 - p.size / 2, 
                x1 - p.size / 2
              ],
              y: [
                y1 - p.size / 2 + p.floatOffset, 
                y2 - p.size / 2 - p.floatOffset, 
                y3 - p.size / 2 + p.floatOffset * 0.5, 
                y1 - p.size / 2 + p.floatOffset
              ],
              opacity: [0.3, 0.6, 0.4, 0.3],
              scale: [0.8, 1.1, 0.9, 0.8],
            }}
            transition={{ 
              duration: p.duration, 
              delay: p.delay, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
          />
        );
      })}
    </div>
  );
};

export const EyeParticles = memo(EyeParticlesComponent);
