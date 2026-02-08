import { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { cn } from '@/lib/utils';
import { Brain, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TranscriptMessage } from '@/components/transcript/TranscriptMessage';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Message } from '@/types/dashboard.types';

interface HistoryCardProps {
  messages: Message[];
  isTyping?: boolean;
  onClose: () => void;
  onClear: () => void;
  onReply?: (text: string) => void;
}

const HistoryCardComponent = ({ messages, isTyping = false, onClose, onClear, onReply }: HistoryCardProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());

  const sortedMessages = useMemo(() => 
    [...messages].sort((a, b) => {
      const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
      const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
      return timeA - timeB;
    }), [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages.length]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollDown(distFromBottom > 100);
  }, []);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, []);

  if (sortedMessages.length === 0 && !isTyping) return null;

  return (
    <>
      <div
        className={cn(
          "relative flex flex-col",
          "w-full sm:w-[90%] md:max-w-[600px] lg:max-w-[680px]",
          "mx-2 sm:mx-auto",
          "bg-background",
          "border border-border/40",
          "shadow-md shadow-black/5 backdrop-blur-sm",
          "rounded-2xl",
          "overflow-hidden"
        )}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-muted">
              <Brain className="w-3.5 h-3.5 text-foreground" />
            </div>
            <span className="text-xs font-medium text-foreground">AYN</span>
          </div>
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
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="max-h-[50vh] overflow-y-auto [-webkit-overflow-scrolling:touch]"
          >
            <div className="p-3 space-y-1 flex flex-col justify-end min-h-full">
              {sortedMessages.map((msg, idx) => {
                const isLastAyn = msg.sender === 'ayn' && idx === sortedMessages.length - 1;
                const isNew = !seenMessageIdsRef.current.has(msg.id);
                if (!isNew) {
                  // already seen
                } else if (!isLastAyn || isTyping) {
                  seenMessageIdsRef.current.add(msg.id);
                }
                const shouldStream = isLastAyn && isNew && !isTyping && msg.sender === 'ayn';
                if (shouldStream) {
                  seenMessageIdsRef.current.add(msg.id);
                }
                const shouldAnimate = isNew;
                return (
                  <TranscriptMessage
                    key={msg.id}
                    content={msg.content}
                    sender={msg.sender}
                    timestamp={msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)}
                    status={msg.status}
                    isStreaming={shouldStream}
                    shouldAnimate={shouldAnimate}
                    onReply={onReply}
                  />
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
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

          {/* Scroll to bottom */}
          {showScrollDown && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 h-8 w-8 rounded-full bg-foreground/90 text-background flex items-center justify-center shadow-lg hover:bg-foreground transition-colors"
              aria-label="Scroll to bottom"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Clear confirmation */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
            <AlertDialogDescription>This will remove all messages from the current session.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowClearConfirm(false); onClear(); }}>Clear</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const HistoryCard = memo(HistoryCardComponent);
