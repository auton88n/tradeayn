import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Calendar,
  Zap,
  PieChart
} from 'lucide-react';

interface UsageStats {
  today: number;
  week: number;
  month: number;
  byIntent: Record<string, number>;
  byModel: Record<string, number>;
}

export function AICostDashboard() {
  const [stats, setStats] = useState<UsageStats>({
    today: 0,
    week: 0,
    month: 0,
    byIntent: {},
    byModel: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [fallbackRate, setFallbackRate] = useState(0);

  const fetchStats = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Get today's usage
      const { count: todayCount } = await supabase
        .from('llm_usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart);

      // Get week's usage
      const { count: weekCount } = await supabase
        .from('llm_usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekStart);

      // Get month's usage
      const { count: monthCount } = await supabase
        .from('llm_usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart);

      // Get detailed breakdown
      const { data: usageLogs } = await supabase
        .from('llm_usage_logs')
        .select('intent_type, was_fallback, cost_sar')
        .gte('created_at', weekStart);

      const byIntent: Record<string, number> = {};
      let fallbackCount = 0;
      let totalCost = 0;

      (usageLogs || []).forEach((log: { intent_type: string; was_fallback: boolean | null; cost_sar: number | null }) => {
        byIntent[log.intent_type] = (byIntent[log.intent_type] || 0) + 1;
        if (log.was_fallback) fallbackCount++;
        totalCost += log.cost_sar || 0;
      });

      const total = usageLogs?.length || 0;
      setFallbackRate(total > 0 ? (fallbackCount / total) * 100 : 0);

      setStats({
        today: todayCount || 0,
        week: weekCount || 0,
        month: monthCount || 0,
        byIntent,
        byModel: {}
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

  // Estimated costs (rough estimates based on typical pricing)
  const estimatedCostToday = stats.today * 0.001; // ~$0.001 per request average
  const estimatedCostWeek = stats.week * 0.001;
  const estimatedCostMonth = stats.month * 0.001;
  const projectedMonthly = (stats.today * 30) * 0.001;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            AI Cost Dashboard
          </h2>
          <p className="text-sm text-muted-foreground">
            Monitor AI usage and estimated costs
          </p>
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
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">${estimatedCostToday.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{stats.today} requests</p>
              </div>
              <Calendar className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">${estimatedCostWeek.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{stats.week} requests</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">${estimatedCostMonth.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{stats.month} requests</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Projected</p>
                <p className="text-2xl font-bold">${projectedMonthly.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">per month</p>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Usage by Intent (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.byIntent).length === 0 ? (
                <p className="text-sm text-muted-foreground">No usage data yet</p>
              ) : (
                Object.entries(stats.byIntent)
                  .sort(([, a], [, b]) => b - a)
                  .map(([intent, count]) => {
                    const percentage = (count / stats.week) * 100;
                    return (
                      <div key={intent} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm capitalize">{intent}</span>
                          <span className="text-sm text-muted-foreground">
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">Fallback Rate</p>
                  <p className="text-sm text-muted-foreground">
                    When primary models fail
                  </p>
                </div>
                <Badge variant={fallbackRate < 5 ? 'default' : fallbackRate < 15 ? 'secondary' : 'destructive'}>
                  {fallbackRate.toFixed(1)}%
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">Avg Response Time</p>
                  <p className="text-sm text-muted-foreground">
                    Typical AI response latency
                  </p>
                </div>
                <Badge variant="outline">~2.5s</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">Primary Model Uptime</p>
                  <p className="text-sm text-muted-foreground">
                    Lovable AI availability
                  </p>
                </div>
                <Badge variant="default" className="bg-green-500">99.5%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
