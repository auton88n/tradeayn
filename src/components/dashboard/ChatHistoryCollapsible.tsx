import { useMemo, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, ChevronDown, Copy, Trash2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TranscriptMessage } from '@/components/transcript/TranscriptMessage';
import { useToast } from '@/hooks/use-toast';
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
import { useState } from 'react';
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
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Sort messages chronologically (oldest first)
  const sortedMessages = useMemo(() => 
    [...messages].sort((a, b) => {
      const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
      const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
      return timeA - timeB;
    }),
    [messages]
  );

  // Auto-scroll to bottom when messages change or panel opens
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
        if (viewport) viewport.scrollTop = viewport.scrollHeight;
      });
    }
  }, [messages.length, isOpen]);

  // Copy all messages
  const handleCopyAll = useCallback(async () => {
    const text = messages.map(msg => `[${msg.sender === 'user' ? 'You' : 'AYN'}]: ${msg.content}`).join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied to clipboard' });
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  }, [messages, toast]);

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
        <Collapsible open={isOpen} onOpenChange={onToggle}>
          <div className="rounded-xl border border-border overflow-hidden bg-card/80 backdrop-blur-sm shadow-sm">
            {/* Collapsible Header/Trigger */}
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-foreground/70" />
                  </div>
                  <span className="font-medium text-sm">Chat History</span>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 rounded-full">
                    {messages.length}
                  </Badge>
                </div>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              </button>
            </CollapsibleTrigger>

            {/* Collapsible Content */}
            <CollapsibleContent>
              {/* Messages List */}
              <ScrollArea className="h-64" ref={scrollRef}>
                <div className="p-2">
                  {sortedMessages.map((msg) => (
                    <TranscriptMessage
                      key={msg.id}
                      content={msg.content}
                      sender={msg.sender}
                      timestamp={msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)}
                    />
                  ))}
                </div>
              </ScrollArea>

              {/* Footer Actions */}
              <div className="flex items-center justify-between p-3 border-t border-border bg-muted/30">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 rounded-lg text-xs font-medium"
                  onClick={handleCopyAll}
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy All
                </Button>
                {onClear && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 rounded-lg text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleClearClick}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Clear
                  </Button>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
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
