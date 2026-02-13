import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Command as CommandIcon,
  ArrowUp,
  Loader2,
  Trash2,
  Users,
  Shield,
  Plus,
  X,
  MessageSquare,
  Terminal,
  ScrollText,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUPABASE_URL } from '@/config';

interface DiscussionMessage {
  id: string;
  employee_id: string;
  topic: string;
  position: string | null;
  reasoning: string | null;
  confidence: number | null;
  created_at: string;
  discussion_id: string;
}

interface Directive {
  id: string;
  directive: string;
  category: string;
  priority: number;
  is_active: boolean;
  created_at: string;
}

interface CommandResult {
  agent?: string;
  agent_name?: string;
  command?: string;
  result?: any;
  success?: boolean;
  error?: string;
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
  founder: { name: 'Founder', emoji: '👤', gradient: 'from-orange-500 to-red-500' },
};

function getAgentMeta(id: string) {
  return AGENT_META[id] || { name: id, emoji: '🤖', gradient: 'from-gray-500 to-gray-600' };
}

const CATEGORY_COLORS: Record<string, string> = {
  geo: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  strategy: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  outreach: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  budget: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  general: 'bg-muted text-muted-foreground border-border',
};

export function CommandCenterPanel() {
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentDiscussionId, setCurrentDiscussionId] = useState<string | null>(null);
  const [directives, setDirectives] = useState<Directive[]>([]);
  const [newDirective, setNewDirective] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [commandResult, setCommandResult] = useState<CommandResult | null>(null);
  const [pastTopics, setPastTopics] = useState<{ discussion_id: string; topic: string; created_at: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ─── Load directives ───
  const loadDirectives = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-command-center`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: 'list_directives' }),
      });
      const data = await res.json();
      setDirectives(data.directives || []);
    } catch { /* ignore */ }
  }, []);

  // ─── Load past discussions ───
  const loadPastTopics = useCallback(async () => {
    const { data } = await supabase
      .from('employee_discussions')
      .select('discussion_id, topic, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (data) {
      const seen = new Set<string>();
      const unique: typeof pastTopics = [];
      for (const d of data) {
        if (!seen.has(d.discussion_id)) {
          seen.add(d.discussion_id);
          unique.push(d);
          if (unique.length >= 10) break;
        }
      }
      setPastTopics(unique);
    }
  }, []);

  // ─── Load recent discussion ───
  const loadRecentDiscussion = useCallback(async () => {
    const { data } = await supabase
      .from('employee_discussions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data && data.length > 0) {
      const latestId = data[0].discussion_id;
      setCurrentDiscussionId(latestId);
      setMessages(data.filter(d => d.discussion_id === latestId).reverse());
    }
  }, []);

  useEffect(() => {
    loadDirectives();
    loadPastTopics();
    loadRecentDiscussion();
  }, [loadDirectives, loadPastTopics, loadRecentDiscussion]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // ─── Parse input for @command syntax ───
  function parseInput(text: string): { mode: string; agent?: string; command?: string; topic?: string } {
    const atMatch = text.match(/^@(\w+)\s+(.+)$/s);
    if (atMatch) {
      return { mode: 'command', agent: atMatch[1].toLowerCase(), command: atMatch[2].trim() };
    }
    return { mode: 'discuss', topic: text };
  }

  // ─── Send ───
  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    setIsLoading(true);
    setCommandResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Not authenticated'); return; }

      const parsed = parseInput(text);

      if (parsed.mode === 'command') {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-command-center`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ mode: 'command', agent: parsed.agent, command: parsed.command }),
        });
        const data = await res.json();
        setCommandResult(data);
        if (data.error) toast.error(data.error);
        else toast.success(`Command sent to ${data.agent_name || parsed.agent}`);
      } else {
        setMessages([]);
        const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-command-center`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ mode: 'discuss', topic: parsed.topic }),
        });

        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (data.discussion_id) {
          setCurrentDiscussionId(data.discussion_id);
          setMessages(data.messages || []);
          loadPastTopics();
        }
      }
    } catch (error) {
      toast.error('Failed to execute');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Follow up on past discussion ───
  const handleFollowUp = async (discussionId: string, topic: string) => {
    setIsLoading(true);
    setCommandResult(null);
    setMessages([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-command-center`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: 'follow_up', topic: `Follow-up: ${topic}`, follow_up_id: discussionId }),
      });

      const data = await res.json();
      if (data.discussion_id) {
        setCurrentDiscussionId(data.discussion_id);
        setMessages(data.messages || []);
        loadPastTopics();
      }
    } catch {
      toast.error('Failed to follow up');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Add directive ───
  const handleAddDirective = async () => {
    if (!newDirective.trim()) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-command-center`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: 'directive', directive: newDirective.trim(), category: newCategory, priority: 1 }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Directive saved');
        setNewDirective('');
        loadDirectives();
      }
    } catch {
      toast.error('Failed to save directive');
    }
  };

  // ─── Delete directive ───
  const handleDeleteDirective = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(`${SUPABASE_URL}/functions/v1/admin-command-center`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: 'delete_directive', id }),
      });

      toast.success('Directive removed');
      loadDirectives();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearRoom = () => {
    setMessages([]);
    setCurrentDiscussionId(null);
    setCommandResult(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <CommandIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              Command Center
              <Badge variant="secondary" className="text-[10px] font-normal">Memory + Directives</Badge>
            </h2>
            <p className="text-sm text-muted-foreground">
              Discuss, command agents directly, or set standing orders
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={clearRoom} className="text-muted-foreground">
          <Trash2 className="w-4 h-4 mr-2" /> Clear
        </Button>
      </div>

      <Tabs defaultValue="discuss" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discuss" className="gap-1.5 text-xs">
            <MessageSquare className="w-3.5 h-3.5" /> Discuss
          </TabsTrigger>
          <TabsTrigger value="command" className="gap-1.5 text-xs">
            <Terminal className="w-3.5 h-3.5" /> Command
          </TabsTrigger>
          <TabsTrigger value="directives" className="gap-1.5 text-xs">
            <ScrollText className="w-3.5 h-3.5" /> Directives
          </TabsTrigger>
        </TabsList>

        {/* ─── DISCUSS TAB ─── */}
        <TabsContent value="discuss">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Past topics sidebar */}
            <Card className="lg:col-span-1 border border-border">
              <CardContent className="p-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" /> Past Discussions
                </h3>
                <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                  {pastTopics.length === 0 && (
                    <p className="text-xs text-muted-foreground">No past discussions</p>
                  )}
                  {pastTopics.map((t) => (
                    <button
                      key={t.discussion_id}
                      onClick={() => handleFollowUp(t.discussion_id, t.topic)}
                      disabled={isLoading}
                      className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <p className="text-xs font-medium truncate">{t.topic}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Main discussion area */}
            <Card className="lg:col-span-3 border border-border overflow-hidden">
              <CardContent className="p-0">
                <ScrollArea className="h-[450px]" ref={scrollRef}>
                  <div className="p-4 space-y-3">
                    {messages.length === 0 && !isLoading && (
                      <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
                        <Users className="w-12 h-12 mb-4 opacity-30" />
                        <p className="text-sm font-medium">No discussion yet</p>
                        <p className="text-xs mt-1">Type a topic — agents now remember past conversations & directives</p>
                      </div>
                    )}

                    {messages.length > 0 && (
                      <div className="text-center py-2">
                        <Badge variant="outline" className="text-xs">Topic: {messages[0]?.topic}</Badge>
                      </div>
                    )}

                    {messages.map((msg) => {
                      const agent = getAgentMeta(msg.employee_id);
                      return (
                        <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                          <div className={cn("w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-sm bg-gradient-to-br text-white", agent.gradient)}>
                            {agent.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-medium">{agent.name}</span>
                              {msg.confidence !== null && (
                                <Badge variant="secondary" className="text-[9px] px-1 py-0">{Math.round(msg.confidence * 100)}%</Badge>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/90 leading-relaxed">{msg.position}</p>
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
                        placeholder="Enter a topic for discussion..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        disabled={isLoading}
                        className="flex-1 resize-none min-h-[44px] max-h-[120px] text-sm bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-2"
                      />
                      <AnimatePresence>
                        {input.trim() && !isLoading && (
                          <motion.button
                            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                            onClick={handleSend}
                            className="shrink-0 w-9 h-9 rounded-lg bg-foreground text-background flex items-center justify-center hover:opacity-90"
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
        </TabsContent>

        {/* ─── COMMAND TAB ─── */}
        <TabsContent value="command">
          <Card className="border border-border">
            <CardContent className="p-4 space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">Syntax: <code className="text-foreground">@agent command</code></p>
                <div className="flex flex-wrap gap-1.5">
                  {['sales', 'investigator', 'marketing', 'security', 'lawyer', 'advisor', 'qa', 'followup', 'customer'].map(a => (
                    <Badge key={a} variant="outline" className="text-[10px] cursor-pointer hover:bg-muted" onClick={() => setInput(`@${a} `)}>
                      @{a}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="relative bg-muted/50 border border-border rounded-xl overflow-hidden">
                <div className="flex items-end gap-2 p-2">
                  <Textarea
                    placeholder="@sales prospect 10 Canadian engineering firms..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={isLoading}
                    className="flex-1 resize-none min-h-[60px] max-h-[120px] text-sm bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-2 font-mono"
                  />
                  <AnimatePresence>
                    {input.trim() && !isLoading && (
                      <motion.button
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        onClick={handleSend}
                        className="shrink-0 w-9 h-9 rounded-lg bg-foreground text-background flex items-center justify-center hover:opacity-90"
                      >
                        <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {isLoading && (
                <div className="flex items-center gap-3 py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Executing command...</span>
                </div>
              )}

              {commandResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className={cn("border", commandResult.error ? "border-destructive/50 bg-destructive/5" : "border-emerald-500/30 bg-emerald-500/5")}>
                    <CardContent className="p-4">
                      {commandResult.error ? (
                        <p className="text-sm text-destructive">{commandResult.error}</p>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{commandResult.agent_name}</Badge>
                            <Badge variant="outline" className="text-emerald-600">✓ Executed</Badge>
                          </div>
                          <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-auto max-h-[300px] whitespace-pre-wrap">
                            {JSON.stringify(commandResult.result, null, 2)}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── DIRECTIVES TAB ─── */}
        <TabsContent value="directives">
          <Card className="border border-border">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">Standing Orders</h3>
                <p className="text-xs text-muted-foreground ml-auto">Injected into every agent's prompt</p>
              </div>

              {/* Add new directive */}
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Focus only on Canada..."
                  value={newDirective}
                  onChange={(e) => setNewDirective(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddDirective()}
                  className="flex-1 text-sm"
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="px-2 py-1 rounded-md border border-border bg-background text-sm"
                >
                  <option value="general">General</option>
                  <option value="geo">Geography</option>
                  <option value="strategy">Strategy</option>
                  <option value="outreach">Outreach</option>
                  <option value="budget">Budget</option>
                </select>
                <Button size="sm" onClick={handleAddDirective} disabled={!newDirective.trim()}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>

              {/* Active directives */}
              <div className="space-y-2">
                {directives.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No active directives</p>
                )}
                {directives.filter(d => d.is_active).map((d) => (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card"
                  >
                    <Badge variant="outline" className={cn("text-[10px] shrink-0 mt-0.5", CATEGORY_COLORS[d.category] || CATEGORY_COLORS.general)}>
                      P{d.priority} · {d.category}
                    </Badge>
                    <p className="text-sm flex-1">{d.directive}</p>
                    <Button
                      variant="ghost" size="icon"
                      className="w-7 h-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteDirective(d.id)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
