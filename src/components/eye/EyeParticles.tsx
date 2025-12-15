import { motion, AnimatePresence } from 'framer-motion';
import { memo, useMemo, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { AYNEmotion, EMOTION_CONFIGS } from '@/contexts/AYNEmotionContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface EyeParticlesProps {
  emotion: AYNEmotion;
  isActive: boolean;
  size?: number;
  glowColor?: string;
  onParticleNearEye?: (angle: number) => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  angle: number;
  startRadius: number;
}

// Emotion-based particle configuration: speed multiplier and particle count
const EMOTION_PARTICLE_CONFIG: Record<AYNEmotion, { speedMult: number; count: number }> = {
  calm: { speedMult: 1.0, count: 4 },
  happy: { speedMult: 0.8, count: 6 },
  excited: { speedMult: 0.5, count: 8 },
  thinking: { speedMult: 1.2, count: 3 },
  frustrated: { speedMult: 0.6, count: 6 },
  curious: { speedMult: 0.9, count: 5 },
  sad: { speedMult: 2.0, count: 3 },
  mad: { speedMult: 0.4, count: 7 },
  bored: { speedMult: 2.5, count: 2 },
  comfort: { speedMult: 1.5, count: 5 },
  supportive: { speedMult: 1.3, count: 5 },
};

const EyeParticlesComponent = ({ emotion, isActive, size = 260, glowColor, onParticleNearEye }: EyeParticlesProps) => {
  const config = EMOTION_CONFIGS[emotion];
  const particleType = config.particleType;
  const isMobile = useIsMobile();
  
  const activeColor = glowColor || config.glowColor;
  const particleConfig = EMOTION_PARTICLE_CONFIG[emotion];
  const showWarmth = emotion === 'comfort' || emotion === 'supportive';
  
  if (particleType === 'none' && !showWarmth) return null;
  if (!isActive) return null;
  if (isMobile && !showWarmth) return null;

  // Outer radius where particles START (1.3x to 1.6x eye size)
  const outerRadius = size * 0.8;
  const innerRadius = size * 0.35; // Where particles end (near eye edge)
  
  // Generate particles starting from OUTSIDE the eye
  const particles: Particle[] = useMemo(() => 
    Array.from({ length: particleConfig.count }, (_, i) => {
      const angle = (i / particleConfig.count) * Math.PI * 2;
      const startRadius = outerRadius + Math.random() * (size * 0.2);
      return {
        id: i,
        x: Math.cos(angle) * startRadius,
        y: Math.sin(angle) * startRadius,
        size: 4 + Math.random() * 4,
        delay: i * (0.15 * particleConfig.speedMult),
        duration: (2.5 + Math.random() * 1) * particleConfig.speedMult,
        angle: (i / particleConfig.count) * 360,
        startRadius,
      };
    }), [particleConfig.count, particleConfig.speedMult, outerRadius, size]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible flex items-center justify-center">
      <AnimatePresence>
        {showWarmth && (
          <WarmthParticles 
            radius={outerRadius} 
            innerRadius={innerRadius}
            color={activeColor} 
            speedMult={particleConfig.speedMult} 
            count={particleConfig.count}
            onParticleNearEye={onParticleNearEye}
          />
        )}
        {particleType === 'sparkle' && !showWarmth && (
          <SparkleParticles 
            particles={particles} 
            color={activeColor} 
            speedMult={particleConfig.speedMult}
            innerRadius={innerRadius}
            onParticleNearEye={onParticleNearEye}
          />
        )}
        {particleType === 'orbit' && !showWarmth && (
          <OrbitParticles 
            color={activeColor} 
            radius={outerRadius * 1.1} 
            speedMult={particleConfig.speedMult}
            onParticleNearEye={onParticleNearEye}
          />
        )}
        {particleType === 'energy' && !showWarmth && (
          <EnergyParticles 
            particles={particles} 
            color={activeColor} 
            speedMult={particleConfig.speedMult}
            innerRadius={innerRadius}
            onParticleNearEye={onParticleNearEye}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export const EyeParticles = memo(EyeParticlesComponent);

// Sparkle particles: start from outside, spiral inward toward eye
const SparkleParticles = ({ 
  particles, 
  color, 
  speedMult, 
  innerRadius,
  onParticleNearEye 
}: { 
  particles: Particle[]; 
  color: string; 
  speedMult: number;
  innerRadius: number;
  onParticleNearEye?: (angle: number) => void;
}) => (
  <>
    {particles.map((p) => {
      // Calculate end position near eye edge
      const angleRad = (p.angle * Math.PI) / 180;
      const endX = Math.cos(angleRad) * innerRadius * 0.5;
      const endY = Math.sin(angleRad) * innerRadius * 0.5;
      
      return (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: color,
            boxShadow: `0 0 ${p.size * 2}px ${color}, 0 0 ${p.size * 4}px ${color}50`,
          }}
          initial={{ x: p.x, y: p.y, opacity: 0, scale: 0.5 }}
          animate={{
            // Spiral inward from outside to near eye center
            x: [p.x, p.x * 0.6, endX],
            y: [p.y, p.y * 0.6, endY],
            opacity: [0, 1, 0.8, 0],
            scale: [0.5, 1.2, 1, 0.3],
            rotate: [0, 45, 90],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          onUpdate={(latest) => {
            // Notify when particle reaches near eye
            if (onParticleNearEye && latest.opacity && (latest.opacity as number) > 0.7) {
              onParticleNearEye(p.angle);
            }
          }}
        />
      );
    })}
  </>
);

// Orbit particles: orbit around the eye from OUTSIDE perimeter
const OrbitParticles = ({ 
  color, 
  radius, 
  speedMult,
  onParticleNearEye 
}: { 
  color: string; 
  radius: number; 
  speedMult: number;
  onParticleNearEye?: (angle: number) => void;
}) => {
  const dots = [0, 1, 2, 3];
  const orbitDuration = 4 * speedMult;
  
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      animate={{ rotate: 360 }}
      transition={{ duration: orbitDuration, repeat: Infinity, ease: 'linear' }}
    >
      {dots.map((i) => {
        const angle = i * 90;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 8,
              height: 8,
              backgroundColor: color,
              boxShadow: `0 0 12px ${color}, 0 0 24px ${color}60`,
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(${radius}px)`,
            }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1.5 * speedMult,
              delay: i * 0.3 * speedMult,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      })}
      
      {/* Trailing glow effect */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: radius * 2,
          height: radius * 2,
          border: `2px solid ${color}30`,
          boxShadow: `0 0 20px ${color}20, inset 0 0 20px ${color}10`,
        }}
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [0.98, 1.02, 0.98],
        }}
        transition={{
          duration: 2 * speedMult,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
};

// Energy particles: burst outward from outside, then pulse
const EnergyParticles = ({ 
  particles, 
  color, 
  speedMult,
  innerRadius,
  onParticleNearEye 
}: { 
  particles: Particle[]; 
  color: string; 
  speedMult: number;
  innerRadius: number;
  onParticleNearEye?: (angle: number) => void;
}) => (
  <>
    {particles.map((p) => {
      const angleRad = (p.angle * Math.PI) / 180;
      // Start from outside, radiate further outward
      const startX = Math.cos(angleRad) * p.startRadius;
      const startY = Math.sin(angleRad) * p.startRadius;
      const endX = Math.cos(angleRad) * (p.startRadius * 1.5);
      const endY = Math.sin(angleRad) * (p.startRadius * 1.5);
      
      return (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2"
          style={{
            width: 3,
            height: 16 + Math.random() * 8,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}, 0 0 16px ${color}60`,
            transformOrigin: 'center center',
            borderRadius: 2,
          }}
          initial={{ 
            x: startX - 1.5, 
            y: startY - 8, 
            opacity: 0, 
            scale: 0.5,
            rotate: p.angle + 90
          }}
          animate={{
            x: [startX - 1.5, endX - 1.5],
            y: [startY - 8, endY - 8],
            opacity: [0, 1, 0.8, 0],
            scale: [0.5, 1.2, 1, 0.5],
          }}
          transition={{
            duration: (1 + Math.random() * 0.5) * speedMult,
            delay: p.delay,
            repeat: Infinity,
            repeatDelay: 0.3 * speedMult,
            ease: 'easeOut',
          }}
        />
      );
    })}
  </>
);

// Warmth particles: float around the perimeter, gently drifting
const WarmthParticles = ({ 
  radius, 
  innerRadius,
  color, 
  speedMult, 
  count,
  onParticleNearEye 
}: { 
  radius: number; 
  innerRadius: number;
  color: string; 
  speedMult: number; 
  count: number;
  onParticleNearEye?: (angle: number) => void;
}) => {
  const embers = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      startAngle: (i / count) * Math.PI * 2,
      size: 6 + Math.random() * 5,
      delay: i * 0.4 * speedMult,
      duration: (5 + Math.random() * 2) * speedMult,
      floatDistance: 25 + Math.random() * 35,
      driftAngle: (Math.random() - 0.5) * 0.5, // Slight angular drift
    })), [count, speedMult]);

  return (
    <>
      {embers.map((ember) => {
        // Start from OUTSIDE the eye
        const startX = Math.cos(ember.startAngle) * radius;
        const startY = Math.sin(ember.startAngle) * radius;
        // Float toward eye then drift away
        const midX = Math.cos(ember.startAngle + ember.driftAngle) * (radius * 0.7);
        const midY = Math.sin(ember.startAngle + ember.driftAngle) * (radius * 0.7);
        const endX = Math.cos(ember.startAngle + ember.driftAngle * 2) * (radius * 0.9);
        const endY = Math.sin(ember.startAngle + ember.driftAngle * 2) * (radius * 0.9);
        
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
              scale: 0.4 
            }}
            animate={{
              x: [startX, midX, endX, startX],
              y: [startY, midY - ember.floatDistance * 0.3, endY, startY],
              opacity: [0, 0.9, 0.7, 0],
              scale: [0.4, 1.1, 0.9, 0.4],
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
      
      {/* Outer ambient glow ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: radius * 2.2,
          height: radius * 2.2,
          background: `radial-gradient(circle, transparent 40%, ${color}15 60%, transparent 80%)`,
        }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.5, 0.7, 0.5],
          rotate: [0, 15, 0],
        }}
        transition={{
          duration: 4 * speedMult,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </>
  );
};
