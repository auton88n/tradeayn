import { motion } from 'framer-motion';
import { EMOTION_CONFIGS } from '@/contexts/AYNEmotionContext';

interface ThinkingDotsProps {
  isVisible: boolean;
  color?: string;
  size?: number;
}

export const ThinkingDots = ({ isVisible, color, size = 260 }: ThinkingDotsProps) => {
  if (!isVisible) return null;

  const dotColor = color || EMOTION_CONFIGS.thinking.glowColor;
  const radius = size * 0.55;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Rotating container for dots */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{
          duration: 2.5,
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
              boxShadow: `0 0 12px ${dotColor}, 0 0 4px ${dotColor}`,
              transform: `translate(-50%, -50%) rotate(${i * 120}deg) translateX(${radius}px)`,
            }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              delay: i * 0.33,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>

      {/* Pulsing ring */}
      <motion.div
        className="absolute left-1/2 top-1/2 rounded-full border-2"
        style={{
          width: radius * 2,
          height: radius * 2,
          borderColor: dotColor,
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};
