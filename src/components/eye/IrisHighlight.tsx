// Iris Highlight - Dynamic light reflection on the eye
// Brightens for positive emotions, dims for negative (softer, gentler look)

import { motion } from 'framer-motion';
import { memo } from 'react';

interface IrisHighlightProps {
  userSentiment: 'positive' | 'negative' | 'neutral';
  emotionIntensity: number; // 0-1
  gazeX?: number; // -1 to 1, for positioning
  gazeY?: number; // -1 to 1, for positioning
}

const IrisHighlightComponent = ({ 
  userSentiment, 
  emotionIntensity, 
  gazeX = 0, 
  gazeY = 0 
}: IrisHighlightProps) => {
  // Calculate brightness based on sentiment
  const getBrightness = () => {
    const baseOpacity = 0.7;
    
    switch (userSentiment) {
      case 'positive':
        // Bright, shimmering for positive emotions
        return Math.min(1, baseOpacity + (emotionIntensity * 0.3));
      case 'negative':
        // Dimmed for negative emotions (gentler, softer look)
        return Math.max(0.2, baseOpacity - (emotionIntensity * 0.4));
      default:
        return baseOpacity;
    }
  };

  // Highlight moves opposite to gaze direction (realistic reflection)
  const highlightX = -gazeX * 4; // Opposite direction, subtle movement
  const highlightY = -gazeY * 3;

  const brightness = getBrightness();
  const size = userSentiment === 'positive' ? 6 + emotionIntensity * 2 : 5;

  return (
    <>
      {/* Primary highlight - bright point */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255,255,255,${brightness}) 0%, rgba(255,255,255,0) 70%)`,
          top: '25%',
          left: '60%',
        }}
        animate={{
          x: highlightX,
          y: highlightY,
          opacity: brightness,
          scale: userSentiment === 'positive' ? [1, 1.1, 1] : 1,
        }}
        transition={{
          x: { duration: 0.3, ease: 'easeOut' },
          y: { duration: 0.3, ease: 'easeOut' },
          opacity: { duration: 0.5, ease: 'easeOut' },
          scale: { duration: 1.5, repeat: userSentiment === 'positive' ? Infinity : 0, ease: 'easeInOut' },
        }}
      />
      
      {/* Secondary smaller highlight */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: size * 0.5,
          height: size * 0.5,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255,255,255,${brightness * 0.6}) 0%, rgba(255,255,255,0) 80%)`,
          top: '35%',
          left: '45%',
        }}
        animate={{
          x: highlightX * 0.5,
          y: highlightY * 0.5,
          opacity: brightness * 0.5,
        }}
        transition={{
          duration: 0.4,
          ease: 'easeOut',
        }}
      />
    </>
  );
};

export const IrisHighlight = memo(IrisHighlightComponent);
