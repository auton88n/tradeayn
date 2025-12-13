import { motion, AnimatePresence } from 'framer-motion';
import { memo } from 'react';

interface ReadingIndicatorProps {
  isVisible: boolean;
  messageLength: number;
}

const ReadingIndicatorComponent = ({ isVisible, messageLength }: ReadingIndicatorProps) => {
  // Show different states based on message length
  const getReadingState = () => {
    if (messageLength > 200) return 'Absorbing...';
    if (messageLength > 100) return 'Reading...';
    if (messageLength > 20) return 'Listening...';
    return 'Listening...';
  };

  return (
    <AnimatePresence>
      {isVisible && messageLength > 5 && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute -bottom-12 left-1/2 -translate-x-1/2 pointer-events-none"
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/80 dark:bg-neutral-900/80 backdrop-blur-sm border border-border/40 shadow-sm">
            {/* Animated dots */}
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1 h-1 rounded-full bg-primary/60"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
            
            {/* Reading text */}
            <span className="text-[10px] font-medium text-muted-foreground/80 tracking-wide">
              {getReadingState()}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const ReadingIndicator = memo(ReadingIndicatorComponent);
