import { memo } from 'react';
import { EMOTION_CONFIGS } from '@/contexts/AYNEmotionContext';

interface ThinkingDotsProps {
  isVisible: boolean;
  color?: string;
  size?: number;
}

// Pure CSS animation for better performance - no Framer Motion
export const ThinkingDots = memo(({ isVisible, color, size = 260 }: ThinkingDotsProps) => {
  if (!isVisible) return null;

  const dotColor = color || EMOTION_CONFIGS.thinking.glowColor;
  const radius = size * 0.55;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* CSS-based rotating container */}
      <div 
        className="absolute inset-0 animate-spin"
        style={{ animationDuration: '2.5s', animationTimingFunction: 'linear' }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full animate-pulse"
            style={{
              width: 8,
              height: 8,
              backgroundColor: dotColor,
              boxShadow: `0 0 12px ${dotColor}, 0 0 4px ${dotColor}`,
              transform: `translate(-50%, -50%) rotate(${i * 120}deg) translateX(${radius}px)`,
              animationDelay: `${i * 0.33}s`,
              animationDuration: '1s',
            }}
          />
        ))}
      </div>

      {/* CSS-based pulsing ring */}
      <div
        className="absolute left-1/2 top-1/2 rounded-full border-2 animate-pulse"
        style={{
          width: radius * 2,
          height: radius * 2,
          borderColor: dotColor,
          transform: 'translate(-50%, -50%)',
          opacity: 0.3,
          animationDuration: '2s',
        }}
      />
    </div>
  );
});

ThinkingDots.displayName = 'ThinkingDots';
