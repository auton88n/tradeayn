import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, Mail, Trash2, AlertTriangle, Terminal, 
  RefreshCw, ChevronDown, ChevronUp, Filter, Wrench
} from 'lucide-react';
import { format } from 'date-fns';

interface ActivityLog {
  id: string;
  action_type: string;
  summary: string;
  target_id: string | null;
  target_type: string | null;
  details: Record<string, unknown> | null;
  triggered_by: string;
  created_at: string;
}

const ACTION_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  reply: { icon: MessageSquare, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: 'Reply' },
  email: { icon: Mail, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', label: 'Email' },
  delete: { icon: Trash2, color: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'Delete' },
  alert: { icon: AlertTriangle, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', label: 'Alert' },
  command: { icon: Terminal, color: 'bg-violet-500/10 text-violet-500 border-violet-500/20', label: 'Command' },
  maintenance_activated: { icon: Wrench, color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', label: 'Maintenance' },
};

const FILTERS = ['all', 'reply', 'email', 'delete', 'alert', 'command', 'maintenance_activated'] as const;

export const AYNActivityLog = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from('ayn_activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (filter !== 'all') {
      query = query.eq('action_type', filter);
    }

    const { data, error } = await query;
    if (!error && data) {
      setLogs(data as ActivityLog[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();

    // Real-time subscription
    const channel = supabase
      .channel('ayn-activity-log-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ayn_activity_log' }, (payload) => {
        const newLog = payload.new as ActivityLog;
        if (filter === 'all' || newLog.action_type === filter) {
          setLogs(prev => [newLog, ...prev].slice(0, 200));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [filter]);

  const getConfig = (type: string) => ACTION_CONFIG[type] || ACTION_CONFIG.command;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AYN Activity Log</h2>
          <p className="text-sm text-muted-foreground">Everything AYN has done, in real-time</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {FILTERS.map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize text-xs"
          >
            {f === 'all' ? 'All' : (ACTION_CONFIG[f]?.label || f)}
          </Button>
        ))}
      </div>

      {/* Log entries */}
      <ScrollArea className="h-[calc(100vh-320px)]">
        <div className="space-y-2 pr-4">
          {logs.length === 0 && !loading && (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No activity logs found</CardContent></Card>
          )}
          {logs.map(log => {
            const config = getConfig(log.action_type);
            const Icon = config.icon;
            const isExpanded = expandedId === log.id;

            return (
              <Card key={log.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg border ${config.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-xs ${config.color}`}>
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          by {log.triggered_by}
                        </span>
                      </div>
                      <p className="text-sm mt-1 font-medium">{log.summary}</p>
                      
                      {log.details && Object.keys(log.details).length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-6 px-2 text-xs text-muted-foreground"
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                          Details
                        </Button>
                      )}
                      
                      {isExpanded && log.details && (
                        <pre className="mt-2 p-3 bg-muted/50 rounded-lg text-xs overflow-auto max-h-40">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
