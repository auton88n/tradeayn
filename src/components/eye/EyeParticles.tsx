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
      // Random fixed position around the eye (not orbiting)
      const angle = Math.random() * Math.PI * 2;
      const radius = size * (0.55 + Math.random() * 0.2); // 1.1x to 1.5x from center
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      return {
        id: i,
        x, // Fixed x position
        y, // Fixed y position
        size: 3 + Math.random() * 3, // 3-6px
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2, // 3-5s for gentle float
        floatRange: 8 + Math.random() * 12, // How much it floats up/down (8-20px)
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
      {particles.map((p) => (
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
            x: p.x - p.size / 2, 
            y: p.y - p.size / 2, 
            opacity: 0, 
            scale: 0.5 
          }}
          animate={{
            // Stay at fixed x position
            x: p.x - p.size / 2,
            // Gentle up/down float at fixed position
            y: [
              p.y - p.size / 2, 
              p.y - p.size / 2 - p.floatRange, 
              p.y - p.size / 2,
            ],
            opacity: [0.3, 0.6, 0.3],
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{ 
            duration: p.duration, 
            delay: p.delay, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
        />
      ))}
    </div>
  );
};

export const EyeParticles = memo(EyeParticlesComponent);
