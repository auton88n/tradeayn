import { ScrollArea } from '@/components/ui/scroll-area';
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
  return (
    <ScrollArea className="flex-1 px-3 sm:px-4 lg:px-6 pb-20 sm:pb-24">
      <div className="max-w-4xl mx-auto py-4 sm:py-6 space-y-3 sm:space-y-4">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            user={user}
            onCopy={onCopy}
            onReply={onReply}
            onTypingComplete={onTypingComplete}
          />
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex gap-2 sm:gap-3 justify-start">
            <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </AvatarFallback>
            </Avatar>
            <TypingIndicator />
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};
