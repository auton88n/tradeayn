import { motion, AnimatePresence } from 'framer-motion';
import { memo } from 'react';
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

const EyeParticlesComponent = ({ emotion, isActive, size = 260, glowColor }: EyeParticlesProps) => {
  const config = EMOTION_CONFIGS[emotion];
  const particleType = config.particleType;
  const isMobile = useIsMobile();
  
  // Use provided glowColor or fallback to config
  const activeColor = glowColor || config.glowColor;

  // Allow warmth particles for comfort emotion
  const showWarmth = emotion === 'comfort' || emotion === 'supportive';
  
  if (particleType === 'none' && !showWarmth) return null;
  if (!isActive) return null;
  if (isMobile && !showWarmth) return null;

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
    <div className="absolute inset-0 pointer-events-none overflow-visible flex items-center justify-center">
      <AnimatePresence>
        {showWarmth && (
          <WarmthParticles radius={radius} color={activeColor} />
        )}
        {particleType === 'sparkle' && !showWarmth && (
          <SparkleParticles particles={particles} color={activeColor} />
        )}
        {particleType === 'orbit' && !showWarmth && (
          <OrbitParticles color={activeColor} radius={radius} />
        )}
        {particleType === 'energy' && !showWarmth && (
          <EnergyParticles particles={particles} color={activeColor} />
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

// Gentle floating warmth particles - uses dynamic color matching eye emotion
const WarmthParticles = ({ radius, color }: { radius: number; color: string }) => {
  // Create 6 gentle floating ember particles
  const embers = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    startAngle: (i / 6) * Math.PI * 2,
    size: 5 + Math.random() * 4,
    delay: i * 0.4,
    duration: 4 + Math.random() * 2,
    floatDistance: 20 + Math.random() * 30,
  }));

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
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </>
  );
};
