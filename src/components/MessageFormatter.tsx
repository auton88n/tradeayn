import React from 'react';
import { Copy, Check, RefreshCw, Share2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface MessageFormatterProps {
  content: string;
  onRegenerate?: () => void;
  showActions?: boolean;
}

export const MessageFormatter: React.FC<MessageFormatterProps> = ({ 
  content, 
  onRegenerate, 
  showActions = true 
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to clipboard",
        description: "Message copied successfully"
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy message to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          text: content
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      copyToClipboard();
    }
  };

  // Enhanced text formatting that mimics ChatGPT/Claude
  const formatContent = (text: string) => {
    // Split by double newlines to get paragraphs
    const paragraphs = text.split(/\n\n+/);
    
    return paragraphs.map((paragraph, index) => {
      const trimmed = paragraph.trim();
      
      // Handle code blocks (```language\ncode\n```)
      if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
        const lines = trimmed.split('\n');
        const language = lines[0].substring(3) || 'text';
        const code = lines.slice(1, -1).join('\n');
        
        return (
          <div key={index} className="my-4 rounded-lg bg-muted/50 border">
            <div className="px-3 py-1 border-b bg-muted/30 text-xs text-muted-foreground">
              {language}
            </div>
            <pre className="p-3 overflow-x-auto">
              <code className="text-sm font-mono">{code}</code>
            </pre>
          </div>
        );
      }
      
      // Handle inline code (`code`)
      let formattedText = trimmed.replace(/`([^`]+)`/g, '<code class="bg-muted/60 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
      
      // Handle bold text (**text** or __text__)
      formattedText = formattedText.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');
      formattedText = formattedText.replace(/__([^_]+)__/g, '<strong class="font-semibold">$1</strong>');
      
      // Handle italic text (*text* or _text_)
      formattedText = formattedText.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
      formattedText = formattedText.replace(/_([^_]+)_/g, '<em class="italic">$1</em>');
      
      // Handle numbered lists (1. item)
      if (/^\d+\.\s/.test(trimmed)) {
        const lines = trimmed.split('\n');
        return (
          <ol key={index} className="list-decimal list-inside space-y-1 my-3 pl-2">
            {lines.map((line, lineIndex) => (
              <li key={lineIndex} className="text-sm leading-relaxed" 
                  dangerouslySetInnerHTML={{ __html: line.replace(/^\d+\.\s/, '') }} />
            ))}
          </ol>
        );
      }
      
      // Handle bullet points (- item or * item)
      if (/^[-*]\s/.test(trimmed)) {
        const lines = trimmed.split('\n');
        return (
          <ul key={index} className="list-disc list-inside space-y-1 my-3 pl-2">
            {lines.map((line, lineIndex) => (
              <li key={lineIndex} className="text-sm leading-relaxed" 
                  dangerouslySetInnerHTML={{ __html: line.replace(/^[-*]\s/, '') }} />
            ))}
          </ul>
        );
      }
      
      // Handle headings (# Heading)
      if (trimmed.startsWith('# ')) {
        return (
          <h1 key={index} className="text-xl font-bold mb-3 mt-4" 
              dangerouslySetInnerHTML={{ __html: formattedText.substring(2) }} />
        );
      }
      
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={index} className="text-lg font-semibold mb-2 mt-3" 
              dangerouslySetInnerHTML={{ __html: formattedText.substring(3) }} />
        );
      }
      
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={index} className="text-base font-semibold mb-2 mt-3" 
              dangerouslySetInnerHTML={{ __html: formattedText.substring(4) }} />
        );
      }
      
      // Handle quotes (> text)
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote key={index} className="border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground my-3"
                      dangerouslySetInnerHTML={{ __html: formattedText.substring(2) }} />
        );
      }
      
      // Handle horizontal rules (--- or ***)
      if (trimmed === '---' || trimmed === '***') {
        return <hr key={index} className="my-4 border-muted" />;
      }
      
      // Regular paragraphs
      if (trimmed) {
        return (
          <p key={index} className="mb-3 text-sm leading-relaxed" 
             dangerouslySetInnerHTML={{ __html: formattedText }} />
        );
      }
      
      return null;
    }).filter(Boolean);
  };

  return (
    <div className="space-y-2">
      <div className="prose prose-sm max-w-none">
        {formatContent(content)}
      </div>
      
      {showActions && (
        <div className="flex items-center gap-1 pt-2 border-t border-muted/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-7 px-2 text-xs hover:bg-muted/50"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
          
          {onRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              className="h-7 px-2 text-xs hover:bg-muted/50"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="h-7 px-2 text-xs hover:bg-muted/50"
          >
            <Share2 className="h-3 w-3" />
          </Button>
          
          <div className="flex-1" />
          
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs hover:bg-muted/50"
          >
            <ThumbsUp className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs hover:bg-muted/50"
          >
            <ThumbsDown className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};