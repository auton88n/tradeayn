import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Brain, Copy, Reply, Paperclip } from 'lucide-react';
import { TypewriterText } from '@/components/TypewriterText';
import { MessageFormatter } from '@/components/MessageFormatter';
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

interface MessageItemProps {
  message: Message;
  user: User;
  onCopy: (content: string) => void;
  onReply: (message: Message) => void;
  onTypingComplete?: (messageId: string) => void;
}

export const MessageItem = ({ message, user, onCopy, onReply, onTypingComplete }: MessageItemProps) => {
  return (
    <div
      className={`flex gap-2 sm:gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'} group relative`}
    >
      {message.sender === 'ayn' && (
        <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`message-bubble rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-3 ${
        message.sender === 'user' 
          ? 'user-message bg-muted/50 border border-border text-foreground' 
          : 'ai-message bg-muted text-foreground'
      }`}>
        {message.sender === 'user' && (
          <div className="text-xs font-medium text-muted-foreground mb-1">
            You
          </div>
        )}
        <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words group cursor-default select-text">
          {message.sender === 'ayn' && message.isTyping ? (
            <TypewriterText
              text={message.content}
              speed={2}
              className="inline-block text-foreground"
              onComplete={() => {
                if (onTypingComplete) {
                  onTypingComplete(message.id);
                }
              }}
            />
          ) : (
            <MessageFormatter
              content={message.content}
              className="text-foreground"
            />
          )}
        </div>
        {message.attachment && (
          <div className="mt-2 p-2 bg-muted/50 rounded-lg flex items-center gap-2">
            <Paperclip className="w-3 h-3" />
            <span className="text-xs">{message.attachment.name}</span>
          </div>
        )}
      </div>

      {/* Action buttons - always visible with opacity-70 */}
      <div className="flex items-start gap-1 opacity-70 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={() => onCopy(message.content)}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Copy message"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onReply(message)}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Reply to message"
        >
          <Reply className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {message.sender === 'user' && (
        <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
          <AvatarImage src="" />
          <AvatarFallback className="text-xs">
            {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};
