import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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

// Arc positions relative to the eye center (cards curve around left side)
const arcPositions = [
  { x: -280, y: -90, rotate: -5 },   // Top-left arc
  { x: -310, y: 0, rotate: 0 },      // Middle-left (furthest)
  { x: -280, y: 90, rotate: 5 },     // Bottom-left arc
];

export const SuggestionsCard = ({ suggestions, onSuggestionClick }: SuggestionsCardProps) => {
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
    <AnimatePresence>
      {visibleSuggestions.map((suggestion, index) => {
        const position = arcPositions[index] || arcPositions[0];
        
        return (
          <motion.button
            key={suggestion.id}
            onClick={(e) => handleClick(suggestion, e)}
            className={cn(
              "absolute flex items-center gap-3",
              "px-4 py-3 min-w-[220px] max-w-[300px]",
              "bg-white/95 dark:bg-gray-900/95",
              "backdrop-blur-xl",
              "shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]",
              "border border-gray-200/60 dark:border-gray-700/40",
              "rounded-2xl",
              "text-left group cursor-pointer",
              "hover:bg-gray-50 dark:hover:bg-gray-800/80",
              "transition-colors duration-150"
            )}
            style={{
              left: `calc(50% + ${position.x}px)`,
              top: `calc(50% + ${position.y}px)`,
              transform: `translate(-50%, -50%) rotate(${position.rotate}deg)`,
            }}
            initial={{ 
              opacity: 0, 
              x: -60, 
              scale: 0.8,
              filter: 'blur(8px)',
            }}
            animate={{ 
              opacity: 1, 
              x: 0, 
              scale: 1,
              filter: 'blur(0px)',
            }}
            exit={{ 
              opacity: 0, 
              x: -40, 
              scale: 0.9,
              filter: 'blur(4px)',
            }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 22,
              mass: 0.8,
              delay: index * 0.1,
            }}
            whileHover={{ 
              scale: 1.05,
              rotate: 0,
              boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
            }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-9 h-9 rounded-xl bg-gray-100/80 dark:bg-gray-800/60 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <span className="text-lg">{suggestion.emoji}</span>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 line-clamp-2">
              {suggestion.content}
            </span>
          </motion.button>
        );
      })}
    </AnimatePresence>
  );
};
