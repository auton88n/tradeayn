import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Bot, 
  Send, 
  Loader2,
  Sparkles,
  Trash2
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  actions?: Array<{ type: string; params: string }>;
}

export function AdminAIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hey! I'm your admin assistant. Ask me anything about the system - user issues, costs, model health, whatever you need help with."
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
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
          body: JSON.stringify({ message: userMessage })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content,
        actions: data.actions
      }]);
    } catch (error) {
      console.error('Admin AI error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, couldn't process that. Try again?"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeAction = async (action: { type: string; params: string }) => {
    toast.info(`Executing: ${action.type}`);
    // Action execution would be implemented here
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Hey! I'm your admin assistant. Ask me anything about the system - user issues, costs, model health, whatever you need help with."
    }]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bot className="w-5 h-5" />
            AI Admin Assistant
          </h2>
          <p className="text-sm text-muted-foreground">
            Ask questions about system status, users, costs, and more
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={clearChat}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Chat
        </Button>
      </div>

      {/* Chat Interface */}
      <Card className="h-[500px] flex flex-col">
        <CardHeader className="py-3 border-b">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Assistant Online
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    
                    {/* Action buttons */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {msg.actions.map((action, j) => (
                          <Badge 
                            key={j}
                            variant="outline" 
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={() => executeAction(action)}
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            {action.type.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Ask about users, costs, issues..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                disabled={isLoading}
              />
              <Button 
                size="icon" 
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Try: "why is the fallback rate high?" or "show me blocked users"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
