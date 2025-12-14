import { motion, AnimatePresence } from 'framer-motion';
import { memo } from 'react';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/haptics';
import { useSoundContextOptional } from '@/contexts/SoundContext';

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

// Desktop: Aligned column positions relative to stage center (will add eyeShiftX)
const desktopPositions = [
  { x: -400, y: -180, rotate: 0 },
  { x: -400, y: -80, rotate: 0 },
  { x: -400, y: 20, rotate: 0 },
];

const SuggestionsCardComponent = ({ 
  suggestions, 
  onSuggestionClick, 
  isMobile = false, 
  isSmallScreen = false,
  eyeShiftX = 0 
}: SuggestionsCardProps) => {
  const soundContext = useSoundContextOptional();
  const playSound = soundContext?.playSound;
  
  // Don't render suggestions on mobile or tablet
  if (isSmallScreen || isMobile) return null;

  const visibleSuggestions = suggestions.filter(s => s.isVisible).slice(0, 3);

  // Always render wrapper for tutorial highlighting, even when empty
  if (visibleSuggestions.length === 0) {
    return <div data-tutorial="suggestions" className="absolute left-1/4 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px]" />;
  }

  const handleClick = (suggestion: Suggestion, e: React.MouseEvent<HTMLButtonElement>) => {
    hapticFeedback('medium');
    playSound?.('suggestion-click');
    const rect = e.currentTarget.getBoundingClientRect();
    onSuggestionClick(suggestion.content, suggestion.emoji, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  // Desktop: Absolute arc positioning on left side
  return (
    <div data-tutorial="suggestions">
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
              // Simplified: solid background instead of blur for performance
              "bg-background border border-border/50",
              "shadow-lg",
              "rounded-2xl",
              "text-left group cursor-pointer",
              "hover:bg-muted",
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
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-150">
              <span className="text-lg">{suggestion.emoji}</span>
            </div>
            <span className="text-sm font-medium text-foreground line-clamp-2">
              {suggestion.content}
            </span>
          </motion.button>
        );
      })}
    </AnimatePresence>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export const SuggestionsCard = memo(SuggestionsCardComponent);
