import { useState, useRef, useEffect } from 'react';
import { X, Search, Copy, Trash2, MessageSquare, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { TranscriptMessage } from './TranscriptMessage';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
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
  isArabic,
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
  isArabic: boolean;
  currentMode?: string;
  onReply?: (quotedContent: string) => void;
  onToggle: (open?: boolean) => void;
  onClear?: () => void;
  handleCopyAll: () => void;
}) => (
  <div className="flex flex-col h-full bg-gradient-to-b from-background to-background/95" dir={isArabic ? 'rtl' : 'ltr'}>
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
              {isArabic ? 'المحادثة' : 'Transcript'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isArabic ? `${messages.length} رسالة` : `${messages.length} messages`}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onToggle(false)}
          className={cn(
            "h-9 w-9 rounded-xl",
            "bg-gray-100/50 dark:bg-gray-800/50",
            "hover:bg-foreground hover:text-background",
            "border border-gray-200/50 dark:border-gray-700/50",
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
          placeholder={isArabic ? 'بحث في المحادثة...' : 'Search messages...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          className={cn(
            "pl-10 h-11 text-sm rounded-xl",
            // Glassmorphism background
            "bg-gradient-to-br from-white/80 to-white/50 dark:from-gray-800/80 dark:to-gray-900/50",
            "backdrop-blur-sm",
            // Border styling
            "border border-gray-200/60 dark:border-gray-700/40",
            // Focus states
            "focus:border-primary/50 focus:ring-2 focus:ring-primary/10",
            "focus:bg-white dark:focus:bg-gray-800",
            // Shadow
            "shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
            "focus:shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
            // Placeholder
            "placeholder:text-muted-foreground/60",
            "transition-all duration-200"
          )}
        />
      </div>
    </div>

    {/* Messages */}
    <ScrollArea className="flex-1 px-4 overflow-x-hidden" ref={scrollRef}>
      <div className="space-y-3 pb-4">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
            <div className="relative mb-6">
              <div className="absolute inset-0 w-20 h-20 rounded-full bg-foreground/10 blur-xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-2xl bg-black dark:bg-white border border-border flex items-center justify-center">
                <Brain className="w-8 h-8 text-white dark:text-black" />
              </div>
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {searchQuery
                ? isArabic ? 'لا توجد نتائج' : 'No messages found'
                : isArabic ? 'لا توجد رسائل بعد' : 'No messages yet'}
            </p>
            <p className="text-xs text-foreground/50 text-center">
              {searchQuery
                ? isArabic ? 'جرب كلمات أخرى' : 'Try different keywords'
                : isArabic ? 'ابدأ محادثة مع AYN' : 'Start a conversation with AYN'}
            </p>
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
            // Glassmorphism background
            "bg-gradient-to-br from-white/80 to-white/50 dark:from-gray-800/80 dark:to-gray-900/50",
            "backdrop-blur-sm",
            "border border-gray-200/60 dark:border-gray-700/40",
            // Shadow
            "shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
            // Hover states
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
          {isArabic ? 'نسخ الكل' : 'Copy All'}
        </Button>
        {onClear && (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "flex-1 h-11 rounded-xl font-medium",
              // Glassmorphism with destructive tint
              "bg-gradient-to-br from-red-50/80 to-red-50/50 dark:from-red-950/30 dark:to-red-900/20",
              "backdrop-blur-sm",
              "border border-destructive/30",
              "text-destructive",
              // Shadow
              "shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
              // Hover states
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
            {isArabic ? 'مسح الكل' : 'Clear All'}
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
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isArabic = language === 'ar';

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
        title: isArabic ? 'تم النسخ' : 'Copied',
        description: isArabic ? 'تم نسخ المحادثة' : 'Conversation copied to clipboard',
      });
    } catch {
      toast({
        title: isArabic ? 'فشل النسخ' : 'Copy failed',
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
    isArabic,
    currentMode,
    onReply,
    onToggle,
    onClear,
    handleCopyAll,
  };

  // Floating toggle button - bottom right corner
  const FloatingToggleButton = () => (
    <button
      onClick={() => onToggle()}
      className={cn(
        "fixed top-6 right-6 z-40",
        "w-11 h-11 rounded-xl",
        "bg-foreground text-background",
        "flex items-center justify-center",
        "shadow-xl hover:shadow-2xl",
        "hover:scale-105 active:scale-95",
        "transition-all duration-200 ease-out",
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

  // Mobile: Use Sheet component for proper drawer behavior
  if (isMobile) {
    return (
      <>
        <FloatingToggleButton />
        <Sheet open={isOpen} onOpenChange={onToggle}>
          <SheetContent 
            side="right" 
            className="w-full sm:w-[420px] p-0 [&>button]:hidden"
          >
            <TranscriptContent {...contentProps} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop: Fixed positioning with CSS transforms
  return (
    <>
      <FloatingToggleButton />
      {/* Sidebar - CSS transform */}
      <div
        data-tutorial="transcript"
        className={cn(
          "fixed top-0 h-full z-50",
          "w-[420px]",
          "bg-background backdrop-blur-lg",
          "border-l border-border",
          "shadow-2xl",
          "right-0",
          "will-change-transform transition-transform duration-150 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <TranscriptContent {...contentProps} />
      </div>
    </>
  );
};
