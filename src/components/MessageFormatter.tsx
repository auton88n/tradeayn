import React from 'react';
import { cn } from '@/lib/utils';

interface MessageFormatterProps {
  content: string;
  className?: string;
}

export function MessageFormatter({ content, className }: MessageFormatterProps) {
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
              <code className="text-sm font-mono text-foreground whitespace-pre">
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
        elements.push(<div key={`space-${i}`} className="h-4" />);
        continue;
      }

      // Check for headers
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
              "font-bold text-foreground mt-6 mb-3 first:mt-0",
              headerLevel === 1 && "text-xl",
              headerLevel === 2 && "text-lg",
              headerLevel === 3 && "text-base",
              headerLevel >= 4 && "text-sm"
            )}
          >
            {formatInlineText(headerText)}
          </HeaderTag>
        );
      }
      // Check for unordered list
      else if (line.match(/^[-*+]\s/)) {
        const listContent = formatInlineText(line.replace(/^[-*+]\s/, ''));
        
        if (currentListType !== 'ul') {
          if (currentList) elements.push(currentList);
          currentList = (
            <ul key={`ul-${i}`} className="list-disc list-inside space-y-1 my-3 first:mt-0 last:mb-0 pl-4">
              <li className="text-foreground leading-relaxed">{listContent}</li>
            </ul>
          );
          currentListType = 'ul';
        } else {
          // Add to existing list
          const existingList = currentList as React.ReactElement;
          currentList = React.cloneElement(existingList, {
            children: [
              ...React.Children.toArray(existingList.props.children),
              <li key={`li-${i}`} className="text-foreground leading-relaxed">{listContent}</li>
            ]
          });
        }
      }
      // Check for ordered list
      else if (line.match(/^\d+\.\s/)) {
        const listContent = formatInlineText(line.replace(/^\d+\.\s/, ''));
        
        if (currentListType !== 'ol') {
          if (currentList) elements.push(currentList);
          currentList = (
            <ol key={`ol-${i}`} className="list-decimal list-inside space-y-1 my-3 first:mt-0 last:mb-0 pl-4">
              <li className="text-foreground leading-relaxed">{listContent}</li>
            </ol>
          );
          currentListType = 'ol';
        } else {
          // Add to existing list
          const existingList = currentList as React.ReactElement;
          currentList = React.cloneElement(existingList, {
            children: [
              ...React.Children.toArray(existingList.props.children),
              <li key={`li-${i}`} className="text-foreground leading-relaxed">{listContent}</li>
            ]
          });
        }
      }
      // Regular paragraph
      else {
        if (currentList) {
          elements.push(currentList);
          currentList = null;
          currentListType = null;
        }
        
        elements.push(
          <p key={`p-${i}`} className="text-foreground leading-relaxed my-3 first:mt-0 last:mb-0">
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
            className="bg-muted text-foreground px-1.5 py-0.5 rounded text-sm font-mono border"
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
    // Handle **bold** and *italic*
    const boldItalicRegex = /(\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = boldItalicRegex.exec(text)) !== null) {
      // Add text before formatting
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      
      // Determine type and content
      if (match[2]) {
        // Bold and italic
        parts.push(<strong key={`bi-${baseKey}-${match.index}`} className="font-bold italic">{match[2]}</strong>);
      } else if (match[3]) {
        // Bold
        parts.push(<strong key={`b-${baseKey}-${match.index}`} className="font-bold">{match[3]}</strong>);
      } else if (match[4]) {
        // Italic
        parts.push(<em key={`i-${baseKey}-${match.index}`} className="italic">{match[4]}</em>);
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
    <div className={cn("text-foreground space-y-2 leading-relaxed", className)}>
      {formatMessage(content)}
    </div>
  );
}