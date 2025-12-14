// Empathy Ring - Pulsing circles that emanate from eye when user emotion is detected
// Shows AYN "understands" and "feels" what the user is experiencing

import { motion, AnimatePresence } from 'framer-motion';
import { memo, useEffect, useState } from 'react';

interface EmpathyRingProps {
  isActive: boolean;
  userSentiment: 'positive' | 'negative' | 'neutral';
  intensity: number; // 0-1
}

// Emotion-appropriate colors for the empathy ring
const SENTIMENT_COLORS = {
  positive: 'hsl(45, 93%, 47%)',      // Warm gold - sharing joy
  negative: 'hsl(24, 75%, 50%)',      // Warm amber - patient understanding
  neutral: 'hsl(220, 70%, 60%)',      // Calm blue - gentle attention
};

const EmpathyRingComponent = ({ isActive, userSentiment, intensity }: EmpathyRingProps) => {
  const [pulseCount, setPulseCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger pulse animation when emotion is detected
  useEffect(() => {
    if (isActive && intensity > 0.4 && !isAnimating) {
      setIsAnimating(true);
      setPulseCount(prev => prev + 1);
      
      // Stop animating after pulses complete
      const timeout = setTimeout(() => {
        setIsAnimating(false);
      }, 1800); // 2-3 pulses × ~600ms each
      
      return () => clearTimeout(timeout);
    }
  }, [isActive, intensity, isAnimating]);

  const color = SENTIMENT_COLORS[userSentiment];
  const pulseIntensity = Math.min(1, intensity * 1.2);

  return (
    <AnimatePresence>
      {isAnimating && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* First ring */}
          <motion.div
            key={`ring-1-${pulseCount}`}
            className="absolute rounded-full"
            style={{
              width: '100%',
              height: '100%',
              border: `2px solid ${color}`,
              opacity: 0.6 * pulseIntensity,
            }}
            initial={{ scale: 0.9, opacity: 0.7 * pulseIntensity }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          />
          
          {/* Second ring (delayed) */}
          <motion.div
            key={`ring-2-${pulseCount}`}
            className="absolute rounded-full"
            style={{
              width: '100%',
              height: '100%',
              border: `2px solid ${color}`,
              opacity: 0.4 * pulseIntensity,
            }}
            initial={{ scale: 0.9, opacity: 0.5 * pulseIntensity }}
            animate={{ scale: 1.6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          />
          
          {/* Third ring (most delayed, for strong emotions) */}
          {intensity > 0.6 && (
            <motion.div
              key={`ring-3-${pulseCount}`}
              className="absolute rounded-full"
              style={{
                width: '100%',
                height: '100%',
                border: `1.5px solid ${color}`,
                opacity: 0.3 * pulseIntensity,
              }}
              initial={{ scale: 0.9, opacity: 0.3 * pulseIntensity }}
              animate={{ scale: 1.7, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            />
          )}
        </div>
      )}
    </AnimatePresence>
  );
};

export const EmpathyRing = memo(EmpathyRingComponent);
