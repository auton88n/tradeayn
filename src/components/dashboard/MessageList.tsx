import React, { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from '@/components/TypingIndicator';
import { useLanguage } from '@/contexts/LanguageContext';
import type { MessageListProps } from '@/types/dashboard.types';

export const MessageList = ({
  messages,
  isTyping,
  userName,
  userAvatar,
  onCopy,
  onReply,
  onQuickPrompt
}: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <ScrollArea className="flex-1 px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Enhanced Welcome State */}
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4 pointer-events-none">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
            
            <div className="relative z-10 max-w-2xl pointer-events-auto">
              {/* Logo/Icon with glow effect */}
              <div className="brain-container-lg mb-8 relative inline-flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <svg className="w-20 h-20 relative text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>

              {/* Welcome text */}
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {t('welcome.title')}
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                {t('welcome.subtitle')}
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <div className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium backdrop-blur-sm border border-primary/20">
                  ⚡ {t('welcome.features.fast')}
                </div>
                <div className="px-4 py-2 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium backdrop-blur-sm border border-green-500/20">
                  🔍 {t('welcome.features.research')}
                </div>
                <div className="px-4 py-2 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm font-medium backdrop-blur-sm border border-purple-500/20">
                  📄 {t('welcome.features.documents')}
                </div>
                <div className="px-4 py-2 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-sm font-medium backdrop-blur-sm border border-orange-500/20">
                  👁️ {t('welcome.features.vision')}
                </div>
              </div>

              {/* Quick prompts */}
              <p className="text-sm text-muted-foreground/70 mb-4">{t('welcome.tryAsking')}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <button 
                  onClick={() => onQuickPrompt?.(t('welcome.prompts.market'))}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left border border-border/50 hover:border-primary/50"
                >
                  💡 {t('welcome.prompts.market')}
                </button>
                <button 
                  onClick={() => onQuickPrompt?.(t('welcome.prompts.growth'))}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left border border-border/50 hover:border-primary/50"
                >
                  📊 {t('welcome.prompts.growth')}
                </button>
                <button 
                  onClick={() => onQuickPrompt?.(t('welcome.prompts.sales'))}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left border border-border/50 hover:border-primary/50"
                >
                  🎯 {t('welcome.prompts.sales')}
                </button>
                <button 
                  onClick={() => onQuickPrompt?.(t('welcome.prompts.launch'))}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left border border-border/50 hover:border-primary/50"
                >
                  🚀 {t('welcome.prompts.launch')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Message List */}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onCopy={onCopy}
            onReply={onReply}
            userName={userName}
            userAvatar={userAvatar}
          />
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium flex-shrink-0">
              AYN
            </div>
            <TypingIndicator />
          </div>
        )}

        {/* Scroll Anchor with padding */}
        <div className="pb-24" ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};
