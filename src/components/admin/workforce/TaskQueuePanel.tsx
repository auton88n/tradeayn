import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { AI_WORKFORCE } from './types';

interface Task {
  id: string;
  from_employee: string;
  to_employee: string;
  task_type: string;
  status: string;
  priority: string;
  created_at: string;
  completed_at: string | null;
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  normal: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  low: 'bg-muted text-muted-foreground',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  completed: 'bg-green-500/10 text-green-500 border-green-500/20',
  failed: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const getEmployeeEmoji = (id: string) => AI_WORKFORCE.find(e => e.triggeredBy === id)?.emoji || '🤖';

export const TaskQueuePanel = ({ selectedEmployee }: { selectedEmployee?: string }) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const fetch = async () => {
      let query = supabase
        .from('employee_tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (selectedEmployee && selectedEmployee !== 'all') {
        query = query.or(`from_employee.eq.${selectedEmployee},to_employee.eq.${selectedEmployee}`);
      }

      const { data } = await query;
      if (data) setTasks(data as Task[]);
    };
    fetch();
  }, [selectedEmployee]);

  const pending = tasks.filter(t => t.status === 'pending').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Task Queue</CardTitle>
          <div className="flex gap-1.5">
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/20">
              {pending} pending
            </Badge>
            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">
              {inProgress} active
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-2 pr-2">
            {tasks.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">No tasks in queue</p>
            )}
            {tasks.map(task => (
              <div key={task.id} className="p-2.5 rounded-lg border border-border/50 bg-muted/20">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span>{getEmployeeEmoji(task.from_employee)}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span>{getEmployeeEmoji(task.to_employee)}</span>
                    <span className="font-medium ml-1">{task.task_type.replace(/_/g, ' ')}</span>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${PRIORITY_COLORS[task.priority] || ''}`}>
                    {task.priority}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[task.status] || ''}`}>
                    {task.status}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(task.created_at), 'MMM d, HH:mm')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
