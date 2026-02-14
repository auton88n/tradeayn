import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Users, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AI_WORKFORCE } from './types';
import { ApprovalQueue } from './ApprovalQueue';
import { TeamFeedPanel } from './TeamFeedPanel';
import { AgentStatusStrip } from './AgentStatusStrip';
import { HealthStatusPanel } from './HealthStatusPanel';

export const WorkforceDashboard = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [totalActions, setTotalActions] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [healthyCount, setHealthyCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [{ data: activities }, { data: tasks }, { data: healthChecks }] = await Promise.all([
        supabase.from('ayn_activity_log').select('id').gte('created_at', weekAgo),
        supabase.from('employee_tasks').select('status').in('status', ['pending', 'in_progress']),
        supabase.from('system_health_checks').select('function_name, is_healthy').order('checked_at', { ascending: false }).limit(20),
      ]);

      setTotalActions(activities?.length || 0);
      setTotalPending(tasks?.length || 0);

      const fnMap = new Map<string, boolean>();
      for (const h of healthChecks || []) {
        if (!fnMap.has(h.function_name)) fnMap.set(h.function_name, Boolean(h.is_healthy));
      }
      setHealthyCount(Array.from(fnMap.values()).filter(Boolean).length);
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">AI Workforce</h2>
          <p className="text-sm text-muted-foreground">Live team feed — see what your agents are doing right now</p>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
          <Zap className="w-4 h-4 text-primary" />
          <div>
            <p className="text-lg font-bold text-foreground">{totalActions}</p>
            <p className="text-[10px] text-muted-foreground">Actions (7d)</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <div>
            <p className="text-lg font-bold text-foreground">{totalPending}</p>
            <p className="text-[10px] text-muted-foreground">Pending Tasks</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <div>
            <p className="text-lg font-bold text-foreground">{healthyCount}</p>
            <p className="text-[10px] text-muted-foreground">Systems Healthy</p>
          </div>
        </div>
      </div>

      {/* Agent Status Strip */}
      <AgentStatusStrip selectedEmployee={selectedEmployee} onSelect={setSelectedEmployee} />

      {/* Approval Queue */}
      <ApprovalQueue selectedEmployee={selectedEmployee} />

      {/* Team Feed */}
      <TeamFeedPanel selectedEmployee={selectedEmployee} />

      {/* System Health (compact, at bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HealthStatusPanel />
      </div>
    </div>
  );
};
