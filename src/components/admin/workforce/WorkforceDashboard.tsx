import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Users, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AI_WORKFORCE } from './types';
import { EmployeeCard } from './EmployeeCard';
import { HealthStatusPanel } from './HealthStatusPanel';
import { TaskQueuePanel } from './TaskQueuePanel';
import { ActivityFeedPanel } from './ActivityFeedPanel';
import { CollaborationGraph } from './CollaborationGraph';

interface EmployeeStats {
  triggeredBy: string;
  activityCount: number;
  lastActive: string | null;
  pendingTasks: number;
  isHealthy: boolean | null;
}

export const WorkforceDashboard = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [stats, setStats] = useState<Map<string, EmployeeStats>>(new Map());
  const [totalActions, setTotalActions] = useState(0);
  const [totalPending, setTotalPending] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      // Fetch activity counts per employee (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [{ data: activities }, { data: tasks }, { data: healthChecks }] = await Promise.all([
        supabase
          .from('ayn_activity_log')
          .select('triggered_by, created_at')
          .gte('created_at', weekAgo),
        supabase
          .from('employee_tasks')
          .select('from_employee, to_employee, status'),
        supabase
          .from('system_health_checks')
          .select('function_name, is_healthy')
          .order('checked_at', { ascending: false })
          .limit(20),
      ]);

      const map = new Map<string, EmployeeStats>();

      // Initialize all employees
      for (const emp of AI_WORKFORCE) {
        map.set(emp.triggeredBy, {
          triggeredBy: emp.triggeredBy,
          activityCount: 0,
          lastActive: null,
          pendingTasks: 0,
          isHealthy: null,
        });
      }

      // Count activities
      let total = 0;
      for (const a of activities || []) {
        total++;
        const s = map.get(a.triggered_by);
        if (s) {
          s.activityCount++;
          if (!s.lastActive || a.created_at > s.lastActive) {
            s.lastActive = a.created_at;
          }
        }
      }
      setTotalActions(total);

      // Count pending tasks per employee
      let pendingTotal = 0;
      for (const t of tasks || []) {
        if (t.status === 'pending' || t.status === 'in_progress') {
          pendingTotal++;
          const s = map.get(t.to_employee);
          if (s) s.pendingTasks++;
        }
      }
      setTotalPending(pendingTotal);

      // Map health checks to employees (heuristic: function name contains employee id)
      const healthMap = new Map<string, boolean>();
      for (const h of healthChecks || []) {
        if (!healthMap.has(h.function_name)) {
          healthMap.set(h.function_name, Boolean(h.is_healthy));
        }
      }
      // Map functions to employees based on naming
      for (const [fn, healthy] of healthMap) {
        for (const emp of AI_WORKFORCE) {
          if (fn.includes(emp.triggeredBy.replace('_', '-')) || fn.includes(emp.id)) {
            const s = map.get(emp.triggeredBy);
            if (s) s.isHealthy = healthy;
          }
        }
      }

      setStats(map);
    };

    fetchStats();
  }, []);

  const healthyCount = Array.from(stats.values()).filter(s => s.isHealthy === true).length;
  const _unhealthyCount = Array.from(stats.values()).filter(s => s.isHealthy === false).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">AI Workforce Dashboard</h2>
        <p className="text-sm text-muted-foreground">Real-time overview of all 10 AI employees</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
          <Users className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xl font-bold">{AI_WORKFORCE.length}</p>
            <p className="text-xs text-muted-foreground">Employees</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
          <Zap className="w-5 h-5 text-amber-500" />
          <div>
            <p className="text-xl font-bold">{totalActions}</p>
            <p className="text-xs text-muted-foreground">Actions (7d)</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <div>
            <p className="text-xl font-bold">{healthyCount}</p>
            <p className="text-xs text-muted-foreground">Healthy</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <div>
            <p className="text-xl font-bold">{totalPending}</p>
            <p className="text-xs text-muted-foreground">Pending Tasks</p>
          </div>
        </div>
      </div>

      {/* Employee Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Employees</h3>
          {selectedEmployee !== 'all' && (
            <Badge
              variant="outline"
              className="cursor-pointer text-xs"
              onClick={() => setSelectedEmployee('all')}
            >
              Clear filter ×
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {AI_WORKFORCE.map(emp => {
            const s = stats.get(emp.triggeredBy);
            return (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                activityCount={s?.activityCount || 0}
                lastActive={s?.lastActive || null}
                pendingTasks={s?.pendingTasks || 0}
                isHealthy={s?.isHealthy ?? null}
                onClick={() => setSelectedEmployee(selectedEmployee === emp.triggeredBy ? 'all' : emp.triggeredBy)}
                isSelected={selectedEmployee === emp.triggeredBy}
              />
            );
          })}
        </div>
      </div>

      {/* Bottom Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActivityFeedPanel selectedEmployee={selectedEmployee} />
        <TaskQueuePanel selectedEmployee={selectedEmployee} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HealthStatusPanel />
        <CollaborationGraph />
      </div>
    </div>
  );
};
