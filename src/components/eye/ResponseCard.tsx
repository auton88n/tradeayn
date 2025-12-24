import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import { StreamingMarkdown } from '@/components/eye/StreamingMarkdown';
import { MessageFormatter } from '@/components/MessageFormatter';
import { hapticFeedback } from '@/lib/haptics';
import { Copy, Check, ThumbsUp, ThumbsDown, Brain, Maximize2, X, ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ResponseBubble {
  id: string;
  content: string;
  isVisible: boolean;
}

interface ResponseCardProps {
  responses: ResponseBubble[];
  isMobile?: boolean;
  onDismiss?: () => void;
}

const ResponseCardComponent = ({ responses, isMobile = false, onDismiss }: ResponseCardProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isStreaming, setIsStreaming] = useState(true);
  const [lastResponseId, setLastResponseId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dialogScrollable, setDialogScrollable] = useState(false);
  const [dialogAtBottom, setDialogAtBottom] = useState(true);

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

  const handleExpand = () => {
    hapticFeedback('light');
    setIsExpanded(true);
  };

  const handleDismiss = () => {
    hapticFeedback('light');
    onDismiss?.();
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

  // Dialog scroll state
  useEffect(() => {
    const el = dialogContentRef.current;
    if (!el || !isExpanded) return;

    const checkDialogScroll = () => {
      const scrollable = el.scrollHeight > el.clientHeight;
      setDialogScrollable(scrollable);
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 10;
      setDialogAtBottom(atBottom);
    };

    checkDialogScroll();
    el.addEventListener('scroll', checkDialogScroll);
    const resizeObserver = new ResizeObserver(checkDialogScroll);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', checkDialogScroll);
      resizeObserver.disconnect();
    };
  }, [isExpanded, combinedContent]);

  const scrollDialogToBottom = () => {
    const el = dialogContentRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  };

  if (visibleResponses.length === 0) return null;

  return (
    <>
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
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{
            duration: 0.3,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          {/* Animated accent line at top - simplified */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-t-2xl" />
          
          {/* Inner highlight shine - removed animation */}
          <div className="absolute inset-x-4 top-0 h-[30%] bg-gradient-to-b from-white/20 to-transparent dark:from-white/5 rounded-t-xl pointer-events-none" />

          {/* Removed Brain Logo for cleaner look */}

          {/* Top-right action cluster: Expand + Dismiss */}
          <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
            {/* Expand Button */}
            <button
              onClick={handleExpand}
              className={cn(
                "p-1.5 rounded-lg transition-all duration-200",
                "bg-background/80 dark:bg-gray-800/80 backdrop-blur-sm",
                "hover:bg-primary/10 hover:scale-105",
                "text-muted-foreground hover:text-primary",
                "border border-border/30",
                "active:scale-95"
              )}
              title="Expand to full view"
            >
              <Maximize2 size={14} />
            </button>
            
            {/* Dismiss Button */}
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className={cn(
                  "p-1.5 rounded-lg transition-all duration-200",
                  "bg-background/80 dark:bg-gray-800/80 backdrop-blur-sm",
                  "hover:bg-red-500/10 hover:scale-105",
                  "text-muted-foreground hover:text-red-500",
                  "border border-border/30",
                  "active:scale-95"
                )}
                title="Dismiss"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Content area with proper scrolling - improved height */}
          <div 
            ref={contentRef}
            className={cn(
              "speech-bubble-content",
              "flex-1 min-h-0 overflow-y-auto overflow-x-auto",
              // Responsive max-height: slightly taller to fit bigger images
              "max-h-[35vh] sm:max-h-[min(380px,40vh)]",
              "break-words max-w-full",
              // Larger images (300px max) for better visibility
              "[&_img]:max-h-[300px] [&_img]:w-auto [&_img]:object-contain [&_img]:rounded-lg",
              // Premium thin scrollbar
              "[&::-webkit-scrollbar]:w-1.5",
              "[&::-webkit-scrollbar-track]:bg-transparent",
              "[&::-webkit-scrollbar-thumb]:bg-gray-300/50 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600/50",
              "[&::-webkit-scrollbar-thumb]:rounded-full",
              "[&::-webkit-scrollbar-thumb]:hover:bg-gray-400/60 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500/60",
              // iOS touch scrolling
              "[-webkit-overflow-scrolling:touch]",
              // Padding for action buttons on right
              "pr-6 pt-1"
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
              className="absolute bottom-14 left-0 right-0 h-6 bg-gradient-to-t from-background/80 dark:from-gray-900/80 to-transparent pointer-events-none"
              aria-hidden="true"
            />
          )}

          {/* Action Footer */}
          <div className="flex-shrink-0 flex items-center justify-between mt-3 pt-3 border-t border-gray-200/40 dark:border-gray-700/40">
            {/* Left: Copy + Expand on mobile */}
            <div className="flex items-center gap-2">
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
              
              {/* Removed duplicate Expand button - now only in top-right */}
            </div>
            
            {/* Right: Feedback Buttons */}
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

      {/* Reading Mode Dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent 
          className={cn(
            "flex flex-col p-0 gap-0",
            // Full screen on mobile, large panel on desktop
            "w-screen h-[100dvh] max-w-none rounded-none",
            "sm:w-[90vw] sm:max-w-4xl sm:h-[85vh] sm:max-h-[85vh] sm:rounded-2xl",
            "bg-background dark:bg-gray-900",
            "border-0 sm:border sm:border-border/40",
            "overflow-hidden"
          )}
        >
          {/* Sticky Header */}
          <DialogHeader className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-border/40 bg-background/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <DialogTitle className="text-lg font-semibold">AYN Response</DialogTitle>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Copy in dialog */}
                <button
                  onClick={copyContent}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium",
                    "bg-gray-100/60 dark:bg-gray-800/60",
                    "hover:bg-gray-200/70 dark:hover:bg-gray-700/70",
                    "text-muted-foreground hover:text-foreground",
                    "transition-all duration-200",
                    "active:scale-95"
                  )}
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-green-500" />
                      <span className="hidden sm:inline text-green-600 dark:text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span className="hidden sm:inline">Copy</span>
                    </>
                  )}
                </button>
                
                {/* Feedback in dialog */}
                <div className="flex gap-1 border-l border-border/40 pl-2 ml-1">
                  <button 
                    onClick={() => handleFeedback('up')}
                    className={cn(
                      "p-2 rounded-lg transition-all duration-200 active:scale-90",
                      feedback === 'up' 
                        ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
                        : "hover:bg-gray-100/60 dark:hover:bg-gray-800/60 text-muted-foreground hover:text-green-500"
                    )}
                  >
                    <ThumbsUp size={16} />
                  </button>
                  <button 
                    onClick={() => handleFeedback('down')}
                    className={cn(
                      "p-2 rounded-lg transition-all duration-200 active:scale-90",
                      feedback === 'down' 
                        ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" 
                        : "hover:bg-gray-100/60 dark:hover:bg-gray-800/60 text-muted-foreground hover:text-red-500"
                    )}
                  >
                    <ThumbsDown size={16} />
                  </button>
                </div>
              </div>
            </div>
          </DialogHeader>
          
          {/* Scrollable Content */}
          <div 
            ref={dialogContentRef}
            className={cn(
              "flex-1 overflow-y-auto overflow-x-hidden",
              "px-4 sm:px-8 py-6",
              // Premium scrollbar
              "[&::-webkit-scrollbar]:w-2",
              "[&::-webkit-scrollbar-track]:bg-transparent",
              "[&::-webkit-scrollbar-thumb]:bg-gray-300/50 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600/50",
              "[&::-webkit-scrollbar-thumb]:rounded-full",
              "[&::-webkit-scrollbar-thumb]:hover:bg-gray-400/60 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500/60",
              "[-webkit-overflow-scrolling:touch]"
            )}
          >
            {/* Top fade */}
            <div className="pointer-events-none absolute top-[57px] left-0 right-0 h-4 bg-gradient-to-b from-background dark:from-gray-900 to-transparent z-10" />
            
            <div className="max-w-3xl mx-auto">
              <MessageFormatter 
                content={combinedContent} 
                className={cn(
                  // Larger, more comfortable typography
                  "text-base sm:text-[15px] leading-relaxed sm:leading-7",
                  "text-foreground",
                  "prose prose-gray dark:prose-invert max-w-none",
                  // Code blocks
                  "[&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:p-4",
                  "[&_code]:text-sm",
                  // Lists
                  "[&_ul]:space-y-2 [&_ol]:space-y-2",
                  // Headings
                  "[&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg",
                  "[&_h1]:font-bold [&_h2]:font-semibold [&_h3]:font-medium",
                  "[&_h1]:mt-6 [&_h2]:mt-5 [&_h3]:mt-4",
                  // Paragraphs
                  "[&_p]:mb-4"
                )}
              />
            </div>
          </div>
          
          {/* Bottom fade + scroll to bottom button */}
          {dialogScrollable && !dialogAtBottom && (
            <>
              <div 
                className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background dark:from-gray-900 to-transparent"
                aria-hidden="true"
              />
              <button
                onClick={scrollDialogToBottom}
                className={cn(
                  "absolute bottom-4 left-1/2 -translate-x-1/2",
                  "flex items-center gap-1.5 px-4 py-2 rounded-full",
                  "bg-primary text-primary-foreground",
                  "shadow-lg shadow-primary/25",
                  "hover:shadow-xl hover:shadow-primary/30",
                  "transition-all duration-200",
                  "animate-bounce",
                  "text-sm font-medium"
                )}
              >
                <ChevronDown size={16} />
                <span>Scroll down</span>
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

// Memoize to prevent unnecessary re-renders
export const ResponseCard = memo(ResponseCardComponent);
