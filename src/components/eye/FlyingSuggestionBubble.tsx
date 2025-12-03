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
  if (status === 'done') return null;

  return (
    <motion.div
      className={cn(
        "fixed left-0 top-0 z-50 px-4 py-3 rounded-2xl",
        "bg-white/95 dark:bg-gray-900/90",
        "backdrop-blur-xl",
        "border border-gray-200/60 dark:border-gray-700/40",
        "shadow-[0_4px_20px_rgba(0,0,0,0.08)]",
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
              scale: 0.4,
              opacity: 1,
              rotate: 8,
              filter: 'blur(0px)',
            }
          : {
              x: endPosition.x,
              y: endPosition.y,
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
              stiffness: 180,
              damping: 20,
              mass: 0.8,
            }
          : {
              duration: 0.3,
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
