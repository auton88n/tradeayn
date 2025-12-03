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
        "fixed left-0 top-0 z-50 max-w-[300px] px-4 py-3 rounded-2xl",
        "bg-primary text-primary-foreground",
        "shadow-lg border border-primary/20",
        "pointer-events-none"
      )}
      initial={{
        x: startPosition.x,
        y: startPosition.y,
        scale: 1,
        opacity: 1,
        rotate: 0,
        filter: 'blur(0px)',
      }}
      animate={
        status === 'flying'
          ? {
              x: endPosition.x,
              y: endPosition.y,
              scale: 0.5,
              opacity: 1,
              rotate: -5,
              filter: 'blur(0px)',
            }
          : {
              x: endPosition.x,
              y: endPosition.y,
              scale: 0,
              opacity: 0,
              rotate: 0,
              filter: 'blur(4px)',
            }
      }
      transition={
        status === 'flying'
          ? {
              type: 'spring',
              stiffness: 200,
              damping: 22,
              mass: 0.6,
            }
          : {
              duration: 0.35,
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
