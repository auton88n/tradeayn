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

  return (
    <motion.div
      ref={bubbleRef}
      className={cn(
        "fixed z-50 px-4 py-3 rounded-2xl",
        "bg-white/95 dark:bg-gray-900/90",
        "backdrop-blur-lg",
        "border border-gray-200/60 dark:border-gray-700/40",
        "shadow-[0_8px_24px_rgba(0,0,0,0.1)]",
        "pointer-events-none"
      )}
      style={{
        left: 0,
        top: 0,
        transformOrigin: 'center center',
        willChange: 'transform, opacity',
      }}
      initial={{
        x: startPosition.x - halfWidth,
        y: startPosition.y - halfHeight,
        scale: 1,
        opacity: 1,
        rotate: 0,
        filter: 'blur(0px)',
      }}
      animate={
        status === 'flying'
          ? {
              x: endPosition.x - halfWidth,
              y: endPosition.y - halfHeight,
              scale: [1, 0.8, 0.5, 0.3],
              opacity: [1, 1, 0.95, 0.9],
              rotate: [0, 4, 7, 10],
              filter: ['blur(0px)', 'blur(0px)', 'blur(1px)', 'blur(2px)'],
            }
          : {
              x: endPosition.x - halfWidth,
              y: endPosition.y - halfHeight,
              scale: 0,
              opacity: 0,
              rotate: 0,
              filter: 'blur(6px)',
            }
      }
      transition={
        status === 'flying'
          ? {
              duration: 0.4,
              ease: [0.32, 0.72, 0, 1],
              times: [0, 0.3, 0.7, 1],
            }
          : {
              duration: 0.12,
              ease: [0.32, 0, 0.67, 0],
            }
      }
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
