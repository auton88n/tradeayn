import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Send, 
  Sparkles,
  Trash2,
  Zap,
  TrendingUp,
  Users,
  AlertCircle,
  ArrowUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  actions?: Array<{ type: string; params: string }>;
  timestamp?: Date;
}

const QUICK_SUGGESTIONS = [
  { icon: TrendingUp, text: "Show AI cost breakdown" },
  { icon: Users, text: "List users with high usage" },
  { icon: AlertCircle, text: "Check system health" },
  { icon: Zap, text: "Why is fallback rate high?" },
];

// Typing indicator dots
const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 px-4 py-3">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-2 h-2 rounded-full bg-muted-foreground/60"
        animate={{
          y: [0, -6, 0],
          opacity: [0.4, 1, 0.4],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          delay: i * 0.15,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

// Message component
const ChatMessage = ({ 
  message, 
  onExecuteAction 
}: { 
  message: Message; 
  onExecuteAction: (action: { type: string; params: string }) => void;
}) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3",
          isUser 
            ? "bg-foreground text-background" 
            : "bg-muted border border-border"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        
        {message.timestamp && (
          <p className={cn(
            "text-[10px] mt-1.5",
            isUser ? "text-background/60" : "text-muted-foreground"
          )}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
        
        {message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
            {message.actions.map((action, j) => (
              <Badge 
                key={j}
                variant="secondary" 
                className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => onExecuteAction(action)}
              >
                <Sparkles className="w-3 h-3 mr-1.5" />
                <span className="text-xs">{action.type.replace(/_/g, ' ')}</span>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export function AdminAIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hey! I'm your admin assistant. Ask me anything about the system - user issues, costs, model health, whatever you need help with.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
    
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: text,
      timestamp: new Date()
    }]);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        'https://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/admin-ai-assistant',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: text })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content,
        actions: data.actions,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Admin AI error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, couldn't process that. Try again?",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeAction = async (action: { type: string; params: string }) => {
    toast.info(`Executing: ${action.type}`);
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Hey! I'm your admin assistant. Ask me anything about the system - user issues, costs, model health, whatever you need help with.",
      timestamp: new Date()
    }]);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.max(44, Math.min(textareaRef.current.scrollHeight, 160)) + 'px';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <Bot className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              AI Admin Assistant
              <Badge variant="secondary" className="text-[10px] font-normal">
                GPT-4
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground">
              System insights and troubleshooting
            </p>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={clearChat}
          className="text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear
        </Button>
      </div>

      {/* Chat Card */}
      <Card className="border border-border bg-card overflow-hidden">
        {/* Messages */}
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]" ref={scrollRef}>
            <div className="p-4 space-y-4">
              {messages.map((msg, i) => (
                <ChatMessage 
                  key={i} 
                  message={msg} 
                  onExecuteAction={executeAction}
                />
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted border border-border rounded-2xl">
                    <TypingIndicator />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Suggestions */}
          {messages.length <= 1 && !isLoading && (
            <div className="px-4 pb-4">
              <p className="text-xs text-muted-foreground mb-2">Quick actions:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_SUGGESTIONS.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(suggestion.text)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border hover:bg-muted/80 transition-colors text-sm"
                  >
                    <suggestion.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area - Similar to ChatInput */}
          <div className="p-3 border-t border-border">
            <div className="relative bg-muted/50 border border-border rounded-xl overflow-hidden">
              <div className="flex items-end gap-2 p-2">
                <Textarea
                  ref={textareaRef}
                  placeholder="Ask about users, costs, issues..."
                  value={input}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyPress}
                  disabled={isLoading}
                  className={cn(
                    "flex-1 resize-none min-h-[44px] max-h-[160px]",
                    "text-sm bg-transparent",
                    "border-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                    "px-2 py-2"
                  )}
                />
                
                <AnimatePresence>
                  {input.trim() && !isLoading && (
                    <motion.button
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      onClick={() => sendMessage()}
                      className="shrink-0 w-9 h-9 rounded-lg bg-foreground text-background flex items-center justify-center hover:opacity-90 transition-opacity"
                    >
                      <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
