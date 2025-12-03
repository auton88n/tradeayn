import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { sanitizeUserInput, isValidUserInput } from '@/lib/security';

interface MessageFormatterProps {
  content: string;
  className?: string;
}

export function MessageFormatter({ content, className }: MessageFormatterProps) {
  // Sanitize content to prevent XSS attacks
  const sanitizedContent = isValidUserInput(content) ? content : sanitizeUserInput(content);
  
  // Preprocess to convert inline tables, numbered/bullet lists to proper newlines
  const preprocessContent = (text: string): string => {
    let processed = text;
    
    // 0. Convert inline markdown tables to multi-line format
    if (processed.includes('|') && processed.match(/\|[^|]+\|[^|]*\|[\s-:]+\|/)) {
      processed = processed.replace(/\|\s*\|---/g, '|\n|---');
      processed = processed.replace(/---\|\s*\|(?!\s*-)/g, '---|\n|');
      processed = processed.replace(/\|\s*\|\s*(\d+)/g, '|\n| $1');
      processed = processed.replace(/\|\s*\|\s*([A-Za-z*])/g, '|\n| $1');
    }
    
    // 1. Convert inline numbered lists like "1. item 2. item 3. item"
    if (processed.match(/\d+\.\s[^0-9]+\d+\.\s/)) {
      processed = processed.replace(/(\s)(\d+)\.\s/g, '\n$2. ').trim();
    }
    
    // 2. Convert inline bullet lists like "text: - **Item** - **Item**"
    if (processed.match(/[^-\n]\s+-\s+(\*\*|[A-Z])/)) {
      processed = processed.replace(/(\S)\s+-\s+(\*\*|[A-Z])/g, '$1\n- $2');
    }
    
    // 3. Convert inline bullets with em-dash "text – item – item"
    if (processed.match(/[^\n]\s+[–—]\s+\*\*/)) {
      processed = processed.replace(/(\S)\s+[–—]\s+(\*\*)/g, '$1\n- $2');
    }
    
    return processed;
  };

  const processedContent = preprocessContent(sanitizedContent);

  return (
    <div className={cn("space-y-2 leading-relaxed", className)}>
      <ReactMarkdown
        components={{
          // Bold text
          strong: ({ children }) => (
            <strong className="font-semibold text-primary">{children}</strong>
          ),
          // Italic text
          em: ({ children }) => (
            <em className="italic text-muted-foreground">{children}</em>
          ),
          // Unordered lists
          ul: ({ children }) => (
            <ul className="space-y-1 my-2 first:mt-0 last:mb-0 pl-2">{children}</ul>
          ),
          // Ordered lists
          ol: ({ children }) => (
            <ol className="space-y-1 my-2 first:mt-0 last:mb-0 pl-2 list-decimal list-inside">{children}</ol>
          ),
          // List items
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          // Paragraphs
          p: ({ children }) => (
            <p className="leading-relaxed mb-2 last:mb-0 text-current break-words">{children}</p>
          ),
          // Code blocks and inline code
          code: ({ children, className }) => {
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return (
                <div className="my-4 first:mt-0 last:mb-0">
                  <pre className="bg-muted border border-border rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm font-mono text-current whitespace-pre">
                      {children}
                    </code>
                  </pre>
                </div>
              );
            }
            return (
              <code className="bg-muted text-current px-1.5 py-0.5 rounded text-sm font-mono border">
                {children}
              </code>
            );
          },
          // Pre blocks (for code)
          pre: ({ children }) => (
            <div className="my-4 first:mt-0 last:mb-0">
              <pre className="bg-muted border border-border rounded-lg p-4 overflow-x-auto">
                {children}
              </pre>
            </div>
          ),
          // Headers
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mt-4 mb-2 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mt-4 mb-2 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-medium mt-3 mb-2 first:mt-0">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-medium mt-3 mb-2 first:mt-0">{children}</h4>
          ),
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-muted-foreground bg-muted/50 pl-4 py-2 italic my-2 first:mt-0 last:mb-0 rounded-r">
              {children}
            </blockquote>
          ),
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 first:mt-0 last:mb-0">
              <table className="min-w-full border-collapse border border-border rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody>{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2.5 text-left font-semibold border-b border-border text-sm">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 border-b border-border/50 text-sm">{children}</td>
          ),
          // Horizontal rule
          hr: () => (
            <hr className="my-4 border-border" />
          ),
          // Links
          a: ({ children, href }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80 transition-colors"
            >
              {children}
            </a>
          ),
          // Images
          img: ({ src, alt }) => (
            <img 
              src={src} 
              alt={alt || ''} 
              className="max-w-full h-auto rounded-lg my-2"
            />
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
