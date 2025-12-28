import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Calendar,
  Zap,
  PieChart,
  Activity,
  CheckCircle,
  Clock
} from 'lucide-react';

interface UsageStats {
  today: number;
  week: number;
  month: number;
  byIntent: Record<string, number>;
  byModel: Record<string, number>;
  avgResponseTime: number | null;
  successRate: number | null;
  totalCost: number;
}

export function AICostDashboard() {
  const [stats, setStats] = useState<UsageStats>({
    today: 0,
    week: 0,
    month: 0,
    byIntent: {},
    byModel: {},
    avgResponseTime: null,
    successRate: null,
    totalCost: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [fallbackRate, setFallbackRate] = useState<number | null>(null);

  const fetchStats = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { count: todayCount } = await supabase
        .from('llm_usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart);

      const { count: weekCount } = await supabase
        .from('llm_usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekStart);

      const { count: monthCount } = await supabase
        .from('llm_usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart);

      const { data: usageLogs } = await supabase
        .from('llm_usage_logs')
        .select('intent_type, was_fallback, cost_sar, response_time_ms')
        .gte('created_at', weekStart);

      const { count: failureCount } = await supabase
        .from('llm_failures')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekStart);

      const byIntent: Record<string, number> = {};
      let fallbackCount = 0;
      let totalCost = 0;
      let totalResponseTime = 0;
      let responseTimeCount = 0;

      (usageLogs || []).forEach((log: { intent_type: string; was_fallback: boolean | null; cost_sar: number | null; response_time_ms: number | null }) => {
        byIntent[log.intent_type] = (byIntent[log.intent_type] || 0) + 1;
        if (log.was_fallback) fallbackCount++;
        totalCost += log.cost_sar || 0;
        if (log.response_time_ms) {
          totalResponseTime += log.response_time_ms;
          responseTimeCount++;
        }
      });

      const total = usageLogs?.length || 0;
      const avgResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : null;
      const successRate = total > 0 ? ((total - (failureCount || 0)) / (total + (failureCount || 0))) * 100 : null;
      
      setFallbackRate(total > 0 ? (fallbackCount / total) * 100 : null);

      setStats({
        today: todayCount || 0,
        week: weekCount || 0,
        month: monthCount || 0,
        byIntent,
        byModel: {},
        avgResponseTime,
        successRate,
        totalCost
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load cost data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const estimatedCostToday = stats.today * 0.001;
  const estimatedCostWeek = stats.week * 0.001;
  const estimatedCostMonth = stats.month * 0.001;
  const projectedMonthly = (stats.today * 30) * 0.001;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <DollarSign className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">AI Cost Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              Monitor AI usage and estimated costs
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => { setIsLoading(true); fetchStats(); }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Cost Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Today', value: `$${estimatedCostToday.toFixed(2)}`, sub: `${stats.today} requests`, icon: Calendar },
          { label: 'This Week', value: `$${estimatedCostWeek.toFixed(2)}`, sub: `${stats.week} requests`, icon: TrendingUp },
          { label: 'This Month', value: `$${estimatedCostMonth.toFixed(2)}`, sub: `${stats.month} requests`, icon: DollarSign },
          { label: 'Projected', value: `$${projectedMonthly.toFixed(2)}`, sub: 'per month', icon: TrendingDown },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border border-border bg-card">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Usage Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="w-4 h-4 text-muted-foreground" />
              Usage by Intent (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.byIntent).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No usage data yet</p>
              ) : (
                Object.entries(stats.byIntent)
                  .sort(([, a], [, b]) => b - a)
                  .map(([intent, count]) => {
                    const percentage = (count / stats.week) * 100;
                    return (
                      <div key={intent} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{intent}</span>
                          <span className="text-sm text-muted-foreground">
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-muted-foreground" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { 
                  label: 'Fallback Rate', 
                  desc: 'When primary models fail',
                  value: fallbackRate !== null ? `${fallbackRate.toFixed(1)}%` : 'No data',
                  status: fallbackRate !== null ? (fallbackRate < 5 ? 'success' : fallbackRate < 15 ? 'warning' : 'error') : 'neutral',
                  icon: Activity
                },
                { 
                  label: 'Avg Response Time', 
                  desc: 'Typical AI response latency',
                  value: stats.avgResponseTime !== null ? `${(stats.avgResponseTime / 1000).toFixed(1)}s` : 'No data',
                  status: 'neutral',
                  icon: Clock
                },
                { 
                  label: 'Success Rate', 
                  desc: 'Successful AI responses',
                  value: stats.successRate !== null ? `${stats.successRate.toFixed(1)}%` : 'No data',
                  status: stats.successRate !== null ? (stats.successRate >= 95 ? 'success' : stats.successRate >= 80 ? 'warning' : 'error') : 'neutral',
                  icon: CheckCircle
                },
              ].map((item) => {
                const Icon = item.icon;
                const statusColors: Record<string, string> = {
                  success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                  warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                  error: 'bg-red-500/10 text-red-600 border-red-500/20',
                  neutral: 'bg-muted text-muted-foreground border-border'
                };
                
                return (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-background">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusColors[item.status]}>
                      {item.value}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
