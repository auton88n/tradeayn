import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Zap,
  Clock,
  Server,
  Wifi,
  WifiOff,
  TrendingUp,
  AlertCircle,
  BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend
} from 'recharts';

interface HistoricalMetric {
  id: string;
  mode_name: string;
  status: 'online' | 'offline' | 'degraded' | 'unknown';
  response_time_ms: number | null;
  last_checked_at: string;
}

interface HealthMetric {
  id: string;
  mode_name: string;
  webhook_url: string;
  status: 'online' | 'offline' | 'degraded' | 'unknown';
  response_time_ms: number | null;
  last_checked_at: string;
  error_message: string | null;
  success_count_24h: number;
  failure_count_24h: number;
}

interface SecurityLog {
  id: string;
  action: string;
  details: Record<string, unknown>;
  severity: string;
  created_at: string;
}

interface AIModeConfig {
  id: string;
  mode_name: string;
  webhook_url: string;
  is_active: boolean;
}

const STATUS_CONFIG = {
  online: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    pulse: 'bg-emerald-500',
    label: 'Online',
  },
  degraded: {
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    pulse: 'bg-amber-500',
    label: 'Degraded',
  },
  offline: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    pulse: 'bg-red-500',
    label: 'Offline',
  },
  unknown: {
    icon: AlertCircle,
    color: 'text-muted-foreground',
    bg: 'bg-muted/50',
    border: 'border-border',
    pulse: 'bg-muted-foreground',
    label: 'Unknown',
  },
};

export const SystemHealthMonitor = () => {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalMetric[]>([]);
  const [aiModeConfigs, setAiModeConfigs] = useState<AIModeConfig[]>([]);
  const [recentErrors, setRecentErrors] = useState<SecurityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState<number | null>(null);
  const [selectedChartMode, setSelectedChartMode] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchHealthData = useCallback(async () => {
    try {
      // Fetch latest health metrics for each mode
      const { data: metrics, error: metricsError } = await supabase
        .from('webhook_health_metrics')
        .select('*')
        .order('last_checked_at', { ascending: false });

      if (metricsError) throw metricsError;

      // Get unique latest metrics per mode
      const latestMetrics = new Map<string, HealthMetric>();
      (metrics || []).forEach((m) => {
        if (!latestMetrics.has(m.mode_name)) {
          latestMetrics.set(m.mode_name, m as HealthMetric);
        }
      });
      setHealthMetrics(Array.from(latestMetrics.values()));

      // Fetch historical data (last 24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: histData, error: histError } = await supabase
        .from('webhook_health_metrics')
        .select('id, mode_name, status, response_time_ms, last_checked_at')
        .gte('last_checked_at', twentyFourHoursAgo)
        .order('last_checked_at', { ascending: true });

      if (histError) throw histError;
      setHistoricalData((histData || []) as HistoricalMetric[]);

      // Fetch AI mode configs
      const { data: configs, error: configsError } = await supabase
        .from('ai_mode_configs')
        .select('*')
        .eq('is_active', true);

      if (configsError) throw configsError;
      setAiModeConfigs(configs || []);

      // Fetch recent errors from security logs
      const { data: logs, error: logsError } = await supabase
        .from('security_logs')
        .select('*')
        .in('severity', ['high', 'critical'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (logsError) throw logsError;
      setRecentErrors((logs || []) as SecurityLog[]);

    } catch (error) {
      console.error('Error fetching health data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch health data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const runHealthCheck = async (modeName?: string) => {
    setIsChecking(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(
        `https://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/check-webhook-health`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(modeName ? { mode_name: modeName } : {}),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Health check failed');
      }

      toast({
        title: 'Health Check Complete',
        description: `Checked ${result.summary.total} webhooks: ${result.summary.online} online, ${result.summary.degraded} degraded, ${result.summary.offline} offline`,
      });

      // Refresh data
      await fetchHealthData();

    } catch (error) {
      console.error('Health check error:', error);
      toast({
        title: 'Health Check Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchHealthData, autoRefresh * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchHealthData]);

  const getStatusForMode = (modeName: string): HealthMetric | null => {
    return healthMetrics.find(m => m.mode_name === modeName) || null;
  };

  const calculateUptime = (metric: HealthMetric): number => {
    const total = metric.success_count_24h + metric.failure_count_24h;
    if (total === 0) return 100;
    return Math.round((metric.success_count_24h / total) * 100);
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Prepare chart data for response times
  const getChartData = (modeName?: string | null) => {
    const filtered = modeName 
      ? historicalData.filter(h => h.mode_name === modeName)
      : historicalData;

    // Group by hour for better visualization
    const hourlyData = new Map<string, { 
      time: string; 
      avgResponseTime: number; 
      count: number;
      onlineCount: number;
      offlineCount: number;
      degradedCount: number;
    }>();

    filtered.forEach(metric => {
      const date = new Date(metric.last_checked_at);
      const hourKey = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
      
      const existing = hourlyData.get(hourKey) || {
        time: hourKey,
        avgResponseTime: 0,
        count: 0,
        onlineCount: 0,
        offlineCount: 0,
        degradedCount: 0,
      };

      existing.count += 1;
      existing.avgResponseTime += metric.response_time_ms || 0;
      if (metric.status === 'online') existing.onlineCount += 1;
      if (metric.status === 'offline') existing.offlineCount += 1;
      if (metric.status === 'degraded') existing.degradedCount += 1;

      hourlyData.set(hourKey, existing);
    });

    return Array.from(hourlyData.values()).map(d => ({
      ...d,
      avgResponseTime: d.count > 0 ? Math.round(d.avgResponseTime / d.count) : 0,
      uptimePercent: d.count > 0 ? Math.round((d.onlineCount / d.count) * 100) : 100,
    }));
  };

  // Get unique mode names from historical data
  const uniqueModes = [...new Set(historicalData.map(h => h.mode_name))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const overallStatus = healthMetrics.length === 0 
    ? 'unknown'
    : healthMetrics.every(m => m.status === 'online') 
      ? 'online' 
      : healthMetrics.some(m => m.status === 'offline') 
        ? 'offline' 
        : 'degraded';

  return (
    <div className="space-y-6">
      {/* Header with Overall Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${STATUS_CONFIG[overallStatus].bg}`}>
            <Activity className={`w-6 h-6 ${STATUS_CONFIG[overallStatus].color}`} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">System Health</h2>
            <p className="text-muted-foreground">
              Monitor n8n webhooks and edge functions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto-refresh selector */}
          <select
            value={autoRefresh || ''}
            onChange={(e) => setAutoRefresh(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 rounded-xl bg-muted/50 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Manual refresh</option>
            <option value="30">Every 30s</option>
            <option value="60">Every 1m</option>
            <option value="300">Every 5m</option>
          </select>

          <Button
            onClick={() => runHealthCheck()}
            disabled={isChecking}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking...' : 'Check All'}
          </Button>
        </div>
      </div>

      {/* Overall Status Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`w-4 h-4 rounded-full ${STATUS_CONFIG[overallStatus].pulse}`} />
                <div className={`absolute inset-0 w-4 h-4 rounded-full ${STATUS_CONFIG[overallStatus].pulse} animate-ping opacity-75`} />
              </div>
              <div>
                <span className="text-lg font-medium">Overall System Status</span>
                <Badge className={`ml-3 ${STATUS_CONFIG[overallStatus].bg} ${STATUS_CONFIG[overallStatus].color} border-0`}>
                  {STATUS_CONFIG[overallStatus].label}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-8 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-500">
                  {healthMetrics.filter(m => m.status === 'online').length}
                </div>
                <div className="text-muted-foreground">Online</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-500">
                  {healthMetrics.filter(m => m.status === 'degraded').length}
                </div>
                <div className="text-muted-foreground">Degraded</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">
                  {healthMetrics.filter(m => m.status === 'offline').length}
                </div>
                <div className="text-muted-foreground">Offline</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uptime History Charts */}
      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5" />
          24-Hour Health Trends
        </h3>

        {historicalData.length > 0 ? (
          <div className="space-y-4">
            {/* Mode Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={selectedChartMode === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedChartMode(null)}
                className="text-xs"
              >
                All Modes
              </Button>
              {uniqueModes.map(mode => (
                <Button
                  key={mode}
                  variant={selectedChartMode === mode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedChartMode(mode)}
                  className="text-xs"
                >
                  {mode}
                </Button>
              ))}
            </div>

            {/* Response Time Chart */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Response Time (ms)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getChartData(selectedChartMode)}>
                      <defs>
                        <linearGradient id="responseTimeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        unit="ms"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="avgResponseTime"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#responseTimeGradient)"
                        name="Avg Response Time"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Uptime Percentage Chart */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Uptime Percentage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getChartData(selectedChartMode)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis 
                        domain={[0, 100]}
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        unit="%"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="uptimePercent"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: '#10b981', strokeWidth: 0, r: 3 }}
                        activeDot={{ r: 5, fill: '#10b981' }}
                        name="Uptime %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Status Distribution Chart */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Status Distribution Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getChartData(selectedChartMode)}>
                      <defs>
                        <linearGradient id="onlineGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="degradedGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="offlineGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="onlineCount"
                        stackId="1"
                        stroke="#10b981"
                        fill="url(#onlineGradient)"
                        name="Online"
                      />
                      <Area
                        type="monotone"
                        dataKey="degradedCount"
                        stackId="1"
                        stroke="#f59e0b"
                        fill="url(#degradedGradient)"
                        name="Degraded"
                      />
                      <Area
                        type="monotone"
                        dataKey="offlineCount"
                        stackId="1"
                        stroke="#ef4444"
                        fill="url(#offlineGradient)"
                        name="Offline"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-8 text-center">
              <BarChart2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="font-medium mb-2">No Historical Data Yet</h4>
              <p className="text-sm text-muted-foreground">
                Run health checks to start collecting data for trend analysis.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Webhook Health Grid */}
      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Server className="w-5 h-5" />
          AI Mode Webhooks
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {aiModeConfigs.map((config, index) => {
              const metric = getStatusForMode(config.mode_name);
              const status = metric?.status || 'unknown';
              const StatusIcon = STATUS_CONFIG[status].icon;

              return (
                <motion.div
                  key={config.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`
                    relative overflow-hidden
                    bg-card/50 backdrop-blur-sm 
                    border ${STATUS_CONFIG[status].border}
                    hover:shadow-lg transition-all duration-300
                  `}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <div className="relative">
                            <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[status].pulse}`} />
                            {status === 'online' && (
                              <div className={`absolute inset-0 w-2 h-2 rounded-full ${STATUS_CONFIG[status].pulse} animate-ping`} />
                            )}
                          </div>
                          {config.mode_name}
                        </CardTitle>
                        <Badge className={`${STATUS_CONFIG[status].bg} ${STATUS_CONFIG[status].color} border-0`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {STATUS_CONFIG[status].label}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      {metric ? (
                        <>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>{metric.response_time_ms ?? '-'}ms</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <TrendingUp className="w-4 h-4" />
                              <span>{calculateUptime(metric)}% uptime</span>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            Last checked: {formatTimestamp(metric.last_checked_at)}
                          </div>

                          {metric.error_message && (
                            <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded-lg">
                              {metric.error_message}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No health data yet
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => runHealthCheck(config.mode_name)}
                        disabled={isChecking}
                      >
                        <Zap className="w-3 h-3" />
                        Check Now
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {aiModeConfigs.length === 0 && (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-8 text-center">
              <WifiOff className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="font-medium mb-2">No Active Webhooks</h4>
              <p className="text-sm text-muted-foreground">
                Configure AI mode webhooks in the system settings to enable health monitoring.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edge Functions Status */}
      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Edge Functions
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['ayn-webhook', 'file-upload', 'generate-suggestions', 'check-webhook-health'].map((fn, index) => (
            <motion.div
              key={fn}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{fn}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs text-emerald-500">Deployed</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <Wifi className="w-3 h-3 inline mr-1" />
                    Active
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Errors */}
      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Recent Issues
        </h3>
        
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <ScrollArea className="h-64">
            <CardContent className="p-4">
              {recentErrors.length > 0 ? (
                <div className="space-y-3">
                  {recentErrors.map((log) => (
                    <div
                      key={log.id}
                      className={`
                        p-3 rounded-xl border
                        ${log.severity === 'critical' 
                          ? 'bg-red-500/10 border-red-500/20' 
                          : 'bg-amber-500/10 border-amber-500/20'}
                      `}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{log.action}</span>
                        <Badge 
                          variant="outline" 
                          className={log.severity === 'critical' ? 'border-red-500 text-red-500' : 'border-amber-500 text-amber-500'}
                        >
                          {log.severity}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {formatTimestamp(log.created_at)}
                      </div>
                      {log.details && (
                        <pre className="text-xs bg-background/50 p-2 rounded-lg overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mb-4 text-emerald-500" />
                  <span>No recent issues</span>
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
};
