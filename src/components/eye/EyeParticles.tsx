import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AYNEmotion, EMOTION_CONFIGS } from '@/contexts/AYNEmotionContext';
import { useVisibilityPause } from '@/hooks/useVisibilityPause';

interface EyeParticlesProps {
  emotion: AYNEmotion;
  isActive: boolean;
  size?: number;
}

// Memoized to prevent unnecessary re-renders
export const EyeParticles = memo(({ emotion, isActive, size = 260 }: EyeParticlesProps) => {
  const isTabVisible = useVisibilityPause();
  const config = EMOTION_CONFIGS[emotion];
  const particleType = config.particleType;

  // Don't render if not active, tab hidden, or no particle type
  if (particleType === 'none' || !isActive || !isTabVisible) return null;

  const radius = size * 0.6;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      <AnimatePresence>
        {particleType === 'sparkle' && (
          <SparkleParticles color={config.glowColor} radius={radius} />
        )}
        {particleType === 'orbit' && (
          <OrbitParticles color={config.glowColor} radius={radius} />
        )}
        {particleType === 'energy' && (
          <EnergyParticles color={config.glowColor} />
        )}
      </AnimatePresence>
    </div>
  );
});

EyeParticles.displayName = 'EyeParticles';

// Reduced to 4 particles with longer delays
const SparkleParticles = memo(({ color, radius }: { color: string; radius: number }) => (
  <>
    {[0, 1, 2, 3].map((i) => {
      const angle = (i / 4) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      return (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: 5,
            height: 5,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{
            x: [0, x * 0.5, x],
            y: [0, y * 0.5, y],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 2.5,
            delay: i * 0.2,
            repeat: Infinity,
            repeatDelay: 1, // Pause between cycles
            ease: 'easeOut',
          }}
        />
      );
    })}
  </>
));

SparkleParticles.displayName = 'SparkleParticles';

// CSS-based orbit for better performance
const OrbitParticles = memo(({ color, radius }: { color: string; radius: number }) => (
  <div 
    className="absolute inset-0 animate-spin"
    style={{ animationDuration: '4s' }}
  >
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="absolute left-1/2 top-1/2 rounded-full animate-pulse"
        style={{
          width: 5,
          height: 5,
          backgroundColor: color,
          boxShadow: `0 0 6px ${color}`,
          transform: `translate(-50%, -50%) rotate(${i * 120}deg) translateX(${radius * 0.8}px)`,
          animationDelay: `${i * 0.3}s`,
          animationDuration: '2s',
        }}
      />
    ))}
  </div>
));

OrbitParticles.displayName = 'OrbitParticles';

// Reduced energy particles
const EnergyParticles = memo(({ color }: { color: string }) => (
  <>
    {[0, 1, 2, 3].map((i) => (
      <motion.div
        key={i}
        className="absolute left-1/2 top-1/2"
        style={{
          width: 2,
          height: 14,
          backgroundColor: color,
          boxShadow: `0 0 4px ${color}`,
          transformOrigin: 'center bottom',
        }}
        initial={{ 
          x: -1, 
          y: -7, 
          opacity: 0, 
          scale: 0,
          rotate: i * 90 
        }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0, 1, 0],
          y: [-7, -50, -70],
        }}
        transition={{
          duration: 1,
          delay: i * 0.15,
          repeat: Infinity,
          repeatDelay: 0.8,
          ease: 'easeOut',
        }}
      />
    ))}
  </>
));

EnergyParticles.displayName = 'EnergyParticles';
