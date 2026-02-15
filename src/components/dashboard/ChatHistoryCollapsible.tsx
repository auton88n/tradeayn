import { useMemo, useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, X, Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TranscriptMessage } from "@/components/transcript/TranscriptMessage";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Message } from "@/types/dashboard.types";

interface ChatHistoryCollapsibleProps {
  messages: Message[];
  isOpen: boolean;
  onToggle: () => void;
  onClear?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  totalMessageCount?: number;
}

export const ChatHistoryCollapsible = ({ messages, isOpen, onToggle, onClear, onLoadMore, hasMore, isLoadingMore, totalMessageCount }: ChatHistoryCollapsibleProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(messages.length);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);

  // Track which messages are "new" (arrived after initial render)
  const newMessageStartIndex = prevMessageCountRef.current;

  // Update the ref after render
  useEffect(() => {
    prevMessageCountRef.current = messages.length;
  }, [messages.length]);

  // Sort messages chronologically (oldest first), limit to last 20 for performance
  const sortedMessages = useMemo(() => {
    const indexed = messages.map((m, i) => ({ m, i }));
    indexed.sort((a, b) => {
      const timeA = a.m.timestamp instanceof Date ? a.m.timestamp.getTime() : new Date(a.m.timestamp).getTime();
      const timeB = b.m.timestamp instanceof Date ? b.m.timestamp.getTime() : new Date(b.m.timestamp).getTime();
      const diff = timeA - timeB;
      return diff !== 0 ? diff : a.i - b.i;
    });
    return indexed.map(x => x.m);
  }, [messages]);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, []);

  // Track scroll position to show/hide scroll-to-bottom button
  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollDown(!isNearBottom);
    }
  }, []);

  // Auto-scroll to bottom when messages change or panel opens
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        });
      });
      // Fallback for framer-motion animation delays
      const fallback = setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 150);
      return () => clearTimeout(fallback);
    }
  }, [messages.length, isOpen]);

  // Check scroll on open
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => handleScroll());
    }
  }, [isOpen, handleScroll]);

  // Handle clear with confirmation
  const handleClearClick = useCallback(() => {
    setShowClearConfirm(true);
  }, []);

  const handleClearConfirm = useCallback(() => {
    setShowClearConfirm(false);
    onClear?.();
  }, [onClear]);

  // Don't render if no messages
  if (messages.length === 0) {
    return null;
  }

  return (
    <>
      <div className="w-full max-w-3xl mx-auto px-4 mb-2">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div
                className="rounded-xl border border-border bg-card/95 backdrop-blur-sm shadow-lg overflow-hidden flex flex-col"
                style={{ maxHeight: "70vh", willChange: "transform" }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-foreground/10">
                      <Brain className="h-4 w-4 text-foreground/70" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">AYN</span>
                      <span className="text-xs text-muted-foreground">{totalMessageCount ?? messages.length} messages</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {onClear && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearClick}
                        className="h-7 px-2 text-xs font-normal text-muted-foreground hover:text-foreground"
                      >
                        Clear
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={onToggle} className="h-7 w-7">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 min-h-0 relative">
                  <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="h-full overflow-y-auto overscroll-contain py-1"
                  >
                    {hasMore && onLoadMore && (
                      <div className="flex justify-center py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onLoadMore}
                          disabled={isLoadingMore}
                          className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground"
                        >
                          {isLoadingMore ? 'Loading...' : 'Load earlier messages'}
                        </Button>
                      </div>
                    )}
                    {sortedMessages.map((msg, index) => (
                      <TranscriptMessage
                        key={msg.id}
                        content={msg.content}
                        sender={msg.sender}
                        timestamp={msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)}
                        status={msg.status}
                        compact
                        shouldAnimate={index >= newMessageStartIndex}
                        
                      />
                    ))}
                    <div className="h-4" />
                  </div>

                  {/* Scroll-to-bottom button */}
                  <AnimatePresence>
                    {showScrollDown && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        onClick={scrollToBottom}
                        className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 p-2 rounded-full bg-foreground text-background shadow-lg hover:bg-foreground/90 transition-colors"
                        aria-label="Scroll to bottom"
                      >
                        <ChevronDown size={16} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Button - shown when collapsed */}
        {!isOpen && (
          <div className="flex justify-center">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={onToggle}
              className={cn(
                "inline-flex items-center gap-2",
                "px-5 py-2 rounded-full",
                "border border-border bg-card/80 backdrop-blur-sm",
                "text-sm text-muted-foreground shadow-sm",
                "hover:bg-muted/50 hover:text-foreground hover:shadow-md",
                "active:scale-95 transition-all cursor-pointer",
              )}
            >
              <Clock className="h-4 w-4" />
              <span>History</span>
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{totalMessageCount ?? messages.length}</span>
            </motion.button>
          </div>
        )}
      </div>

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all messages and start a new chat. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
