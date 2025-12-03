import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Brain } from 'lucide-react';
import { MessageFormatter } from '@/components/MessageFormatter';
import type { BubbleType } from '@/utils/emotionMapping';

interface AYNSpeechBubbleProps {
  id: string;
  content: string;
  type: BubbleType;
  isVisible: boolean;
  onDismiss?: () => void;
  position?: { x: number; y: number };
}

export const AYNSpeechBubble = ({
  id,
  content,
  type,
  isVisible,
}: AYNSpeechBubbleProps) => {
  // Clean content - remove leading punctuation and whitespace
  const cleanedContent = content.replace(/^[!?\s]+/, '').trim();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={id}
          className={cn(
            "relative z-40 max-w-[480px]",
            // Premium white glass card
            "bg-white/98 dark:bg-gray-900/95",
            "backdrop-blur-xl",
            // Elegant soft shadows
            "shadow-[0_4px_24px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.03)]",
            // Subtle border
            "border border-gray-200/60 dark:border-gray-800/50",
            // Rounded speech bubble shape
            "px-5 py-4 rounded-2xl rounded-bl-md",
            // Overflow handling
            "max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700"
          )}
          initial={{
            x: -20,
            scale: 0.9,
            opacity: 0,
          }}
          animate={{
            x: 0,
            scale: 1,
            opacity: 1,
          }}
          exit={{
            x: -20,
            scale: 0.9,
            opacity: 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
          }}
        >
          {/* Small AYN badge in corner */}
          <div className="absolute -left-2 -top-2 w-7 h-7 rounded-full bg-white dark:bg-gray-900 shadow-md border border-gray-100 dark:border-gray-800 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
          </div>
          
          {/* Content with markdown formatting */}
          <MessageFormatter 
            content={cleanedContent} 
            className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:text-gray-900 dark:[&_strong]:text-white [&_code]:bg-gray-100 dark:[&_code]:bg-gray-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs" 
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
