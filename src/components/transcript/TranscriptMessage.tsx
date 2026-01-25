import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Brain, User, Copy, Check, Reply } from 'lucide-react';
import { MessageFormatter } from '@/components/shared/MessageFormatter';
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
  sad: '😢',
  mad: '😠',
  bored: '😐',
  comfort: '🤗',
  supportive: '💕',
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
    <div className="group w-full px-2">
      {/* Header Row */}
      <div className={cn(
        "flex items-center gap-2 mb-2",
        isUser ? "justify-end" : "justify-start"
      )}>
        {!isUser && (
          <>
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shadow-sm">
              <Brain className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-medium text-sm text-foreground/90">AYN</span>
            {emotion && <span className="text-sm">{emotionEmojis[emotion]}</span>}
            {mode && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                {mode}
              </span>
            )}
          </>
        )}
        {isUser && (
          <>
            <span className="font-medium text-sm text-foreground/90">You</span>
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
          </>
        )}
      </div>

      {/* Message Bubble - Premium Styling */}
      <div
        className={cn(
          "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
          "transition-all duration-200 ease-out",
          "hover:-translate-y-0.5",
          // Text wrapping
          "whitespace-normal break-words [word-break:break-word] [overflow-wrap:anywhere]",
          // Alignment
          isUser ? "ml-auto" : "mr-auto",
          // Width - fit content but cap at 85%
          "w-fit max-w-[85%]",
          // User styling - Premium dark gradient
          isUser && [
            "bg-gradient-to-br from-gray-900 to-gray-800",
            "dark:from-gray-800 dark:to-gray-900",
            "text-white",
            "shadow-lg shadow-gray-900/20 dark:shadow-black/30",
            "rounded-br-md",
          ],
          // AYN styling - Glassmorphism
          !isUser && [
            "bg-white/90 dark:bg-gray-800/70",
            "backdrop-blur-sm",
            "border border-gray-200/80 dark:border-gray-700/50",
            "shadow-md shadow-gray-200/50 dark:shadow-black/20",
            "text-foreground",
            "rounded-bl-md",
          ]
        )}
      >
        <MessageFormatter 
          content={content}
          className="text-sm leading-relaxed whitespace-normal break-words [word-break:break-word] [overflow-wrap:anywhere] [&_*]:whitespace-normal [&_*]:break-words"
        />
      </div>

      {/* Footer: Timestamp + Actions */}
      <div className={cn(
        "flex items-center gap-3 mt-2 text-[11px] text-muted-foreground/50",
        isUser ? "justify-end pr-1" : "justify-start pl-1"
      )}>
        <span className="font-light">{format(timestamp, 'h:mm a')}</span>
        
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors"
            title="Copy"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {onReply && (
            <button
              onClick={handleReply}
              className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors"
              title="Reply"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
