import { useRef, useLayoutEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FlyingSuggestionBubbleProps {
  content: string;
  emoji: string;
  status: 'flying' | 'absorbing' | 'done';
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  onComplete?: () => void;
}

export const FlyingSuggestionBubble = ({
  content,
  emoji,
  status,
  startPosition,
  endPosition,
  onComplete,
}: FlyingSuggestionBubbleProps) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 180, height: 50 });

  // Measure actual bubble dimensions after render
  useLayoutEffect(() => {
    if (bubbleRef.current) {
      const rect = bubbleRef.current.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    }
  }, [content]);

  if (status === 'done') return null;

  // Use measured dimensions for precise centering
  const halfWidth = dimensions.width / 2;
  const halfHeight = dimensions.height / 2;

  // Simplified animation with fewer keyframes for smoother performance
  const flyingAnimation = {
    x: endPosition.x - halfWidth,
    y: endPosition.y - halfHeight,
    scale: 0.2,
    opacity: 0.8,
    rotate: 10,
  };

  const absorbingAnimation = {
    x: endPosition.x - halfWidth,
    y: endPosition.y - halfHeight,
    scale: 0,
    opacity: 0,
    rotate: 12,
  };

  return (
    <motion.div
      ref={bubbleRef}
      className={cn(
        "fixed z-50 px-4 py-3 rounded-2xl",
        "bg-white/95 dark:bg-gray-900/90",
        "backdrop-blur-md",
        "border border-gray-200/60 dark:border-gray-700/40",
        "shadow-lg",
        "pointer-events-none"
      )}
      style={{
        left: 0,
        top: 0,
        transformOrigin: 'center center',
        transform: 'translateZ(0)', // GPU acceleration
      }}
      initial={{
        x: startPosition.x - halfWidth,
        y: startPosition.y - halfHeight,
        scale: 1,
        opacity: 1,
        rotate: 0,
      }}
      animate={status === 'flying' ? flyingAnimation : absorbingAnimation}
      transition={{
        duration: status === 'flying' ? 0.35 : 0.2,
        ease: [0.32, 0.72, 0, 1],
      }}
      onAnimationComplete={() => {
        if (status === 'absorbing' && onComplete) {
          onComplete();
        }
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gray-100/80 dark:bg-gray-800/60 flex items-center justify-center flex-shrink-0">
          <span className="text-base">{emoji}</span>
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 line-clamp-2 max-w-[200px]">
          {content}
        </span>
      </div>
    </motion.div>
  );
};
