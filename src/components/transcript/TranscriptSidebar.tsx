import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Copy, Trash2, ChevronRight, ChevronLeft, MessageSquare, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TranscriptMessage } from './TranscriptMessage';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Message } from '@/types/dashboard.types';
import type { AYNEmotion } from '@/contexts/AYNEmotionContext';

interface TranscriptSidebarProps {
  messages: Message[];
  isOpen: boolean;
  onToggle: () => void;
  onClear?: () => void;
  currentMode?: string;
  onReply?: (quotedContent: string) => void;
}

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

  return (
    <>
      {/* Toggle button when closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={onToggle}
            className={cn(
              "fixed top-1/2 -translate-y-1/2 z-40",
              "w-10 h-24 rounded-l-2xl",
              "bg-background backdrop-blur-2xl",
              "border border-border",
              "flex items-center justify-center",
              "hover:bg-foreground hover:text-background hover:w-12",
              "transition-all duration-300 ease-out",
              "shadow-lg",
              "group",
              "right-0"
            )}
          >
            <motion.div
              animate={{ x: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            >
              <ChevronLeft className="w-5 h-5 text-foreground/60 group-hover:text-background transition-colors" />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            dir={isArabic ? 'rtl' : 'ltr'}
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              "fixed top-0 h-full w-80 z-50",
              "bg-background backdrop-blur-2xl",
              "border-border",
              "flex flex-col",
              "shadow-2xl",
              "right-0 border-l"
            )}
          >
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
                  onClick={onToggle}
                  className="h-8 w-8 rounded-lg hover:bg-foreground hover:text-background transition-colors"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {/* Border line */}
              <div className="h-px bg-border" />
            </div>

            {/* Search */}
            <div className="p-4">
              <div className={cn(
                "relative transition-all duration-300",
                isSearchFocused && "transform scale-[1.02]"
              )}>
                <Search className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200",
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
                    "transition-all duration-300"
                  )}
                />
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4" ref={scrollRef}>
              <div className="space-y-3 pb-4">
                {filteredMessages.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-16 px-4"
                  >
                    {/* Empty state */}
                    <div className="relative mb-6">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          opacity: [0.2, 0.4, 0.2]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute inset-0 w-20 h-20 rounded-full bg-foreground/10 blur-xl"
                      />
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
                  </motion.div>
                ) : (
                  filteredMessages.map((msg, index) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.3 }}
                    >
                      <TranscriptMessage
                        content={msg.content}
                        sender={msg.sender}
                        timestamp={msg.timestamp}
                        emotion={(msg as Message & { emotion?: AYNEmotion }).emotion}
                        mode={msg.sender === 'ayn' ? currentMode : undefined}
                        onReply={onReply}
                      />
                    </motion.div>
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
                    "transition-all duration-300",
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
                      "transition-all duration-300",
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
};