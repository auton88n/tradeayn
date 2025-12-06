import { motion } from 'framer-motion';
import { memo } from 'react';
import { EMOTION_CONFIGS } from '@/contexts/AYNEmotionContext';

interface ThinkingDotsProps {
  isVisible: boolean;
  color?: string;
  size?: number;
}

const ThinkingDotsComponent = ({ isVisible, color, size = 260 }: ThinkingDotsProps) => {
  if (!isVisible) return null;

  const dotColor = color || EMOTION_CONFIGS.thinking.glowColor;
  const radius = size * 0.55;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Rotating container for dots - slower rotation for performance */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: 8,
              height: 8,
              backgroundColor: dotColor,
              boxShadow: `0 0 8px ${dotColor}`,
              transform: `translate(-50%, -50%) rotate(${i * 120}deg) translateX(${radius}px)`,
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 1.2,
              delay: i * 0.4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export const ThinkingDots = memo(ThinkingDotsComponent);
