import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Send, 
  Sparkles,
  Trash2,
  Zap,
  MessageSquare,
  TrendingUp,
  Users,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  actions?: Array<{ type: string; params: string }>;
  timestamp?: Date;
}

const QUICK_SUGGESTIONS = [
  { icon: TrendingUp, text: "Show AI cost breakdown", color: "text-emerald-400" },
  { icon: Users, text: "List users with high usage", color: "text-blue-400" },
  { icon: AlertCircle, text: "Check system health", color: "text-amber-400" },
  { icon: Zap, text: "Why is fallback rate high?", color: "text-purple-400" },
];

// Animated typing indicator
const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 px-4 py-3">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-2 h-2 rounded-full bg-primary/60"
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

// Animated status orb
const StatusOrb = ({ isOnline }: { isOnline: boolean }) => (
  <div className="relative">
    <motion.div
      className={cn(
        "w-3 h-3 rounded-full",
        isOnline ? "bg-emerald-500" : "bg-muted-foreground"
      )}
      animate={isOnline ? {
        boxShadow: [
          "0 0 0 0 rgba(16, 185, 129, 0.4)",
          "0 0 0 8px rgba(16, 185, 129, 0)",
        ],
      } : {}}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeOut",
      }}
    />
  </div>
);

// Message component with animations
const ChatMessage = ({ 
  message, 
  index, 
  onExecuteAction 
}: { 
  message: Message; 
  index: number;
  onExecuteAction: (action: { type: string; params: string }) => void;
}) => {
  const isUser = message.role === 'user';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        ease: [0.23, 1, 0.32, 1]
      }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 relative overflow-hidden",
          isUser 
            ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25" 
            : "bg-card border border-border shadow-sm"
        )}
      >
        {/* Subtle gradient overlay for assistant messages */}
        {!isUser && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        )}
        
        <p className={cn(
          "text-sm leading-relaxed relative z-10 whitespace-pre-wrap",
          isUser ? "text-primary-foreground" : "text-foreground"
        )}>
          {message.content}
        </p>
        
        {/* Timestamp */}
        {message.timestamp && (
          <p className={cn(
            "text-[10px] mt-1.5",
            isUser ? "text-primary-foreground/60" : "text-muted-foreground"
          )}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
        
        {/* Action badges */}
        <AnimatePresence>
          {message.actions && message.actions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50"
            >
              {message.actions.map((action, j) => (
                <motion.div
                  key={j}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: j * 0.1 }}
                >
                  <Badge 
                    variant="secondary" 
                    className="cursor-pointer bg-secondary text-secondary-foreground border border-border hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all duration-300 group"
                    onClick={() => onExecuteAction(action)}
                  >
                    <Sparkles className="w-3 h-3 mr-1.5 text-primary group-hover:rotate-12 transition-transform" />
                    <span className="text-xs font-medium">{action.type.replace(/_/g, ' ')}</span>
                  </Badge>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
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
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleSuggestionClick = (text: string) => {
    sendMessage(text);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-6"
    >
      {/* Premium Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Animated Bot Icon */}
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
              <Bot className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-1 -right-1">
              <StatusOrb isOnline={true} />
            </div>
          </motion.div>
          
          <div>
            <h2 className="text-xl font-semibold font-display flex items-center gap-2">
              AI Admin Assistant
              <Badge variant="secondary" className="text-[10px] font-normal bg-primary/10 text-primary border-0">
                GPT-4
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground">
              System insights, user analytics, and troubleshooting
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

      {/* Main Chat Card */}
      <Card className="overflow-hidden border border-border bg-card shadow-xl ring-1 ring-primary/10">
        {/* Gradient top accent */}
        <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
        
        {/* Chat Messages */}
        <CardContent className="p-0">
          <ScrollArea className="h-[400px] relative" ref={scrollRef}>
            {/* Top fade gradient */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-card to-transparent z-10 pointer-events-none" />
            
            <div className="p-4 space-y-4">
              <AnimatePresence mode="popLayout">
                {messages.map((msg, i) => (
                  <ChatMessage 
                    key={i} 
                    message={msg} 
                    index={i}
                    onExecuteAction={executeAction}
                  />
                ))}
              </AnimatePresence>
              
              {/* Typing indicator */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex justify-start"
                  >
                    <div className="bg-card border border-border rounded-2xl shadow-sm">
                      <TypingIndicator />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Bottom fade gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none" />
          </ScrollArea>

          {/* Quick Suggestions */}
          {messages.length <= 1 && !isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="px-4 pb-4"
            >
              <p className="text-xs text-muted-foreground mb-2 font-medium">Quick actions:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_SUGGESTIONS.map((suggestion, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary border border-border hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 group shadow-sm"
                  >
                    <suggestion.icon className={cn("w-3.5 h-3.5", suggestion.color)} />
                    <span className="text-xs text-foreground font-medium group-hover:text-primary transition-colors">
                      {suggestion.text}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-border/50 bg-muted/30">
            <motion.div 
              className="flex gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="relative flex-1">
                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input
                  ref={inputRef}
                  placeholder="Ask about users, costs, issues..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={isLoading}
                  className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl h-11"
                />
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="icon" 
                  onClick={() => sendMessage()}
                  disabled={isLoading || !input.trim()}
                  className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
