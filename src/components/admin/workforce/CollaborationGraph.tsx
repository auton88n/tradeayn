import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AI_WORKFORCE } from './types';

interface CollabEdge {
  from: string;
  to: string;
  count: number;
}

const getEmployee = (id: string) => AI_WORKFORCE.find(e => e.triggeredBy === id);

export const CollaborationGraph = () => {
  const [edges, setEdges] = useState<CollabEdge[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('employee_tasks')
        .select('from_employee, to_employee')
        .limit(500);

      if (data) {
        const map = new Map<string, number>();
        for (const d of data) {
          const key = `${d.from_employee}→${d.to_employee}`;
          map.set(key, (map.get(key) || 0) + 1);
        }
        const result: CollabEdge[] = [];
        map.forEach((count, key) => {
          const [from, to] = key.split('→');
          result.push({ from, to, count });
        });
        result.sort((a, b) => b.count - a.count);
        setEdges(result.slice(0, 10));
      }
    };
    fetch();
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Collaboration Map</CardTitle>
      </CardHeader>
      <CardContent>
        {edges.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No collaborations yet</p>
        ) : (
          <div className="space-y-2">
            {edges.map((edge, i) => {
              const from = getEmployee(edge.from);
              const to = getEmployee(edge.to);
              const maxCount = edges[0]?.count || 1;
              const widthPct = Math.max(20, (edge.count / maxCount) * 100);
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm w-6 text-center">{from?.emoji || '🤖'}</span>
                  <span className="text-[10px] text-muted-foreground w-5 text-center">→</span>
                  <span className="text-sm w-6 text-center">{to?.emoji || '🤖'}</span>
                  <div className="flex-1 h-4 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full flex items-center justify-end pr-1.5"
                      style={{ width: `${widthPct}%` }}
                    >
                      <span className="text-[9px] text-primary-foreground font-bold">{edge.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
