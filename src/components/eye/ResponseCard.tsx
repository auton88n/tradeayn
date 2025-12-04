import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { MessageFormatter } from '@/components/MessageFormatter';
import { Copy, Check } from 'lucide-react';

interface ResponseBubble {
  id: string;
  content: string;
  isVisible: boolean;
}

interface ResponseCardProps {
  responses: ResponseBubble[];
  isMobile?: boolean;
  eyeShiftX?: number;
}

export const ResponseCard = ({ responses, isMobile = false, eyeShiftX = 0 }: ResponseCardProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [copied, setCopied] = useState(false);

  const visibleResponses = responses.filter(r => r.isVisible);

  // Combine all responses into single content
  const combinedContent = visibleResponses
    .map(r => r.content.replace(/^[!?\s]+/, '').trim())
    .join('\n\n');

  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(combinedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

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
  }, [combinedContent]);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    const el = contentRef.current;
    if (el && isAtBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [combinedContent, isAtBottom]);

  if (visibleResponses.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          "relative group",
          // Responsive width - fit content up to max width
          "w-fit min-w-[280px] max-w-[calc(100vw-2rem)] sm:max-w-[560px]",
          // Premium glass card
          "bg-white/95 dark:bg-gray-900/90",
          "backdrop-blur-md",
          "shadow-sm hover:shadow-md transition-shadow",
          "border border-gray-100/60 dark:border-gray-800/40",
          "px-4 py-3 rounded-xl"
        )}
        initial={{
          x: -20,
          scale: 0.95,
          opacity: 0,
        }}
        animate={{
          x: 0,
          scale: 1,
          opacity: 1,
        }}
        exit={{
          x: -15,
          scale: 0.97,
          opacity: 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 26,
        }}
      >
        {/* Copy button - shows on hover */}
        <button
          onClick={copyContent}
          className={cn(
            "absolute right-2 top-2 p-1.5 rounded-md z-10",
            "bg-muted/80 hover:bg-muted",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "text-muted-foreground hover:text-foreground"
          )}
          title="Copy response"
        >
          {copied ? (
            <Check size={14} className="text-green-500" />
          ) : (
            <Copy size={14} />
          )}
        </button>

        {/* Content area with proper scrolling */}
        <div 
          ref={contentRef}
          className={cn(
            "speech-bubble-content",
            "max-h-[450px] overflow-y-auto overflow-x-hidden",
            "break-words",
            // Premium scrollbar styling - more visible
            "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2",
            "[&::-webkit-scrollbar-track]:bg-muted/30",
            "[&::-webkit-scrollbar-track]:rounded-full",
            "[&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600",
            "[&::-webkit-scrollbar-thumb]:rounded-full",
            "[&::-webkit-scrollbar-thumb]:hover:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500",
            // iOS touch scrolling
            "[-webkit-overflow-scrolling:touch]",
            // Padding for copy button
            "pr-6"
          )}
          style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
        >
          <MessageFormatter 
            content={combinedContent} 
            className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed max-w-none break-words" 
          />
        </div>

        {/* Fade gradient indicator when scrollable and not at bottom */}
        {isScrollable && !isAtBottom && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none rounded-b-xl"
            aria-hidden="true"
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};
