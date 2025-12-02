import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { RefreshCw, ShieldAlert, ShieldCheck, Unlock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

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

export const RateLimitMonitoring = () => {
  const { language } = useLanguage();
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
      toast({
        title: "Error",
        description: "Failed to fetch rate limit statistics.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  const handleUnblock = async (userId: string, endpoint: string) => {
    try {
      const { error } = await supabase.rpc('admin_unblock_user', {
        p_user_id: userId,
        p_endpoint: endpoint
      });

      if (error) throw error;

      toast({
        title: "User Unblocked",
        description: `Successfully unblocked user for ${endpoint}.`
      });

      fetchRateLimitStats();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unblock user.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchRateLimitStats();
    const interval = setInterval(fetchRateLimitStats, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchRateLimitStats]);

  const blockedUsers = stats.filter(s => s.is_blocked);
  const approachingLimit = stats.filter(s => !s.is_blocked && (s.request_count / s.max_requests) > 0.8);
  const usersWithViolations = stats.filter(s => s.violation_count > 0);

  const getUsagePercentage = (stat: RateLimitStat) => {
    return Math.round((stat.request_count / stat.max_requests) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 100) return 'text-destructive';
    if (percentage >= 80) return 'text-orange-500';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading rate limit statistics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div>
          <h2 className="text-2xl font-bold">Rate Limit Monitoring</h2>
          <p className="text-sm text-muted-foreground">Real-time API rate limit tracking and violations</p>
        </div>
        <Button onClick={fetchRateLimitStats} variant="outline" size="sm" disabled={isRefreshing}>
          <RefreshCw className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'} ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Users</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockedUsers.length}</div>
            <p className="text-xs text-muted-foreground">Currently rate limited</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approaching Limit</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approachingLimit.length}</div>
            <p className="text-xs text-muted-foreground">Over 80% usage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersWithViolations.length}</div>
            <p className="text-xs text-muted-foreground">Users with violations</p>
          </CardContent>
        </Card>
      </div>

      {/* Blocked Users Alert */}
      {blockedUsers.length > 0 && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            {blockedUsers.length} user{blockedUsers.length > 1 ? 's are' : ' is'} currently blocked due to rate limit violations.
          </AlertDescription>
        </Alert>
      )}

      {/* Rate Limit Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limit Statistics</CardTitle>
          <CardDescription>Detailed view of all user rate limits and violations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Violations</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No rate limit data available
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.map((stat) => {
                    const percentage = getUsagePercentage(stat);
                    const usageColor = getUsageColor(percentage);

                    return (
                      <TableRow key={`${stat.user_id}-${stat.endpoint}`}>
                        <TableCell className="font-mono text-xs">{stat.user_id.slice(0, 8)}...</TableCell>
                        <TableCell>
                          <Badge variant="outline">{stat.endpoint}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={usageColor}>
                            {stat.request_count} / {stat.max_requests} ({percentage}%)
                          </span>
                        </TableCell>
                        <TableCell>
                          {stat.is_blocked ? (
                            <Badge variant="destructive">
                              Blocked until {stat.blocked_until ? format(new Date(stat.blocked_until), 'HH:mm') : 'N/A'}
                            </Badge>
                          ) : percentage >= 80 ? (
                            <Badge variant="outline" className="text-orange-500 border-orange-500">
                              Warning
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-500 border-green-500">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {stat.violation_count > 0 ? (
                            <Badge variant="secondary">{stat.violation_count}</Badge>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(stat.last_activity), 'MMM dd, HH:mm')}
                        </TableCell>
                        <TableCell className="text-right">
                          {stat.is_blocked && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnblock(stat.user_id, stat.endpoint)}
                            >
                              <Unlock className="w-3 h-3 mr-1" />
                              Unblock
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limit Configuration</CardTitle>
          <CardDescription>Current rate limit settings per endpoint</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Messages (ayn-webhook):</span>
              <Badge variant="outline">100 requests / hour</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">File Uploads (file-upload):</span>
              <Badge variant="outline">50 requests / hour</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Auto-block threshold:</span>
              <Badge variant="outline">Exceeding limit = Immediate block</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Block duration:</span>
              <Badge variant="outline">Until window reset (60 minutes)</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
