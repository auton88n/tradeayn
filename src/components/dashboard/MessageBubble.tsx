import React, { memo } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Copy, Reply } from 'lucide-react';
import { MessageFormatter } from '@/components/MessageFormatter';
import { TypewriterText } from '@/components/TypewriterText';
import { cn } from '@/lib/utils';
import type { MessageBubbleProps } from '@/types/dashboard.types';

export const MessageBubble = memo(({ 
  message, 
  onCopy, 
  onReply,
  userName,
  userAvatar 
}: MessageBubbleProps) => {
  const isUser = message.sender === 'user';
  const isAyn = message.sender === 'ayn';

  return (
    <div
      className={cn(
        "flex gap-3 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* AYN Avatar - Left Side */}
      {isAyn && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground">
            AYN
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Content */}
      <div
        className={cn(
          "message-bubble rounded-2xl px-4 py-3 relative group transition-all duration-300",
          isUser
            ? "user-message bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
            : "ai-message bg-muted text-foreground shadow-md hover:shadow-lg"
        )}
      >
        {/* Message Text */}
        <div className="whitespace-pre-wrap break-words">
          {isAyn && message.isTyping ? (
            <TypewriterText
              text={message.content}
              speed={30}
              showCursor={false}
              onComplete={() => {}}
            />
          ) : (
            <MessageFormatter content={message.content} />
          )}
        </div>

        {/* Attachment Display */}
        {message.attachment && (
          <div className="mt-2 p-2 rounded-lg bg-background/50 border border-border">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">📎</span>
              <span className="font-medium truncate">{message.attachment.name}</span>
            </div>
          </div>
        )}

        {/* Action Buttons - Show on Hover */}
        <div className={cn(
          "absolute -top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
          isUser ? "left-2" : "right-2"
        )}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(message.content)}
            className="h-6 w-6 p-0 bg-background shadow-sm hover:bg-muted"
            title="Copy message"
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReply(message)}
            className="h-6 w-6 p-0 bg-background shadow-sm hover:bg-muted"
            title="Reply to message"
          >
            <Reply className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* User Avatar - Right Side */}
      {isUser && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="bg-muted text-foreground">
            {userName?.charAt(0) || userAvatar?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if message content or typing state changes
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.isTyping === nextProps.message.isTyping
  );
});

MessageBubble.displayName = 'MessageBubble';
