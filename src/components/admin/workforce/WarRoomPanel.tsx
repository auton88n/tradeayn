import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, 
  ArrowUp, 
  Loader2, 
  Trash2,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUPABASE_URL } from '@/config';

interface WarRoomMessage {
  id: string;
  employee_id: string;
  topic: string;
  position: string | null;
  reasoning: string | null;
  confidence: number | null;
  created_at: string;
  discussion_id: string;
}

const AGENT_META: Record<string, { name: string; emoji: string; gradient: string }> = {
  system: { name: 'AYN', emoji: '🧠', gradient: 'from-violet-500 to-purple-600' },
  chief_of_staff: { name: 'Chief of Staff', emoji: '📋', gradient: 'from-blue-500 to-cyan-500' },
  advisor: { name: 'Strategic Advisor', emoji: '📊', gradient: 'from-emerald-500 to-teal-500' },
  sales: { name: 'Sales Hunter', emoji: '💼', gradient: 'from-amber-500 to-orange-500' },
  marketing: { name: 'Marketing Strategist', emoji: '📣', gradient: 'from-pink-500 to-rose-500' },
  security_guard: { name: 'Security Guard', emoji: '🛡️', gradient: 'from-red-500 to-rose-600' },
  lawyer: { name: 'Legal Counsel', emoji: '⚖️', gradient: 'from-slate-500 to-gray-600' },
  innovation: { name: 'Innovation Lead', emoji: '🚀', gradient: 'from-indigo-500 to-violet-500' },
  customer_success: { name: 'Customer Success', emoji: '🤝', gradient: 'from-green-500 to-emerald-500' },
  qa_watchdog: { name: 'QA Watchdog', emoji: '🐕', gradient: 'from-yellow-500 to-amber-500' },
  investigator: { name: 'Investigator', emoji: '🔍', gradient: 'from-cyan-500 to-blue-500' },
  follow_up: { name: 'Follow-Up Agent', emoji: '📬', gradient: 'from-purple-500 to-fuchsia-500' },
  hr_manager: { name: 'HR Manager', emoji: '👥', gradient: 'from-teal-500 to-emerald-600' },
};

function getAgentMeta(id: string) {
  return AGENT_META[id] || { name: id, emoji: '🤖', gradient: 'from-gray-500 to-gray-600' };
}

export function WarRoomPanel() {
  const [messages, setMessages] = useState<WarRoomMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentDiscussionId, setCurrentDiscussionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load recent discussions
  const loadRecentDiscussions = useCallback(async () => {
    const { data } = await supabase
      .from('employee_discussions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data && data.length > 0) {
      // Group by discussion_id, show latest discussion
      const latestDiscussionId = data[0].discussion_id;
      setCurrentDiscussionId(latestDiscussionId);
      setMessages(data.filter(d => d.discussion_id === latestDiscussionId).reverse());
    }
  }, []);

  useEffect(() => {
    loadRecentDiscussions();
  }, [loadRecentDiscussions]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('war-room-live')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'employee_discussions',
      }, (payload) => {
        const newMsg = payload.new as WarRoomMessage;
        if (currentDiscussionId && newMsg.discussion_id === currentDiscussionId) {
          setMessages(prev => [...prev, newMsg]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentDiscussionId]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const startDiscussion = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Not authenticated'); return; }

      setMessages([]);

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/admin-war-room`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ topic: text }),
        }
      );

      if (!response.ok) throw new Error('Failed to start discussion');

      const data = await response.json();
      if (data.discussion_id) {
        setCurrentDiscussionId(data.discussion_id);
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('War room error:', error);
      toast.error('Failed to start discussion');
    } finally {
      setIsLoading(false);
    }
  };

  const clearRoom = () => {
    setMessages([]);
    setCurrentDiscussionId(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      startDiscussion();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Swords className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              War Room
              <Badge variant="secondary" className="text-[10px] font-normal">
                Multi-Agent
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground">
              Watch your AI team discuss any topic
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={clearRoom} className="text-muted-foreground">
          <Trash2 className="w-4 h-4 mr-2" /> Clear
        </Button>
      </div>

      {/* Discussion Area */}
      <Card className="border border-border bg-card overflow-hidden">
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]" ref={scrollRef}>
            <div className="p-4 space-y-3">
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                  <Users className="w-12 h-12 mb-4 opacity-30" />
                  <p className="text-sm font-medium">No discussion yet</p>
                  <p className="text-xs mt-1">Type a topic and your AI team will debate it</p>
                </div>
              )}

              {/* Topic header */}
              {messages.length > 0 && (
                <div className="text-center py-2">
                  <Badge variant="outline" className="text-xs">
                    Topic: {messages[0]?.topic}
                  </Badge>
                </div>
              )}

              {messages.map((msg) => {
                const agent = getAgentMeta(msg.employee_id);
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-sm bg-gradient-to-br text-white",
                      agent.gradient
                    )}>
                      {agent.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium">{agent.name}</span>
                        {msg.confidence !== null && (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0">
                            {Math.round(msg.confidence * 100)}%
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 leading-relaxed">
                        {msg.position}
                      </p>
                      {msg.reasoning && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          {msg.reasoning}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-3 py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Agents are discussing...</span>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="relative bg-muted/50 border border-border rounded-xl overflow-hidden">
              <div className="flex items-end gap-2 p-2">
                <Textarea
                  ref={textareaRef}
                  placeholder="Enter a topic for your AI team to discuss..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={isLoading}
                  className={cn(
                    "flex-1 resize-none min-h-[44px] max-h-[120px]",
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
                      onClick={startDiscussion}
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
