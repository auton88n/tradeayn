import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SuggestionBubbleProps {
  id: string;
  content: string;
  emoji?: string;
  isVisible: boolean;
  onClick: (content: string, emoji: string, position: { x: number; y: number }) => void;
  index: number;
}

export const SuggestionBubble = ({
  id,
  content,
  emoji = '💡',
  isVisible,
  onClick,
  index,
}: SuggestionBubbleProps) => {
  const bubbleRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (bubbleRef.current) {
      const rect = bubbleRef.current.getBoundingClientRect();
      onClick(content, emoji, {
        x: rect.left + rect.width / 2 - 120, // Center adjustment
        y: rect.top + rect.height / 2 - 24,
      });
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          ref={bubbleRef}
          key={id}
          onClick={handleClick}
          className={cn(
            "group relative overflow-hidden",
            // Premium glass card
            "bg-card/95",
            "backdrop-blur-xl",
            // Elegant borders
            "border border-border/60",
            // Premium layered shadows
            "shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)]",
            "hover:shadow-[0_8px_30px_rgba(0,0,0,0.08),0_4px_8px_rgba(0,0,0,0.04)]",
            // Rounded and padded
            "px-4 py-3 rounded-2xl",
            // Smooth transitions
            "transition-all duration-300 ease-out",
            "hover:scale-[1.02] hover:border-border/80",
            "active:scale-[0.98]",
            "cursor-pointer select-none"
          )}
          initial={{
            x: -30,
            y: 12,
            opacity: 0,
            scale: 0.85,
            filter: 'blur(4px)',
          }}
          animate={{
            x: 0,
            y: 0,
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
          }}
          exit={{
            x: -20,
            opacity: 0,
            scale: 0.9,
            filter: 'blur(2px)',
          }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 20,
            delay: index * 0.12,
          }}
          whileHover={{ x: 4 }}
        >
          {/* Subtle hover gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-muted/0 via-muted/50 to-muted/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
          
          <div className="relative flex items-center gap-3">
            {/* Emoji in subtle container */}
            <div className="w-8 h-8 rounded-xl bg-muted/80 flex items-center justify-center flex-shrink-0 group-hover:bg-muted transition-colors duration-200">
              <span className="text-base">{emoji}</span>
            </div>
            
            {/* Content */}
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-200">
              {content}
            </span>
            
            {/* Arrow indicator */}
            <motion.span
              className="ml-auto text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              initial={{ x: -4 }}
              animate={{ x: 0 }}
            >
              →
            </motion.span>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
};
