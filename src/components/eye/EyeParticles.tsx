import { motion, AnimatePresence } from 'framer-motion';
import { memo, useMemo, useState, useEffect, useRef } from 'react';
import type { AYNEmotion, ActivityLevel } from '@/contexts/AYNEmotionContext';
import { useIsMobile } from '@/hooks/use-mobile';

type ParticleType = 'sparkle' | 'orbit' | 'energy';

interface EyeParticlesProps {
  isActive: boolean;
  size?: number;
  glowColor?: string;
  activityLevel?: ActivityLevel;
  emotion?: AYNEmotion;
  particleType?: ParticleType;
  isAbsorbing?: boolean;
  isPulsing?: boolean;
}

// Emotion-specific particle counts - reduced for performance
const getEmotionParticleCount = (emotion: AYNEmotion, activityLevel: ActivityLevel, isMobile: boolean): number => {
  const emotionCounts: Record<AYNEmotion, number> = {
    calm: 2,
    comfort: 3,
    supportive: 3,
    happy: 4,
    excited: 6,
    thinking: 3,
    frustrated: 5,
    curious: 4,
    sad: 2,
    mad: 6,
    bored: 1,
  };
  
  const activityMultiplier: Record<ActivityLevel, number> = { 
    idle: 0.4, 
    low: 0.7, 
    medium: 1.0, 
    high: 1.3 
  };
  
  // Reduce particle count on mobile for better performance
  const mobileMultiplier = isMobile ? 0.5 : 1;
  
  return Math.max(1, Math.round(emotionCounts[emotion] * activityMultiplier[activityLevel] * mobileMultiplier));
};

// Emotion-specific colors (HSL format)
const getEmotionParticleColor = (emotion: AYNEmotion, glowColor: string): string => {
  const emotionColors: Record<AYNEmotion, string> = {
    calm: 'hsl(195, 35%, 55%)',      // Soft ocean blue
    comfort: 'hsl(350, 55%, 65%)',   // Warm rose
    supportive: 'hsl(15, 60%, 65%)', // Soft peach
    happy: 'hsl(38, 90%, 60%)',      // Golden yellow
    excited: 'hsl(4, 90%, 65%)',     // Bright coral
    thinking: 'hsl(239, 70%, 60%)',  // Royal indigo
    frustrated: 'hsl(16, 80%, 55%)', // Hot orange
    curious: 'hsl(285, 50%, 60%)',   // Bright magenta
    sad: 'hsl(260, 20%, 60%)',       // Muted lavender
    mad: 'hsl(350, 70%, 50%)',       // Deep crimson
    bored: 'hsl(210, 15%, 55%)',     // Slate blue
  };
  return emotionColors[emotion] || glowColor;
};

// Speed multipliers per emotion
const getSpeedMultiplier = (emotion: AYNEmotion): number => {
  const speeds: Record<AYNEmotion, number> = {
    calm: 0.7,
    comfort: 0.6,
    supportive: 0.7,
    happy: 1.0,
    excited: 1.8,
    thinking: 0.5,
    frustrated: 1.5,
    curious: 1.1,
    sad: 0.4,
    mad: 2.0,
    bored: 0.3,
  };
  return speeds[emotion] || 1;
};

// Particle size ranges per type
const getParticleSizeRange = (particleType: ParticleType): { min: number; max: number } => {
  switch (particleType) {
    case 'sparkle':
      return { min: 3, max: 6 };
    case 'energy':
      return { min: 5, max: 9 };
    case 'orbit':
      return { min: 4, max: 7 };
    default:
      return { min: 4, max: 7 };
  }
};

// Helper to create subtle color variations from HSL
const varyHslColor = (hslColor: string, lightnessShift: number): string => {
  const match = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return hslColor;
  
  const h = parseInt(match[1]);
  const s = parseInt(match[2]);
  const l = Math.max(20, Math.min(80, parseInt(match[3]) + lightnessShift));
  
  return `hsl(${h}, ${s}%, ${l}%)`;
};

interface Particle {
  id: number;
  size: number;
  angle: number;
  delay: number;
  lightnessShift: number;
}

const EyeParticlesComponent = ({ 
  isActive, 
  size = 260,
  glowColor = 'hsl(193, 38%, 47%)',
  activityLevel = 'idle',
  emotion = 'calm',
  particleType = 'sparkle',
  isAbsorbing = false,
  isPulsing = false,
}: EyeParticlesProps) => {
  const [burstParticles, setBurstParticles] = useState<number[]>([]);
  const burstIdCounter = useRef(0);
  const prevAbsorbing = useRef(false);
  const isMobile = useIsMobile();
  
  // Trigger burst on absorption - reduced count on mobile
  useEffect(() => {
    if (isAbsorbing && !prevAbsorbing.current) {
      const burstCount = isMobile ? 6 : 12;
      const newBurst = Array.from({ length: burstCount }, () => burstIdCounter.current++);
      setBurstParticles(newBurst);
      
      setTimeout(() => {
        setBurstParticles([]);
      }, 700);
    }
    prevAbsorbing.current = isAbsorbing;
  }, [isAbsorbing, isMobile]);

  const particleCount = getEmotionParticleCount(emotion, activityLevel, isMobile);
  const speedMultiplier = getSpeedMultiplier(emotion);
  const particleColor = getEmotionParticleColor(emotion, glowColor);
  const sizeRange = getParticleSizeRange(particleType);
  
  // Boost during pulse - less boost on mobile
  const pulseBoost = isMobile ? 1.2 : 1.5;
  const effectiveCount = isPulsing ? Math.max(particleCount * pulseBoost, isMobile ? 3 : 6) : particleCount;

  // Generate ambient particles
  const ambientParticles = useMemo((): Particle[] => {
    return Array.from({ length: Math.round(effectiveCount) }, (_, i) => {
      const particleSize = sizeRange.min + Math.random() * (sizeRange.max - sizeRange.min);
      const baseAngle = (i / effectiveCount) * Math.PI * 2;
      const angleVariation = (Math.random() - 0.5) * 0.8;
      
      return {
        id: i,
        size: particleSize,
        angle: baseAngle + angleVariation,
        delay: Math.random() * 3,
        lightnessShift: (Math.random() - 0.5) * 20,
      };
    });
  }, [effectiveCount, sizeRange.min, sizeRange.max]);

  // SPARKLE: Gentle floating upward with twinkling
  const renderSparkle = (particle: Particle) => {
    const distance = size * (0.5 + Math.random() * 0.2);
    const startX = Math.cos(particle.angle) * distance;
    const startY = Math.sin(particle.angle) * distance;
    const driftY = -size * 0.35;
    const driftX = (Math.random() - 0.5) * size * 0.2;
    const color = varyHslColor(particleColor, particle.lightnessShift);
    
    return (
      <motion.div
        key={`sparkle-${particle.id}`}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: particle.size,
          height: particle.size,
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 ${particle.size * 2}px ${color}`,
        }}
        initial={{
          x: startX - particle.size / 2,
          y: startY - particle.size / 2,
          opacity: 0,
          scale: 0.3,
        }}
        animate={{
          x: [startX - particle.size / 2, startX + driftX - particle.size / 2],
          y: [startY - particle.size / 2, startY + driftY - particle.size / 2],
          opacity: [0, 0.7, 0.5, 0],
          scale: [0.3, 1, 0.7, 0.2],
        }}
        transition={{
          duration: (5 + Math.random() * 3) / speedMultiplier,
          delay: particle.delay,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />
    );
  };

  // ENERGY: Fast, erratic bursts radiating outward
  const renderEnergy = (particle: Particle) => {
    const startRadius = size * 0.35;
    const endRadius = size * 0.9;
    const startX = Math.cos(particle.angle) * startRadius;
    const startY = Math.sin(particle.angle) * startRadius;
    const endX = Math.cos(particle.angle) * endRadius;
    const endY = Math.sin(particle.angle) * endRadius;
    const color = varyHslColor(particleColor, particle.lightnessShift);
    
    return (
      <motion.div
        key={`energy-${particle.id}`}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: particle.size,
          height: particle.size,
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 ${particle.size * 3}px ${color}, 0 0 ${particle.size * 6}px ${color}40`,
        }}
        initial={{
          x: startX - particle.size / 2,
          y: startY - particle.size / 2,
          opacity: 0,
          scale: 0.5,
        }}
        animate={{
          x: [startX - particle.size / 2, endX - particle.size / 2],
          y: [startY - particle.size / 2, endY - particle.size / 2],
          opacity: [0.9, 0.6, 0],
          scale: [0.5, 1.4, 0.2],
        }}
        transition={{
          duration: (1.2 + Math.random() * 0.6) / speedMultiplier,
          delay: particle.delay * 0.4,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />
    );
  };

  // ORBIT: Circular path around eye - contemplative
  const renderOrbit = (particle: Particle) => {
    const orbitRadius = size * (0.55 + Math.random() * 0.15);
    const color = varyHslColor(particleColor, particle.lightnessShift);
    
    return (
      <motion.div
        key={`orbit-${particle.id}`}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: particle.size,
          height: particle.size,
          marginLeft: -particle.size / 2,
          marginTop: -particle.size / 2,
        }}
        initial={{ rotate: particle.angle * (180 / Math.PI) }}
        animate={{ rotate: particle.angle * (180 / Math.PI) + 360 }}
        transition={{
          duration: (12 + Math.random() * 6) / speedMultiplier,
          delay: particle.delay,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <motion.div
          style={{
            position: 'absolute',
            width: particle.size,
            height: particle.size,
            borderRadius: '50%',
            backgroundColor: color,
            boxShadow: `0 0 ${particle.size * 2}px ${color}`,
            transform: `translateX(${orbitRadius}px)`,
          }}
          animate={{
            opacity: [0.4, 0.7, 0.4],
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{
            duration: 4 / speedMultiplier,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>
    );
  };

  // Render particle based on type
  const renderParticle = (particle: Particle) => {
    switch (particleType) {
      case 'sparkle':
        return renderSparkle(particle);
      case 'energy':
        return renderEnergy(particle);
      case 'orbit':
        return renderOrbit(particle);
      default:
        return renderSparkle(particle);
    }
  };

  // Burst particles (always energy-like explosion)
  const renderBurstParticle = (id: number, index: number) => {
    const angle = (index / burstParticles.length) * Math.PI * 2;
    const burstSize = 4 + Math.random() * 4;
    const burstRadius = size * 1.1;
    const color = varyHslColor(particleColor, (Math.random() - 0.5) * 20);
    
    return (
      <motion.div
        key={`burst-${id}`}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: burstSize,
          height: burstSize,
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 ${burstSize * 3}px ${color}`,
        }}
        initial={{ 
          x: -burstSize / 2, 
          y: -burstSize / 2, 
          opacity: 1, 
          scale: 0.3 
        }}
        animate={{
          x: Math.cos(angle) * burstRadius - burstSize / 2,
          y: Math.sin(angle) * burstRadius - burstSize / 2,
          opacity: 0,
          scale: 1.6,
        }}
        exit={{ opacity: 0 }}
        transition={{ 
          duration: 0.6,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      />
    );
  };

  if (!isActive) return null;

  return (
    <div 
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: size * 2.2,
        height: size * 2.2,
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      {/* Ambient particles - type-specific rendering */}
      {ambientParticles.map(renderParticle)}

      {/* Burst particles on absorption */}
      <AnimatePresence>
        {burstParticles.map((id, i) => renderBurstParticle(id, i))}
      </AnimatePresence>
      
      {/* Pulse ring effect */}
      {isPulsing && (
        <motion.div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: size * 0.3,
            height: size * 0.3,
            marginLeft: -size * 0.15,
            marginTop: -size * 0.15,
            borderRadius: '50%',
            backgroundColor: 'transparent',
            border: `2px solid ${particleColor}`,
            boxShadow: `0 0 20px ${particleColor}`,
          }}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 3.5, opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      )}
    </div>
  );
};

export const EyeParticles = memo(EyeParticlesComponent);
