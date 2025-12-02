import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export const AIEye = () => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Track mouse position
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Transform mouse position to eye movement (-20 to 20 range)
  const eyeX = useTransform(mouseX, [0, window.innerWidth], [-20, 20]);
  const eyeY = useTransform(mouseY, [0, window.innerHeight], [-20, 20]);
  
  // Apply smooth spring physics
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothX = useSpring(eyeX, springConfig);
  const smoothY = useSpring(eyeY, springConfig);
  
  // Calculate distance from center for glow intensity
  const glowIntensity = useTransform(
    [smoothX, smoothY],
    ([x, y]) => {
      const distance = Math.sqrt((x as number) ** 2 + (y as number) ** 2);
      return Math.max(0.3, 1 - distance / 40);
    }
  );
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);
  
  return (
    <div 
      className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 flex items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Outer glow ring - pulsing */}
      <motion.div
        className="absolute inset-0 rounded-full eye-glow"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          background: 'radial-gradient(circle, hsl(var(--foreground) / 0.1) 0%, transparent 70%)',
        }}
      />
      
      {/* Second ring - slower pulse */}
      <motion.div
        className="absolute inset-4 rounded-full border border-border/20"
        animate={{
          scale: [1, 1.03, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />
      
      {/* Third ring - reverse pulse */}
      <motion.div
        className="absolute inset-8 rounded-full border border-border/30"
        animate={{
          scale: [1.03, 1, 1.03],
          opacity: [0.4, 0.2, 0.4],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Main eye container */}
      <div className="relative w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 rounded-full bg-card/50 backdrop-blur-xl border-2 border-border shadow-2xl overflow-hidden">
        {/* Iris - moves with cursor */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            x: smoothX,
            y: smoothY,
          }}
        >
          {/* Iris outer ring */}
          <motion.div
            className="relative w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full"
            style={{
              background: 'radial-gradient(circle at 30% 30%, hsl(var(--foreground) / 0.8), hsl(var(--foreground) / 0.3))',
              boxShadow: '0 0 30px hsl(var(--foreground) / 0.3), inset 0 0 20px hsl(var(--background) / 0.2)',
            }}
            animate={{
              scale: isHovered ? 1.1 : 1,
            }}
            transition={{
              duration: 0.3,
              ease: "easeOut"
            }}
          >
            {/* Pupil */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-foreground"
              style={{
                boxShadow: '0 0 20px hsl(var(--foreground) / 0.6)',
                opacity: glowIntensity,
              }}
              animate={{
                scale: isHovered ? 1.15 : 1,
              }}
              transition={{
                duration: 0.3,
                ease: "easeOut"
              }}
            >
              {/* Highlight reflection */}
              <div className="absolute top-2 left-2 w-2 h-2 md:w-3 md:h-3 rounded-full bg-background/80" />
            </motion.div>
          </motion.div>
        </motion.div>
        
        {/* Subtle grain texture overlay */}
        <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
      </div>
      
      {/* Floating particles */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * 360;
        const radius = 140;
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;
        
        return (
          <motion.div
            key={i}
            className="absolute w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-foreground/40"
            style={{
              left: '50%',
              top: '50%',
            }}
            animate={{
              x: [x * 0.8, x * 1.2, x * 0.8],
              y: [y * 0.8, y * 1.2, y * 0.8],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + i * 0.3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2,
            }}
          />
        );
      })}
    </div>
  );
};
