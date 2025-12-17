import { motion } from 'framer-motion';
import { memo, useMemo } from 'react';
import type { AYNEmotion, ActivityLevel } from '@/contexts/AYNEmotionContext';

interface EyeParticlesProps {
  isActive: boolean;
  size?: number;
  glowColor?: string;
  activityLevel?: ActivityLevel;
  emotion?: AYNEmotion;
}

// Emotion-based particle configurations
const getParticleConfig = (emotion: AYNEmotion, activityLevel: ActivityLevel) => {
  // Base counts by activity level
  const activityCounts: Record<ActivityLevel, number> = {
    idle: 2,      // Always show some to feel "alive"
    low: 5,
    medium: 8,
    high: 12,
  };
  
  // Emotion modifiers
  const emotionConfig: Record<AYNEmotion, { 
    countMultiplier: number; 
    speedMultiplier: number;
    driftDirection: 'outward' | 'upward' | 'downward' | 'orbit';
  }> = {
    calm: { countMultiplier: 0.5, speedMultiplier: 1.2, driftDirection: 'outward' },
    happy: { countMultiplier: 1.2, speedMultiplier: 0.9, driftDirection: 'upward' },
    excited: { countMultiplier: 1.5, speedMultiplier: 0.6, driftDirection: 'outward' },
    thinking: { countMultiplier: 0.8, speedMultiplier: 1.3, driftDirection: 'orbit' },
    curious: { countMultiplier: 1.0, speedMultiplier: 0.8, driftDirection: 'orbit' },
    frustrated: { countMultiplier: 1.3, speedMultiplier: 0.5, driftDirection: 'outward' },
    sad: { countMultiplier: 0.4, speedMultiplier: 1.5, driftDirection: 'downward' },
    mad: { countMultiplier: 1.4, speedMultiplier: 0.4, driftDirection: 'outward' },
    bored: { countMultiplier: 0.3, speedMultiplier: 2.0, driftDirection: 'downward' },
    comfort: { countMultiplier: 0.8, speedMultiplier: 1.1, driftDirection: 'upward' },
    supportive: { countMultiplier: 1.0, speedMultiplier: 1.0, driftDirection: 'upward' },
  };
  
  const config = emotionConfig[emotion];
  const baseCount = activityCounts[activityLevel];
  const count = Math.round(baseCount * config.countMultiplier);
  
  return {
    count: Math.max(1, count), // Always at least 1 particle
    speedMultiplier: config.speedMultiplier,
    driftDirection: config.driftDirection,
  };
};

const EyeParticlesComponent = ({ 
  isActive, 
  size = 260,
  glowColor = 'hsl(193, 38%, 47%)',
  activityLevel = 'idle',
  emotion = 'calm',
}: EyeParticlesProps) => {
  const { count: particleCount, speedMultiplier, driftDirection } = getParticleConfig(emotion, activityLevel);
  
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
      const angleVariation = (Math.random() - 0.5) * 0.6;
      
      // Vary particle size based on emotion energy
      const baseSize = emotion === 'excited' || emotion === 'mad' || emotion === 'frustrated' 
        ? 5 + Math.random() * 5  // Larger for intense emotions
        : 3 + Math.random() * 4; // Smaller for calm emotions
      
      return {
        id: i,
        angle,
        angleVariation,
        size: baseSize,
        delay: Math.random() * 4,
        baseDuration: 10 + Math.random() * 6,
      };
    });
  }, [particleCount, emotion]);

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
      {particles.map((p) => {
        const duration = p.baseDuration * speedMultiplier;
        
        // Calculate positions based on drift direction
        let startRadius: number, midRadius: number, endRadius: number;
        let startAngle: number, midAngle: number, endAngle: number;
        
        switch (driftDirection) {
          case 'upward':
            // Start at sides, drift upward and outward
            startRadius = size * 0.35;
            midRadius = size * 0.6;
            endRadius = size * 1.0;
            startAngle = p.angle;
            midAngle = p.angle - 0.3; // Drift upward
            endAngle = p.angle - 0.5;
            break;
          case 'downward':
            // Slow melancholic drift downward
            startRadius = size * 0.35;
            midRadius = size * 0.55;
            endRadius = size * 0.9;
            startAngle = p.angle;
            midAngle = p.angle + 0.2;
            endAngle = p.angle + 0.4;
            break;
          case 'orbit':
            // Circular orbit around eye
            startRadius = size * 0.7;
            midRadius = size * 0.75;
            endRadius = size * 0.7;
            startAngle = p.angle;
            midAngle = p.angle + Math.PI;
            endAngle = p.angle + Math.PI * 2;
            break;
          case 'outward':
          default:
            // Standard outward drift
            startRadius = size * 0.3;
            midRadius = size * 0.6;
            endRadius = size * 0.95;
            startAngle = p.angle;
            midAngle = p.angle + p.angleVariation * 0.5;
            endAngle = p.angle + p.angleVariation;
        }
        
        const startX = Math.cos(startAngle) * startRadius;
        const startY = Math.sin(startAngle) * startRadius;
        const midX = Math.cos(midAngle) * midRadius;
        const midY = Math.sin(midAngle) * midRadius;
        const endX = Math.cos(endAngle) * endRadius;
        const endY = Math.sin(endAngle) * endRadius;

        // Opacity varies by emotion - more visible for intense emotions
        const maxOpacity = ['excited', 'mad', 'frustrated', 'happy'].includes(emotion) ? 0.8 : 0.6;

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
              backgroundColor: glowColor,
              boxShadow: `0 0 ${p.size * 2.5}px ${glowColor}`,
            }}
            initial={{ 
              x: startX - p.size / 2, 
              y: startY - p.size / 2, 
              opacity: 0, 
              scale: 0.2 
            }}
            animate={{
              x: [startX - p.size / 2, midX - p.size / 2, endX - p.size / 2],
              y: [startY - p.size / 2, midY - p.size / 2, endY - p.size / 2],
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
    </div>
  );
};

export const EyeParticles = memo(EyeParticlesComponent);
