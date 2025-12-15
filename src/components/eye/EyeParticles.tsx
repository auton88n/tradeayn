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

// Sparkle particles: float around the eye perimeter like fireflies
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
      const angleRad = (p.angle * Math.PI) / 180;
      // Stay at outer radius, gentle orbital drift
      const orbitRadius = p.startRadius;
      const driftAngle = 0.3; // How far to drift along orbit
      
      const pos1X = Math.cos(angleRad) * orbitRadius;
      const pos1Y = Math.sin(angleRad) * orbitRadius;
      const pos2X = Math.cos(angleRad + driftAngle) * (orbitRadius * 0.95);
      const pos2Y = Math.sin(angleRad + driftAngle) * (orbitRadius * 0.95) - 12;
      const pos3X = Math.cos(angleRad + driftAngle * 2) * orbitRadius;
      const pos3Y = Math.sin(angleRad + driftAngle * 2) * orbitRadius + 8;
      
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
          initial={{ x: pos1X, y: pos1Y, opacity: 0, scale: 0.5 }}
          animate={{
            // Float around perimeter with gentle up/down drift
            x: [pos1X, pos2X, pos3X, pos1X],
            y: [pos1Y, pos2Y, pos3Y, pos1Y],
            opacity: [0, 0.9, 0.8, 0.9, 0],
            scale: [0.5, 1, 1.2, 1, 0.5],
          }}
          transition={{
            duration: p.duration * 1.5,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
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
      
      {/* Trailing glow ring */}
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

// Energy particles: pulse around perimeter as ambient aura
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
      const orbitRadius = p.startRadius;
      // Slight orbital drift with pulsing
      const driftAngle = 0.2;
      
      const posX = Math.cos(angleRad) * orbitRadius;
      const posY = Math.sin(angleRad) * orbitRadius;
      const driftX = Math.cos(angleRad + driftAngle) * (orbitRadius * 1.05);
      const driftY = Math.sin(angleRad + driftAngle) * (orbitRadius * 1.05);
      
      return (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2"
          style={{
            width: 3,
            height: 14,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}, 0 0 16px ${color}60`,
            transformOrigin: 'center center',
            borderRadius: 2,
          }}
          initial={{ 
            x: posX - 1.5, 
            y: posY - 7, 
            opacity: 0, 
            scale: 0.5,
            rotate: p.angle + 90
          }}
          animate={{
            // Pulse in place with slight orbital drift
            x: [posX - 1.5, driftX - 1.5, posX - 1.5],
            y: [posY - 7, driftY - 7, posY - 7],
            opacity: [0.3, 1, 0.3],
            scale: [0.7, 1.3, 0.7],
          }}
          transition={{
            duration: (2 + Math.random() * 0.5) * speedMult,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      );
    })}
  </>
);

// Warmth particles: float around the outer perimeter, never moving inward
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
      floatOffset: 10 + Math.random() * 20,
      orbitDrift: 0.4 + Math.random() * 0.3, // How far to drift along orbit
    })), [count, speedMult]);

  return (
    <>
      {embers.map((ember) => {
        // All positions stay at outer radius - never move inward
        const pos1X = Math.cos(ember.startAngle) * radius;
        const pos1Y = Math.sin(ember.startAngle) * radius;
        const pos2X = Math.cos(ember.startAngle + ember.orbitDrift) * (radius * 1.05);
        const pos2Y = Math.sin(ember.startAngle + ember.orbitDrift) * (radius * 1.05) - ember.floatOffset;
        const pos3X = Math.cos(ember.startAngle + ember.orbitDrift * 2) * radius;
        const pos3Y = Math.sin(ember.startAngle + ember.orbitDrift * 2) * radius + ember.floatOffset * 0.5;
        
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
              x: pos1X, 
              y: pos1Y, 
              opacity: 0, 
              scale: 0.4 
            }}
            animate={{
              // Orbit around perimeter with gentle float
              x: [pos1X, pos2X, pos3X, pos1X],
              y: [pos1Y, pos2Y, pos3Y, pos1Y],
              opacity: [0, 0.9, 0.7, 0.9, 0],
              scale: [0.4, 1.1, 0.9, 1, 0.4],
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
