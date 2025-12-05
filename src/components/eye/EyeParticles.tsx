import { motion, AnimatePresence } from 'framer-motion';
import { memo } from 'react';
import { cn } from '@/lib/utils';
import { AYNEmotion, EMOTION_CONFIGS } from '@/contexts/AYNEmotionContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface EyeParticlesProps {
  emotion: AYNEmotion;
  isActive: boolean;
  size?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  angle: number;
}

const EyeParticlesComponent = ({ emotion, isActive, size = 260 }: EyeParticlesProps) => {
  const config = EMOTION_CONFIGS[emotion];
  const particleType = config.particleType;
  const isMobile = useIsMobile();

  // Disable particles on mobile for better performance
  if (particleType === 'none' || !isActive || isMobile) return null;

  const radius = size * 0.6;
  // Reduce particle count from 8 to 5 for performance
  const particles: Particle[] = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    x: Math.cos((i / 5) * Math.PI * 2) * radius,
    y: Math.sin((i / 5) * Math.PI * 2) * radius,
    size: 4 + Math.random() * 4,
    delay: i * 0.15,
    duration: 2.5 + Math.random() * 1,
    angle: (i / 5) * 360,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      <AnimatePresence>
        {particleType === 'sparkle' && (
          <SparkleParticles particles={particles} color={config.glowColor} />
        )}
        {particleType === 'orbit' && (
          <OrbitParticles color={config.glowColor} radius={radius} />
        )}
        {particleType === 'energy' && (
          <EnergyParticles particles={particles} color={config.glowColor} />
        )}
      </AnimatePresence>
    </div>
  );
};

export const EyeParticles = memo(EyeParticlesComponent);

const SparkleParticles = ({ particles, color }: { particles: Particle[]; color: string }) => (
  <>
    {particles.map((p) => (
      <motion.div
        key={p.id}
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: p.size,
          height: p.size,
          backgroundColor: color,
          boxShadow: `0 0 ${p.size * 2}px ${color}`,
        }}
        initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
        animate={{
          x: [0, p.x * 0.5, p.x],
          y: [0, p.y * 0.5, p.y],
          opacity: [0, 1, 0],
          scale: [0, 1.2, 0],
        }}
        transition={{
          duration: p.duration,
          delay: p.delay,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />
    ))}
  </>
);

const OrbitParticles = ({ color, radius }: { color: string; radius: number }) => {
  const dots = [0, 1, 2];
  
  return (
    <motion.div
      className="absolute inset-0"
      animate={{ rotate: 360 }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
    >
      {dots.map((i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: 6,
            height: 6,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`,
            transform: `translate(-50%, -50%) rotate(${i * 120}deg) translateX(${radius * 0.8}px)`,
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.div>
  );
};

const EnergyParticles = ({ particles, color }: { particles: Particle[]; color: string }) => (
  <>
    {particles.map((p) => (
      <motion.div
        key={p.id}
        className="absolute left-1/2 top-1/2"
        style={{
          width: 2,
          height: 12 + Math.random() * 8,
          backgroundColor: color,
          boxShadow: `0 0 6px ${color}`,
          transformOrigin: 'center bottom',
        }}
        initial={{ 
          x: -1, 
          y: -6, 
          opacity: 0, 
          scale: 0,
          rotate: p.angle 
        }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0, 1, 0],
          y: [-6, -60 - Math.random() * 20, -80],
        }}
        transition={{
          duration: 0.8 + Math.random() * 0.4,
          delay: p.delay,
          repeat: Infinity,
          repeatDelay: 0.5,
          ease: 'easeOut',
        }}
      />
    ))}
  </>
);
