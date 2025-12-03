import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Clean content - remove leading punctuation and whitespace
  const cleanedContent = content.replace(/^[!?\s]+/, '').trim();

  // Check if content is scrollable and track scroll position
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const checkScrollState = () => {
      const scrollable = el.scrollHeight > el.clientHeight;
      setIsScrollable(scrollable);
      
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 10;
      setIsAtBottom(atBottom);
    };

    checkScrollState();
    el.addEventListener('scroll', checkScrollState);
    
    // Re-check when content changes
    const resizeObserver = new ResizeObserver(checkScrollState);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', checkScrollState);
      resizeObserver.disconnect();
    };
  }, [cleanedContent]);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    const el = contentRef.current;
    if (el && isAtBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [cleanedContent, isAtBottom]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={id}
          className={cn(
            "relative z-40",
            // Responsive width
            "w-auto min-w-[200px] max-w-[calc(100vw-2rem)] sm:max-w-[480px]",
            // Premium white glass card
            "bg-white/98 dark:bg-gray-900/95",
            "backdrop-blur-xl",
            // Elegant soft shadows
            "shadow-[0_4px_24px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.03)]",
            // Subtle border
            "border border-gray-200/60 dark:border-gray-800/50",
            // Rounded speech bubble shape
            "px-5 py-4 rounded-2xl rounded-bl-md"
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
          
          {/* Content with markdown formatting and scrolling */}
          <div 
            ref={contentRef}
            className={cn(
              "max-h-[400px] overflow-y-auto overflow-x-hidden",
              // Premium scrollbar styling
              "scrollbar-thin",
              "[&::-webkit-scrollbar]:w-1.5",
              "[&::-webkit-scrollbar-track]:bg-transparent",
              "[&::-webkit-scrollbar-thumb]:bg-gray-300/60 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600/60",
              "[&::-webkit-scrollbar-thumb]:rounded-full",
              "[&::-webkit-scrollbar-thumb]:hover:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500",
              // iOS touch scrolling
              "[-webkit-overflow-scrolling:touch]"
            )}
          >
            <MessageFormatter 
              content={cleanedContent} 
              className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:text-gray-900 dark:[&_strong]:text-white [&_code]:bg-gray-100 dark:[&_code]:bg-gray-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs" 
            />
          </div>

          {/* Fade gradient indicator when scrollable and not at bottom */}
          {isScrollable && !isAtBottom && (
            <div 
              className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none rounded-b-2xl"
              aria-hidden="true"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
