import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, Search, Copy, Trash2, MessageSquare, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TranscriptMessage } from './TranscriptMessage';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
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

interface TranscriptSidebarProps {
  messages: Message[];
  isOpen: boolean;
  onToggle: (open?: boolean) => void;
  onClear?: () => void;
  currentMode?: string;
  onReply?: (quotedContent: string) => void;
}

export const TranscriptSidebar = ({
  messages,
  isOpen,
  onToggle,
  onClear,
}: TranscriptSidebarProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter and sort messages chronologically (oldest first)
  const filteredMessages = useMemo(() => 
    messages
      .filter(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
        const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
        return timeA - timeB;
      }),
    [messages, searchQuery]
  );

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (!searchQuery) {
      requestAnimationFrame(() => {
        const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
        if (viewport) viewport.scrollTop = viewport.scrollHeight;
      });
    }
  }, [messages.length, searchQuery]);

  // Copy all
  const handleCopyAll = async () => {
    const text = messages.map(msg => `[${msg.sender === 'user' ? 'You' : 'AYN'}]: ${msg.content}`).join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied to clipboard' });
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  // Handle clear with confirmation
  const handleClearClick = () => {
    setShowClearConfirm(true);
  };

  const handleClearConfirm = () => {
    setShowClearConfirm(false);
    onClear?.();
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => onToggle()}
        className={cn(
          "fixed top-6 right-6 z-40 hidden md:flex",
          "w-11 h-11 rounded-xl items-center justify-center",
          "bg-background/80 backdrop-blur-sm border border-border",
          "shadow-lg hover:shadow-xl hover:scale-105 active:scale-95",
          "transition-all duration-200",
          isOpen && "opacity-0 pointer-events-none"
        )}
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/60"
              onClick={() => onToggle(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={cn(
                "fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[420px]",
                "bg-background border-l border-border",
                "flex flex-col"
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-foreground flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-background" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm">Chat History</h2>
                    <p className="text-xs text-muted-foreground">
                      {messages.length} messages
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onToggle(false)}
                  className="h-9 w-9 rounded-xl hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Search */}
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
                  />
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1" ref={scrollRef}>
                <div className="p-2">
                  {filteredMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                        <MessageSquare className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <p className="font-medium text-sm mb-1">
                        {searchQuery ? 'No results' : 'No messages yet'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {searchQuery ? 'Try different keywords' : 'Start chatting with AYN'}
                      </p>
                    </div>
                  ) : (
                    filteredMessages.map((msg) => (
                      <TranscriptMessage
                        key={msg.id}
                        content={msg.content}
                        sender={msg.sender}
                        timestamp={msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Footer actions */}
              <div className="p-3 border-t border-border flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-9 rounded-lg bg-muted/50 hover:bg-muted text-xs font-medium"
                  onClick={scrollToBottom}
                  disabled={messages.length === 0}
                >
                  <ChevronDown className="w-3.5 h-3.5 mr-1.5" />
                  Latest
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-9 rounded-lg bg-muted/50 hover:bg-muted text-xs font-medium"
                  onClick={handleCopyAll}
                  disabled={messages.length === 0}
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy
                </Button>
                {onClear && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-9 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-medium"
                    onClick={handleClearClick}
                    disabled={messages.length === 0}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Clear
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
            <AlertDialogAction onClick={handleClearConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
