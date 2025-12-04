import { useRef, useLayoutEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface UserMessageBubbleProps {
  content: string;
  status: 'flying' | 'absorbing' | 'done';
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  onComplete?: () => void;
}

export const UserMessageBubble = ({
  content,
  status,
  startPosition,
  endPosition,
  onComplete,
}: UserMessageBubbleProps) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 140, height: 44 });

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
        "fixed z-50 max-w-[300px] px-4 py-3 rounded-2xl",
        "bg-primary text-primary-foreground",
        "shadow-lg border border-primary/20",
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
              scale: [1, 0.85, 0.6, 0.35],
              opacity: [1, 1, 0.95, 0.9],
              rotate: [0, -3, -6, -8],
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
              duration: 0.45,
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
      <p className="text-sm font-medium line-clamp-3">{content}</p>
    </motion.div>
  );
};
