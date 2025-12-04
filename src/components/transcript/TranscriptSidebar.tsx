import { useState, useRef, useEffect } from 'react';
import { X, Search, Copy, Trash2, ChevronLeft, MessageSquare, Brain } from 'lucide-react';
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
  <div className="flex flex-col h-full bg-background" dir={isArabic ? 'rtl' : 'ltr'}>
    {/* Header */}
    <div className="relative">
      <div className="flex items-center justify-between p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-foreground/10 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-foreground" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-foreground flex items-center justify-center">
              <span className="text-[9px] font-bold text-background">{messages.length}</span>
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-sm tracking-tight">
              {isArabic ? 'محادثة' : 'Chat'}
            </h2>
            <p className="text-xs text-foreground/60">
              {isArabic ? `${messages.length} رسالة` : `${messages.length} messages`}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onToggle(false)}
          className="h-8 w-8 rounded-lg hover:bg-foreground hover:text-background transition-colors"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="h-px bg-border" />
    </div>

    {/* Search */}
    <div className="p-4">
      <div className={cn(
        "relative transition-transform duration-150",
        isSearchFocused && "scale-[1.02]"
      )}>
        <Search className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-150",
          isSearchFocused ? "text-foreground" : "text-foreground/50"
        )} />
        <Input
          placeholder={isArabic ? 'بحث في المحادثة...' : 'Search messages...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          className={cn(
            "pl-10 h-10 text-sm rounded-xl",
            "bg-transparent border border-border",
            "placeholder:text-foreground/40",
            "focus:bg-background focus:border-foreground focus:ring-0",
            "transition-colors duration-150"
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

    {/* Actions */}
    <div className="p-4 pt-2">
      <div className="h-px bg-border mb-4" />
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex-1 h-10 rounded-xl",
            "bg-transparent border border-border",
            "hover:bg-foreground hover:text-background hover:border-foreground",
            "transition-colors duration-150",
            "disabled:opacity-40"
          )}
          onClick={handleCopyAll}
          disabled={messages.length === 0}
        >
          <Copy className="w-4 h-4 mr-2" />
          {isArabic ? 'نسخ' : 'Copy'}
        </Button>
        {onClear && (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "flex-1 h-10 rounded-xl",
              "bg-transparent border border-destructive/30",
              "text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive",
              "transition-colors duration-150",
              "disabled:opacity-40"
            )}
            onClick={onClear}
            disabled={messages.length === 0}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isArabic ? 'مسح' : 'Clear'}
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

  // Mobile: Use Sheet component for proper drawer behavior
  if (isMobile) {
    return (
      <>
        {/* Toggle button when closed - mobile */}
        <button
          onClick={() => onToggle()}
          className={cn(
            "fixed top-1/2 -translate-y-1/2 z-40",
            "w-10 h-24 rounded-l-2xl",
            "bg-background",
            "border border-border",
            "flex items-center justify-center",
            "hover:bg-foreground hover:text-background hover:w-12",
            "transition-all duration-150 ease-out",
            "shadow-lg",
            "group",
            "right-0",
            isOpen ? "opacity-0 pointer-events-none translate-x-4" : "opacity-100 translate-x-0"
          )}
        >
          <ChevronLeft className="w-5 h-5 text-foreground/60 group-hover:text-background transition-colors" />
        </button>

        <Sheet open={isOpen} onOpenChange={onToggle}>
          <SheetContent 
            side="right" 
            className="w-full sm:w-80 p-0 [&>button]:hidden"
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
      {/* Toggle button when closed - desktop */}
      <button
        onClick={() => onToggle()}
        className={cn(
          "fixed top-1/2 -translate-y-1/2 z-40",
          "w-10 h-24 rounded-l-2xl",
          "bg-background",
          "border border-border",
          "flex items-center justify-center",
          "hover:bg-foreground hover:text-background hover:w-12",
          "transition-all duration-150 ease-out",
          "shadow-lg",
          "group",
          "right-0",
          isOpen ? "opacity-0 pointer-events-none translate-x-4" : "opacity-100 translate-x-0"
        )}
      >
        <ChevronLeft className="w-5 h-5 text-foreground/60 group-hover:text-background transition-colors" />
      </button>

      {/* Sidebar - CSS transform */}
      <div
        data-tutorial="transcript"
        className={cn(
          "fixed top-0 h-full z-50",
          "w-80",
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
