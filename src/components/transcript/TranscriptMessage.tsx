import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Brain, User, Copy, Check, Reply } from 'lucide-react';
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
      const quotedReply = `> ${preview}\n\n`;
      onReply(quotedReply);
    }
  };

  return (
    <div className={cn("group", isUser ? "text-right" : "text-left")}>
      {/* Header */}
      <div className={cn(
        "flex items-center gap-2.5 mb-1.5 text-xs text-muted-foreground",
        isUser ? "justify-end" : "justify-start"
      )}>
        {!isUser && (
          <>
            <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center shadow-sm">
              <Brain className="w-3.5 h-3.5 text-background" />
            </div>
            <span className="font-semibold text-foreground/80">AYN</span>
            {emotion && (
              <span className="text-sm">{emotionEmojis[emotion]}</span>
            )}
            {mode && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-foreground/5 border border-foreground/10 text-foreground/70">
                {mode}
              </span>
            )}
          </>
        )}
        {isUser && (
          <>
            <span className="font-semibold text-foreground/80">You</span>
            <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
          </>
        )}
      </div>

      {/* Premium Message Bubble */}
      <div className={cn("block max-w-[85%] min-w-0 overflow-hidden", isUser ? "ml-auto" : "mr-auto")}>
        <div
          className={cn(
            "px-4 py-2.5 text-sm leading-relaxed",
            "shadow-sm transition-all duration-300 hover:shadow-md",
            isUser
              ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-2xl rounded-br-md"
              : "bg-muted/60 backdrop-blur-sm text-foreground rounded-2xl rounded-bl-md border border-border/30"
          )}
        >
          <p className="whitespace-pre-wrap break-words overflow-hidden">{content}</p>
        </div>
      </div>

      {/* Footer: Timestamp + Actions */}
      <div className={cn(
        "flex items-center gap-2 mt-1.5",
        isUser ? "justify-end" : "justify-start"
      )}>
        <span className="text-[10px] text-muted-foreground/50">
          {format(timestamp, 'h:mm a')}
        </span>
        
        {/* Action buttons - subtle, inline */}
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleCopy}
            className="p-1 rounded-md hover:bg-muted/50 text-muted-foreground/50 hover:text-foreground transition-colors"
            title="Copy message"
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
          {onReply && (
            <button
              onClick={handleReply}
              className="p-1 rounded-md hover:bg-muted/50 text-muted-foreground/50 hover:text-foreground transition-colors"
              title="Reply to message"
            >
              <Reply className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
