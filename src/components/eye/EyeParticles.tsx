import { motion, AnimatePresence } from 'framer-motion';
import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { AYNEmotion, EMOTION_CONFIGS } from '@/contexts/AYNEmotionContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface EyeParticlesProps {
  emotion: AYNEmotion;
  isActive: boolean;
  size?: number;
  glowColor?: string;
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

// Emotion-based particle configuration: speed multiplier and particle count
const EMOTION_PARTICLE_CONFIG: Record<AYNEmotion, { speedMult: number; count: number }> = {
  calm: { speedMult: 1.0, count: 4 },
  happy: { speedMult: 0.8, count: 6 },
  excited: { speedMult: 0.5, count: 8 },  // Fast, many particles
  thinking: { speedMult: 1.2, count: 3 },  // Slow, focused
  frustrated: { speedMult: 0.6, count: 6 }, // Fast energy
  curious: { speedMult: 0.9, count: 5 },
  sad: { speedMult: 2.0, count: 3 },       // Very slow, sparse
  mad: { speedMult: 0.4, count: 7 },       // Very fast, intense
  bored: { speedMult: 2.5, count: 2 },     // Extremely slow, minimal
  comfort: { speedMult: 1.5, count: 5 },   // Gentle, warm
  supportive: { speedMult: 1.3, count: 5 },
};

const EyeParticlesComponent = ({ emotion, isActive, size = 260, glowColor }: EyeParticlesProps) => {
  const config = EMOTION_CONFIGS[emotion];
  const particleType = config.particleType;
  const isMobile = useIsMobile();
  
  // Use provided glowColor or fallback to config
  const activeColor = glowColor || config.glowColor;
  
  // Get emotion-based particle settings
  const particleConfig = EMOTION_PARTICLE_CONFIG[emotion];

  // Allow warmth particles for comfort emotion
  const showWarmth = emotion === 'comfort' || emotion === 'supportive';
  
  if (particleType === 'none' && !showWarmth) return null;
  if (!isActive) return null;
  if (isMobile && !showWarmth) return null;

  const radius = size * 0.6;
  
  // Generate particles based on emotion count
  const particles: Particle[] = useMemo(() => 
    Array.from({ length: particleConfig.count }, (_, i) => ({
      id: i,
      x: Math.cos((i / particleConfig.count) * Math.PI * 2) * radius,
      y: Math.sin((i / particleConfig.count) * Math.PI * 2) * radius,
      size: 4 + Math.random() * 4,
      delay: i * (0.15 * particleConfig.speedMult),
      duration: (2.5 + Math.random() * 1) * particleConfig.speedMult,
      angle: (i / particleConfig.count) * 360,
    })), [particleConfig.count, particleConfig.speedMult, radius]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible flex items-center justify-center">
      <AnimatePresence>
        {showWarmth && (
          <WarmthParticles radius={radius} color={activeColor} speedMult={particleConfig.speedMult} count={particleConfig.count} />
        )}
        {particleType === 'sparkle' && !showWarmth && (
          <SparkleParticles particles={particles} color={activeColor} speedMult={particleConfig.speedMult} />
        )}
        {particleType === 'orbit' && !showWarmth && (
          <OrbitParticles color={activeColor} radius={radius} speedMult={particleConfig.speedMult} />
        )}
        {particleType === 'energy' && !showWarmth && (
          <EnergyParticles particles={particles} color={activeColor} speedMult={particleConfig.speedMult} />
        )}
      </AnimatePresence>
    </div>
  );
};

export const EyeParticles = memo(EyeParticlesComponent);

const SparkleParticles = ({ particles, color, speedMult }: { particles: Particle[]; color: string; speedMult: number }) => (
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

const OrbitParticles = ({ color, radius, speedMult }: { color: string; radius: number; speedMult: number }) => {
  const dots = [0, 1, 2];
  const orbitDuration = 3 * speedMult; // Slower/faster based on emotion
  
  return (
    <motion.div
      className="absolute inset-0"
      animate={{ rotate: 360 }}
      transition={{ duration: orbitDuration, repeat: Infinity, ease: 'linear' }}
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
            duration: 1.5 * speedMult,
            delay: i * 0.5 * speedMult,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.div>
  );
};

const EnergyParticles = ({ particles, color, speedMult }: { particles: Particle[]; color: string; speedMult: number }) => (
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
          duration: (0.8 + Math.random() * 0.4) * speedMult,
          delay: p.delay,
          repeat: Infinity,
          repeatDelay: 0.5 * speedMult,
          ease: 'easeOut',
        }}
      />
    ))}
  </>
);

// Gentle floating warmth particles - uses dynamic color matching eye emotion
const WarmthParticles = ({ radius, color, speedMult, count }: { radius: number; color: string; speedMult: number; count: number }) => {
  // Create gentle floating ember particles based on count
  const embers = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      startAngle: (i / count) * Math.PI * 2,
      size: 5 + Math.random() * 4,
      delay: i * 0.4 * speedMult,
      duration: (4 + Math.random() * 2) * speedMult,
      floatDistance: 20 + Math.random() * 30,
    })), [count, speedMult]);

  return (
    <>
      {embers.map((ember) => {
        const startX = Math.cos(ember.startAngle) * radius * 0.7;
        const startY = Math.sin(ember.startAngle) * radius * 0.7;
        
        return (
          <motion.div
            key={ember.id}
            className="absolute rounded-full"
            style={{
              width: ember.size,
              height: ember.size,
              background: `radial-gradient(circle, ${color} 0%, ${color}80 50%, transparent 100%)`,
              boxShadow: `
                0 0 ${ember.size * 2}px ${color},
                0 0 ${ember.size * 4}px ${color}50
              `,
            }}
            initial={{ 
              x: startX, 
              y: startY, 
              opacity: 0, 
              scale: 0.5 
            }}
            animate={{
              x: [startX, startX + Math.random() * 20 - 10, startX],
              y: [startY, startY - ember.floatDistance, startY - ember.floatDistance * 0.5],
              opacity: [0, 0.8, 0.6, 0],
              scale: [0.5, 1, 0.8, 0.3],
            }}
            transition={{
              duration: ember.duration,
              delay: ember.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      })}
      
      {/* Soft ambient glow ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: radius * 1.8,
          height: radius * 1.8,
          background: `radial-gradient(circle, ${color}25 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 3 * speedMult,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </>
  );
};
