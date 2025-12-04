import { useState, useRef, useEffect } from 'react';
import { X, Search, Copy, Trash2, MessageSquare, Brain } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TranscriptMessage } from './TranscriptMessage';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/dashboard.types';
import type { AYNEmotion } from '@/contexts/AYNEmotionContext';

interface TranscriptSidebarProps {
  messages: Message[];
  isOpen: boolean;
  onToggle: (open?: boolean) => void;
  onClear?: () => void;
  currentMode?: string;
  onReply?: (quotedContent: string) => void;
}

// Extracted content component to avoid duplication
const TranscriptContent = ({
  messages,
  filteredMessages,
  searchQuery,
  setSearchQuery,
  isSearchFocused,
  setIsSearchFocused,
  scrollRef,
  currentMode,
  onReply,
  onToggle,
  onClear,
  handleCopyAll,
}: {
  messages: Message[];
  filteredMessages: Message[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSearchFocused: boolean;
  setIsSearchFocused: (f: boolean) => void;
  scrollRef: React.RefObject<HTMLDivElement>;
  currentMode?: string;
  onReply?: (quotedContent: string) => void;
  onToggle: (open?: boolean) => void;
  onClear?: () => void;
  handleCopyAll: () => void;
}) => (
  <div className="flex flex-col h-full bg-gradient-to-b from-background to-background/95">
    {/* Premium Header */}
    <div className="relative">
      {/* Glassmorphism header background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-white/20 dark:from-gray-900/50 dark:to-gray-800/20 backdrop-blur-sm" />
      
      <div className="relative flex items-center justify-between p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* Premium icon container with gradient */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
              <MessageSquare className="w-4.5 h-4.5 text-background" />
            </div>
            {/* Message count badge */}
            <div className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-primary flex items-center justify-center shadow-sm">
              <span className="text-[10px] font-bold text-primary-foreground">{messages.length}</span>
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-sm tracking-tight">
              Chat Transcript
            </h2>
            <p className="text-xs text-muted-foreground">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onToggle(false)}
          className={cn(
            "h-9 w-9 rounded-xl",
            "bg-muted/50",
            "hover:bg-foreground hover:text-background",
            "border border-border/50",
            "transition-all duration-200",
            "active:scale-95"
          )}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Gradient border */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>

    {/* Premium Search */}
    <div className="p-4 pt-3">
      <div className={cn(
        "relative transition-all duration-200",
        isSearchFocused && "scale-[1.01]"
      )}>
        {/* Search icon */}
        <Search className={cn(
          "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-all duration-200",
          isSearchFocused ? "text-primary" : "text-muted-foreground"
        )} />
        
        {/* Glassmorphism search input */}
        <Input
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          className={cn(
            "pl-10 h-11 text-sm rounded-xl",
            "bg-muted/50",
            "backdrop-blur-sm",
            "border border-border/60",
            "focus:border-primary/50 focus:ring-2 focus:ring-primary/10",
            "focus:bg-background",
            "shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
            "focus:shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
            "placeholder:text-muted-foreground/60",
            "transition-all duration-200"
          )}
        />
      </div>
    </div>

    {/* Messages */}
    <ScrollArea className="flex-1 px-4" ref={scrollRef}>
      <div className="space-y-3 pb-4">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 relative">
            {/* Decorative dots pattern - top right */}
            <div className="absolute top-4 right-4 grid grid-cols-3 gap-1.5 opacity-20">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="w-1 h-1 rounded-full bg-foreground" />
              ))}
            </div>
            
            {/* Static brain icon - no continuous animations */}
            <div className="relative mb-6">
              {/* Soft outer glow - static */}
              <div className="absolute inset-[-12px] rounded-full bg-primary/20 blur-xl" />
              
              {/* Static orbital particles */}
              <div className="absolute inset-[-16px]">
                {[0, 90, 180, 270].map((deg) => (
                  <div
                    key={deg}
                    className="absolute w-2 h-2 rounded-full bg-primary/60"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `rotate(${deg}deg) translateX(40px) translateY(-50%)`,
                    }}
                  />
                ))}
              </div>
              
              {/* Orbital path ring */}
              <div className="absolute inset-[-16px] rounded-full border border-dashed border-foreground/10" />
              
              {/* Main circular icon - static */}
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center shadow-xl">
                <Brain className="w-8 h-8 text-background" />
              </div>
            </div>
            
            {/* Better typography */}
            <p className="text-base font-semibold text-foreground mb-2 text-center">
              {searchQuery ? 'No messages found' : 'Your conversation starts here'}
            </p>
            <p className="text-xs text-muted-foreground text-center max-w-[200px] leading-relaxed">
              {searchQuery ? 'Try different keywords' : 'Send a message to AYN and watch your chat history build up'}
            </p>
            
            {/* Quick start hint chip */}
            {!searchQuery && (
              <div className="mt-6 px-3 py-1.5 rounded-full bg-muted/50 backdrop-blur-sm border border-border/50 flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">✨ Type below to begin</span>
              </div>
            )}
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div key={msg.id} className="animate-fade-in">
              <TranscriptMessage
                content={msg.content}
                sender={msg.sender}
                timestamp={msg.timestamp}
                emotion={(msg as Message & { emotion?: AYNEmotion }).emotion}
                mode={msg.sender === 'ayn' ? currentMode : undefined}
                onReply={onReply}
              />
            </div>
          ))
        )}
      </div>
    </ScrollArea>

    {/* Premium Actions Footer */}
    <div className="relative p-4 pt-2">
      {/* Gradient border */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4" />
      
      <div className="flex gap-2.5">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex-1 h-11 rounded-xl font-medium",
            "bg-muted/50",
            "backdrop-blur-sm",
            "border border-border/60",
            "shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
            "hover:bg-foreground hover:text-background hover:border-foreground",
            "hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]",
            "transition-all duration-200",
            "active:scale-[0.98]",
            "disabled:opacity-40 disabled:pointer-events-none"
          )}
          onClick={handleCopyAll}
          disabled={messages.length === 0}
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy All
        </Button>
        {onClear && (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "flex-1 h-11 rounded-xl font-medium",
              "bg-destructive/10",
              "backdrop-blur-sm",
              "border border-destructive/30",
              "text-destructive",
              "shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
              "hover:bg-destructive hover:text-destructive-foreground hover:border-destructive",
              "hover:shadow-[0_4px_12px_rgba(239,68,68,0.2)]",
              "transition-all duration-200",
              "active:scale-[0.98]",
              "disabled:opacity-40 disabled:pointer-events-none"
            )}
            onClick={onClear}
            disabled={messages.length === 0}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>
    </div>
  </div>
);

export const TranscriptSidebar = ({
  messages,
  isOpen,
  onToggle,
  onClear,
  currentMode,
  onReply,
}: TranscriptSidebarProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Filter messages by search
  const filteredMessages = messages.filter((msg) =>
    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Copy all messages
  const handleCopyAll = async () => {
    const text = messages
      .map((msg) => `[${msg.sender === 'user' ? 'You' : 'AYN'}]: ${msg.content}`)
      .join('\n\n');
    
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied',
        description: 'Conversation copied to clipboard',
      });
    } catch {
      toast({
        title: 'Copy failed',
        variant: 'destructive',
      });
    }
  };

  const contentProps = {
    messages,
    filteredMessages,
    searchQuery,
    setSearchQuery,
    isSearchFocused,
    setIsSearchFocused,
    scrollRef,
    currentMode,
    onReply,
    onToggle,
    onClear,
    handleCopyAll,
  };

  // Floating toggle button - desktop only (mobile uses header button)
  const FloatingToggleButton = () => (
    <button
      onClick={() => onToggle()}
      className={cn(
        "fixed top-6 right-6 z-40",
        "hidden md:flex",
        "w-11 h-11 rounded-xl",
        "bg-background/80 backdrop-blur-sm border border-border",
        "text-foreground",
        "items-center justify-center",
        "shadow-lg hover:shadow-xl",
        "hover:scale-105 active:scale-95",
        "transition-all duration-300 ease-out",
        isOpen ? "opacity-0 pointer-events-none scale-90" : "opacity-100 scale-100"
      )}
    >
      <MessageSquare className="w-5 h-5" />
      {messages.length > 0 && (
        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-md">
          {messages.length > 99 ? '99+' : messages.length}
        </span>
      )}
    </button>
  );

  // UNIFIED: Full-screen overlay for ALL devices (mobile, tablet, desktop)
  return (
    <>
      <FloatingToggleButton />
      
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Dark backdrop - solid color, no blur for performance */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ duration: 0.12 }}
              className="fixed inset-0 z-50 bg-black/70"
              onClick={() => onToggle(false)}
            />
            
            {/* Full-screen content panel - fast tween, GPU accelerated */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%', transition: { duration: 0.15, ease: 'easeIn' } }}
              transition={{ type: 'tween', duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0, right: 0.4 }}
              onDragEnd={(_, info) => {
                if (info.offset.x > 100 || info.velocity.x > 500) {
                  onToggle(false);
                }
              }}
              className="fixed inset-0 z-50 bg-background touch-pan-y will-change-transform"
              style={{ transform: 'translateZ(0)' }}
              data-tutorial="transcript"
            >
              <TranscriptContent {...contentProps} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
