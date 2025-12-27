import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Send, 
  X, 
  Trash2, 
  Sparkles, 
  HelpCircle, 
  Lightbulb,
  CheckCircle,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEngineeringAI } from '@/hooks/useEngineeringAI';
import { AIResponseCard } from './AIResponseCard';
import { CalculatorType } from '@/lib/engineeringKnowledge';

interface EngineeringAIPanelProps {
  calculatorType: CalculatorType;
  currentInputs: Record<string, unknown>;
  currentOutputs: Record<string, unknown> | null;
  isVisible: boolean;
  onToggle: () => void;
}

const QUICK_ACTIONS: Record<CalculatorType, { label: string; question: string }[]> = {
  beam: [
    { label: 'Explain design', question: 'Explain why this beam design was chosen and the key calculations' },
    { label: 'Check code', question: 'Does this design comply with ACI 318 and Saudi Building Code requirements?' },
    { label: 'Optimize', question: 'How can I optimize this beam design to reduce cost or improve performance?' },
  ],
  column: [
    { label: 'Explain design', question: 'Explain the column design including slenderness effects' },
    { label: 'Check capacity', question: 'Is this column adequate for the applied loads?' },
    { label: 'Reduce size', question: 'Can I reduce the column size while maintaining safety?' },
  ],
  foundation: [
    { label: 'Explain design', question: 'Explain the foundation sizing and reinforcement design' },
    { label: 'Check bearing', question: 'Is the soil bearing pressure within safe limits?' },
    { label: 'Foundation type', question: 'Would a different foundation type be more economical?' },
  ],
  slab: [
    { label: 'Explain design', question: 'Explain the slab design and reinforcement layout' },
    { label: 'Check deflection', question: 'Will deflection be within acceptable limits?' },
    { label: 'Optimize thickness', question: 'Can I reduce the slab thickness?' },
  ],
  retaining_wall: [
    { label: 'Explain design', question: 'Explain the retaining wall design and stability checks' },
    { label: 'Check stability', question: 'Are all stability factors (overturning, sliding, bearing) adequate?' },
    { label: 'Drainage', question: 'What drainage provisions should I include?' },
  ],
  grading: [
    { label: 'Explain design', question: 'Explain the grading design and earthwork balance' },
    { label: 'Optimize cut/fill', question: 'How can I minimize earthwork costs?' },
    { label: 'Drainage', question: 'Are the drainage slopes adequate?' },
  ],
};

export const EngineeringAIPanel = ({
  calculatorType,
  currentInputs,
  currentOutputs,
  isVisible,
  onToggle
}: EngineeringAIPanelProps) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, isLoading, sendMessage, clearConversation, askQuickQuestion } = useEngineeringAI({
    calculatorType,
    currentInputs,
    currentOutputs
  });

  const quickActions = QUICK_ACTIONS[calculatorType] || QUICK_ACTIONS.beam;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isVisible]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleQuickReply = (question: string) => {
    askQuickQuestion(question);
  };

  // Collapsed Toggle Button
  if (!isVisible) {
    return (
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onToggle}
        className="fixed right-4 bottom-24 z-50 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
      >
        <Bot className="h-5 w-5" />
        <span className="font-medium">Ask AI</span>
        <ChevronRight className="h-4 w-4" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 h-full w-full sm:w-96 bg-background border-l border-border shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Engineering AI</h3>
            <p className="text-xs text-muted-foreground capitalize">{calculatorType.replace('_', ' ')} Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearConversation}
              className="h-8 w-8"
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            {/* Welcome Message */}
            <div className="text-center space-y-3 py-6">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Engineering AI Assistant</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Ask me anything about your {calculatorType.replace('_', ' ')} design
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium px-1">Quick Actions</p>
              {quickActions.map((action, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickReply(action.question)}
                  className="w-full justify-start text-left h-auto py-3 px-3"
                  disabled={isLoading}
                >
                  <div className="flex items-start gap-3">
                    {i === 0 && <HelpCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />}
                    {i === 1 && <CheckCircle className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />}
                    {i === 2 && <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />}
                    <span className="text-xs">{action.label}</span>
                  </div>
                </Button>
              ))}
            </div>

            {/* Context Status */}
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Current Context</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${currentOutputs ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className="text-xs text-foreground/80">
                  {currentOutputs ? 'Calculation results available' : 'Waiting for calculation'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {Object.keys(currentInputs).length} input parameters detected
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'user' ? (
                    <div className="max-w-[85%] bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2">
                      <p className="text-sm">{message.content}</p>
                    </div>
                  ) : (
                    <div className="max-w-[95%] space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="bg-muted/50 rounded-2xl rounded-tl-md px-4 py-3 flex-1">
                          {message.structuredResponse ? (
                            <AIResponseCard 
                              response={message.structuredResponse} 
                              onQuickReply={handleQuickReply}
                            />
                          ) : (
                            <p className="text-sm text-foreground whitespace-pre-wrap">{message.content}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading Indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-2"
              >
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted/50 rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-muted-foreground">Analyzing...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-muted/30">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about this design..."
              className="pl-10 pr-4 bg-background"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || isLoading}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </motion.div>
  );
};
