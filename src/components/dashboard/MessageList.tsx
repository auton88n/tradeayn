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
        {/* Empty State - positioned to work with centered input */}
        {messages.length === 0 && !isTyping && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <div className="mb-6">
              <svg
                className="w-16 h-16 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Ready to help with your business
            </h3>
            <p className="text-muted-foreground max-w-md">
              Ask me anything about market research, sales optimization, strategic planning, or business insights.
            </p>
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
