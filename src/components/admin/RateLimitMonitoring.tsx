import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, ShieldAlert, ShieldCheck, Unlock, AlertTriangle, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface RateLimitStat {
  user_id: string;
  endpoint: string;
  request_count: number;
  max_requests: number;
  violation_count: number;
  is_blocked: boolean;
  blocked_until: string | null;
  last_activity: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

export const RateLimitMonitoring = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<RateLimitStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRateLimitStats = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const { data, error } = await supabase.rpc('get_rate_limit_stats');
      if (error) throw error;
      setStats(data || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch rate limit statistics.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  const handleUnblock = async (userId: string, endpoint: string) => {
    try {
      const { error } = await supabase.rpc('admin_unblock_user', { p_user_id: userId, p_endpoint: endpoint });
      if (error) throw error;
      toast({ title: "User Unblocked", description: `Successfully unblocked user for ${endpoint}.` });
      fetchRateLimitStats();
    } catch (error) {
      toast({ title: "Error", description: "Failed to unblock user.", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchRateLimitStats();
    const interval = setInterval(fetchRateLimitStats, 30000);
    return () => clearInterval(interval);
  }, [fetchRateLimitStats]);

  const blockedUsers = stats.filter(s => s.is_blocked);
  const approachingLimit = stats.filter(s => !s.is_blocked && (s.request_count / s.max_requests) > 0.8);
  const usersWithViolations = stats.filter(s => s.violation_count > 0);

  const getUsagePercentage = (stat: RateLimitStat) => Math.round((stat.request_count / stat.max_requests) * 100);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading rate limit statistics...</span>
        </div>
      </div>
    );
  }

  const summaryCards = [
    { label: 'Blocked Users', value: blockedUsers.length, icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-500/10' },
    { label: 'Approaching Limit', value: approachingLimit.length, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { label: 'Total Violations', value: usersWithViolations.length, icon: ShieldCheck, color: 'text-foreground', bg: 'bg-foreground/5' },
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-medium">Rate Limit Monitoring</h2>
          <p className="text-sm text-muted-foreground">Real-time API rate limit tracking</p>
        </div>
        <Button onClick={fetchRateLimitStats} variant="outline" size="sm" disabled={isRefreshing} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              variants={itemVariants}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="relative overflow-hidden rounded-2xl bg-background border border-border/50 p-6 transition-all duration-300 hover:border-border hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">{card.label}</p>
                  <p className="text-3xl font-serif font-medium">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Blocked Users Alert */}
      {blockedUsers.length > 0 && (
        <motion.div 
          variants={itemVariants}
          className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
        >
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">
            {blockedUsers.length} user{blockedUsers.length > 1 ? 's are' : ' is'} currently blocked due to rate limit violations.
          </p>
        </motion.div>
      )}

      {/* Rate Limit Table */}
      <motion.div 
        variants={itemVariants}
        className="rounded-2xl border border-border/50 bg-background overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-border/50">
          <h3 className="text-lg font-serif font-medium">Rate Limit Statistics</h3>
          <p className="text-sm text-muted-foreground">Detailed view of all user rate limits</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">User ID</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Endpoint</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Usage</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Violations</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Last Activity</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-12">
                    No rate limit data available
                  </td>
                </tr>
              ) : (
                stats.map((stat) => {
                  const percentage = getUsagePercentage(stat);
                  
                  return (
                    <tr key={`${stat.user_id}-${stat.endpoint}`} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <code className="text-xs bg-muted/50 px-2 py-1 rounded">{stat.user_id.slice(0, 8)}...</code>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="font-mono text-xs">{stat.endpoint}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                percentage >= 100 ? 'bg-red-500' :
                                percentage >= 80 ? 'bg-amber-500' :
                                'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${
                            percentage >= 100 ? 'text-red-600' :
                            percentage >= 80 ? 'text-amber-600' :
                            'text-emerald-600'
                          }`}>
                            {percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {stat.is_blocked ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-600">
                            <Zap className="w-3 h-3" />
                            Blocked until {stat.blocked_until ? format(new Date(stat.blocked_until), 'HH:mm') : 'N/A'}
                          </span>
                        ) : percentage >= 80 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600">
                            Warning
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {stat.violation_count > 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                            {stat.violation_count}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {format(new Date(stat.last_activity), 'MMM dd, HH:mm')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {stat.is_blocked && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnblock(stat.user_id, stat.endpoint)}
                            className="h-8 px-3 text-xs gap-1.5"
                          >
                            <Unlock className="w-3 h-3" />
                            Unblock
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Configuration Info */}
      <motion.div 
        variants={itemVariants}
        className="rounded-2xl border border-border/50 bg-background p-6"
      >
        <h3 className="text-lg font-serif font-medium mb-4">Rate Limit Configuration</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Messages (ayn-webhook)', value: '100 req/hour' },
            { label: 'File Uploads', value: '50 req/hour' },
            { label: 'Auto-block threshold', value: 'On exceed' },
            { label: 'Block duration', value: '60 minutes' },
          ].map((config) => (
            <div key={config.label} className="p-4 rounded-xl bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">{config.label}</p>
              <p className="text-sm font-medium">{config.value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};