import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface HealthCheck {
  function_name: string;
  is_healthy: boolean;
  response_time_ms: number | null;
  checked_at: string;
  error_message: string | null;
}

export const HealthStatusPanel = () => {
  const [checks, setChecks] = useState<HealthCheck[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('system_health_checks')
        .select('function_name, is_healthy, response_time_ms, checked_at, error_message')
        .order('checked_at', { ascending: false })
        .limit(20);
      if (data) {
        // Deduplicate by function_name, keeping the latest
        const map = new Map<string, HealthCheck>();
        for (const d of data as HealthCheck[]) {
          if (!map.has(d.function_name)) map.set(d.function_name, d);
        }
        setChecks(Array.from(map.values()));
      }
    };
    fetch();
  }, []);

  const healthy = checks.filter(c => c.is_healthy === true).length;
  const total = checks.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">System Health</CardTitle>
          <Badge variant={healthy === total ? 'default' : 'destructive'} className="text-xs">
            {healthy}/{total} Healthy
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {checks.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No health checks yet</p>
        )}
        {checks.map(c => (
          <div key={c.function_name} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
            <div className="flex items-center gap-2">
              {c.is_healthy ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-destructive" />
              )}
              <span className="text-xs font-medium">{c.function_name}</span>
            </div>
            <div className="flex items-center gap-2">
              {c.response_time_ms !== null && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {c.response_time_ms}ms
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">
                {format(new Date(c.checked_at), 'HH:mm')}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
