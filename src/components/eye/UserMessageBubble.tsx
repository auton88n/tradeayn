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

  // Simplified animation for smoother performance
  const flyingAnimation = {
    x: endPosition.x - halfWidth,
    y: endPosition.y - halfHeight,
    scale: 0.25,
    opacity: 0.85,
    rotate: -10,
  };

  const absorbingAnimation = {
    x: endPosition.x - halfWidth,
    y: endPosition.y - halfHeight,
    scale: 0,
    opacity: 0,
    rotate: -12,
  };

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
        duration: status === 'flying' ? 0.4 : 0.22,
        ease: [0.32, 0.72, 0, 1],
      }}
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
