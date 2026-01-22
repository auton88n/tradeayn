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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="w-full pb-2"
    >
      <div className="flex flex-wrap gap-2 justify-center items-center px-3 max-w-full">
        <AnimatePresence mode="popLayout">
          {visibleSuggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion.id}
              onClick={(e) => handleClick(suggestion, e)}
              className={cn(
                "flex items-center gap-1.5",
                "px-2.5 py-1.5",
                "bg-background",
                "border border-border",
                "rounded-xl",
                "text-xs font-medium text-foreground",
                "shadow-sm",
                "hover:bg-muted hover:border-border/80",
                "active:scale-95",
                "transition-all duration-150",
                "min-w-[100px] max-w-[220px]",
                "cursor-pointer"
              )}
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 4 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 25,
                delay: index * 0.05,
              }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-sm flex-shrink-0">{suggestion.emoji}</span>
              <span className="line-clamp-1 text-left flex-1">{suggestion.content}</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
