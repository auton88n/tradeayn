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
            "group relative overflow-hidden",
            // Premium white glass card
            "bg-white/95 dark:bg-gray-900/90",
            "backdrop-blur-xl",
            // Elegant borders
            "border border-gray-200/60 dark:border-gray-700/40",
            // Premium layered shadows
            "shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)]",
            "hover:shadow-[0_8px_30px_rgba(0,0,0,0.08),0_4px_8px_rgba(0,0,0,0.04)]",
            // Rounded and padded
            "px-4 py-3 rounded-2xl",
            // Smooth transitions
            "transition-all duration-300 ease-out",
            "hover:scale-[1.02] hover:border-gray-300/80 dark:hover:border-gray-600/60",
            "active:scale-[0.98]",
            "cursor-pointer select-none"
          )}
          initial={{
            x: -40,
            opacity: 0,
            scale: 0.9,
          }}
          animate={{
            x: 0,
            opacity: 1,
            scale: 1,
          }}
          exit={{
            x: -30,
            opacity: 0,
            scale: 0.95,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
            delay: index * 0.08,
          }}
          whileHover={{ x: 4 }}
        >
          {/* Subtle hover gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-50/0 via-gray-50/50 to-gray-50/0 dark:from-gray-800/0 dark:via-gray-800/30 dark:to-gray-800/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
          
          <div className="relative flex items-center gap-3">
            {/* Emoji in subtle container */}
            <div className="w-8 h-8 rounded-xl bg-gray-100/80 dark:bg-gray-800/60 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200/80 dark:group-hover:bg-gray-700/60 transition-colors duration-200">
              <span className="text-base">{emoji}</span>
            </div>
            
            {/* Content */}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200">
              {content}
            </span>
            
            {/* Arrow indicator */}
            <motion.span
              className="ml-auto text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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
