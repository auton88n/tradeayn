import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

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
      className="w-full pb-3"
    >
      <div className="flex flex-wrap gap-2.5 justify-center items-center px-3 max-w-full">
        <AnimatePresence mode="popLayout">
          {visibleSuggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion.id}
              onClick={(e) => handleClick(suggestion, e)}
              className={cn(
                "flex items-center gap-2",
                "px-4 py-2.5",
                // Premium glassmorphism
                "bg-white/95 dark:bg-gray-900/90",
                "backdrop-blur-xl",
                "border border-gray-200/60 dark:border-gray-700/40",
                "rounded-xl",
                "text-sm font-medium text-foreground",
                // Enhanced shadows with glow on hover
                "shadow-[0_2px_12px_rgba(0,0,0,0.05)]",
                "hover:shadow-[0_8px_24px_rgba(0,0,0,0.08),0_0_20px_rgba(147,51,234,0.04)]",
                // Hover effects
                "hover:scale-105 hover:-translate-y-0.5",
                "hover:border-primary/30",
                "active:scale-95",
                "transition-all duration-200 ease-out",
                "max-w-[180px]",
                "cursor-pointer"
              )}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 5 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 25,
                delay: index * 0.06,
              }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
              <span className="text-base flex-shrink-0">{suggestion.emoji}</span>
              <span className="truncate">{suggestion.content}</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
