import { format } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Copy, Check, User, Brain, Clock, CornerDownLeft, Download, ThumbsUp, ThumbsDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { MessageFormatter } from "@/components/shared/MessageFormatter";
import { StreamingMarkdown } from "@/components/eye/StreamingMarkdown";
import { AttachmentPreview } from "@/components/transcript/AttachmentPreview";

interface TranscriptMessageProps {
  content: string;
  sender: "user" | "ayn";
  timestamp: Date;
  compact?: boolean;
  status?: "sending" | "sent" | "error" | "queued";
  shouldAnimate?: boolean;
  isStreaming?: boolean;
  attachment?: { url: string; name: string; type: string };
  onReply?: (content: string) => void;
}

// Helper to strip markdown for clipboard
const markdownToPlainText = (markdown: string): string => {
  let text = markdown;
  text = text.replace(/^#{1,6}\s+/gm, "");
  text = text.replace(/\*\*(.+?)\*\*/g, "$1");
  text = text.replace(/__(.+?)__/g, "$1");
  text = text.replace(/\*(.+?)\*/g, "$1");
  text = text.replace(/_(.+?)_/g, "$1");
  text = text.replace(/^\s*[-*+]\s+/gm, "• ");
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  text = text.replace(/`(.+?)`/g, "$1");
  return text.trim();
};

export const TranscriptMessage = ({
  content,
  sender,
  timestamp,
  compact = false,
  status,
  shouldAnimate = true,
  isStreaming = false,
  attachment,
  onReply,
}: TranscriptMessageProps) => {
  const isUser = sender === "user";
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [showDownload, setShowDownload] = useState(false);

  const handleCopy = async () => {
    const plainText = markdownToPlainText(content);
    await navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = async (type: "up" | "down") => {
    const newFeedback = feedback === type ? null : type;
    setFeedback(newFeedback);
    if (newFeedback) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("message_ratings").insert({
          user_id: user?.id || null,
          message_preview: content.slice(0, 200),
          rating: type === "up" ? "positive" : "negative",
        });
      } catch (err) {
        console.error("Failed to save feedback:", err);
      }
    }
  };

  const handleDownload = (format: "md" | "txt") => {
    const text = format === "txt" ? markdownToPlainText(content) : content;
    const ext = format === "txt" ? "txt" : "md";
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ayn-response.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    setShowDownload(false);
  };

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "group flex transition-colors",
        compact ? "py-2 px-3 gap-3" : "p-3 gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "rounded-full flex items-center justify-center shrink-0",
          compact ? "w-7 h-7" : "w-8 h-8",
          isUser ? "bg-primary text-primary-foreground" : "bg-foreground text-background",
        )}
      >
        {isUser ? (
          <User className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
        ) : (
          <Brain className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
        )}
      </div>

      {/* Content */}
      <div
        className={cn("min-w-0", isUser && compact ? "" : "flex-1", compact ? "max-w-[95%]" : "max-w-[80%]", isUser ? "text-right" : "text-left")}
      >
        <div
          className={cn(
            "flex items-center gap-1.5",
            compact ? "mb-1" : "mb-0.5",
            isUser ? "justify-end" : "justify-start",
          )}
        >
          <span className={cn("font-medium text-foreground text-sm")}>
            {isUser ? "You" : "AYN"}
          </span>
          <span className={cn("text-muted-foreground text-xs")}>
            {format(timestamp, "h:mm a")}
          </span>
        </div>

        <div
          className={cn(
            "inline-block text-start relative px-4 py-2.5 w-fit max-w-full",
            compact ? "rounded-[16px]" : "rounded-[20px]",
            isUser
              ? "bg-muted/30 text-foreground rounded-br-sm"
              : "bg-muted/50 text-foreground rounded-bl-sm shadow-sm",
          )}
        >
          {/* MESSAGE CONTENT */}
          <div
            className={cn(
              "leading-relaxed break-words text-sm",
              compact
                ? "[&_p]:mb-1 [&_p:last-child]:mb-0 [&_ul]:my-1.5 [&_ol]:my-1.5"
                : "max-h-[40vh] overflow-y-auto overscroll-contain",
            )}
          >
            {isStreaming ? <StreamingMarkdown content={content} speed={15} /> : <MessageFormatter content={content} />}
          </div>

          {/* File attachment preview */}
          {attachment?.url && (
            <AttachmentPreview url={attachment.url} name={attachment.name} type={attachment.type} />
          )}
        </div>

        {/* Queued indicator */}
        {status === "queued" && isUser && (
          <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span className="text-[10px]">Queued</span>
          </div>
        )}

        {/* Action buttons */}
        <div
          className={cn(
            "flex items-center gap-0.5 mt-1",
            "opacity-0 group-hover:opacity-100 transition-all duration-150",
            "backdrop-blur-sm bg-background/80 rounded-lg px-1 py-0.5 w-fit",
            isUser ? "ml-auto" : "mr-auto",
          )}
        >
          <button onClick={handleCopy} className="p-1 rounded-md hover:bg-muted/50 transition-all" title="Copy">
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
          {!isUser && (
            <>
              <button
                onClick={() => handleFeedback("up")}
                className={cn("p-1 rounded-md transition-all", feedback === "up" ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
                title="Good response"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleFeedback("down")}
                className={cn("p-1 rounded-md transition-all", feedback === "down" ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
                title="Bad response"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowDownload(!showDownload)}
                  className="p-1 rounded-md hover:bg-muted/50 transition-all text-muted-foreground hover:text-foreground"
                  title="Download"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                {showDownload && (
                  <div className="absolute bottom-full left-0 mb-1 bg-popover border border-border rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
                    <button onClick={() => handleDownload("md")} className="w-full px-3 py-1.5 text-xs text-left hover:bg-muted transition-colors">
                      Markdown (.md)
                    </button>
                    <button onClick={() => handleDownload("txt")} className="w-full px-3 py-1.5 text-xs text-left hover:bg-muted transition-colors">
                      Plain Text (.txt)
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          {onReply && (
            <button onClick={() => onReply(content)} className="p-1 rounded-md hover:bg-muted/50 transition-all" title="Reply">
              <CornerDownLeft className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
