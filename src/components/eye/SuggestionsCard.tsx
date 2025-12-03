import { motion, AnimatePresence } from 'framer-motion';
import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface Suggestion {
  id: string;
  content: string;
  emoji: string;
  isVisible: boolean;
}

interface SuggestionsCardProps {
  suggestions: Suggestion[];
  onSuggestionClick: (content: string, emoji: string, position: { x: number; y: number }) => void;
}

export const SuggestionsCard = ({ suggestions, onSuggestionClick }: SuggestionsCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const visibleSuggestions = suggestions.filter(s => s.isVisible);

  if (visibleSuggestions.length === 0) return null;

  const handleItemClick = (suggestion: Suggestion, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSuggestionClick(suggestion.content, suggestion.emoji, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={cardRef}
        className={cn(
          "w-[220px]",
          "bg-white/95 dark:bg-gray-900/95",
          "backdrop-blur-xl",
          "shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]",
          "border border-gray-200/60 dark:border-gray-700/40",
          "rounded-2xl overflow-hidden"
        )}
        initial={{ 
          x: -40, 
          opacity: 0, 
          scale: 0.9,
          filter: 'blur(8px)',
        }}
        animate={{ 
          x: 0, 
          opacity: 1, 
          scale: 1,
          filter: 'blur(0px)',
        }}
        exit={{ 
          x: -30, 
          opacity: 0, 
          scale: 0.95,
          filter: 'blur(4px)',
        }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 22,
          mass: 0.8,
        }}
      >
        {visibleSuggestions.map((suggestion, index) => (
          <motion.button
            key={suggestion.id}
            onClick={(e) => handleItemClick(suggestion, e)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3",
              "hover:bg-gray-100/80 dark:hover:bg-gray-800/60",
              "transition-colors duration-150",
              "text-left group",
              index !== visibleSuggestions.length - 1 && "border-b border-gray-100 dark:border-gray-800"
            )}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: index * 0.08,
              duration: 0.3,
              ease: [0.32, 0.72, 0, 1],
            }}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-8 h-8 rounded-xl bg-gray-100/80 dark:bg-gray-800/60 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <span className="text-base">{suggestion.emoji}</span>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex-1 line-clamp-2">
              {suggestion.content}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};
