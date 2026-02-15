import { useState, useRef, useEffect } from 'react';
import { Brain, Send, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { useChartCoach } from '@/hooks/useChartCoach';
import type { ChartAnalysisResult } from '@/types/chartAnalyzer.types';

const QUICK_ACTIONS_WITH_RESULT = [
  "Should I take this trade?",
  "What's my biggest risk here?",
  "Am I being emotional?",
  "Explain the patterns",
  "Help me stay disciplined",
];

const QUICK_ACTIONS_GENERAL = [
  "How do I manage risk?",
  "Help me stay disciplined",
  "What's position sizing?",
  "Am I being emotional?",
];

interface ChartCoachChatProps {
  result?: ChartAnalysisResult | null;
}

export default function ChartCoachChat({ result }: ChartCoachChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage, clearChat } = useChartCoach(result ?? undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickActions = result ? QUICK_ACTIONS_WITH_RESULT : QUICK_ACTIONS_GENERAL;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-muted text-foreground hover:bg-muted/80'
            : 'bg-amber-500 text-white hover:bg-amber-600'
        }`}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Brain className="h-5 w-5" />}
        {!isOpen && result && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
        )}
      </button>

      {/* Floating chat panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-80 h-[400px] rounded-2xl shadow-2xl border border-amber-500/20 bg-background flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold">AYN Coach</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground text-center pt-2">
                  {result
                    ? `Ask AYN anything about your ${result.ticker} analysis`
                    : 'Upload a chart first for personalized coaching'}
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {quickActions.map((action) => (
                    <button
                      key={action}
                      onClick={() => sendMessage(action)}
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
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-amber-500/15 text-foreground'
                        : 'bg-muted/60 text-foreground'
                    }`}>
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

          {/* Input */}
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
              placeholder="Ask about trading..."
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
        </div>
      )}
    </>
  );
}
