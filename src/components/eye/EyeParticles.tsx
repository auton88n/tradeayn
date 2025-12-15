import { motion } from 'framer-motion';
import { memo, useMemo } from 'react';
import { AYNEmotion, EMOTION_CONFIGS } from '@/contexts/AYNEmotionContext';

interface EyeParticlesProps {
  emotion: AYNEmotion;
  isActive: boolean;
  size?: number;
  glowColor?: string;
  activityLevel?: 'idle' | 'low' | 'medium' | 'high';
}

const EyeParticlesComponent = ({ 
  emotion, 
  isActive, 
  size = 260, 
  glowColor 
}: EyeParticlesProps) => {
  const config = EMOTION_CONFIGS[emotion];
  const color = glowColor || config.glowColor;
  
  // Fewer particles - 3 to 5 based on emotion
  const particleCount = useMemo(() => {
    if (emotion === 'excited' || emotion === 'happy') return 5;
    if (emotion === 'comfort' || emotion === 'supportive') return 4;
    return 3;
  }, [emotion]);

  // Generate particles in tight orbit around eye edge
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = size * 0.52; // Tight orbit just outside eye
      return {
        id: i,
        angle,
        radius,
        size: 3 + Math.random() * 3, // Small: 3-6px
        delay: i * 0.5,
        duration: 4 + Math.random() * 2,
      };
    });
  }, [particleCount, size]);

  if (!isActive) return null;

  return (
    <div 
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: size * 1.3,
        height: size * 1.3,
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      {particles.map((p) => {
        // Simple orbital drift
        const drift = 0.3;
        const x1 = Math.cos(p.angle) * p.radius;
        const y1 = Math.sin(p.angle) * p.radius;
        const x2 = Math.cos(p.angle + drift) * p.radius;
        const y2 = Math.sin(p.angle + drift) * p.radius;
        
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
              backgroundColor: color,
              boxShadow: `0 0 ${p.size}px ${color}`,
            }}
            initial={{ 
              x: x1 - p.size / 2, 
              y: y1 - p.size / 2, 
              opacity: 0, 
              scale: 0.5 
            }}
            animate={{
              x: [x1 - p.size / 2, x2 - p.size / 2, x1 - p.size / 2],
              y: [y1 - p.size / 2, y2 - p.size / 2, y1 - p.size / 2],
              opacity: [0.3, 0.6, 0.3],
              scale: [0.8, 1, 0.8],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
};

export const EyeParticles = memo(EyeParticlesComponent);
