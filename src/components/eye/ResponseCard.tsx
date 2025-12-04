import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { MessageFormatter } from '@/components/MessageFormatter';
import { Copy, Check, ThumbsUp, ThumbsDown, Brain } from 'lucide-react';

interface ResponseBubble {
  id: string;
  content: string;
  isVisible: boolean;
}

interface ResponseCardProps {
  responses: ResponseBubble[];
  isMobile?: boolean;
}

export const ResponseCard = ({ responses, isMobile = false }: ResponseCardProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

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

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(prev => prev === type ? null : type);
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
          // Responsive width
          "w-fit min-w-[280px] max-w-[calc(100vw-2rem)] sm:max-w-[640px] lg:max-w-[720px]",
          // Premium glass card with gradient
          "bg-gradient-to-br from-white/95 to-white/80 dark:from-gray-900/95 dark:to-gray-800/80",
          "backdrop-blur-xl",
          // Layered shadows for depth
          "shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.2)]",
          "hover:shadow-[0_12px_40px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.25)]",
          // Border
          "border border-gray-200/50 dark:border-gray-700/40",
          "hover:border-gray-300/60 dark:hover:border-gray-600/50",
          // Hover lift effect
          "hover:-translate-y-0.5",
          // Smooth transitions
          "transition-all duration-300 ease-out",
          // Padding and rounding
          "px-5 py-4 rounded-2xl"
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
        {/* Accent Line at Top */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-t-2xl" />

        {/* Brain Logo - Top Left */}
        <div className="absolute top-3 left-3 opacity-25 group-hover:opacity-40 transition-opacity duration-300">
          <Brain className="w-4 h-4 text-primary" />
        </div>

        {/* Content area with proper scrolling */}
        <div 
          ref={contentRef}
          className={cn(
            "speech-bubble-content",
            "max-h-[450px] overflow-y-auto overflow-x-hidden",
            "break-words",
            // Premium thin scrollbar
            "[&::-webkit-scrollbar]:w-1.5",
            "[&::-webkit-scrollbar-track]:bg-transparent",
            "[&::-webkit-scrollbar-thumb]:bg-gray-300/50 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600/50",
            "[&::-webkit-scrollbar-thumb]:rounded-full",
            "[&::-webkit-scrollbar-thumb]:hover:bg-gray-400/60 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500/60",
            // iOS touch scrolling
            "[-webkit-overflow-scrolling:touch]",
            // Padding for brain logo
            "pl-6 pr-2 pt-1"
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
            className="absolute bottom-14 left-0 right-0 h-8 bg-gradient-to-t from-white/90 dark:from-gray-900/90 to-transparent pointer-events-none"
            aria-hidden="true"
          />
        )}

        {/* Action Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200/40 dark:border-gray-700/40">
          {/* Copy Button */}
          <button
            onClick={copyContent}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium",
              "bg-gray-100/60 dark:bg-gray-800/60",
              "hover:bg-gray-200/70 dark:hover:bg-gray-700/70",
              "text-muted-foreground hover:text-foreground",
              "transition-all duration-200",
              "active:scale-95"
            )}
          >
            {copied ? (
              <>
                <Check size={12} className="text-green-500" />
                <span className="text-green-600 dark:text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
          
          {/* Feedback Buttons */}
          <div className="flex gap-1">
            <button 
              onClick={() => handleFeedback('up')}
              className={cn(
                "p-1.5 rounded-lg transition-all duration-200 active:scale-90",
                feedback === 'up' 
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
                  : "hover:bg-gray-100/60 dark:hover:bg-gray-800/60 text-muted-foreground hover:text-green-500"
              )}
            >
              <ThumbsUp size={14} />
            </button>
            <button 
              onClick={() => handleFeedback('down')}
              className={cn(
                "p-1.5 rounded-lg transition-all duration-200 active:scale-90",
                feedback === 'down' 
                  ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" 
                  : "hover:bg-gray-100/60 dark:hover:bg-gray-800/60 text-muted-foreground hover:text-red-500"
              )}
            >
              <ThumbsDown size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
