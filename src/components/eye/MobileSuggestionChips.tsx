import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Suggestion {
  id: string;
  content: string;
  emoji: string;
  isVisible: boolean;
}

interface MobileSuggestionChipsProps {
  suggestions: Suggestion[];
  onSuggestionClick: (content: string, emoji: string, position: { x: number; y: number }) => void;
}

export const MobileSuggestionChips = ({ 
  suggestions, 
  onSuggestionClick 
}: MobileSuggestionChipsProps) => {
  const visibleSuggestions = suggestions.filter(s => s.isVisible).slice(0, 3);

  if (visibleSuggestions.length === 0) return null;

  const handleClick = (suggestion: Suggestion, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSuggestionClick(suggestion.content, suggestion.emoji, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="w-full pb-3 overflow-x-auto scrollbar-hide"
    >
      <div className="flex flex-nowrap gap-2 justify-center items-center px-4 overflow-x-auto scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {visibleSuggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion.id}
              onClick={(e) => handleClick(suggestion, e)}
              className={cn(
                "flex items-center gap-1.5",
                "px-3 py-2",
                "bg-white/90 dark:bg-gray-800/90",
                "backdrop-blur-lg",
                "border border-gray-200/60 dark:border-gray-700/40",
                "rounded-full",
                "text-sm font-medium text-foreground",
                "shadow-sm",
                "active:scale-95",
                "transition-colors duration-150",
                "max-w-[calc(100vw-4rem)]",
                "shrink-0"
              )}
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 25,
                delay: index * 0.05,
              }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-base flex-shrink-0">{suggestion.emoji}</span>
              <span className="truncate">{suggestion.content}</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
