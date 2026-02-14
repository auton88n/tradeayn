import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AI_WORKFORCE } from './types';
import { cn } from '@/lib/utils';

interface AgentHealth {
  triggeredBy: string;
  isHealthy: boolean | null;
  lastActive: string | null;
}

export const AgentStatusStrip = ({
  selectedEmployee,
  onSelect,
}: {
  selectedEmployee: string;
  onSelect: (id: string) => void;
}) => {
  const [healthMap, setHealthMap] = useState<Map<string, AgentHealth>>(new Map());

  useEffect(() => {
    const fetchHealth = async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [{ data: healthChecks }, { data: activities }] = await Promise.all([
        supabase
          .from('system_health_checks')
          .select('function_name, is_healthy')
          .order('checked_at', { ascending: false })
          .limit(20),
        supabase
          .from('ayn_activity_log')
          .select('triggered_by, created_at')
          .gte('created_at', weekAgo)
          .order('created_at', { ascending: false }),
      ]);

      const map = new Map<string, AgentHealth>();
      for (const emp of AI_WORKFORCE) {
        map.set(emp.triggeredBy, { triggeredBy: emp.triggeredBy, isHealthy: null, lastActive: null });
      }

      // Map health checks
      const fnHealth = new Map<string, boolean>();
      for (const h of healthChecks || []) {
        if (!fnHealth.has(h.function_name)) fnHealth.set(h.function_name, Boolean(h.is_healthy));
      }
      for (const [fn, healthy] of fnHealth) {
        for (const emp of AI_WORKFORCE) {
          if (fn.includes(emp.triggeredBy.replace('_', '-')) || fn.includes(emp.id)) {
            const s = map.get(emp.triggeredBy);
            if (s) s.isHealthy = healthy;
          }
        }
      }

      // Map last active
      for (const a of activities || []) {
        const s = map.get(a.triggered_by);
        if (s && (!s.lastActive || a.created_at > s.lastActive)) {
          s.lastActive = a.created_at;
        }
      }

      setHealthMap(map);
    };
    fetchHealth();
  }, []);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agent Status</h3>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => onSelect('all')}
          className={cn(
            'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border',
            selectedEmployee === 'all'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-muted/30 text-foreground/70 border-border hover:bg-muted/60'
          )}
        >
          All
        </button>
        {AI_WORKFORCE.map(emp => {
          const health = healthMap.get(emp.triggeredBy);
          const isSelected = selectedEmployee === emp.triggeredBy;
          const dotColor = health?.isHealthy === true
            ? 'bg-green-500'
            : health?.isHealthy === false
            ? 'bg-destructive'
            : 'bg-muted-foreground/40';

          return (
            <button
              key={emp.id}
              onClick={() => onSelect(isSelected ? 'all' : emp.triggeredBy)}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border',
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/30 text-foreground/70 border-border hover:bg-muted/60'
              )}
            >
              <span className="text-sm">{emp.emoji}</span>
              <span className="hidden sm:inline">{emp.name.split(' ')[0]}</span>
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />
            </button>
          );
        })}
      </div>
    </div>
  );
};
