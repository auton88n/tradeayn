import { useRef, useLayoutEffect, useState, memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface UserMessageBubbleProps {
  content: string;
  status: 'flying' | 'absorbing' | 'done';
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  onComplete?: () => void;
}

const UserMessageBubbleComponent = ({
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
        boxShadow: '0 0 0px transparent',
      }}
      animate={
        status === 'flying'
          ? {
              x: endPosition.x - halfWidth,
              y: endPosition.y - halfHeight,
              scale: [1, 0.85, 0.55, 0.25],
              opacity: [1, 1, 0.95, 0.85],
              rotate: [0, -3, -6, -10],
              filter: ['blur(0px)', 'blur(0px)', 'blur(1px)', 'blur(3px)'],
              boxShadow: [
                '0 0 0px transparent',
                '0 0 8px hsl(var(--primary) / 0.3)',
                '0 0 16px hsl(var(--primary) / 0.5)',
                '0 0 24px hsl(var(--primary) / 0.7)',
              ],
            }
          : {
              x: endPosition.x - halfWidth - 8,
              y: endPosition.y - halfHeight - 5,
              scale: [0.25, 0.1, 0],
              opacity: [0.85, 0.4, 0],
              rotate: -12,
              filter: ['blur(3px)', 'blur(8px)', 'blur(14px)'],
              boxShadow: [
                '0 0 24px hsl(var(--primary) / 0.7)',
                '0 0 40px hsl(var(--primary) / 0.9)',
                '0 0 60px hsl(var(--primary))',
              ],
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
              duration: 0.28,
              ease: [0.55, 0.055, 0.675, 0.19],
              times: [0, 0.5, 1],
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

export const UserMessageBubble = memo(UserMessageBubbleComponent, (prevProps, nextProps) => {
  return (
    prevProps.content === nextProps.content &&
    prevProps.status === nextProps.status &&
    prevProps.startPosition.x === nextProps.startPosition.x &&
    prevProps.startPosition.y === nextProps.startPosition.y &&
    prevProps.endPosition.x === nextProps.endPosition.x &&
    prevProps.endPosition.y === nextProps.endPosition.y
  );
});
