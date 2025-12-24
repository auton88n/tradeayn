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
  variant?: 'inline' | 'sheet';
}

const ResponseCardComponent = ({ responses, isMobile = false, onDismiss, variant = 'inline' }: ResponseCardProps) => {
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
            "relative flex flex-col",
            // Full width on mobile, contained on desktop
            "w-full sm:w-[90%] md:max-w-[600px] lg:max-w-[680px]",
            "mx-2 sm:mx-auto",
            // Glass morphism background
            "bg-background/95 dark:bg-gray-900/95 backdrop-blur-xl",
            // Glow border effect
            "ring-1 ring-primary/20",
            "shadow-xl shadow-primary/10",
            // Rounding - sheet has rounded top, inline has full rounding
            variant === 'sheet' ? "rounded-t-3xl rounded-b-xl" : "rounded-2xl",
            "overflow-hidden",
            // CSS containment for performance isolation
            "contain-layout contain-paint"
          )}
          style={{
            willChange: 'transform, opacity',
            transform: 'translateZ(0)',
          }}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{
            duration: 0.35,
            ease: [0.25, 0.1, 0.25, 1],
            delay: 0.1,
          }}
        >
          {/* Speech bubble pointer toward eye */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-background/95 dark:bg-gray-900/95 ring-1 ring-primary/20 ring-b-0 ring-r-0" />
          
          {/* Subtle top glow line */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          {/* Content area - images full width */}
          <div 
            ref={contentRef}
            className={cn(
              "flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
              // Height constraints
              "max-h-[45vh] sm:max-h-[50vh]",
              // Full-width images with proper styling
              "[&_img]:w-full [&_img]:max-h-[280px] [&_img]:object-cover [&_img]:rounded-none",
              "[&_img]:border-b [&_img]:border-border/20",
              // Text padding (images go edge to edge)
              "[&>div]:px-5 [&>div]:py-4",
              // Premium thin scrollbar
              "[&::-webkit-scrollbar]:w-1.5",
              "[&::-webkit-scrollbar-track]:bg-transparent",
              "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20",
              "[&::-webkit-scrollbar-thumb]:rounded-full",
              "[&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/30",
              // iOS touch scrolling
              "[-webkit-overflow-scrolling:touch]"
            )}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentResponseId || 'content'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                {isStreaming ? (
                  <StreamingMarkdown 
                    content={combinedContent}
                    speed={50}
                    onComplete={handleStreamComplete}
                    enableHaptics={isMobile}
                    className="text-sm text-foreground leading-relaxed [&_pre]:max-w-full [&_pre]:overflow-x-auto"
                  />
                ) : (
                  <MessageFormatter 
                    content={combinedContent} 
                    className="text-sm text-foreground leading-relaxed [&_pre]:max-w-full [&_pre]:overflow-x-auto" 
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Fade gradient when scrollable */}
          {isScrollable && !isAtBottom && (
            <div 
              className="absolute bottom-14 left-0 right-0 h-8 bg-gradient-to-t from-background dark:from-gray-900 to-transparent pointer-events-none"
              aria-hidden="true"
            />
          )}

          {/* Clean single-row action bar */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-t border-border/30 bg-muted/30">
            {/* Left: Copy button */}
            <button
              onClick={copyContent}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                "bg-background/80 dark:bg-gray-800/80",
                "hover:bg-primary/10",
                "text-muted-foreground hover:text-primary",
                "transition-all duration-200",
                "active:scale-95"
              )}
            >
              {copied ? (
                <>
                  <Check size={14} className="text-green-500" />
                  <span className="text-green-600 dark:text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
            
            {/* Center: Feedback Buttons */}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => handleFeedback('up')}
                className={cn(
                  "p-2 rounded-full transition-all duration-200 active:scale-90",
                  feedback === 'up' 
                    ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400" 
                    : "hover:bg-muted text-muted-foreground hover:text-green-500"
                )}
              >
                <ThumbsUp size={16} />
              </button>
              <button 
                onClick={() => handleFeedback('down')}
                className={cn(
                  "p-2 rounded-full transition-all duration-200 active:scale-90",
                  feedback === 'down' 
                    ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400" 
                    : "hover:bg-muted text-muted-foreground hover:text-red-500"
                )}
              >
                <ThumbsDown size={16} />
              </button>
            </div>
            
            {/* Right: Expand + Dismiss */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleExpand}
                className={cn(
                  "p-2 rounded-full transition-all duration-200",
                  "hover:bg-muted",
                  "text-muted-foreground hover:text-primary",
                  "active:scale-95"
                )}
                title="Expand"
              >
                <Maximize2 size={16} />
              </button>
              {onDismiss && (
                <button
                  onClick={handleDismiss}
                  className={cn(
                    "p-2 rounded-full transition-all duration-200",
                    "hover:bg-destructive/10",
                    "text-muted-foreground hover:text-destructive",
                    "active:scale-95"
                  )}
                  title="Dismiss"
                >
                  <X size={16} />
                </button>
              )}
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
