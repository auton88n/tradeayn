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
  if (status === 'done') return null;

  return (
    <motion.div
      className={cn(
        "fixed z-50 max-w-[300px] px-4 py-3 rounded-2xl",
        "bg-primary text-primary-foreground",
        "shadow-lg border border-primary/20",
        "pointer-events-none"
      )}
      initial={{
        x: startPosition.x,
        y: startPosition.y,
        scale: 0,
        opacity: 0,
      }}
      animate={
        status === 'flying'
          ? {
              x: endPosition.x,
              y: endPosition.y,
              scale: 1,
              opacity: 1,
            }
          : {
              x: endPosition.x,
              y: endPosition.y,
              scale: 0.3,
              opacity: 0,
            }
      }
      transition={
        status === 'flying'
          ? {
              duration: 0.8,
              ease: [0.4, 0.0, 0.2, 1],
            }
          : {
              duration: 0.2,
              ease: 'easeOut',
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
