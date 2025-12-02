import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Brain, User } from 'lucide-react';
import type { AYNEmotion } from '@/contexts/AYNEmotionContext';

interface TranscriptMessageProps {
  content: string;
  sender: 'user' | 'ayn';
  timestamp: Date;
  emotion?: AYNEmotion;
  mode?: string;
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
}: TranscriptMessageProps) => {
  const isUser = sender === 'user';

  return (
    <div className={cn("group", isUser ? "text-right" : "text-left")}>
      {/* Header */}
      <div className={cn(
        "flex items-center gap-2 mb-1 text-xs text-muted-foreground",
        isUser ? "justify-end" : "justify-start"
      )}>
        {!isUser && (
          <>
            <div className="w-5 h-5 rounded-full bg-foreground/10 flex items-center justify-center">
              <Brain className="w-3 h-3" />
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

      {/* Message bubble */}
      <div
        className={cn(
          "inline-block max-w-[90%] px-3 py-2 rounded-xl text-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{content}</p>
      </div>

      {/* Timestamp */}
      <div className="text-[10px] text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {format(timestamp, 'h:mm:ss a')}
      </div>
    </div>
  );
};
