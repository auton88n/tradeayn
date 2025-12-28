import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { StreamingMarkdown } from '@/components/eye/StreamingMarkdown';
import { MessageFormatter } from '@/components/MessageFormatter';
import { hapticFeedback } from '@/lib/haptics';
import { Copy, Check, ThumbsUp, ThumbsDown, Brain, Maximize2, X, ChevronDown, Palette } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { persistDalleImage } from '@/hooks/useImagePersistence';

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
  showPointer?: boolean;
}

const ResponseCardComponent = ({ responses, isMobile = false, onDismiss, variant = 'inline', showPointer = true }: ResponseCardProps) => {
  const navigate = useNavigate();
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

  // Detect images in content (markdown image syntax or URLs)
  const detectedImageUrl = useMemo(() => {
    // Match markdown image: ![alt](url) or direct image URLs
    const markdownMatch = combinedContent.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
    if (markdownMatch) return markdownMatch[1];
    
    // Match direct image URLs ending with common extensions
    const urlMatch = combinedContent.match(/(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg))/i);
    if (urlMatch) return urlMatch[1];
    
    return null;
  }, [combinedContent]);

  const handleDesignThis = useCallback(async () => {
    if (detectedImageUrl) {
      hapticFeedback('light');
      // Try to persist the image first, then navigate with permanent URL
      try {
        const permanentUrl = await persistDalleImage(detectedImageUrl);
        navigate(`/design-lab?image=${encodeURIComponent(permanentUrl)}`);
      } catch {
        // Fallback to original URL if persistence fails
        navigate(`/design-lab?image=${encodeURIComponent(detectedImageUrl)}`);
      }
    }
  }, [detectedImageUrl, navigate]);

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
            // Modern glassmorphism background with gradient
            "bg-gradient-to-br from-white/90 via-white/80 to-gray-100/70",
            "dark:from-gray-900/95 dark:via-gray-800/90 dark:to-gray-900/85",
            "backdrop-blur-2xl",
            // Layered border effects for depth
            "border border-white/40 dark:border-white/10",
            "ring-1 ring-black/5 dark:ring-white/5",
            // Premium shadow with color tint
            "shadow-[0_8px_40px_-12px_rgba(0,0,0,0.15),0_4px_20px_-8px_rgba(0,0,0,0.1)]",
            "dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)]",
            // Rounding
            variant === 'sheet' ? "rounded-t-3xl rounded-b-xl" : "rounded-3xl",
            "overflow-hidden",
            // CSS containment for performance
            "contain-layout contain-paint"
          )}
          style={{
            willChange: 'transform, opacity',
            transform: 'translateZ(0)',
            ...(variant === 'sheet' ? { maxHeight: 'min(50vh, 100%)' } : {}),
          }}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{
            duration: 0.4,
            ease: [0.25, 0.1, 0.25, 1],
            delay: 0.1,
          }}
        >
          {/* Glossy top shine effect */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/20 to-transparent" />
          <div className="absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          
          {/* Speech bubble pointer */}
          {showPointer && variant !== 'sheet' && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-gradient-to-br from-white/90 to-gray-100/70 dark:from-gray-900/95 dark:to-gray-800/90 border-l border-t border-white/40 dark:border-white/10" />
          )}

          {/* Header with gradient icon container */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-black/5 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 shadow-sm shadow-primary/10 ring-1 ring-primary/10">
                <Brain className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">AYN</span>
            </div>
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className={cn(
                  "p-2 rounded-xl transition-all duration-200",
                  "bg-gray-100/50 dark:bg-white/5",
                  "hover:bg-red-100/80 dark:hover:bg-red-500/10",
                  "text-muted-foreground hover:text-red-500",
                  "active:scale-90"
                )}
                title="Dismiss"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Content area with inner glow */}
          <div 
            ref={contentRef}
            className={cn(
              "flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
              "relative",
              // Height constraints
              variant === 'inline' && "max-h-[45vh] sm:max-h-[50vh]",
              // Full-width images
              "[&_img]:w-full [&_img]:max-h-[280px] [&_img]:object-cover [&_img]:rounded-none",
              "[&_img]:border-b [&_img]:border-black/5 dark:[&_img]:border-white/5",
              // Text padding
              "[&>div]:px-5 [&>div]:py-4",
              // Premium scrollbar
              "[&::-webkit-scrollbar]:w-1",
              "[&::-webkit-scrollbar-track]:bg-transparent",
              "[&::-webkit-scrollbar-thumb]:bg-gray-300/50 dark:[&::-webkit-scrollbar-thumb]:bg-white/10",
              "[&::-webkit-scrollbar-thumb]:rounded-full",
              "[&::-webkit-scrollbar-thumb]:hover:bg-gray-400/50 dark:[&::-webkit-scrollbar-thumb]:hover:bg-white/20",
              "[-webkit-overflow-scrolling:touch]"
            )}
          >
            {/* Inner glow effect */}
            <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white/30 dark:from-white/5 to-transparent pointer-events-none" />
            
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
              className="absolute bottom-16 left-0 right-0 h-10 bg-gradient-to-t from-white/80 dark:from-gray-900/80 to-transparent pointer-events-none"
              aria-hidden="true"
            />
          )}

          {/* Modern glossy action bar */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-t border-black/5 dark:border-white/5 bg-gradient-to-b from-gray-50/50 to-gray-100/30 dark:from-gray-800/30 dark:to-gray-900/20">
            {/* Left: Copy pill button */}
            <button
              onClick={copyContent}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium",
                "bg-white/80 dark:bg-white/10",
                "backdrop-blur-sm",
                "border border-black/5 dark:border-white/10",
                "shadow-sm hover:shadow-md",
                "hover:bg-white dark:hover:bg-white/15",
                "text-muted-foreground hover:text-foreground",
                "transition-all duration-200",
                "active:scale-95"
              )}
            >
              {copied ? (
                <>
                  <Check size={13} className="text-green-500" />
                  <span className="text-green-600 dark:text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy</span>
                </>
              )}
            </button>
            
            {/* Center: Glossy feedback buttons */}
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-black/5 dark:border-white/5">
              <button 
                onClick={() => handleFeedback('up')}
                className={cn(
                  "p-2 rounded-full transition-all duration-200 active:scale-90",
                  feedback === 'up' 
                    ? "bg-gradient-to-br from-green-400/30 to-green-500/20 text-green-600 dark:text-green-400 shadow-sm shadow-green-500/20" 
                    : "hover:bg-white/80 dark:hover:bg-white/10 text-muted-foreground hover:text-green-500"
                )}
              >
                <ThumbsUp size={15} />
              </button>
              <button 
                onClick={() => handleFeedback('down')}
                className={cn(
                  "p-2 rounded-full transition-all duration-200 active:scale-90",
                  feedback === 'down' 
                    ? "bg-gradient-to-br from-red-400/30 to-red-500/20 text-red-600 dark:text-red-400 shadow-sm shadow-red-500/20" 
                    : "hover:bg-white/80 dark:hover:bg-white/10 text-muted-foreground hover:text-red-500"
                )}
              >
                <ThumbsDown size={15} />
              </button>
            </div>
            
            {/* Right: Design + Expand */}
            <div className="flex items-center gap-1.5">
              {detectedImageUrl && (
                <button
                  onClick={handleDesignThis}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium",
                    "bg-gradient-to-r from-pink-500/15 via-orange-500/10 to-amber-500/15",
                    "backdrop-blur-sm",
                    "border border-pink-300/30 dark:border-pink-500/20",
                    "shadow-sm hover:shadow-md hover:shadow-pink-500/10",
                    "hover:from-pink-500/25 hover:via-orange-500/20 hover:to-amber-500/25",
                    "text-pink-600 dark:text-pink-400",
                    "transition-all duration-200",
                    "active:scale-95"
                  )}
                  title="Edit in Design LAB"
                >
                  <Palette size={13} />
                  <span>Design</span>
                </button>
              )}
              <button
                onClick={handleExpand}
                className={cn(
                  "p-2.5 rounded-full transition-all duration-200",
                  "bg-white/80 dark:bg-white/10",
                  "backdrop-blur-sm",
                  "border border-black/5 dark:border-white/10",
                  "shadow-sm hover:shadow-md",
                  "hover:bg-white dark:hover:bg-white/15",
                  "text-muted-foreground hover:text-primary",
                  "active:scale-95"
                )}
                title="Expand"
              >
                <Maximize2 size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Reading Mode Dialog - Glossy Modern Style */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent 
          className={cn(
            "flex flex-col p-0 gap-0",
            // Full screen on mobile, large panel on desktop
            "w-screen h-[100dvh] max-w-none rounded-none",
            "sm:w-[90vw] sm:max-w-4xl sm:h-[85vh] sm:max-h-[85vh] sm:rounded-3xl",
            // Modern glassmorphism
            "bg-gradient-to-br from-white/95 via-gray-50/90 to-white/95",
            "dark:from-gray-900/98 dark:via-gray-800/95 dark:to-gray-900/98",
            "backdrop-blur-2xl",
            "border-0 sm:border sm:border-white/30 dark:sm:border-white/10",
            "sm:shadow-[0_25px_80px_-20px_rgba(0,0,0,0.25)]",
            "sm:ring-1 sm:ring-black/5 dark:sm:ring-white/5",
            "overflow-hidden"
          )}
        >
          {/* Glossy top shine */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/15 to-transparent" />
          
          {/* Sticky Header - Glassmorphism */}
          <DialogHeader className="flex-shrink-0 px-5 sm:px-8 py-4 border-b border-black/5 dark:border-white/5 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 shadow-sm shadow-primary/10 ring-1 ring-primary/10">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <DialogTitle className="text-lg font-semibold">AYN Response</DialogTitle>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Copy pill button */}
                <button
                  onClick={copyContent}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium",
                    "bg-white/80 dark:bg-white/10",
                    "backdrop-blur-sm",
                    "border border-black/5 dark:border-white/10",
                    "shadow-sm hover:shadow-md",
                    "hover:bg-white dark:hover:bg-white/15",
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
                
                {/* Glossy feedback container */}
                <div className="flex gap-1 p-1 rounded-full bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-black/5 dark:border-white/5 ml-1">
                  <button 
                    onClick={() => handleFeedback('up')}
                    className={cn(
                      "p-2 rounded-full transition-all duration-200 active:scale-90",
                      feedback === 'up' 
                        ? "bg-gradient-to-br from-green-400/30 to-green-500/20 text-green-600 dark:text-green-400 shadow-sm shadow-green-500/20" 
                        : "hover:bg-white/80 dark:hover:bg-white/10 text-muted-foreground hover:text-green-500"
                    )}
                  >
                    <ThumbsUp size={15} />
                  </button>
                  <button 
                    onClick={() => handleFeedback('down')}
                    className={cn(
                      "p-2 rounded-full transition-all duration-200 active:scale-90",
                      feedback === 'down' 
                        ? "bg-gradient-to-br from-red-400/30 to-red-500/20 text-red-600 dark:text-red-400 shadow-sm shadow-red-500/20" 
                        : "hover:bg-white/80 dark:hover:bg-white/10 text-muted-foreground hover:text-red-500"
                    )}
                  >
                    <ThumbsDown size={15} />
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
              "px-5 sm:px-10 py-6",
              // Premium scrollbar
              "[&::-webkit-scrollbar]:w-1.5",
              "[&::-webkit-scrollbar-track]:bg-transparent",
              "[&::-webkit-scrollbar-thumb]:bg-gray-300/40 dark:[&::-webkit-scrollbar-thumb]:bg-white/10",
              "[&::-webkit-scrollbar-thumb]:rounded-full",
              "[&::-webkit-scrollbar-thumb]:hover:bg-gray-400/50 dark:[&::-webkit-scrollbar-thumb]:hover:bg-white/20",
              "[-webkit-overflow-scrolling:touch]"
            )}
          >
            {/* Inner glow */}
            <div className="pointer-events-none absolute top-[57px] left-0 right-0 h-6 bg-gradient-to-b from-white/50 dark:from-gray-900/50 to-transparent z-10" />
            
            <div className="max-w-3xl mx-auto">
              <MessageFormatter 
                content={combinedContent} 
                className={cn(
                  "text-base sm:text-[15px] leading-relaxed sm:leading-7",
                  "text-foreground",
                  "prose prose-gray dark:prose-invert max-w-none",
                  "[&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:p-4",
                  "[&_code]:text-sm",
                  "[&_ul]:space-y-2 [&_ol]:space-y-2",
                  "[&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg",
                  "[&_h1]:font-bold [&_h2]:font-semibold [&_h3]:font-medium",
                  "[&_h1]:mt-6 [&_h2]:mt-5 [&_h3]:mt-4",
                  "[&_p]:mb-4"
                )}
              />
            </div>
          </div>
          
          {/* Bottom fade + glossy scroll button */}
          {dialogScrollable && !dialogAtBottom && (
            <>
              <div 
                className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white/90 dark:from-gray-900/90 via-white/50 dark:via-gray-900/50 to-transparent"
                aria-hidden="true"
              />
              <button
                onClick={scrollDialogToBottom}
                className={cn(
                  "absolute bottom-5 left-1/2 -translate-x-1/2",
                  "flex items-center gap-1.5 px-5 py-2.5 rounded-full",
                  "bg-gradient-to-r from-primary via-primary to-primary/90",
                  "text-primary-foreground",
                  "backdrop-blur-sm",
                  "shadow-lg shadow-primary/30",
                  "hover:shadow-xl hover:shadow-primary/40",
                  "ring-1 ring-white/20",
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
