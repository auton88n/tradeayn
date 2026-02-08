import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Copy, Check, User, Brain, CornerDownLeft, Clock } from 'lucide-react';
import { useState } from 'react';
import { MessageFormatter } from '@/components/shared/MessageFormatter';
import { StreamingMarkdown } from '@/components/eye/StreamingMarkdown';

interface TranscriptMessageProps {
  content: string;
  sender: 'user' | 'ayn';
  timestamp: Date;
  compact?: boolean;
  status?: 'sending' | 'sent' | 'error' | 'queued';
  onReply?: (content: string) => void;
  shouldAnimate?: boolean;
  isStreaming?: boolean;
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
  compact = false,
  status,
  onReply,
  shouldAnimate = true,
  isStreaming = false,
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
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        "group flex transition-colors",
        compact ? "py-0.5 px-1 gap-1.5" : "p-3 gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
      {/* Avatar */}
      <div className={cn(
        "rounded-full flex items-center justify-center shrink-0",
        compact ? "w-5 h-5" : "w-8 h-8",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-foreground text-background"
      )}>
        {isUser ? (
          <User className={compact ? "w-3 h-3" : "w-4 h-4"} />
        ) : (
          <Brain className={compact ? "w-3 h-3" : "w-4 h-4"} />
        )}
      </div>

      {/* Content */}
      <div className={cn(
        "min-w-0 flex-1",
        compact ? "max-w-[95%]" : "max-w-[80%]",
        !compact && (isUser ? "text-right" : "text-left")
      )}>
        <div className={cn(
          "flex items-center gap-1.5 mb-0.5",
          isUser ? "justify-end" : "justify-start"
        )}>
          <span className={cn(
            "font-medium text-foreground",
            compact ? "text-[11px]" : "text-sm"
          )}>
            {isUser ? 'You' : 'AYN'}
          </span>
          <span className={cn(
            "text-muted-foreground",
            compact ? "text-[10px]" : "text-xs"
          )}>
            {format(timestamp, 'h:mm a')}
          </span>
        </div>
        
        <div className={cn(
          compact ? "block rounded-[16px] text-start relative" : "inline-block rounded-[20px] text-start relative",
          compact ? "px-2.5 py-1" : "px-4 py-2.5",
          isUser 
            ? "bg-muted/70 text-foreground rounded-br-sm" 
            : "bg-muted/50 text-foreground rounded-bl-sm shadow-sm"
        )}>
          <div className={cn(
            "leading-relaxed break-words [&_p]:mb-1 [&_p:last-child]:mb-0 [&_ul]:my-1 [&_ol]:my-1 [&_li]:pb-0 [&_li]:pl-3 [&_li]:before:text-sm",
            "[&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:bg-muted [&_pre]:rounded-lg [&_pre]:p-3",
            "[&_code]:text-sm [&_table]:text-sm [&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-3",
            compact ? "text-xs" : "text-sm",
            "max-h-[40vh] overflow-y-auto overscroll-contain"
          )}>
            {isStreaming ? (
              <StreamingMarkdown content={content} speed={15} />
            ) : (
              <MessageFormatter content={content} />
            )}
          </div>
        </div>

        {/* Queued indicator */}
        {status === 'queued' && isUser && (
          <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span className="text-[10px]">Queued</span>
          </div>
        )}

        {/* Action buttons - only in non-compact mode */}
        {!compact && (
          <div className={cn(
            "flex items-center gap-0.5 mt-1",
            "opacity-0 group-hover:opacity-100 transition-all",
            isUser ? "justify-end" : "justify-start"
          )}>
            <button
              onClick={handleCopy}
              className="p-1 rounded-md hover:bg-muted/50 transition-all"
              title="Copy"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
            {onReply && (
              <button
                onClick={() => onReply(content)}
                className="p-1 rounded-md hover:bg-muted/50 transition-all"
                title="Reply"
              >
                <CornerDownLeft className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
