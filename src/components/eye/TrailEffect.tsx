import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface TrailParticle {
  id: number;
  x: number;
  y: number;
  delay: number;
}

interface TrailEffectProps {
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  isActive: boolean;
  color?: string;
  particleCount?: number;
}

export const TrailEffect = ({
  startPosition,
  endPosition,
  isActive,
  color = 'rgba(99, 102, 241, 0.6)',
  particleCount = 8,
}: TrailEffectProps) => {
  const [particles, setParticles] = useState<TrailParticle[]>([]);

  useEffect(() => {
    if (isActive) {
      // Generate particles along the path
      const newParticles: TrailParticle[] = [];
      for (let i = 0; i < particleCount; i++) {
        const progress = i / (particleCount - 1);
        newParticles.push({
          id: i,
          x: startPosition.x + (endPosition.x - startPosition.x) * progress,
          y: startPosition.y + (endPosition.y - startPosition.y) * progress,
          delay: i * 0.04,
        });
      }
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [isActive, startPosition, endPosition, particleCount]);

  if (!isActive || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Glowing line trail */}
      <svg className="absolute inset-0 w-full h-full">
        <motion.line
          x1={startPosition.x}
          y1={startPosition.y}
          x2={endPosition.x}
          y2={endPosition.y}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 0.8, 0] }}
          transition={{ duration: 0.4, ease: [0.32, 0, 0.67, 0] }}
        />
        {/* Glow effect line */}
        <motion.line
          x1={startPosition.x}
          y1={startPosition.y}
          x2={endPosition.x}
          y2={endPosition.y}
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          filter="blur(4px)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 0.4, 0] }}
          transition={{ duration: 0.4, ease: [0.32, 0, 0.67, 0] }}
        />
      </svg>

      {/* Particle dots along the path */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            background: color,
            boxShadow: `0 0 8px ${color}, 0 0 16px ${color}`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 0.5,
            delay: particle.delay,
            ease: [0.32, 0, 0.67, 0],
          }}
        />
      ))}

      {/* Leading particle that travels along the path */}
      <motion.div
        className="absolute w-3 h-3 rounded-full"
        style={{
          background: color,
          boxShadow: `0 0 12px ${color}, 0 0 24px ${color}`,
        }}
        initial={{
          left: startPosition.x - 6,
          top: startPosition.y - 6,
          scale: 1,
          opacity: 1,
        }}
        animate={{
          left: endPosition.x - 6,
          top: endPosition.y - 6,
          scale: [1, 1.2, 0.5],
          opacity: [1, 1, 0],
        }}
        transition={{
          duration: 0.35,
          ease: [0.32, 0, 0.67, 0],
        }}
      />
    </div>
  );
};
