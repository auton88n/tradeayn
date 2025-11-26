import React, { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from '@/components/TypingIndicator';
import { Brain } from 'lucide-react';
import type { MessageListProps } from '@/types/dashboard.types';

export const MessageList = ({
  messages,
  isTyping,
  userName,
  userAvatar,
  onCopy,
  onReply
}: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0">
              <Brain className="w-4 h-4" />
            </div>
            <TypingIndicator />
          </div>
        )}

        {/* Scroll Anchor with MORE padding for fixed input */}
        <div className="pb-32" ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};
