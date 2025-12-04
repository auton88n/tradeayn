import React, { useState } from 'react';
import { Bookmark, Trash2, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import type { SavedResponse } from '@/hooks/useSavedResponses';

interface SavedResponsesSectionProps {
  savedResponses: SavedResponse[];
  onDelete: (id: string) => Promise<boolean>;
  isLoading: boolean;
}

export const SavedResponsesSection = ({ 
  savedResponses, 
  onDelete,
  isLoading 
}: SavedResponsesSectionProps) => {
  const { language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (savedResponses.length === 0) return null;

  return (
    <div className="flex-shrink-0">
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center justify-between w-full px-4 py-2",
          "hover:bg-muted/50 transition-colors",
          "text-xs font-medium text-foreground/50 uppercase tracking-wider"
        )}
      >
        <div className="flex items-center gap-2">
          <Bookmark className="w-3.5 h-3.5" />
          <span>{language === 'ar' ? 'الردود المحفوظة' : 'Saved Responses'}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
            {savedResponses.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-2 pb-2 animate-in slide-in-from-top-2 duration-200">
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-1.5">
              {savedResponses.map((response) => (
                <div
                  key={response.id}
                  className={cn(
                    "group relative p-2.5 rounded-xl",
                    "bg-muted/40 hover:bg-muted/60",
                    "border border-transparent hover:border-border/50",
                    "transition-all duration-200"
                  )}
                >
                  {/* Mode Badge */}
                  {response.mode && (
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary mb-1 inline-block">
                      {response.mode}
                    </span>
                  )}
                  
                  {/* Content Preview */}
                  <p className="text-xs text-foreground/80 line-clamp-2 pr-14">
                    {response.title || response.content.slice(0, 60)}
                  </p>
                  
                  {/* Timestamp */}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(response.created_at).toLocaleDateString()}
                  </p>

                  {/* Action Buttons */}
                  <div className={cn(
                    "absolute top-2 right-2 flex gap-1",
                    "opacity-0 group-hover:opacity-100 transition-opacity"
                  )}>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 rounded-md hover:bg-background"
                      onClick={() => handleCopy(response.content, response.id)}
                    >
                      {copiedId === response.id ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 rounded-md hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onDelete(response.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
