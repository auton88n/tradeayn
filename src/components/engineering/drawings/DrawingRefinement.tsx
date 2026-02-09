import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface RefinementMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DrawingRefinementProps {
  onRefine: (instruction: string) => void;
  isRefining: boolean;
  history: RefinementMessage[];
}

export const DrawingRefinement: React.FC<DrawingRefinementProps> = ({
  onRefine,
  isRefining,
  history,
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isRefining) return;
    onRefine(input.trim());
    setInput('');
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card/50">
      <div className="px-4 py-2.5 border-b border-border/50 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Refine Design</span>
        <span className="text-xs text-muted-foreground ml-auto">
          e.g. "make the kitchen bigger" or "add a pantry"
        </span>
      </div>

      {/* Message history */}
      {history.length > 0 && (
        <div ref={scrollRef} className="max-h-40 overflow-y-auto px-4 py-2 space-y-2">
          {history.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg max-w-[85%]",
                msg.role === 'user'
                  ? "bg-primary/10 text-primary ml-auto"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {msg.content}
            </div>
          ))}
          {isRefining && (
            <div className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground animate-pulse">
              Updating layout...
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-border/50">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Describe changes to your floor plan..."
          disabled={isRefining}
          className="text-sm"
        />
        <Button type="submit" size="sm" disabled={!input.trim() || isRefining}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};

export default DrawingRefinement;
