import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { StreamingMarkdown } from '@/components/eye/StreamingMarkdown';
import { MessageFormatter } from '@/components/shared/MessageFormatter';
import { hapticFeedback } from '@/lib/haptics';
import { Copy, Check, ThumbsUp, ThumbsDown, Brain, X, ChevronDown, Palette } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { persistDalleImage } from '@/hooks/useImagePersistence';

interface ResponseBubbleAttachment {
  url: string;
  name: string;
  type: string;
}

interface ResponseBubble {
  id: string;
  content: string;
  isVisible: boolean;
  attachment?: ResponseBubbleAttachment;
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
  // Use a ref so streaming updates can't race with state updates and force-scroll the user
  const shouldAutoScrollRef = useRef(true);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isStreaming, setIsStreaming] = useState(true);
  const [lastResponseId, setLastResponseId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dialogScrollable, setDialogScrollable] = useState(false);
  const [dialogAtBottom, setDialogAtBottom] = useState(true);
  const dialogShouldAutoScrollRef = useRef(true);

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

  // Document links are now rendered inline by MessageFormatter - no separate card needed

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

  // Convert markdown to plain text for copying (matches visual display)
  const markdownToPlainText = useCallback((markdown: string): string => {
    let text = markdown;
    
    // Remove headers (### Title → Title)
    text = text.replace(/^#{1,6}\s+/gm, '');
    
    // Remove bold (**text** or __text__ → text)
    text = text.replace(/\*\*(.+?)\*\*/g, '$1');
    text = text.replace(/__(.+?)__/g, '$1');
    
    // Remove italic (*text* or _text_ → text)  
    text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1');
    text = text.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '$1');
    
    // Remove inline code (`code` → code)
    text = text.replace(/`(.+?)`/g, '$1');
    
    // Remove code blocks (```code``` → code)
    text = text.replace(/```[\w]*\n?([\s\S]*?)```/g, '$1');
    
    // Convert bullet points (* item → • item)
    text = text.replace(/^\s*[-*+]\s+/gm, '• ');
    
    // Remove link syntax [text](url) → text
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    
    // Remove image syntax ![alt](url) → [Image: alt]
    text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '[Image: $1]');
    
    // Remove horizontal rules
    text = text.replace(/^[-*_]{3,}$/gm, '');
    
    // Remove blockquote markers (> text → text)
    text = text.replace(/^>\s+/gm, '');
    
    // Clean up multiple newlines
    text = text.replace(/\n{3,}/g, '\n\n');
    
    return text.trim();
  }, []);

  const copyContent = async () => {
    try {
      const plainText = markdownToPlainText(combinedContent);
      await navigator.clipboard.writeText(plainText);
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
      shouldAutoScrollRef.current = atBottom;
    };

    checkScrollState();
    el.addEventListener('scroll', checkScrollState, { passive: true });
    
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
    // IMPORTANT: use ref to avoid stale isAtBottom during rapid streaming updates
    if (el && shouldAutoScrollRef.current) {
      // Use rAF so scroll happens after layout updates
      requestAnimationFrame(() => {
        if (!contentRef.current) return;
        contentRef.current.scrollTop = contentRef.current.scrollHeight;
      });
    }
  }, [combinedContent]);

  // Dialog scroll state
  useEffect(() => {
    const el = dialogContentRef.current;
    if (!el || !isExpanded) return;

    const checkDialogScroll = () => {
      const scrollable = el.scrollHeight > el.clientHeight;
      setDialogScrollable(scrollable);
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 10;
      setDialogAtBottom(atBottom);
      dialogShouldAutoScrollRef.current = atBottom;
    };

    checkDialogScroll();
    el.addEventListener('scroll', checkDialogScroll, { passive: true });
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

  // Hide completely if there's no visible content to show.
  if (visibleResponses.length === 0 || !combinedContent.trim()) return null;

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={visibleResponses[0]?.id || 'empty'}
          layout={false}
          className={cn(
            "relative flex flex-col",
            "w-full sm:w-[90%] md:max-w-[600px] lg:max-w-[680px]",
            "mx-2 sm:mx-auto",
            // Clean white background
            "bg-background",
            // Simple subtle border
            "border border-border",
            // Minimal shadow
            "shadow-sm",
            // Rounding
            variant === 'sheet' ? "rounded-t-2xl rounded-b-lg" : "rounded-2xl",
            "overflow-hidden"
          )}
          style={{
            willChange: 'transform, opacity',
            transform: 'translateZ(0)',
            ...(variant === 'sheet' ? { maxHeight: 'min(50vh, 100%)' } : {}),
          }}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{
            duration: 0.3,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          {/* Speech bubble pointer */}
          {showPointer && variant !== 'sheet' && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-background border-l border-t border-border" />
          )}

          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-muted">
                <Brain className="w-3.5 h-3.5 text-foreground" />
              </div>
              <span className="text-xs font-medium text-foreground">AYN</span>
            </div>
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Content area */}
          <div 
            ref={contentRef}
            className={cn(
              "flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
              variant === 'inline' && "max-h-[28vh] sm:max-h-[32vh]",
              "[&_img]:w-full [&_img]:max-h-[200px] [&_img]:object-cover [&_img]:rounded-lg",
              "[&>div]:px-3 [&>div]:py-2.5",
              "[-webkit-overflow-scrolling:touch]"
            )}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentResponseId || 'content'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isStreaming ? (
                  <StreamingMarkdown 
                    content={combinedContent}
                    speed={20}
                    onComplete={handleStreamComplete}
                    enableHaptics={isMobile}
                    className="text-sm text-foreground leading-relaxed [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:bg-muted [&_pre]:rounded-lg [&_pre]:p-3"
                  />
                ) : (
                  <MessageFormatter 
                    content={combinedContent} 
                    className="text-sm text-foreground leading-relaxed [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:bg-muted [&_pre]:rounded-lg [&_pre]:p-3" 
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Fade gradient when scrollable */}
          {isScrollable && !isAtBottom && (
            <div 
              className="absolute bottom-14 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none"
              aria-hidden="true"
            />
          )}

          {/* Clean action bar */}
          <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-t border-border">
            {/* Left: Copy button */}
            <button
              onClick={copyContent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-green-600" />
                  <span className="text-green-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
            
            {/* Right: Feedback + actions */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleFeedback('up')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  feedback === 'up' 
                    ? "text-foreground bg-muted" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                aria-label="Helpful"
              >
                <ThumbsUp size={18} />
              </button>
              <button 
                onClick={() => handleFeedback('down')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  feedback === 'down' 
                    ? "text-foreground bg-muted" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                aria-label="Not helpful"
              >
                <ThumbsDown size={18} />
              </button>
              
              {detectedImageUrl && (
                <button
                  onClick={handleDesignThis}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Edit in Design LAB"
                >
                  <Palette size={16} />
                  <span>Design</span>
                </button>
              )}
            </div>
          </div>

          {/* Inline document download link (inside action bar area) */}
        </motion.div>
      </AnimatePresence>

      {/* Reading Mode Dialog - Clean Style */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent 
          className={cn(
            "flex flex-col p-0 gap-0",
            "w-screen h-[100dvh] max-w-none rounded-none",
            "sm:w-[90vw] sm:max-w-4xl sm:h-[85vh] sm:max-h-[85vh] sm:rounded-2xl",
            "bg-background",
            "border-0 sm:border sm:border-border",
            "sm:shadow-lg",
            "overflow-hidden"
          )}
        >
          {/* Header */}
          <DialogHeader className="flex-shrink-0 px-5 sm:px-6 py-4 border-b border-border bg-background">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-muted">
                  <Brain className="w-5 h-5 text-foreground" />
                </div>
                <DialogTitle className="text-base font-medium">AYN Response</DialogTitle>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={copyContent}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-green-600" />
                      <span className="hidden sm:inline text-green-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span className="hidden sm:inline">Copy</span>
                    </>
                  )}
                </button>
                
                <button 
                  onClick={() => handleFeedback('up')}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    feedback === 'up' 
                      ? "text-foreground bg-muted" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <ThumbsUp size={16} />
                </button>
                <button 
                  onClick={() => handleFeedback('down')}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    feedback === 'down' 
                      ? "text-foreground bg-muted" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <ThumbsDown size={16} />
                </button>
              </div>
            </div>
          </DialogHeader>
          
          {/* Scrollable Content */}
          <div 
            ref={dialogContentRef}
            className={cn(
              "flex-1 overflow-y-auto overflow-x-hidden",
              "px-5 sm:px-8 py-6",
              "[-webkit-overflow-scrolling:touch]"
            )}
          >
            <div className="max-w-3xl mx-auto">
              <MessageFormatter 
                content={combinedContent} 
                className={cn(
                  "text-base sm:text-[15px] leading-relaxed sm:leading-7",
                  "text-foreground",
                  "prose prose-gray dark:prose-invert max-w-none",
                  "[&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:bg-muted",
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
          
          {/* Bottom fade + scroll button */}
          {dialogScrollable && !dialogAtBottom && (
            <>
              <div 
                className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent"
                aria-hidden="true"
              />
              <button
                onClick={scrollDialogToBottom}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium shadow-lg animate-bounce"
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
