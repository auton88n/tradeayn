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
      const quotedReply = `> ${preview}\n\n`;
      onReply(quotedReply);
    }
  };

  return (
    <div className={cn("group", isUser ? "text-right" : "text-left")}>
      {/* Header */}
      <div className={cn(
        "flex items-center gap-2.5 mb-2 text-xs",
        isUser ? "justify-end" : "justify-start"
      )}>
        {!isUser && (
          <>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center shadow-sm">
              <Brain className="w-3.5 h-3.5 text-background" />
            </div>
            <span className="font-semibold text-foreground">AYN</span>
            {emotion && (
              <span className="text-sm">{emotionEmojis[emotion]}</span>
            )}
            {mode && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 border border-primary/20 text-primary">
                {mode}
              </span>
            )}
          </>
        )}
        {isUser && (
          <>
            <span className="font-semibold text-foreground">You</span>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
          </>
        )}
      </div>

      {/* Premium Message Bubble - Matching ResponseCard */}
      <div className={cn("inline-block max-w-[90%] min-w-0", isUser ? "ml-auto" : "mr-auto")}>
        <div
          className={cn(
            "relative px-4 py-3 text-sm leading-relaxed",
            "max-w-full overflow-x-auto",
            "transition-all duration-300",
            isUser
              ? [
                  // User bubble - gradient primary
                  "bg-gradient-to-br from-primary to-primary/90",
                  "text-primary-foreground",
                  "rounded-2xl rounded-br-sm",
                  "shadow-[0_4px_16px_rgba(0,0,0,0.1)]",
                  "hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)]",
                ]
              : [
                  // AYN bubble - Premium glassmorphism matching ResponseCard
                  "bg-gradient-to-br from-white/95 to-white/80 dark:from-gray-900/95 dark:to-gray-800/80",
                  "backdrop-blur-xl",
                  "rounded-2xl rounded-bl-sm",
                  // Layered shadows for depth
                  "shadow-[0_4px_20px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.2)]",
                  "hover:shadow-[0_8px_28px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.25)]",
                  // Border
                  "border border-gray-200/50 dark:border-gray-700/40",
                  "hover:border-gray-300/60 dark:hover:border-gray-600/50",
                  // Hover lift
                  "hover:-translate-y-0.5",
                  "text-foreground",
                ]
          )}
        >
          {/* Accent Line at Top - AYN only */}
          {!isUser && (
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/25 to-transparent rounded-t-2xl" />
          )}
          
          <MessageFormatter 
            content={content} 
            className={cn(
              "text-sm prose-sm max-w-none",
              !isUser && "text-gray-700 dark:text-gray-200"
            )} 
          />
        </div>
      </div>

      {/* Footer: Timestamp + Actions */}
      <div className={cn(
        "flex items-center gap-2 mt-2",
        isUser ? "justify-end" : "justify-start"
      )}>
        <span className="text-[10px] text-muted-foreground/60 font-medium">
          {format(timestamp, 'h:mm a')}
        </span>
        
        {/* Action buttons - premium styling */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleCopy}
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200 active:scale-90",
              "hover:bg-gray-100/80 dark:hover:bg-gray-800/60",
              "text-muted-foreground/60 hover:text-foreground"
            )}
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
              className={cn(
                "p-1.5 rounded-lg transition-all duration-200 active:scale-90",
                "hover:bg-gray-100/80 dark:hover:bg-gray-800/60",
                "text-muted-foreground/60 hover:text-foreground"
              )}
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
