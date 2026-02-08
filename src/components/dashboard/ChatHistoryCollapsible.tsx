import { useMemo, useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, X, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { TranscriptMessage } from '@/components/transcript/TranscriptMessage';
import { cn } from '@/lib/utils';
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
import type { Message } from '@/types/dashboard.types';

interface ChatHistoryCollapsibleProps {
  messages: Message[];
  isOpen: boolean;
  onToggle: () => void;
  onClear?: () => void;
}

export const ChatHistoryCollapsible = ({
  messages,
  isOpen,
  onToggle,
  onClear,
}: ChatHistoryCollapsibleProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(messages.length);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Track which messages are "new" (arrived after initial render)
  const newMessageStartIndex = prevMessageCountRef.current;
  
  // Update the ref after render
  useEffect(() => {
    prevMessageCountRef.current = messages.length;
  }, [messages.length]);

  // Sort messages chronologically (oldest first), limit to last 20 for performance
  const sortedMessages = useMemo(() => {
    const sorted = [...messages].sort((a, b) => {
      const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
      const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
      return timeA - timeB;
    });
    return sorted.slice(-20);
  }, [messages]);

  // Auto-scroll to bottom when messages change or panel opens
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
        if (viewport) viewport.scrollTop = viewport.scrollHeight;
      });
    }
  }, [messages.length, isOpen]);

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
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm shadow-lg overflow-hidden" style={{ willChange: 'transform', contain: 'content' }}>
                {/* Header - styled like Engineering AI Panel */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-foreground/10">
                      <Brain className="h-4 w-4 text-foreground/70" />
                    </div>
                    <span className="font-medium text-sm">AYN Engineering</span>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onToggle}
                      className="h-7 w-7"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages Area */}
                <ScrollArea className="h-72" ref={scrollRef}>
                  <div className="py-1 space-y-0">
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
                  </div>
                </ScrollArea>
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
                "active:scale-95 transition-all cursor-pointer"
              )}
            >
              <Clock className="h-4 w-4" />
              <span>History</span>
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{messages.length}</span>
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
