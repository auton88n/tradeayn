import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import { StreamingMarkdown } from '@/components/eye/StreamingMarkdown';
import { MessageFormatter } from '@/components/MessageFormatter';
import { hapticFeedback } from '@/lib/haptics';
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

const ResponseCardComponent = ({ responses, isMobile = false }: ResponseCardProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isStreaming, setIsStreaming] = useState(true);
  const [lastResponseId, setLastResponseId] = useState<string | null>(null);

  const visibleResponses = responses.filter(r => r.isVisible);
  const currentResponseId = visibleResponses[0]?.id;

  // Combine all responses into single content
  const combinedContent = visibleResponses
    .map(r => r.content.replace(/^[!?\s]+/, '').trim())
    .join('\n\n');

  // Reset streaming state when new response arrives
  useEffect(() => {
    if (currentResponseId && currentResponseId !== lastResponseId) {
      setIsStreaming(true);
      setLastResponseId(currentResponseId);
    }
  }, [currentResponseId, lastResponseId]);

  const handleStreamComplete = useCallback(() => {
    setIsStreaming(false);
    hapticFeedback('light');
  }, []);

  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(combinedContent);
      hapticFeedback('success');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      hapticFeedback('heavy');
    }
  };

  const handleFeedback = (type: 'up' | 'down') => {
    hapticFeedback('light');
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
    <AnimatePresence mode="wait">
      <motion.div
        key={visibleResponses[0]?.id || 'empty'}
        layout={false}
        className={cn(
          "relative group flex flex-col",
          // Responsive width and height constraints
        "w-fit min-w-[280px] max-w-[calc(100vw-2rem)] sm:max-w-[560px] lg:max-w-[640px]",
          "mb-4",
          // Solid background for performance (no backdrop-blur)
          "bg-background dark:bg-gray-900",
          // Subtle shadow
          "shadow-lg",
          // Border
          "border border-border/40",
          // Padding and rounding
          "px-5 py-4 rounded-2xl",
          // CSS containment for performance isolation
          "contain-layout contain-paint"
        )}
        style={{
          willChange: 'transform, opacity',
          transform: 'translateZ(0)', // Force GPU layer
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{
          duration: 0.25,
          ease: [0.25, 0.1, 0.25, 1],
        }}
      >
        {/* Animated accent line at top - simplified */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-t-2xl" />
        
        {/* Inner highlight shine - removed animation */}
        <div className="absolute inset-x-4 top-0 h-[30%] bg-gradient-to-b from-white/20 to-transparent dark:from-white/5 rounded-t-xl pointer-events-none" />

        {/* Brain Logo - Top Left (static for performance) */}
        <div className="absolute top-3 left-3 opacity-20">
          <Brain className="w-5 h-5 text-primary" />
        </div>

        {/* Content area with proper scrolling */}
        <div 
          ref={contentRef}
          className={cn(
            "speech-bubble-content",
            "flex-1 min-h-0 overflow-y-auto overflow-x-auto",
            "max-h-[300px]", // Enable scrolling when content exceeds 300px
            "break-words max-w-full",
            // Premium thin scrollbar
            "[&::-webkit-scrollbar]:w-1.5",
            "[&::-webkit-scrollbar-track]:bg-transparent",
            "[&::-webkit-scrollbar-thumb]:bg-gray-300/50 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600/50",
            "[&::-webkit-scrollbar-thumb]:rounded-full",
            "[&::-webkit-scrollbar-thumb]:hover:bg-gray-400/60 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500/60",
            // iOS touch scrolling
            "[-webkit-overflow-scrolling:touch]",
            // Padding for brain logo on left
            "pl-8 pr-2 pt-1"
          )}
          style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
        >
          {/* Content with fade transition on change */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentResponseId || 'content'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {/* Streaming text effect for new responses */}
              {isStreaming ? (
                <StreamingMarkdown 
                  content={combinedContent}
                  speed={50}
                  onComplete={handleStreamComplete}
                  enableHaptics={isMobile}
                  className="max-w-full break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto"
                />
              ) : (
                <MessageFormatter 
                  content={combinedContent} 
                  className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed max-w-full break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto" 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Fade gradient indicator when scrollable and not at bottom */}
        {isScrollable && !isAtBottom && (
          <div 
            className="absolute bottom-14 left-0 right-0 h-6 bg-gradient-to-t from-white/60 dark:from-gray-900/60 to-transparent pointer-events-none"
            aria-hidden="true"
          />
        )}

        {/* Action Footer */}
        <div className="flex-shrink-0 flex items-center justify-between mt-3 pt-3 border-t border-gray-200/40 dark:border-gray-700/40">
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

// Memoize to prevent unnecessary re-renders
export const ResponseCard = memo(ResponseCardComponent);
