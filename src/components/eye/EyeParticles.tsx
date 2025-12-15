import { motion } from 'framer-motion';
import { memo, useMemo } from 'react';
import { AYNEmotion } from '@/contexts/AYNEmotionContext';

interface EyeParticlesProps {
  emotion: AYNEmotion;
  isActive: boolean;
  size?: number;
  glowColor?: string;
  activityLevel?: 'idle' | 'low' | 'medium' | 'high';
}

// Emotion-specific particle configurations
const PARTICLE_CONFIGS: Record<AYNEmotion, {
  count: number;
  color: string;
  shape: 'circle' | 'star' | 'diamond';
  glowIntensity: number;
  speed: number;
}> = {
  calm: {
    count: 3,
    color: 'hsl(210, 60%, 70%)',
    shape: 'circle',
    glowIntensity: 0.4,
    speed: 1,
  },
  happy: {
    count: 5,
    color: 'hsl(45, 95%, 65%)',
    shape: 'star',
    glowIntensity: 0.8,
    speed: 1.2,
  },
  excited: {
    count: 6,
    color: 'hsl(35, 100%, 60%)',
    shape: 'star',
    glowIntensity: 0.9,
    speed: 1.5,
  },
  thinking: {
    count: 4,
    color: 'hsl(220, 70%, 65%)',
    shape: 'diamond',
    glowIntensity: 0.5,
    speed: 0.8,
  },
  curious: {
    count: 4,
    color: 'hsl(280, 60%, 70%)',
    shape: 'diamond',
    glowIntensity: 0.6,
    speed: 1,
  },
  frustrated: {
    count: 3,
    color: 'hsl(0, 70%, 60%)',
    shape: 'diamond',
    glowIntensity: 0.5,
    speed: 0.7,
  },
  comfort: {
    count: 4,
    color: 'hsl(30, 80%, 70%)',
    shape: 'circle',
    glowIntensity: 0.7,
    speed: 0.6,
  },
  supportive: {
    count: 4,
    color: 'hsl(340, 60%, 75%)',
    shape: 'circle',
    glowIntensity: 0.7,
    speed: 0.6,
  },
  bored: {
    count: 2,
    color: 'hsl(200, 20%, 60%)',
    shape: 'circle',
    glowIntensity: 0.3,
    speed: 0.5,
  },
  mad: {
    count: 4,
    color: 'hsl(0, 80%, 55%)',
    shape: 'diamond',
    glowIntensity: 0.7,
    speed: 1.3,
  },
  sad: {
    count: 3,
    color: 'hsl(220, 40%, 60%)',
    shape: 'circle',
    glowIntensity: 0.4,
    speed: 0.5,
  },
};

const EyeParticlesComponent = ({ 
  emotion, 
  isActive, 
  size = 260,
}: EyeParticlesProps) => {
  const config = PARTICLE_CONFIGS[emotion];
  
  const particles = useMemo(() => {
    return Array.from({ length: config.count }, (_, i) => {
      const angle = (i / config.count) * Math.PI * 2;
      const radius = size * 0.52;
      return {
        id: i,
        angle,
        radius,
        size: config.shape === 'star' ? 6 : 4,
        delay: i * 0.4,
        duration: (4 + Math.random() * 2) / config.speed,
      };
    });
  }, [config.count, config.shape, config.speed, size]);

  if (!isActive) return null;

  // Render different shapes based on emotion
  const renderParticle = (p: typeof particles[0]) => {
    const drift = 0.3;
    const x1 = Math.cos(p.angle) * p.radius;
    const y1 = Math.sin(p.angle) * p.radius;
    const x2 = Math.cos(p.angle + drift) * p.radius;
    const y2 = Math.sin(p.angle + drift) * p.radius;

    const baseStyle = {
      position: 'absolute' as const,
      left: '50%',
      top: '50%',
    };

    if (config.shape === 'star') {
      // Star/sparkle shape using CSS
      return (
        <motion.div
          key={p.id}
          style={{
            ...baseStyle,
            width: p.size,
            height: p.size,
          }}
          initial={{ x: x1 - p.size / 2, y: y1 - p.size / 2, opacity: 0, scale: 0.3, rotate: 0 }}
          animate={{
            x: [x1 - p.size / 2, x2 - p.size / 2, x1 - p.size / 2],
            y: [y1 - p.size / 2, y2 - p.size / 2, y1 - p.size / 2],
            opacity: [0.2, config.glowIntensity, 0.2],
            scale: [0.6, 1.2, 0.6],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg viewBox="0 0 24 24" fill={config.color} style={{ filter: `drop-shadow(0 0 ${p.size}px ${config.color})` }}>
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
        </motion.div>
      );
    }

    if (config.shape === 'diamond') {
      return (
        <motion.div
          key={p.id}
          style={{
            ...baseStyle,
            width: p.size,
            height: p.size,
            backgroundColor: config.color,
            transform: 'rotate(45deg)',
            boxShadow: `0 0 ${p.size * 2}px ${config.color}`,
          }}
          initial={{ x: x1 - p.size / 2, y: y1 - p.size / 2, opacity: 0, scale: 0.5 }}
          animate={{
            x: [x1 - p.size / 2, x2 - p.size / 2, x1 - p.size / 2],
            y: [y1 - p.size / 2, y2 - p.size / 2, y1 - p.size / 2],
            opacity: [0.2, config.glowIntensity, 0.2],
            scale: [0.7, 1, 0.7],
          }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      );
    }

    // Default: soft circle/orb
    return (
      <motion.div
        key={p.id}
        style={{
          ...baseStyle,
          width: p.size,
          height: p.size,
          borderRadius: '50%',
          backgroundColor: config.color,
          boxShadow: `0 0 ${p.size * 3}px ${config.color}`,
        }}
        initial={{ x: x1 - p.size / 2, y: y1 - p.size / 2, opacity: 0, scale: 0.5 }}
        animate={{
          x: [x1 - p.size / 2, x2 - p.size / 2, x1 - p.size / 2],
          y: [y1 - p.size / 2, y2 - p.size / 2, y1 - p.size / 2],
          opacity: [0.3, config.glowIntensity, 0.3],
          scale: [0.8, 1.1, 0.8],
        }}
        transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
      />
    );
  };

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
      {particles.map(renderParticle)}
    </div>
  );
};

export const EyeParticles = memo(EyeParticlesComponent);
