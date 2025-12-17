import { motion, AnimatePresence } from 'framer-motion';
import { memo, useMemo, useState, useEffect, useRef } from 'react';
import type { AYNEmotion, ActivityLevel } from '@/contexts/AYNEmotionContext';

interface EyeParticlesProps {
  isActive: boolean;
  size?: number;
  glowColor?: string;
  activityLevel?: ActivityLevel;
  emotion?: AYNEmotion;
  isAbsorbing?: boolean;
  isPulsing?: boolean;
}

// Helper to create subtle color variations from HSL
const varyHslColor = (hslColor: string, lightnessShift: number, saturationShift: number): string => {
  const match = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return hslColor;
  
  const h = parseInt(match[1]);
  const s = Math.max(0, Math.min(100, parseInt(match[2]) + saturationShift));
  const l = Math.max(0, Math.min(100, parseInt(match[3]) + lightnessShift));
  
  return `hsl(${h}, ${s}%, ${l}%)`;
};

// Reduced ambient counts - particles are now event-driven
const getAmbientCount = (activityLevel: ActivityLevel): number => {
  const counts: Record<ActivityLevel, number> = {
    idle: 0,      // No ambient particles when idle
    low: 2,       // Minimal
    medium: 4,    // Some activity
    high: 6,      // Active conversation
  };
  return counts[activityLevel];
};

// Emotion-based drift direction for meaningful movement
const getEmotionDrift = (emotion: AYNEmotion): 'upward' | 'downward' | 'orbit' | 'outward' => {
  switch (emotion) {
    case 'happy':
    case 'excited':
    case 'supportive':
    case 'comfort':
      return 'upward';     // Positive energy rises
    case 'sad':
    case 'bored':
      return 'downward';   // Energy draining
    case 'thinking':
    case 'curious':
      return 'orbit';      // Thoughts circling
    case 'frustrated':
    case 'mad':
    case 'calm':
    default:
      return 'outward';    // Standard radial
  }
};

// Speed multiplier based on emotion intensity
const getSpeedMultiplier = (emotion: AYNEmotion): number => {
  switch (emotion) {
    case 'excited':
    case 'mad':
      return 0.5;  // Fast, intense
    case 'happy':
    case 'frustrated':
      return 0.7;
    case 'thinking':
    case 'curious':
      return 1.0;  // Medium, contemplative
    case 'calm':
    case 'supportive':
    case 'comfort':
      return 1.2;  // Slow, gentle
    case 'sad':
    case 'bored':
      return 1.5;  // Very slow, melancholic
    default:
      return 1.0;
  }
};

const EyeParticlesComponent = ({ 
  isActive, 
  size = 260,
  glowColor = 'hsl(193, 38%, 47%)',
  activityLevel = 'idle',
  emotion = 'calm',
  isAbsorbing = false,
  isPulsing = false,
}: EyeParticlesProps) => {
  const [burstParticles, setBurstParticles] = useState<number[]>([]);
  const burstIdCounter = useRef(0);
  const prevAbsorbing = useRef(false);
  const prevPulsing = useRef(false);
  
  // Trigger burst on absorption
  useEffect(() => {
    if (isAbsorbing && !prevAbsorbing.current) {
      // Create burst particles
      const burstCount = 12;
      const newBurst = Array.from({ length: burstCount }, () => burstIdCounter.current++);
      setBurstParticles(newBurst);
      
      // Clear burst after animation
      setTimeout(() => {
        setBurstParticles([]);
      }, 600);
    }
    prevAbsorbing.current = isAbsorbing;
  }, [isAbsorbing]);

  // Pulse boost particles
  useEffect(() => {
    if (isPulsing && !prevPulsing.current) {
      // Could add pulse-specific effects here
    }
    prevPulsing.current = isPulsing;
  }, [isPulsing]);

  const ambientCount = getAmbientCount(activityLevel);
  const driftDirection = getEmotionDrift(emotion);
  const speedMultiplier = getSpeedMultiplier(emotion);
  
  // Boost particle count during pulse
  const effectiveCount = isPulsing ? Math.max(ambientCount * 2, 6) : ambientCount;

  // Generate ambient particles
  const ambientParticles = useMemo(() => {
    return Array.from({ length: effectiveCount }, (_, i) => {
      const angle = (i / effectiveCount) * Math.PI * 2 + Math.random() * 0.5;
      const angleVariation = (Math.random() - 0.5) * 0.6;
      
      // Size based on emotion intensity
      const baseSize = ['excited', 'mad', 'frustrated'].includes(emotion)
        ? 5 + Math.random() * 5
        : 3 + Math.random() * 4;
      
      // Subtle color variation
      const lightnessShift = (Math.random() - 0.5) * 20;
      const saturationShift = (Math.random() - 0.5) * 14;
      
      return {
        id: i,
        angle,
        angleVariation,
        size: baseSize,
        delay: Math.random() * 4,
        baseDuration: 10 + Math.random() * 6,
        lightnessShift,
        saturationShift,
      };
    });
  }, [effectiveCount, emotion]);

  // Calculate ambient particle positions based on drift direction
  const calculateAmbientPath = (p: typeof ambientParticles[0]) => {
    let startRadius: number, midRadius: number, endRadius: number;
    let startAngle: number, midAngle: number, endAngle: number;
    
    switch (driftDirection) {
      case 'upward':
        startRadius = size * 0.35;
        midRadius = size * 0.6;
        endRadius = size * 1.0;
        startAngle = p.angle;
        midAngle = p.angle - 0.3;
        endAngle = p.angle - 0.5;
        break;
      case 'downward':
        startRadius = size * 0.35;
        midRadius = size * 0.55;
        endRadius = size * 0.9;
        startAngle = p.angle;
        midAngle = p.angle + 0.2;
        endAngle = p.angle + 0.4;
        break;
      case 'orbit':
        startRadius = size * 0.7;
        midRadius = size * 0.75;
        endRadius = size * 0.7;
        startAngle = p.angle;
        midAngle = p.angle + Math.PI;
        endAngle = p.angle + Math.PI * 2;
        break;
      case 'outward':
      default:
        startRadius = size * 0.3;
        midRadius = size * 0.6;
        endRadius = size * 0.95;
        startAngle = p.angle;
        midAngle = p.angle + p.angleVariation * 0.5;
        endAngle = p.angle + p.angleVariation;
    }
    
    return {
      startX: Math.cos(startAngle) * startRadius,
      startY: Math.sin(startAngle) * startRadius,
      midX: Math.cos(midAngle) * midRadius,
      midY: Math.sin(midAngle) * midRadius,
      endX: Math.cos(endAngle) * endRadius,
      endY: Math.sin(endAngle) * endRadius,
    };
  };

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
      {/* Ambient particles - only when activity > idle */}
      {ambientParticles.map((p) => {
        const duration = p.baseDuration * speedMultiplier;
        const path = calculateAmbientPath(p);
        const maxOpacity = ['excited', 'mad', 'frustrated', 'happy'].includes(emotion) ? 0.8 : 0.6;
        const particleColor = varyHslColor(glowColor, p.lightnessShift, p.saturationShift);

        return (
          <motion.div
            key={`ambient-${p.id}`}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: particleColor,
              boxShadow: `0 0 ${p.size * 2.5}px ${particleColor}`,
            }}
            initial={{ 
              x: path.startX - p.size / 2, 
              y: path.startY - p.size / 2, 
              opacity: 0, 
              scale: 0.2 
            }}
            animate={{
              x: [path.startX - p.size / 2, path.midX - p.size / 2, path.endX - p.size / 2],
              y: [path.startY - p.size / 2, path.midY - p.size / 2, path.endY - p.size / 2],
              opacity: [0, maxOpacity * 0.8, maxOpacity, maxOpacity * 0.5, 0],
              scale: [0.2, 0.9, 0.8, 0.5, 0.1],
            }}
            transition={{ 
              duration, 
              delay: p.delay, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
          />
        );
      })}

      {/* Burst particles - triggered on absorption */}
      <AnimatePresence>
        {burstParticles.map((id, i) => {
          const angle = (i / burstParticles.length) * Math.PI * 2;
          const burstSize = 4 + Math.random() * 4;
          const burstRadius = size * 1.2;
          const particleColor = varyHslColor(glowColor, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 14);
          
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
                backgroundColor: particleColor,
                boxShadow: `0 0 ${burstSize * 3}px ${particleColor}`,
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
                scale: 1.5,
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export const EyeParticles = memo(EyeParticlesComponent);
