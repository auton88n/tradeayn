import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Copy, Check, User, Brain } from 'lucide-react';
import { useState } from 'react';
import { MessageFormatter } from '@/components/shared/MessageFormatter';

interface TranscriptMessageProps {
  content: string;
  sender: 'user' | 'ayn';
  timestamp: Date;
}

// Helper to strip markdown for clipboard
const markdownToPlainText = (markdown: string): string => {
  let text = markdown;
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/\*\*(.+?)\*\*/g, '$1');
  text = text.replace(/__(.+?)__/g, '$1');
  text = text.replace(/\*(.+?)\*/g, '$1');
  text = text.replace(/_(.+?)_/g, '$1');
  text = text.replace(/^\s*[-*+]\s+/gm, '• ');
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  text = text.replace(/`(.+?)`/g, '$1');
  return text.trim();
};

export const TranscriptMessage = ({
  content,
  sender,
  timestamp,
}: TranscriptMessageProps) => {
  const isUser = sender === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const plainText = markdownToPlainText(content);
    await navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn(
      "group flex gap-3 p-3 transition-colors",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-foreground text-background"
      )}>
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Brain className="w-4 h-4" />
        )}
      </div>

      {/* Content */}
      <div className={cn(
        "flex-1 min-w-0 max-w-[80%]",
        isUser ? "text-right" : "text-left"
      )}>
        <div className={cn(
          "flex items-center gap-2 mb-1",
          isUser ? "justify-end" : "justify-start"
        )}>
          <span className="font-medium text-sm text-foreground">
            {isUser ? 'You' : 'AYN'}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(timestamp, 'h:mm a')}
          </span>
        </div>
        
        <div className={cn(
          "inline-block rounded-2xl px-4 py-2",
          isUser 
            ? "bg-primary text-primary-foreground rounded-br-sm" 
            : "bg-muted text-foreground rounded-bl-sm"
        )}>
          <div className="text-sm leading-relaxed break-words [&_p]:mb-1 [&_p:last-child]:mb-0 [&_ul]:my-1 [&_ol]:my-1 [&_li]:pb-0 [&_li]:pl-3 [&_li]:before:text-sm">
            <MessageFormatter content={content} />
          </div>
        </div>

        {/* Copy button - underneath the bubble */}
        <button
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1 mt-1 p-1 rounded-md",
            "opacity-0 group-hover:opacity-100",
            "hover:bg-muted/50 transition-all",
            isUser ? "ml-auto" : "mr-auto"
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
    </div>
  );
};
