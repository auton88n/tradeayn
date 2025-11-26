import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  type: 'dust' | 'orb' | 'glow-blue' | 'glow-purple';
}

const generateParticles = (count: number): Particle[] => {
  const types: Particle['type'][] = ['dust', 'orb', 'glow-blue', 'glow-purple'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 5,
    type: types[Math.floor(Math.random() * types.length)],
  }));
};

export const Particles = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setParticles(generateParticles(40));
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const getParticleStyle = (particle: Particle) => {
    switch (particle.type) {
      case 'dust':
        return 'bg-white/20';
      case 'orb':
        return 'bg-white/10 rounded-full';
      case 'glow-blue':
        return 'bg-blue-500/30 rounded-full blur-xl';
      case 'glow-purple':
        return 'bg-purple-500/30 rounded-full blur-xl';
      default:
        return 'bg-white/10';
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute ${getParticleStyle(particle)}`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, mousePosition.x * 0.5, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};
