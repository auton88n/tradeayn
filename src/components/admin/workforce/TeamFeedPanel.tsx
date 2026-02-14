import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { AI_WORKFORCE } from './types';

interface FeedEntry {
  id: string;
  type: 'message' | 'activity';
  emoji: string;
  agentName: string;
  content: string;
  timestamp: string;
  actionType?: string;
}

const getEmployee = (id: string) => AI_WORKFORCE.find(e => e.triggeredBy === id || e.id === id);

export const TeamFeedPanel = ({ selectedEmployee }: { selectedEmployee: string }) => {
  const [entries, setEntries] = useState<FeedEntry[]>([]);

  const fetchFeed = async () => {
    const dayAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // Fetch both data sources in parallel
    const [convResult, actResult] = await Promise.all([
      supabase
        .from('admin_ai_conversations')
        .select('id, message, context, created_at')
        .eq('role', 'assistant')
        .gte('created_at', dayAgo)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('ayn_activity_log')
        .select('id, action_type, summary, triggered_by, created_at')
        .gte('created_at', dayAgo)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    const feed: FeedEntry[] = [];

    // Add conversation messages
    for (const c of (convResult.data || []) as Array<{ id: string; message: string; context: Record<string, unknown> | null; created_at: string }>) {
      const ctx = c.context as Record<string, unknown> | null;
      const empId = (ctx?.employee_id as string) || (ctx?.triggered_by as string) || 'system';
      const emp = getEmployee(empId);
      
      if (selectedEmployee && selectedEmployee !== 'all' && empId !== selectedEmployee) continue;

      feed.push({
        id: `msg-${c.id}`,
        type: 'message',
        emoji: emp?.emoji || '🤖',
        agentName: emp?.name || empId,
        content: c.message,
        timestamp: c.created_at,
      });
    }

    // Add activity entries
    for (const a of (actResult.data || []) as Array<{ id: string; action_type: string; summary: string; triggered_by: string; created_at: string }>) {
      if (selectedEmployee && selectedEmployee !== 'all' && a.triggered_by !== selectedEmployee) continue;
      const emp = getEmployee(a.triggered_by);
      feed.push({
        id: `act-${a.id}`,
        type: 'activity',
        emoji: emp?.emoji || '🤖',
        agentName: emp?.name || a.triggered_by,
        content: a.summary,
        timestamp: a.created_at,
        actionType: a.action_type,
      });
    }

    // Sort by time descending
    feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setEntries(feed.slice(0, 60));
  };

  useEffect(() => {
    fetchFeed();

    // Real-time subscriptions
    const channel = supabase
      .channel('team-feed-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_ai_conversations' }, () => {
        fetchFeed();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ayn_activity_log' }, () => {
        fetchFeed();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedEmployee]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Team Feed</h3>
        <span className="text-[10px] text-muted-foreground">Live updates from your AI team</span>
      </div>
      <ScrollArea className="h-[420px]">
        <div className="space-y-1 pr-2">
          {entries.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No activity yet. Your agents will appear here when they start working.</p>
            </div>
          )}
          {entries.map(entry => (
            <div
              key={entry.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50 ${
                entry.type === 'message' ? 'bg-muted/20' : ''
              }`}
            >
              <span className="text-base mt-0.5 shrink-0">{entry.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-foreground">{entry.agentName}</span>
                  {entry.type === 'activity' && entry.actionType && (
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-0.5">
                      <Zap className="w-2 h-2" />
                      {entry.actionType}
                    </Badge>
                  )}
                  {entry.type === 'message' && (
                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                      message
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-foreground/70 leading-relaxed">
                  {entry.type === 'message' ? `"${entry.content}"` : entry.content}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-1">
                {format(new Date(entry.timestamp), 'HH:mm')}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
