import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { sanitizeUserInput, isValidUserInput } from '@/lib/security';
import { Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface MessageFormatterProps {
  content: string;
  className?: string;
}

export function MessageFormatter({ content, className }: MessageFormatterProps) {
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Sanitize content to prevent XSS attacks
  const sanitizedContent = isValidUserInput(content) ? content : sanitizeUserInput(content);

  const copyCodeToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeId(id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };
  
  // Preprocess to convert inline tables, numbered/bullet lists to proper newlines
  const preprocessContent = (text: string): string => {
    let processed = text;
    
    // Normalize curly/smart quotes to straight quotes for markdown compatibility
    processed = processed
      .replace(/[\u2018\u2019]/g, "'")  // Single curly quotes → straight
      .replace(/[\u201C\u201D]/g, '"'); // Double curly quotes → straight
    
    // Check if content contains a markdown table (has pipes and separator row)
    const isTable = processed.includes('|') && /\|[\s-:]+\|/.test(processed);
    
    // For tables: just normalize excessive newlines, don't modify structure
    if (isTable) {
      processed = processed.replace(/\n{3,}/g, '\n\n');
      return processed;
    }
    
    // Only apply list conversion for NON-table content
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
    <>
      <div className={cn("space-y-2 leading-relaxed", className)}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Bold text
            strong: ({ children }) => (
              <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>
            ),
            // Italic text
            em: ({ children }) => (
              <em className="italic text-gray-600 dark:text-gray-300">{children}</em>
            ),
            // Strikethrough (GFM)
            del: ({ children }) => (
              <del className="line-through text-muted-foreground">{children}</del>
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
              <li className="leading-relaxed break-words [&>p]:inline [&>p]:m-0">{children}</li>
            ),
            // Paragraphs
            p: ({ children }) => (
              <p className="leading-relaxed mb-2 last:mb-0 text-current break-words">{children}</p>
            ),
            // Code blocks with copy button
            code: ({ children, className: codeClassName }) => {
              const isBlock = codeClassName?.includes('language-') || 
                (typeof children === 'string' && children.includes('\n'));
              const codeString = String(children).replace(/\n$/, '');
              const codeId = `code-${Math.random().toString(36).slice(2, 9)}`;
              
              if (isBlock) {
                return (
                  <div className="relative group my-3 first:mt-0 last:mb-0">
                    <button
                      onClick={() => copyCodeToClipboard(codeString, codeId)}
                      className={cn(
                        "absolute right-2 top-2 p-1.5 rounded-md z-10",
                        "bg-gray-200/80 dark:bg-gray-700/80",
                        "hover:bg-gray-300 dark:hover:bg-gray-600",
                        "opacity-0 group-hover:opacity-100 transition-opacity",
                        "text-gray-600 dark:text-gray-300"
                      )}
                      title="Copy code"
                    >
                      {copiedCodeId === codeId ? (
                        <Check size={14} className="text-green-500" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                    <pre className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 pr-10 overflow-x-auto">
                      <code className="text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre">
                        {children}
                      </code>
                    </pre>
                  </div>
                );
              }
              return (
                <code className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded text-sm font-mono border border-gray-200 dark:border-gray-700">
                  {children}
                </code>
              );
            },
            // Pre blocks (for code) - let code component handle rendering
            pre: ({ children }) => <>{children}</>,
            // Headers
            h1: ({ children }) => (
              <h1 className="text-xl font-bold mt-4 mb-2 first:mt-0 text-gray-900 dark:text-white">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-semibold mt-4 mb-2 first:mt-0 text-gray-900 dark:text-white">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-medium mt-3 mb-2 first:mt-0 text-gray-900 dark:text-white">{children}</h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-sm font-medium mt-3 mb-2 first:mt-0 text-gray-900 dark:text-white">{children}</h4>
            ),
            // Blockquotes
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary/50 bg-gray-50 dark:bg-gray-800/50 pl-4 py-2 italic my-2 first:mt-0 last:mb-0 rounded-r text-gray-600 dark:text-gray-300">
                {children}
              </blockquote>
            ),
            // Tables (enhanced with GFM support)
            table: ({ children }) => (
              <div className="overflow-x-auto my-4 first:mt-0 last:mb-0 max-w-full">
                <table className="min-w-full border-collapse border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden text-sm">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>
            ),
            tbody: ({ children }) => (
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">{children}</tbody>
            ),
            tr: ({ children }) => (
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">{children}</tr>
            ),
            th: ({ children }) => (
              <th className="px-4 py-2.5 text-left font-semibold border-b border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white break-words">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 break-words">{children}</td>
            ),
            // Horizontal rule
            hr: () => (
              <hr className="my-4 border-gray-200 dark:border-gray-700" />
            ),
            // Links
            a: ({ children, href }) => (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
              >
                {children}
              </a>
            ),
            // Images with click-to-zoom
            img: ({ src, alt }) => (
              <img 
                src={src} 
                alt={alt || ''} 
                loading="lazy"
                className="max-w-full h-auto rounded-lg my-2 cursor-zoom-in hover:opacity-90 transition-opacity shadow-sm"
                onClick={() => setLightboxImage({ src: src || '', alt: alt || '' })}
              />
            ),
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>

      {/* Image Lightbox Dialog */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 bg-black/95 border-none">
          {lightboxImage && (
            <img
              src={lightboxImage.src}
              alt={lightboxImage.alt}
              className="w-full h-full object-contain max-h-[85vh]"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
