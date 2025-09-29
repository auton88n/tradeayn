// Virtual scrolling with react-virtuoso for performance optimization
import { useRef, useEffect } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Brain } from 'lucide-react';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from '@/components/TypingIndicator';
import { User } from '@supabase/supabase-js';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ayn';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  isTyping?: boolean;
  attachment?: {
    url: string;
    name: string;
    type: string;
  };
}

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  user: User;
  onCopy: (content: string) => void;
  onReply: (message: Message) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onTypingComplete?: (messageId: string) => void;
}

export const MessageList = ({ 
  messages, 
  isTyping, 
  user, 
  onCopy, 
  onReply, 
  messagesEndRef,
  onTypingComplete
}: MessageListProps) => {
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (virtuosoRef.current && messages.length > 0) {
      virtuosoRef.current.scrollToIndex({
        index: messages.length - 1,
        behavior: 'smooth',
        align: 'end'
      });
    }
  }, [messages.length]);

  // Item renderer with typing indicator support
  const itemContent = (index: number) => {
    const message = messages[index];
    return (
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="max-w-4xl mx-auto pb-3 sm:pb-4">
          <MessageItem
            message={message}
            user={user}
            onCopy={onCopy}
            onReply={onReply}
            onTypingComplete={onTypingComplete}
          />
        </div>
      </div>
    );
  };

  // Footer renderer for typing indicator
  const Footer = () => {
    if (!isTyping) return null;
    
    return (
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="max-w-4xl mx-auto pb-3 sm:pb-4">
          <div className="flex gap-2 sm:gap-3 justify-start">
            <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </AvatarFallback>
            </Avatar>
            <TypingIndicator />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 pb-20 sm:pb-24 relative">
      <Virtuoso
        ref={virtuosoRef}
        data={messages}
        itemContent={itemContent}
        components={{ Footer }}
        followOutput="smooth"
        alignToBottom
        className="py-4 sm:py-6"
      />
      <div ref={messagesEndRef} className="absolute bottom-0" />
    </div>
  );
};
