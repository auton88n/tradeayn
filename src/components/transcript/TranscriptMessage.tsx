import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface TranscriptMessageProps {
  content: string;
  sender: 'user' | 'ayn';
  timestamp: Date;
}

export const TranscriptMessage = ({
  content,
  sender,
  timestamp,
}: TranscriptMessageProps) => {
  const isUser = sender === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn(
      "group flex gap-3 p-3 rounded-xl transition-colors",
      "hover:bg-muted/50"
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-medium",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-foreground text-background"
      )}>
        {isUser ? 'Y' : 'A'}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-foreground">
            {isUser ? 'You' : 'AYN'}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(timestamp, 'h:mm a')}
          </span>
        </div>
        
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </p>
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className={cn(
          "p-1.5 rounded-md shrink-0 self-start mt-1",
          "opacity-0 group-hover:opacity-100",
          "hover:bg-muted transition-all"
        )}
        title="Copy"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>
    </div>
  );
};
