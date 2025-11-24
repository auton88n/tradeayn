// Virtual scrolling with react-virtuoso for performance optimization
import { useRef, useCallback } from 'react';
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
  isDragOver?: boolean;
  onDragEnter?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export const MessageList = ({ 
  messages, 
  isTyping, 
  user, 
  onCopy, 
  onReply, 
  messagesEndRef,
  onTypingComplete,
  isDragOver,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop
}: MessageListProps) => {
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // Item renderer with typing indicator support
  const itemContent = useCallback((index: number) => {
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
  }, [messages, user, onCopy, onReply, onTypingComplete]);

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
    <div 
      className="flex-1 pb-20 sm:pb-24 relative"
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Full-Screen Drag Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-[60] bg-background/30 backdrop-blur-md flex items-center justify-center drag-overlay-enter">
          <div className="bg-card/95 border-2 border-dashed rounded-3xl p-12 text-center max-w-md mx-4 shadow-2xl drag-border-pulse">
            <div className="drag-icon-bounce mb-6">
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <svg 
                  className="w-10 h-10 text-primary" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground mb-3">Drop your file here</p>
            <p className="text-sm text-muted-foreground mb-6">
              Release to attach to your message
            </p>
            <div className="text-xs text-muted-foreground space-y-2 bg-muted/50 rounded-lg p-4">
              <p className="font-semibold text-foreground mb-2">Accepted formats:</p>
              <div className="grid grid-cols-2 gap-2 text-left">
                <div>• Images (JPG, PNG, GIF)</div>
                <div>• PDFs</div>
                <div>• Word docs</div>
                <div>• Text files</div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Maximum size: 10MB</p>
            </div>
          </div>
        </div>
      )}

      <Virtuoso
        ref={virtuosoRef}
        data={messages}
        itemContent={itemContent}
        components={{ Footer }}
        followOutput="smooth"
        alignToBottom
        increaseViewportBy={{ top: 200, bottom: 200 }}
        className="py-4 sm:py-6"
      />
      <div ref={messagesEndRef} className="absolute bottom-0" />

      {/* Empty State Hint */}
      {messages.length === 0 && !isTyping && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center max-w-md px-6 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-primary" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Start a conversation
            </h3>
            <p className="text-sm text-muted-foreground">
              Type a message below or drag & drop files to begin
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
