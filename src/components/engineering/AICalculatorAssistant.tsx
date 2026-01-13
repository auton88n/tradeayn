import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Lightbulb, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Send,
  Wand2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { CalculatorType } from '@/lib/engineeringKnowledge';

interface Suggestion {
  field: string;
  label: string;
  currentValue: any;
  suggestedValue: any;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

interface Warning {
  type: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AICalculatorAssistantProps {
  calculatorType: CalculatorType;
  inputs: Record<string, any>;
  outputs: Record<string, any> | null;
  onApplySuggestion: (field: string, value: any) => void;
  onApplyAllSuggestions: (values: Record<string, any>) => void;
}

const QUICK_ACTIONS: Record<CalculatorType, { label: string; prompt: string }[]> = {
  beam: [
    { label: 'Optimize depth', prompt: 'What is the optimal depth for this beam based on span/depth ratios?' },
    { label: 'Check deflection', prompt: 'Will this beam meet deflection limits under service loads?' },
    { label: 'Reduce steel', prompt: 'How can I reduce the steel requirement while maintaining safety?' },
  ],
  column: [
    { label: 'Check slenderness', prompt: 'Is this column slender? Should I consider second-order effects?' },
    { label: 'Optimize section', prompt: 'What is the minimum section size for this load?' },
    { label: 'Tie spacing', prompt: 'What tie spacing is required per ACI 318?' },
  ],
  foundation: [
    { label: 'Check bearing', prompt: 'Is the bearing pressure within allowable limits?' },
    { label: 'Optimize size', prompt: 'What is the minimum foundation size for this load?' },
    { label: 'Punching shear', prompt: 'Is punching shear a concern? What reinforcement is needed?' },
  ],
  slab: [
    { label: 'Minimum thickness', prompt: 'What is the minimum slab thickness to control deflection?' },
    { label: 'Rebar layout', prompt: 'What is the optimal reinforcement layout for this slab?' },
    { label: 'Crack control', prompt: 'How do I ensure crack widths are within limits?' },
  ],
  retaining_wall: [
    { label: 'Stability check', prompt: 'Is the wall stable against overturning and sliding?' },
    { label: 'Drainage', prompt: 'What drainage provisions are recommended?' },
    { label: 'Key design', prompt: 'Do I need a key? What size should it be?' },
  ],
  grading: [
    { label: 'Cut/fill balance', prompt: 'How can I balance cut and fill volumes?' },
    { label: 'Drainage design', prompt: 'What slope is needed for proper drainage?' },
    { label: 'Cost estimate', prompt: 'What is the estimated earthwork cost?' },
  ],
  parking: [
    { label: 'Maximize spaces', prompt: 'How can I maximize parking capacity in this area?' },
    { label: 'ADA compliance', prompt: 'How many accessible spaces are required?' },
    { label: 'Traffic flow', prompt: 'What is the optimal traffic circulation pattern?' },
  ],
};

export const AICalculatorAssistant: React.FC<AICalculatorAssistantProps> = ({
  calculatorType,
  inputs,
  outputs,
  onApplySuggestion,
  onApplyAllSuggestions,
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastAnalyzedInputs = useRef<string>('');

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, streamingContent]);

  // Analyze inputs when they change (debounced)
  useEffect(() => {
    const inputsString = JSON.stringify(inputs);
    if (inputsString === lastAnalyzedInputs.current) return;
    
    const timer = setTimeout(() => {
      analyzeInputs();
      lastAnalyzedInputs.current = inputsString;
    }, 1000);

    return () => clearTimeout(timer);
  }, [inputs]);

  const analyzeInputs = async () => {
    // Basic local analysis for immediate feedback
    const newWarnings: Warning[] = [];
    const newSuggestions: Suggestion[] = [];

    // Beam-specific analysis
    if (calculatorType === 'beam' && inputs.span && inputs.width) {
      const span = parseFloat(inputs.span);
      const width = parseFloat(inputs.width);
      
      if (span > 0 && width > 0) {
        // Span/depth ratio check
        const recommendedDepth = (span * 1000) / 16; // L/16 for simply supported
        if (!inputs.depth || parseFloat(inputs.depth) < recommendedDepth * 0.8) {
          newSuggestions.push({
            field: 'depth',
            label: 'Beam Depth',
            currentValue: inputs.depth || 'Not set',
            suggestedValue: Math.ceil(recommendedDepth / 25) * 25, // Round to 25mm
            reason: `For span/depth ratio ≤ 16 (simply supported), recommended depth is ${Math.round(recommendedDepth)}mm`,
            priority: 'high',
          });
        }

        // Width check
        if (width < 200) {
          newWarnings.push({
            type: 'warning',
            message: 'Beam width less than 200mm may cause construction difficulties',
            field: 'width',
          });
        }
      }
    }

    // Column-specific analysis
    if (calculatorType === 'column' && inputs.height && inputs.width) {
      const height = parseFloat(inputs.height) * 1000; // m to mm
      const width = parseFloat(inputs.width);
      const slenderness = height / (width * 0.3); // Approximate
      
      if (slenderness > 22) {
        newWarnings.push({
          type: 'warning',
          message: `Slenderness ratio ≈ ${slenderness.toFixed(1)} > 22. Second-order effects should be considered.`,
        });
      }
    }

    // Foundation-specific analysis
    if (calculatorType === 'foundation' && inputs.columnLoad && inputs.bearingCapacity) {
      const load = parseFloat(inputs.columnLoad);
      const bearing = parseFloat(inputs.bearingCapacity);
      const minArea = (load * 1.5) / bearing; // Factored
      const minSize = Math.sqrt(minArea);
      
      if (!inputs.length || parseFloat(inputs.length) < minSize) {
        newSuggestions.push({
          field: 'length',
          label: 'Foundation Length',
          currentValue: inputs.length || 'Not set',
          suggestedValue: Math.ceil(minSize * 10) / 10,
          reason: `Minimum size for bearing capacity: ${minSize.toFixed(2)}m × ${minSize.toFixed(2)}m`,
          priority: 'high',
        });
      }
    }

    setSuggestions(newSuggestions);
    setWarnings(newWarnings);
  };

  const requestAIOptimization = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('engineering-ai-chat', {
        body: {
          calculatorType,
          currentInputs: inputs,
          currentOutputs: outputs,
          messages: [
            {
              role: 'user',
              content: `Analyze my current inputs and provide specific optimized values. Return a JSON object with suggested field values and reasons. Current inputs: ${JSON.stringify(inputs)}`,
            },
          ],
        },
      });

      if (error) throw error;

      // Parse AI suggestions if available
      if (data?.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error('AI optimization error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sendChatMessage = async (message: string) => {
    if (!message.trim() || isSending) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsSending(true);
    setStreamingContent('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/engineering-ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            calculatorType,
            currentInputs: inputs,
            currentOutputs: outputs,
            messages: [
              ...chatMessages.map(m => ({ role: m.role, content: m.content })),
              { role: 'user', content: message },
            ],
            stream: true,
          }),
        }
      );

      if (!response.ok) throw new Error('Stream failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);

          if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;

          try {
            const parsed = JSON.parse(line.slice(6));
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              setStreamingContent(fullContent);
            }
          } catch {
            // Partial JSON, continue
          }
        }
      }

      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: fullContent, timestamp: new Date() },
      ]);
      setStreamingContent('');
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: new Date() },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    sendChatMessage(prompt);
    if (!isChatOpen) setIsChatOpen(true);
  };

  const applyAllSuggestions = () => {
    const values: Record<string, any> = {};
    suggestions.forEach(s => {
      values[s.field] = s.suggestedValue;
    });
    onApplyAllSuggestions(values);
    setSuggestions([]);
  };

  const quickActions = QUICK_ACTIONS[calculatorType] || [];

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm">AI Engineering Assistant</h3>
              <p className="text-xs text-muted-foreground">Real-time analysis & suggestions</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={requestAIOptimization}
            disabled={isAnalyzing}
            className="gap-2"
          >
            {isAnalyzing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Wand2 className="w-3 h-3" />
            )}
            AI Optimize
          </Button>
        </div>
      </div>

      {/* Warnings */}
      <AnimatePresence>
        {warnings.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-destructive/10 border-b border-destructive/20"
          >
            {warnings.map((warning, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <span className="text-destructive">{warning.message}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-3 bg-accent/5 border-b border-border"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">Suggestions</span>
                <Badge variant="secondary" className="text-xs">
                  {suggestions.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={applyAllSuggestions}
                className="text-xs gap-1"
              >
                <Zap className="w-3 h-3" />
                Apply All
              </Button>
            </div>
            <div className="space-y-2">
              {suggestions.map((suggestion, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-2 bg-background rounded-md border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{suggestion.label}</span>
                      <Badge
                        variant={suggestion.priority === 'high' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {suggestion.reason}
                    </p>
                    <div className="text-xs mt-1">
                      <span className="text-muted-foreground">{suggestion.currentValue}</span>
                      <span className="mx-1">→</span>
                      <span className="text-primary font-medium">{suggestion.suggestedValue}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onApplySuggestion(suggestion.field, suggestion.suggestedValue)}
                    className="shrink-0 ml-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-xs text-muted-foreground mb-2">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction(action.prompt)}
              className="text-xs"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Collapsible Chat */}
      <Collapsible open={isChatOpen} onOpenChange={setIsChatOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full px-4 py-2 flex items-center justify-between text-sm hover:bg-accent/50 transition-colors">
            <span className="font-medium">Chat with AI</span>
            {isChatOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border">
            {/* Chat Messages */}
            <ScrollArea className="h-64 px-4 py-2">
              {chatMessages.length === 0 && !streamingContent && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Brain className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">Ask me anything about your design</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
                >
                  <div
                    className={`inline-block max-w-[85%] p-2 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {streamingContent && (
                <div className="mb-3 text-left">
                  <div className="inline-block max-w-[85%] p-2 rounded-lg text-sm bg-muted">
                    {streamingContent}
                    <span className="inline-block w-1 h-4 ml-1 bg-primary animate-pulse" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </ScrollArea>

            {/* Chat Input */}
            <div className="p-3 border-t border-border">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendChatMessage(chatInput);
                }}
                className="flex gap-2"
              >
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about your design..."
                  disabled={isSending}
                  className="flex-1 text-sm"
                />
                <Button type="submit" size="sm" disabled={isSending || !chatInput.trim()}>
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
