import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { StreamingMarkdown } from '@/components/eye/StreamingMarkdown';
import { MessageFormatter } from '@/components/shared/MessageFormatter';
import { TranscriptMessage } from '@/components/transcript/TranscriptMessage';
import { hapticFeedback } from '@/lib/haptics';
import { Copy, Check, ThumbsUp, ThumbsDown, Brain, X, ChevronDown, Palette, Maximize2, CornerDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { persistDalleImage } from '@/hooks/useImagePersistence';
import { supabase } from '@/integrations/supabase/client';
import { DocumentDownloadButton } from './DocumentDownloadButton';
import { toast } from 'sonner';
import type { Message } from '@/types/dashboard.types';

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
  sessionId?: string;
  // History mode props
  transcriptOpen?: boolean;
  transcriptMessages?: Message[];
  isTyping?: boolean;
  onHistoryClose?: () => void;
  onHistoryClear?: () => void;
}

const ResponseCardComponent = ({ 
  responses, isMobile = false, onDismiss, variant = 'inline', showPointer = true, sessionId,
  transcriptOpen = false, transcriptMessages = [], isTyping: historyTyping = false, onHistoryClose, onHistoryClear
}: ResponseCardProps) => {
  const navigate = useNavigate();
  
  const contentRef = useRef<HTMLDivElement>(null);
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const historyScrollRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const shouldAutoScrollRef = useRef(true);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isStreaming, setIsStreaming] = useState(true);
  const [lastResponseId, setLastResponseId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dialogScrollable, setDialogScrollable] = useState(false);
  const [dialogAtBottom, setDialogAtBottom] = useState(true);
  const dialogShouldAutoScrollRef = useRef(true);
  // History mode state
  const [showHistoryScrollDown, setShowHistoryScrollDown] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());

  const visibleResponses = responses.filter(r => r.isVisible);
  const currentResponseId = visibleResponses[0]?.id;

  const combinedContent = visibleResponses
    .map(r => r.content.replace(/^[!?\s]+/, '').trim())
    .join('\n\n');

  const detectedImageUrl = useMemo(() => {
    const markdownMatch = combinedContent.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
    if (markdownMatch) return markdownMatch[1];
    const urlMatch = combinedContent.match(/(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg))/i);
    if (urlMatch) return urlMatch[1];
    return null;
  }, [combinedContent]);

  const documentAttachment = useMemo(() => {
    const firstResponse = visibleResponses[0];
    if (!firstResponse?.attachment) return null;
    const { url, name, type } = firstResponse.attachment;
    const isDocument = 
      type === 'pdf' || type === 'excel' ||
      type === 'application/pdf' || type?.includes('spreadsheet') ||
      url?.startsWith('data:application/pdf') || url?.startsWith('data:application/vnd.openxmlformats');
    return isDocument ? { url, name, type } : null;
  }, [visibleResponses]);

  // Sorted transcript messages for history mode
  const sortedMessages = useMemo(() => 
    [...transcriptMessages].sort((a, b) => {
      const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
      const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
      return timeA - timeB;
    }), [transcriptMessages]);

  const handleDesignThis = useCallback(async () => {
    if (detectedImageUrl) {
      hapticFeedback('light');
      try {
        const permanentUrl = await persistDalleImage(detectedImageUrl);
        navigate(`/design-lab?image=${encodeURIComponent(permanentUrl)}`);
      } catch {
        navigate(`/design-lab?image=${encodeURIComponent(detectedImageUrl)}`);
      }
    }
  }, [detectedImageUrl, navigate]);

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

  const markdownToPlainText = useCallback((markdown: string): string => {
    let text = markdown;
    text = text.replace(/^#{1,6}\s+/gm, '');
    text = text.replace(/\*\*(.+?)\*\*/g, '$1');
    text = text.replace(/__(.+?)__/g, '$1');
    text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1');
    text = text.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '$1');
    text = text.replace(/`(.+?)`/g, '$1');
    text = text.replace(/```[\w]*\n?([\s\S]*?)```/g, '$1');
    text = text.replace(/^\s*[-*+]\s+/gm, '• ');
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '[Image: $1]');
    text = text.replace(/^[-*_]{3,}$/gm, '');
    text = text.replace(/^>\s+/gm, '');
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

  const handleFeedback = async (type: 'up' | 'down') => {
    hapticFeedback('light');
    const newFeedback = feedback === type ? null : type;
    setFeedback(newFeedback);
    if (newFeedback) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const rating = type === 'up' ? 'positive' : 'negative';
        const preview = combinedContent.slice(0, 200) + (combinedContent.length > 200 ? '...' : '');
        const { error } = await supabase.from('message_ratings').insert({
          user_id: user?.id || null,
          session_id: sessionId || null,
          message_preview: preview,
          rating
        });
        if (error) throw error;
        toast.success(type === 'up' ? 'Thanks for the feedback!' : 'We\'ll work on improving');
      } catch (err) {
        console.error('Failed to save feedback:', err);
      }
    }
  };

  const handleExpand = () => { hapticFeedback('light'); setIsExpanded(true); };
  const handleDismiss = () => { hapticFeedback('light'); onDismiss?.(); };

  // Response content scroll tracking
  useEffect(() => {
    if (transcriptOpen) return;
    const el = contentRef.current;
    if (!el) return;
    const checkScrollState = () => {
      setIsScrollable(el.scrollHeight > el.clientHeight);
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 10;
      setIsAtBottom(atBottom);
      shouldAutoScrollRef.current = atBottom;
    };
    checkScrollState();
    el.addEventListener('scroll', checkScrollState, { passive: true });
    const resizeObserver = new ResizeObserver(checkScrollState);
    resizeObserver.observe(el);
    return () => { el.removeEventListener('scroll', checkScrollState); resizeObserver.disconnect(); };
  }, [combinedContent, transcriptOpen]);

  useEffect(() => {
    if (transcriptOpen) return;
    const el = contentRef.current;
    if (el && shouldAutoScrollRef.current) {
      requestAnimationFrame(() => { if (contentRef.current) contentRef.current.scrollTop = contentRef.current.scrollHeight; });
    }
  }, [combinedContent, transcriptOpen]);

  // History scroll tracking
  const handleHistoryScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setShowHistoryScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 50);
  }, []);

  const scrollHistoryToBottom = useCallback(() => {
    historyScrollRef.current?.scrollTo({ top: historyScrollRef.current.scrollHeight, behavior: 'smooth' });
  }, []);

  // Auto-scroll history to bottom on new messages & check scroll indicator
   useEffect(() => {
    if (!transcriptOpen) return;
    if (historyScrollRef.current) {
      requestAnimationFrame(() => {
        const el = historyScrollRef.current;
        if (el) {
          el.scrollTop = el.scrollHeight;
          // Delayed check to handle race condition with layout
          setTimeout(() => {
            if (el) {
              setShowHistoryScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
            }
          }, 100);
        }
      });
    }
  }, [transcriptMessages.length, transcriptOpen]);

  // ResizeObserver to track history content overflow for scroll arrow
  useEffect(() => {
    if (!transcriptOpen) return;
    const el = historyScrollRef.current;
    if (!el) return;
    const checkScroll = () => {
      setShowHistoryScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
    };
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);
    return () => { el.removeEventListener('scroll', checkScroll); observer.disconnect(); };
  }, [transcriptOpen]);

  // Dialog scroll state
  useEffect(() => {
    const el = dialogContentRef.current;
    if (!el || !isExpanded) return;
    const checkDialogScroll = () => {
      setDialogScrollable(el.scrollHeight > el.clientHeight);
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 10;
      setDialogAtBottom(atBottom);
      dialogShouldAutoScrollRef.current = atBottom;
    };
    checkDialogScroll();
    el.addEventListener('scroll', checkDialogScroll, { passive: true });
    const resizeObserver = new ResizeObserver(checkDialogScroll);
    resizeObserver.observe(el);
    return () => { el.removeEventListener('scroll', checkDialogScroll); resizeObserver.disconnect(); };
  }, [isExpanded, combinedContent]);

  const scrollDialogToBottom = () => {
    const el = dialogContentRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  // Hide if no content to show (but always show in history mode)
  if (!transcriptOpen && (visibleResponses.length === 0 || !combinedContent.trim())) return null;

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={transcriptOpen ? 'history' : (visibleResponses[0]?.id || 'empty')}
          layout={false}
          className={cn(
            "relative flex flex-col",
            "w-full sm:w-[90%] md:max-w-[600px] lg:max-w-[680px]",
            "mx-2 sm:mx-auto",
            "bg-background",
            "border border-border/40",
            "shadow-md shadow-black/5 backdrop-blur-sm",
            variant === 'sheet' ? "rounded-t-2xl rounded-b-lg" : "rounded-2xl",
            "overflow-hidden",
            "max-h-full"
          )}
          style={{
            willChange: 'transform, opacity',
            transform: 'translateZ(0)',
            ...(variant === 'sheet' ? { maxHeight: 'min(50vh, 100%)' } : {}),
          }}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {showPointer && variant !== 'sheet' && !transcriptOpen && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-background border-l border-t border-border/40" />
          )}

          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-muted">
                <Brain className="w-3.5 h-3.5 text-foreground" />
              </div>
              <span className="text-xs font-medium text-foreground">AYN</span>
              {transcriptOpen && sortedMessages.length > 0 && (
                <span className="text-[10px] text-muted-foreground">{sortedMessages.length} messages</span>
              )}
            </div>
            {transcriptOpen ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClearConfirm(true)}
                  className="h-7 px-2 text-xs font-normal text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
                <button
                  onClick={onHistoryClose}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Close"
                >
                  <X size={14} />
                </button>
              </div>
            ) : onDismiss ? (
              <button
                onClick={handleDismiss}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>

          {/* Content area */}
          {transcriptOpen ? (
            /* History mode content */
            <div className="relative flex-1 min-h-0 flex flex-col">
              <div
                ref={historyScrollRef}
                onScroll={handleHistoryScroll}
                className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden [-webkit-overflow-scrolling:touch]"
              >
                <div className="p-3 pb-6 space-y-1 [overflow-wrap:anywhere]">
                  {sortedMessages.map((msg, idx) => {
                    const isLastAyn = msg.sender === 'ayn' && idx === sortedMessages.length - 1;
                    const isNew = !seenMessageIdsRef.current.has(msg.id);
                    if (!isNew) { /* already seen */ }
                    else if (!isLastAyn || historyTyping) { seenMessageIdsRef.current.add(msg.id); }
                    const shouldStream = isLastAyn && isNew && !historyTyping && msg.sender === 'ayn';
                    if (shouldStream) seenMessageIdsRef.current.add(msg.id);
                    return (
                      <TranscriptMessage
                        key={msg.id}
                        content={msg.content}
                        sender={msg.sender}
                        timestamp={msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)}
                        status={msg.status}
                        isStreaming={shouldStream}
                        shouldAnimate={isNew}
                        compact={false}
                      />
                    );
                  })}

                  {historyTyping && (
                    <div className="flex gap-2 p-3">
                      <div className="rounded-full w-8 h-8 bg-foreground text-background flex items-center justify-center shrink-0">
                        <Brain className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground mb-0.5">AYN</span>
                        <div className="inline-flex items-center gap-1 px-4 py-2.5 rounded-[20px] rounded-bl-sm bg-muted/50 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce-dot" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce-dot" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce-dot" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {showHistoryScrollDown && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    onClick={scrollHistoryToBottom}
                    className="absolute bottom-14 left-1/2 -translate-x-1/2 z-10 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl hover:bg-primary/90 transition-colors"
                    aria-label="Scroll to bottom"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Reply footer */}
              <div className="flex-shrink-0 px-3 py-2 border-t border-border/40 flex items-center justify-end">
                <button
                  onClick={onHistoryClose}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <CornerDownLeft size={13} />
                  Reply
                </button>
              </div>
            </div>
          ) : (
            /* Normal response content */
            <>
              <div 
                ref={contentRef}
                className={cn(
                  "flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
                  variant === 'inline' && "max-h-[28vh] sm:max-h-[32vh]",
                  "[&_img]:w-full [&_img]:max-h-[200px] [&_img]:object-cover [&_img]:rounded-lg",
                  "[&>div]:px-4 [&>div]:py-3",
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

                {documentAttachment && (
                  <div className="px-3 pb-2">
                    <DocumentDownloadButton
                      url={documentAttachment.url}
                      name={documentAttachment.name}
                      type={documentAttachment.type}
                    />
                  </div>
                )}
              </div>

              {isScrollable && !isAtBottom && (
                <div 
                  className="absolute bottom-14 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none"
                  aria-hidden="true"
                />
              )}

              {/* Action bar - only in response mode */}
              <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-t border-border/40">
                <button
                  onClick={copyContent}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? (
                    <><Check size={14} className="text-green-600" /><span className="text-green-600">Copied</span></>
                  ) : (
                    <><Copy size={14} /><span>Copy</span></>
                  )}
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleFeedback('up')} className={cn("p-2 rounded-lg transition-colors", feedback === 'up' ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted")} aria-label="Helpful"><ThumbsUp size={16} /></button>
                  <button onClick={() => handleFeedback('down')} className={cn("p-2 rounded-lg transition-colors", feedback === 'down' ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted")} aria-label="Not helpful"><ThumbsDown size={16} /></button>
                  <button onClick={handleExpand} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="Expand"><Maximize2 size={16} /></button>
                  {detectedImageUrl && (
                    <button onClick={handleDesignThis} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Edit in Design LAB">
                      <Palette size={16} /><span>Design</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Reading Mode Dialog */}
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
          <DialogHeader className="flex-shrink-0 px-5 sm:px-6 py-4 border-b border-border bg-background pr-20">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-muted"><Brain className="w-5 h-5 text-foreground" /></div>
              <DialogTitle className="text-base font-medium">AYN Response</DialogTitle>
            </div>
          </DialogHeader>
          <div ref={dialogContentRef} className={cn("flex-1 overflow-y-auto overflow-x-hidden min-h-0", "px-5 sm:px-8 py-6", "[-webkit-overflow-scrolling:touch]")}>
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
          {dialogScrollable && !dialogAtBottom && (
            <>
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" aria-hidden="true" />
              <button onClick={scrollDialogToBottom} className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium shadow-lg animate-bounce">
                <ChevronDown size={16} /><span>Scroll down</span>
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Clear history confirmation */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
            <AlertDialogDescription>This will remove all messages from the current session.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowClearConfirm(false); onHistoryClear?.(); }}>Clear</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const ResponseCard = memo(ResponseCardComponent);
