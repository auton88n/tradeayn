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
  isMobile?: boolean;
  isSmallScreen?: boolean; // Mobile + Tablet (< 1024px)
  eyeShiftX?: number;
}

// Desktop: Arc positions relative to stage center (will add eyeShiftX)
const desktopPositions = [
  { x: -180, y: -60, rotate: -3 },
  { x: -200, y: 0, rotate: 0 },
  { x: -180, y: 60, rotate: 3 },
];

export const SuggestionsCard = ({ 
  suggestions, 
  onSuggestionClick, 
  isMobile = false, 
  isSmallScreen = false,
  eyeShiftX = 0 
}: SuggestionsCardProps) => {
  const visibleSuggestions = suggestions.filter(s => s.isVisible).slice(0, 3);

  if (visibleSuggestions.length === 0) return null;

  const handleClick = (suggestion: Suggestion, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSuggestionClick(suggestion.content, suggestion.emoji, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  // Mobile/Tablet: Use flexbox container above eye
  if (isSmallScreen || isMobile) {
    return (
      <div 
        className={cn(
          "absolute left-0 right-0 flex flex-wrap justify-center gap-2 px-3",
          isMobile ? "top-4" : "top-8"
        )}
      >
        <AnimatePresence>
          {visibleSuggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion.id}
              onClick={(e) => handleClick(suggestion, e)}
              className={cn(
                "flex items-center gap-2",
                "px-3 py-2",
                "bg-white/95 dark:bg-gray-900/95",
                "backdrop-blur-xl",
                "shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]",
                "border border-gray-200/60 dark:border-gray-700/40",
                "rounded-xl",
                "text-left group cursor-pointer",
                "hover:bg-gray-50 dark:hover:bg-gray-800/80",
                "transition-colors duration-150"
              )}
              initial={{ 
                opacity: 0, 
                y: -20, 
                scale: 0.9,
              }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
              }}
              exit={{ 
                opacity: 0, 
                y: -10, 
                scale: 0.95,
              }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 22,
                delay: index * 0.08,
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="w-6 h-6 rounded-lg bg-gray-100/80 dark:bg-gray-800/60 flex items-center justify-center flex-shrink-0">
                <span className="text-sm">{suggestion.emoji}</span>
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-200 line-clamp-1 max-w-[120px]">
                {suggestion.content}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop: Absolute arc positioning on left side
  return (
    <AnimatePresence>
      {visibleSuggestions.map((suggestion, index) => {
        const position = desktopPositions[index] || desktopPositions[0];
        
        return (
          <motion.button
            key={suggestion.id}
            onClick={(e) => handleClick(suggestion, e)}
            className={cn(
              "absolute flex items-center gap-2",
              "px-4 py-3 min-w-[200px] max-w-[280px]",
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
              left: `calc(50% + ${position.x + eyeShiftX}px)`,
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
