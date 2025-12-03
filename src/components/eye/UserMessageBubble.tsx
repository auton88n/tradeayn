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

  // Calculate center offset for the bubble (so it lands centered on eye)
  const bubbleWidth = 140;
  const bubbleHeight = 44;

  return (
    <motion.div
      className={cn(
        "fixed z-50 max-w-[300px] px-4 py-3 rounded-2xl",
        "bg-primary text-primary-foreground",
        "shadow-lg border border-primary/20",
        "pointer-events-none"
      )}
      style={{
        left: 0,
        top: 0,
      }}
      initial={{
        x: startPosition.x - bubbleWidth / 2,
        y: startPosition.y - bubbleHeight / 2,
        scale: 1,
        opacity: 1,
        rotate: 0,
        filter: 'blur(0px)',
      }}
      animate={
        status === 'flying'
          ? {
              x: endPosition.x - bubbleWidth / 2,
              y: endPosition.y - bubbleHeight / 2,
              scale: 0.35,
              opacity: 1,
              rotate: -8,
              filter: 'blur(0px)',
            }
          : {
              x: endPosition.x - bubbleWidth / 2,
              y: endPosition.y - bubbleHeight / 2,
              scale: 0,
              opacity: 0,
              rotate: 0,
              filter: 'blur(6px)',
            }
      }
      transition={
        status === 'flying'
          ? {
              type: 'spring',
              stiffness: 160,
              damping: 18,
              mass: 0.5,
            }
          : {
              duration: 0.25,
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
