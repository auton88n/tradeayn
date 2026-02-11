import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { AI_WORKFORCE } from './types';

interface ActivityEntry {
  id: string;
  action_type: string;
  summary: string;
  triggered_by: string;
  created_at: string;
}

const getEmployee = (id: string) => AI_WORKFORCE.find(e => e.triggeredBy === id);

export const ActivityFeedPanel = ({ selectedEmployee }: { selectedEmployee?: string }) => {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    const fetch = async () => {
      let query = supabase
        .from('ayn_activity_log')
        .select('id, action_type, summary, triggered_by, created_at')
        .order('created_at', { ascending: false })
        .limit(30);

      if (selectedEmployee && selectedEmployee !== 'all') {
        query = query.eq('triggered_by', selectedEmployee);
      }

      const { data } = await query;
      if (data) setActivities(data as ActivityEntry[]);
    };
    fetch();

    // Subscribe to realtime
    const channel = supabase
      .channel('workforce-activity-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ayn_activity_log' }, (payload) => {
        const entry = payload.new as ActivityEntry;
        if (!selectedEmployee || selectedEmployee === 'all' || entry.triggered_by === selectedEmployee) {
          setActivities(prev => [entry, ...prev].slice(0, 30));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedEmployee]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Live Activity Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-2 pr-2">
            {activities.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">No recent activity</p>
            )}
            {activities.map(a => {
              const emp = getEmployee(a.triggered_by);
              return (
                <div key={a.id} className="flex items-start gap-2.5 py-2 border-b border-border/30 last:border-0">
                  <span className="text-sm mt-0.5">{emp?.emoji || '🤖'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium">{emp?.name || a.triggered_by}</span>
                      <Badge variant="outline" className="text-[10px]">{a.action_type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.summary}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {format(new Date(a.created_at), 'HH:mm')}
                  </span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
