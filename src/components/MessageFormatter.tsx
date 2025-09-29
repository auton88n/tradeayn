import React from 'react';
import { cn } from '@/lib/utils';
import { sanitizeMessageContent } from '@/lib/domPurifyConfig';

interface MessageFormatterProps {
  content: string;
  className?: string;
}

export function MessageFormatter({ content, className }: MessageFormatterProps) {
  // Clean system tags first
  const cleanSystemTags = (text: string): string => {
    // Remove <lov-actions> blocks entirely (including content)
    text = text.replace(/<lov-actions>[\s\S]*?<\/lov-actions>/gi, '');
    
    // Extract content from <lov-plan> tags but remove the tags themselves
    text = text.replace(/<lov-plan>([\s\S]*?)<\/lov-plan>/gi, '$1');
    
    // Remove other system tags and their content (lov-message-prompt, lov-link, etc.)
    text = text.replace(/<lov-(?!plan)[\w-]*>[\s\S]*?<\/lov-[\w-]*>/gi, '');
    
    // Remove standalone system tags (self-closing or single tags)
    text = text.replace(/<lov-[\w-]*[^>]*\/?>/gi, '');
    
    return text.trim();
  };

  // Clean system tags and sanitize content to prevent XSS attacks
  const cleanedContent = cleanSystemTags(content);
  const sanitizedContent = sanitizeMessageContent(cleanedContent);
  
  const formatMessage = (text: string) => {
    // Split by code blocks first
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }
      
      // Add code block
      parts.push({
        type: 'code',
        content: match[1].trim()
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    return parts.map((part, index) => {
      if (part.type === 'code') {
        return (
          <div key={index} className="my-4 first:mt-0 last:mb-0">
            <pre className="bg-muted border border-border rounded-lg p-4 overflow-x-auto">
              <code className="text-sm font-mono text-current whitespace-pre">
                {part.content}
              </code>
            </pre>
          </div>
        );
      } else {
        return (
          <div key={index}>
            {formatTextContent(part.content)}
          </div>
        );
      }
    });
  };

  const formatTextContent = (text: string) => {
    const lines = text.split('\n');
    const elements = [];
    let currentList = null;
    let currentListType = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        // Empty line - close current list and add spacing
        if (currentList) {
          elements.push(currentList);
          currentList = null;
          currentListType = null;
        }
        elements.push(<div key={`space-${i}`} className="h-3" />);
        continue;
      }

      // Check for headers (# ## ### or ==== style)
      if (line.startsWith('#')) {
        if (currentList) {
          elements.push(currentList);
          currentList = null;
          currentListType = null;
        }
        
        const headerLevel = line.match(/^#+/)?.[0].length || 1;
        const headerText = line.replace(/^#+\s*/, '');
        const HeaderTag = `h${Math.min(headerLevel, 6)}` as keyof JSX.IntrinsicElements;
        
        elements.push(
          <HeaderTag 
            key={`header-${i}`} 
            className={cn(
              "font-semibold mt-4 mb-2 first:mt-0",
              headerLevel === 1 && "text-xl font-bold",
              headerLevel === 2 && "text-lg font-semibold", 
              headerLevel === 3 && "text-base font-medium",
              headerLevel >= 4 && "text-sm font-medium"
            )}
          >
            {formatInlineText(headerText)}
          </HeaderTag>
        );
      }
      // Check for alternative header styles (=== or ---)
      else if (line.match(/^={3,}|^-{3,}$/)) {
        elements.push(<hr key={`divider-${i}`} className="my-4 border-border" />);
      }
      // Check for various bullet styles (-, *, +, •, ▪, ►, →, ✓, ✗, 🔸, 🔹, etc.)
      else if (line.match(/^[-*+•▪►→✓✗🔸🔹⭐🎯💡⚡🚀✨💎🔥📊📈📉🎨🛠️⚙️💰📝🎪🌟🎈]\s/)) {
        const bullet = line.match(/^[-*+•▪►→✓✗🔸🔹⭐🎯💡⚡🚀✨💎🔥📊📈📉🎨🛠️⚙️💰📝🎪🌟🎈]/)?.[0] || '•';
        const listContent = formatInlineText(line.replace(/^[-*+•▪►→✓✗🔸🔹⭐🎯💡⚡🚀✨💎🔥📊📈📉🎨🛠️⚙️💰📝🎪🌟🎈]\s/, ''));
        
        if (currentListType !== 'ul') {
          if (currentList) elements.push(currentList);
          currentList = (
            <ul key={`ul-${i}`} className="space-y-1 my-2 first:mt-0 last:mb-0 pl-2">
              <li className="leading-relaxed flex items-start gap-2">
                <span className="text-primary flex-shrink-0 mt-0.5 text-base leading-none">{bullet}</span>
                <span className="flex-1">{listContent}</span>
              </li>
            </ul>
          );
          currentListType = 'ul';
        } else {
          // Add to existing list
          const existingList = currentList as React.ReactElement;
          currentList = React.cloneElement(existingList, {
            children: [
              ...React.Children.toArray(existingList.props.children),
              <li key={`li-${i}`} className="leading-relaxed flex items-start gap-2">
                <span className="text-primary flex-shrink-0 mt-0.5 text-base leading-none">{bullet}</span>
                <span className="flex-1">{listContent}</span>
              </li>
            ]
          });
        }
      }
      // Check for numbered lists (1., 2., Step 1:, Phase 1, etc.)
      else if (line.match(/^(\d+[\.\)\:]|Step\s+\d+[\:\.]|Phase\s+\d+[\:\.]|#\d+|\d+[\)|\.])\s/i)) {
        const numberMatch = line.match(/^(\d+[\.\)\:]|Step\s+\d+[\:\.]|Phase\s+\d+[\:\.]|#\d+|\d+[\)|\.])\s/i);
        const numberPart = numberMatch?.[1] || '';
        const listContent = formatInlineText(line.replace(/^(\d+[\.\)\:]|Step\s+\d+[\:\.]|Phase\s+\d+[\:\.]|#\d+|\d+[\)|\.])\s/i, ''));
        
        if (currentListType !== 'ol') {
          if (currentList) elements.push(currentList);
          currentList = (
            <ol key={`ol-${i}`} className="space-y-1 my-2 first:mt-0 last:mb-0 pl-2">
              <li className="leading-relaxed flex items-start gap-2">
                <span className="text-primary font-medium flex-shrink-0 mt-0.5 min-w-[2rem] text-sm">{numberPart}</span>
                <span className="flex-1">{listContent}</span>
              </li>
            </ol>
          );
          currentListType = 'ol';
        } else {
          // Add to existing list
          const existingList = currentList as React.ReactElement;
          currentList = React.cloneElement(existingList, {
            children: [
              ...React.Children.toArray(existingList.props.children),
              <li key={`li-${i}`} className="leading-relaxed flex items-start gap-2">
                <span className="text-primary font-medium flex-shrink-0 mt-0.5 min-w-[2rem] text-sm">{numberPart}</span>
                <span className="flex-1">{listContent}</span>
              </li>
            ]
          });
        }
      }
      // Check for special formatted lines (quotes, notes, warnings, etc.)
      else if (line.match(/^(>|Note:|Warning:|Important:|Tip:|💡|⚠️|❗|🔔)/i)) {
        if (currentList) {
          elements.push(currentList);
          currentList = null;
          currentListType = null;
        }
        
        const isQuote = line.startsWith('>');
        const isNote = line.match(/^(Note:|💡)/i);
        const isWarning = line.match(/^(Warning:|⚠️|❗)/i);
        const isImportant = line.match(/^(Important:|🔔)/i);
        
        const content = line.replace(/^(>|Note:|Warning:|Important:|Tip:|💡|⚠️|❗|🔔)\s?/i, '');
        
        let className = "p-3 rounded-lg border-l-4 my-2 first:mt-0 last:mb-0";
        let icon = "";
        
        if (isQuote) {
          className += " bg-muted/50 border-l-muted-foreground italic";
        } else if (isNote) {
          className += " bg-blue-50 dark:bg-blue-950/20 border-l-blue-500 text-blue-900 dark:text-blue-100";
          icon = "💡 ";
        } else if (isWarning) {
          className += " bg-yellow-50 dark:bg-yellow-950/20 border-l-yellow-500 text-yellow-900 dark:text-yellow-100";
          icon = "⚠️ ";
        } else if (isImportant) {
          className += " bg-red-50 dark:bg-red-950/20 border-l-red-500 text-red-900 dark:text-red-100";
          icon = "❗ ";
        } else {
          className += " bg-primary/5 border-l-primary";
          icon = "🔔 ";
        }
        
        elements.push(
          <div key={`special-${i}`} className={className}>
            {icon && <span className="mr-2">{icon}</span>}
            {formatInlineText(content)}
          </div>
        );
      }
      // Regular paragraph - preserve emojis and special characters
      else {
        if (currentList) {
          elements.push(currentList);
          currentList = null;
          currentListType = null;
        }
        
        elements.push(
          <p key={`p-${i}`} className="leading-relaxed mb-2 last:mb-0 text-current break-words">
            {formatInlineText(line)}
          </p>
        );
      }
    }

    // Don't forget to add the last list if it exists
    if (currentList) {
      elements.push(currentList);
    }

    return elements;
  };

  const formatInlineText = (text: string) => {
    // Handle inline code first
    const inlineCodeRegex = /`([^`]+)`/g;
    let parts = [];
    let lastIndex = 0;
    let match;

    while ((match = inlineCodeRegex.exec(text)) !== null) {
      // Add text before inline code
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }
      
      // Add inline code
      parts.push({
        type: 'inline-code',
        content: match[1]
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    // If no inline code found, treat as single text part
    if (parts.length === 0) {
      parts = [{ type: 'text', content: text }];
    }

    return parts.map((part, index) => {
      if (part.type === 'inline-code') {
        return (
          <code 
            key={index} 
            className="bg-muted/80 text-foreground px-1.5 py-0.5 rounded text-sm font-mono border border-border"
          >
            {part.content}
          </code>
        );
      } else {
        // Handle bold and italic in text
        return formatBoldItalic(part.content, index);
      }
    });
  };

  const formatBoldItalic = (text: string, baseKey: number) => {
    // Handle **bold**, *italic*, __underline__, ~~strikethrough~~, ##header##, and other formatting
    const formatRegex = /(\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|\*([^*]+)\*|__([^_]+)__|~~([^~]+)~~|==([^=]+)==|\|\|([^|]+)\|\||##([^#]+)##)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = formatRegex.exec(text)) !== null) {
      // Add text before formatting
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      
      // Determine type and content
      if (match[2]) {
        // Bold and italic (***text***)
        parts.push(<strong key={`bi-${baseKey}-${match.index}`} className="font-bold italic text-primary">{match[2]}</strong>);
      } else if (match[3]) {
        // Bold (**text**)
        parts.push(<strong key={`b-${baseKey}-${match.index}`} className="font-bold text-primary">{match[3]}</strong>);
      } else if (match[4]) {
        // Italic (*text*)
        parts.push(<em key={`i-${baseKey}-${match.index}`} className="italic text-muted-foreground">{match[4]}</em>);
      } else if (match[5]) {
        // Underline (__text__)
        parts.push(<u key={`u-${baseKey}-${match.index}`} className="underline">{match[5]}</u>);
      } else if (match[6]) {
        // Strikethrough (~~text~~)
        parts.push(<del key={`s-${baseKey}-${match.index}`} className="line-through opacity-75">{match[6]}</del>);
      } else if (match[7]) {
        // Highlight (==text==)
        parts.push(<mark key={`h-${baseKey}-${match.index}`} className="bg-primary/20 text-primary px-1 rounded">{match[7]}</mark>);
      } else if (match[8]) {
        // Spoiler (||text||)
        parts.push(
          <span key={`sp-${baseKey}-${match.index}`} className="bg-muted text-muted cursor-pointer hover:bg-transparent hover:text-foreground transition-all duration-200 px-1 rounded" title="Click to reveal">
            {match[8]}
          </span>
        );
      } else if (match[9]) {
        // Header (##text##) - render as actual h2 element
        parts.push(<h2 key={`h-${baseKey}-${match.index}`} className="text-lg font-bold text-primary block my-2 border-b border-border pb-1">{match[9]}</h2>);
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 1 ? parts : text;
  };

  return (
    <div className={cn("space-y-2 leading-relaxed", className)}>
      {formatMessage(sanitizedContent)}
    </div>
  );
}