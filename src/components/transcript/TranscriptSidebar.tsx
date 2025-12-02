import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Copy, Trash2, ChevronRight, ChevronLeft, MessageSquare } from 'lucide-react';
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
}

export const TranscriptSidebar = ({
  messages,
  isOpen,
  onToggle,
  onClear,
  currentMode,
}: TranscriptSidebarProps) => {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={onToggle}
            className={cn(
              "fixed top-1/2 -translate-y-1/2 z-40",
              "w-8 h-20 rounded-l-lg",
              "bg-background/80 backdrop-blur-sm border border-r-0 border-border",
              "flex items-center justify-center",
              "hover:bg-muted transition-colors",
              "shadow-lg",
              isArabic ? "left-0 rounded-l-none rounded-r-lg border-l-0 border-r" : "right-0"
            )}
          >
            {isArabic ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            <span className="sr-only">Open transcript</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: isArabic ? '-100%' : '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: isArabic ? '-100%' : '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              "fixed top-0 h-full w-80 z-50",
              "bg-background/95 backdrop-blur-xl",
              "border-border shadow-2xl",
              "flex flex-col",
              isArabic ? "left-0 border-r" : "right-0 border-l"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                <h2 className="font-semibold text-foreground">
                  {isArabic ? 'سجل المحادثة' : 'Transcript'}
                </h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {messages.length}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={onToggle}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={isArabic ? 'بحث في المحادثة...' : 'Search messages...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {filteredMessages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">
                      {searchQuery
                        ? isArabic ? 'لا توجد نتائج' : 'No messages found'
                        : isArabic ? 'لا توجد رسائل بعد' : 'No messages yet'}
                    </p>
                  </div>
                ) : (
                  filteredMessages.map((msg) => (
                    <TranscriptMessage
                      key={msg.id}
                      content={msg.content}
                      sender={msg.sender}
                      timestamp={msg.timestamp}
                      emotion={(msg as Message & { emotion?: AYNEmotion }).emotion}
                      mode={msg.sender === 'ayn' ? currentMode : undefined}
                    />
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="p-3 border-t border-border flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
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
                  className="flex-1 text-destructive hover:text-destructive"
                  onClick={onClear}
                  disabled={messages.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isArabic ? 'مسح' : 'Clear'}
                </Button>
              )}
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
            onClick={onToggle}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
};
