import { useState, useRef, useEffect } from 'react';
import { Brain, Send, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ReactMarkdown from 'react-markdown';
import { useChartCoach } from '@/hooks/useChartCoach';
import type { ChartAnalysisResult } from '@/types/chartAnalyzer.types';

const QUICK_ACTIONS = [
  "Should I take this trade?",
  "What's my biggest risk here?",
  "Am I being emotional?",
  "Explain the patterns",
  "Help me stay disciplined",
];

interface ChartCoachChatProps {
  result: ChartAnalysisResult;
}

export default function ChartCoachChat({ result }: ChartCoachChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage, clearChat } = useChartCoach(result);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleQuickAction = (action: string) => {
    sendMessage(action);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className="w-full gap-2 border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/5 text-amber-600 dark:text-amber-400"
        >
          <Brain className="h-4 w-4" />
          {isOpen ? 'Close Coach' : 'Ask AYN about this trade'}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <Card className="mt-3 border-amber-500/20 overflow-hidden">
          <CardContent className="p-0">
            {/* Messages */}
            <ScrollArea className="h-72 p-3" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    Ask AYN anything about your {result.ticker} analysis
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action}
                        onClick={() => handleQuickAction(action)}
                        disabled={isLoading}
                        className="text-[11px] px-2.5 py-1.5 rounded-full border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-50"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                          msg.role === 'user'
                            ? 'bg-amber-500/15 text-foreground'
                            : 'bg-muted/60 text-foreground'
                        }`}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-1.5 [&>ul]:mb-1.5 [&>ol]:mb-1.5">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <span>{msg.content}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted/60 rounded-xl px-3 py-2 text-sm text-muted-foreground">
                        <span className="animate-pulse">AYN is thinking...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input area */}
            <div className="border-t border-border/50 p-2 flex gap-2 items-center">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={clearChat}
                  title="Clear chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about this trade..."
                className="h-8 text-sm border-amber-500/20 focus-visible:ring-amber-500/30"
                disabled={isLoading}
              />
              <Button
                size="icon"
                className="h-8 w-8 shrink-0 bg-amber-500 hover:bg-amber-600 text-white"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
