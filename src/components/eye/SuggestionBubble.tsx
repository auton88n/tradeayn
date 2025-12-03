import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SuggestionBubbleProps {
  id: string;
  content: string;
  emoji?: string;
  isVisible: boolean;
  onClick: (content: string) => void;
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
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          key={id}
          onClick={() => onClick(content)}
          className={cn(
            "group relative px-4 py-2.5 rounded-2xl rounded-bl-md",
            "bg-muted/60 backdrop-blur-md border border-border/30",
            "shadow-sm hover:shadow-md",
            "text-sm text-foreground/90",
            "cursor-pointer select-none",
            "transition-all duration-200",
            "hover:bg-muted/80 hover:border-border/50",
            "active:scale-95"
          )}
          initial={{
            x: -50,
            opacity: 0,
            scale: 0.8,
          }}
          animate={{
            x: 0,
            opacity: 1,
            scale: 1,
          }}
          exit={{
            x: -30,
            opacity: 0,
            scale: 0.9,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
            delay: index * 0.1,
          }}
          whileHover={{ x: 5 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{emoji}</span>
            <span className="font-medium">{content}</span>
            <motion.span
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              initial={{ x: -5 }}
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
