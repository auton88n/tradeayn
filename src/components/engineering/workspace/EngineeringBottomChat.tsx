import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUp, 
  Play, 
  FileDown, 
  FileText,
  GitCompare, 
  History, 
  RotateCcw,
  Loader2,
  Save,
  Brain,
  X,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface EngineeringBottomChatProps {
  onCalculate: () => void;
  onExportDXF?: () => void;
  onExportPDF?: () => void;
  onCompare: () => void;
  onHistory: () => void;
  onReset?: () => void;
  onSave?: () => void;
  isCalculating: boolean;
  hasResults: boolean;
  canCompare: boolean;
  calculatorType: string | null;
  currentInputs: Record<string, any>;
  currentOutputs: Record<string, any> | null;
}

const placeholders = [
  "Ask about your design...",
  "How can I optimize this structure?",
  "Check code compliance...",
  "Suggest improvements..."
];

export const EngineeringBottomChat: React.FC<EngineeringBottomChatProps> = ({
  onCalculate,
  onExportDXF,
  onExportPDF,
  onCompare,
  onHistory,
  onReset,
  onSave,
  isCalculating,
  hasResults,
  canCompare,
  calculatorType,
  currentInputs,
  currentOutputs,
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Rotate placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
        setShowPlaceholder(true);
      }, 200);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px';
    }
  }, [input]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsExpanded(true);

    try {
      const { data, error } = await supabase.functions.invoke('engineering-ai-chat', {
        body: {
          calculatorType,
          currentInputs,
          currentOutputs,
          question: userMessage.content,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          stream: false,
        },
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data?.answer || data?.content || 'I apologize, I could not process your request.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('AI chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, calculatorType, currentInputs, currentOutputs, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-xl"
      >
        {/* Expandable Messages Area */}
        <AnimatePresence>
          {isExpanded && messages.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-b border-border/30"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Brain className="w-4 h-4" />
                  <span>AI Assistant</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsExpanded(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <ScrollArea className="max-h-[200px]">
                <div className="p-4 space-y-3">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex",
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                          msg.role === 'user'
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl px-4 py-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Thinking...
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="container mx-auto px-4 py-3">
          {/* Chat Input Row */}
          <div className="flex items-end gap-3 mb-3">
            {/* Toggle messages button */}
            {messages.length > 0 && !isExpanded && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-10 w-10"
                    onClick={() => setIsExpanded(true)}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Show messages</TooltipContent>
              </Tooltip>
            )}

            {/* Input Area */}
            <div className="flex-1 relative">
              <div
                className={cn(
                  "relative rounded-2xl overflow-hidden",
                  "bg-muted/50 border border-border/50",
                  "transition-all duration-200",
                  "focus-within:border-primary/50 focus-within:bg-muted/70"
                )}
              >
                <div className="flex items-end gap-2 px-4 py-2">
                  <div className="flex-1 relative">
                    <Textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder=""
                      disabled={isLoading}
                      className={cn(
                        "resize-none border-0 bg-transparent p-0 min-h-[40px] max-h-[100px]",
                        "focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                        "text-sm placeholder:text-muted-foreground/60"
                      )}
                      rows={1}
                    />
                    
                    {/* Animated placeholder */}
                    {!input && (
                      <div 
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 left-0 pointer-events-none text-muted-foreground/50 text-sm",
                          "transition-opacity duration-200",
                          showPlaceholder ? "opacity-100" : "opacity-0"
                        )}
                      >
                        {placeholders[currentPlaceholder]}
                      </div>
                    )}
                  </div>

                  {/* Send Button */}
                  <AnimatePresence>
                    {input.trim() && (
                      <motion.button
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-xl",
                          "flex items-center justify-center",
                          "bg-primary text-primary-foreground",
                          "transition-all duration-200",
                          "hover:scale-105 hover:shadow-lg",
                          "active:scale-95",
                          "disabled:opacity-50"
                        )}
                      >
                        <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Toolbar Row */}
          <div className="flex items-center justify-between">
            {/* Left Actions - Primary */}
            <div className="flex items-center gap-2">
              <Button
                onClick={onCalculate}
                disabled={isCalculating || !calculatorType}
                className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                size="default"
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Calculate
                  </>
                )}
              </Button>

              {onReset && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={onReset}
                      disabled={isCalculating}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset Form</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Center Actions - Export */}
            <div className="flex items-center gap-2">
              {hasResults && (
                <>
                  {onExportDXF && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onExportDXF}
                          className="gap-2"
                        >
                          <FileDown className="w-4 h-4" />
                          <span className="hidden sm:inline">DXF</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Export CAD Drawing</TooltipContent>
                    </Tooltip>
                  )}

                  {onExportPDF && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onExportPDF}
                          className="gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          <span className="hidden sm:inline">PDF</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Export Report</TooltipContent>
                    </Tooltip>
                  )}

                  {onSave && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onSave}
                          className="gap-2"
                        >
                          <Save className="w-4 h-4" />
                          <span className="hidden sm:inline">Save</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Save to Portfolio</TooltipContent>
                    </Tooltip>
                  )}

                  <Separator orientation="vertical" className="h-6 hidden sm:block" />
                </>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCompare}
                    disabled={!canCompare}
                    className="gap-2"
                  >
                    <GitCompare className="w-4 h-4" />
                    <span className="hidden sm:inline">Compare</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {canCompare ? 'Compare Calculations' : 'Need 2+ calculations'}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onHistory}
                    className="gap-2"
                  >
                    <History className="w-4 h-4" />
                    <span className="hidden sm:inline">History</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View History</TooltipContent>
              </Tooltip>
            </div>

            {/* Right - Status */}
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
                hasResults
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  hasResults ? "bg-emerald-500" : "bg-muted-foreground/50"
                )} />
                {hasResults ? 'Results Ready' : 'Ready'}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
};
