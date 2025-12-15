import { motion } from 'framer-motion';
import { memo, useMemo } from 'react';
import { AYNEmotion, EMOTION_CONFIGS } from '@/contexts/AYNEmotionContext';

interface EyeParticlesProps {
  emotion: AYNEmotion;
  isActive: boolean;
  size?: number;
  glowColor?: string;
  onParticleNearEye?: (angle: number) => void;
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
  
  // Simple particle count based on emotion
  const particleCount = useMemo(() => {
    if (emotion === 'excited' || emotion === 'happy') return 6;
    if (emotion === 'comfort' || emotion === 'supportive') return 5;
    if (emotion === 'calm' || emotion === 'thinking') return 4;
    return 3;
  }, [emotion]);

  // Generate particles positioned around the eye
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = size * 0.7; // Position outside the eye
      return {
        id: i,
        angle,
        radius,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        size: 6 + Math.random() * 4,
        delay: i * 0.3,
        duration: 3 + Math.random() * 2,
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
        width: size * 2,
        height: size * 2,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      {particles.map((p) => {
        // Calculate orbital positions
        const driftAngle = 0.4;
        const x1 = Math.cos(p.angle) * p.radius;
        const y1 = Math.sin(p.angle) * p.radius;
        const x2 = Math.cos(p.angle + driftAngle) * (p.radius * 1.1);
        const y2 = Math.sin(p.angle + driftAngle) * (p.radius * 1.1) - 15;
        const x3 = Math.cos(p.angle + driftAngle * 2) * p.radius;
        const y3 = Math.sin(p.angle + driftAngle * 2) * p.radius + 10;
        
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
              boxShadow: `0 0 ${p.size * 2}px ${color}, 0 0 ${p.size * 4}px ${color}60`,
            }}
            initial={{ 
              x: x1 - p.size / 2, 
              y: y1 - p.size / 2, 
              opacity: 0, 
              scale: 0.5 
            }}
            animate={{
              x: [x1 - p.size / 2, x2 - p.size / 2, x3 - p.size / 2, x1 - p.size / 2],
              y: [y1 - p.size / 2, y2 - p.size / 2, y3 - p.size / 2, y1 - p.size / 2],
              opacity: [0, 0.9, 0.7, 0.9, 0],
              scale: [0.5, 1.2, 1, 1.1, 0.5],
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
