import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Brain, User, Copy, Check, Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { AYNEmotion } from '@/contexts/AYNEmotionContext';

interface TranscriptMessageProps {
  content: string;
  sender: 'user' | 'ayn';
  timestamp: Date;
  emotion?: AYNEmotion;
  mode?: string;
  onReply?: (quotedContent: string) => void;
}

const emotionEmojis: Record<AYNEmotion, string> = {
  calm: '😌',
  happy: '😊',
  excited: '🔥',
  thinking: '🧠',
  frustrated: '😕',
  curious: '🤔',
};

export const TranscriptMessage = ({
  content,
  sender,
  timestamp,
  emotion = 'calm',
  mode,
  onReply,
}: TranscriptMessageProps) => {
  const isUser = sender === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReply = () => {
    if (onReply) {
      // Create quoted reply with truncated preview
      const preview = content.length > 50 ? content.slice(0, 50) + '...' : content;
      const quotedReply = `> ${preview}\n\n`;
      onReply(quotedReply);
    }
  };

  return (
    <div className={cn("group relative", isUser ? "text-right" : "text-left")}>
      {/* Header */}
      <div className={cn(
        "flex items-center gap-2 mb-1 text-xs text-muted-foreground",
        isUser ? "justify-end" : "justify-start"
      )}>
        {!isUser && (
          <>
            <div className="w-5 h-5 rounded-full bg-black dark:bg-white flex items-center justify-center">
              <Brain className="w-3 h-3 text-white dark:text-black" />
            </div>
            <span className="font-medium">AYN</span>
            {emotion && <span>{emotionEmojis[emotion]}</span>}
            {mode && (
              <span className="px-1.5 py-0.5 rounded bg-muted text-[10px]">
                {mode}
              </span>
            )}
          </>
        )}
        {isUser && (
          <>
            <span className="font-medium">You</span>
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-3 h-3" />
            </div>
          </>
        )}
      </div>

      {/* Message bubble with action buttons */}
      <div className="relative inline-block max-w-[90%]">
        {/* Action buttons - appear on hover */}
        <div className={cn(
          "absolute -top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10",
          isUser ? "left-0" : "right-0"
        )}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-6 w-6 p-0 bg-background border shadow-sm hover:bg-muted"
            title="Copy message"
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
          {onReply && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReply}
              className="h-6 w-6 p-0 bg-background border shadow-sm hover:bg-muted"
              title="Reply to message"
            >
              <Reply className="w-3 h-3" />
            </Button>
          )}
        </div>

        <div
          className={cn(
            "px-3 py-2 rounded-xl text-sm",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{content}</p>
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-[10px] text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {format(timestamp, 'h:mm:ss a')}
      </div>
    </div>
  );
};
