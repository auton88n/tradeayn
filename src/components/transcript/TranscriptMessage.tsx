import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Brain, User, Copy, Check, Reply } from 'lucide-react';
import { MessageFormatter } from '@/components/MessageFormatter';
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
      const preview = content.length > 50 ? content.slice(0, 50) + '...' : content;
      onReply(`> ${preview}\n\n`);
    }
  };

  return (
    <div className="group w-full">
      {/* Header Row */}
      <div className={cn(
        "flex items-center gap-2 mb-1.5 text-xs",
        isUser ? "justify-end" : "justify-start"
      )}>
        {!isUser && (
          <>
            <div className="w-6 h-6 rounded-lg bg-foreground flex items-center justify-center">
              <Brain className="w-3 h-3 text-background" />
            </div>
            <span className="font-semibold">AYN</span>
            {emotion && <span className="text-sm">{emotionEmojis[emotion]}</span>}
            {mode && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary">
                {mode}
              </span>
            )}
          </>
        )}
        {isUser && (
          <>
            <span className="font-semibold">You</span>
            <div className="w-6 h-6 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <User className="w-3 h-3 text-primary" />
            </div>
          </>
        )}
      </div>

      {/* Message Bubble - SIMPLE FLAT STRUCTURE */}
      <div
        className={cn(
          "px-3 py-2.5 rounded-2xl text-sm",
          // CRITICAL: Force text wrapping at every level
          "whitespace-normal",
          "break-words",
          "[word-break:break-word]",
          "[overflow-wrap:anywhere]",
          // Alignment
          isUser ? "ml-auto" : "mr-auto",
          // Width - fixed percentage for reliable mobile behavior
          "w-[85%]",
          // User styling
          isUser && [
            "bg-primary text-primary-foreground",
            "rounded-br-md",
          ],
          // AYN styling
          !isUser && [
            "bg-muted/60 dark:bg-muted/40",
            "border border-border/50",
            "rounded-bl-md",
          ]
        )}
      >
        {/* Content - direct, no nested wrappers */}
        <MessageFormatter 
          content={content}
          className="text-sm whitespace-normal break-words [word-break:break-word] [overflow-wrap:anywhere] [&_*]:whitespace-normal [&_*]:break-words"
        />
      </div>

      {/* Footer: Timestamp + Actions */}
      <div className={cn(
        "flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground/60",
        isUser ? "justify-end" : "justify-start"
      )}>
        <span>{format(timestamp, 'h:mm a')}</span>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-muted/50"
            title="Copy"
          >
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
          </button>
          {onReply && (
            <button
              onClick={handleReply}
              className="p-1 rounded hover:bg-muted/50"
              title="Reply"
            >
              <Reply className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
