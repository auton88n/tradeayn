import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { 
  RefreshCw, 
  Users, 
  Eye, 
  MousePointer, 
  Clock, 
  TrendingUp,
  Globe,
  ExternalLink,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

interface GAData {
  realTime: {
    activeUsers: number;
  };
  today: {
    sessions: number;
    pageViews: number;
    users: number;
    bounceRate: number;
    avgSessionDuration: number;
  };
  week: {
    sessions: number;
    pageViews: number;
    users: number;
  };
  month: {
    sessions: number;
    pageViews: number;
    users: number;
  };
  topPages: Array<{ pagePath: string; pageViews: number }>;
  trafficSources: Array<{ source: string; sessions: number }>;
  countries: Array<{ country: string; sessions: number }>;
  fetchedAt: string;
}

export function GoogleAnalytics() {
  const [data, setData] = useState<GAData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const { data: response, error: fnError } = await supabase.functions.invoke('google-analytics');
      
      if (fnError) throw fnError;
      if (response.error) throw new Error(response.error);
      
      setData(response);
      if (isRefresh) toast.success('Google Analytics data refreshed');
    } catch (err: any) {
      console.error('Error fetching GA data:', err);
      setError('Unable to load analytics data. Please try again.');
      toast.error('Unable to load analytics. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Google Analytics</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => fetchData()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Google Analytics</h2>
          <p className="text-muted-foreground text-sm">
            Last updated: {new Date(data.fetchedAt).toLocaleString()}
          </p>
        </div>
        <Button onClick={() => fetchData(true)} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Real-time indicator */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Activity className="h-8 w-8 text-primary" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Real-time Active Users</p>
              <p className="text-3xl font-bold">{data.realTime.activeUsers}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users Today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.today.users}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.week.users} this week • {data.month.users} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              Sessions Today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.today.sessions}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.week.sessions} this week • {data.month.sessions} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Page Views Today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.today.pageViews}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.week.pageViews} this week • {data.month.pageViews} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg. Session Duration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatDuration(data.today.avgSessionDuration)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.today.bounceRate}% bounce rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Pages (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topPages.slice(0, 8).map((page, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate max-w-[180px] text-muted-foreground" title={page.pagePath}>
                    {page.pagePath === '/' ? 'Homepage' : page.pagePath}
                  </span>
                  <span className="font-medium">{page.pageViews.toLocaleString()}</span>
                </div>
              ))}
              {data.topPages.length === 0 && (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Traffic Sources (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.trafficSources.slice(0, 8).map((source, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate max-w-[180px] text-muted-foreground">
                    {source.source === '(direct)' ? 'Direct' : source.source}
                  </span>
                  <span className="font-medium">{source.sessions.toLocaleString()}</span>
                </div>
              ))}
              {data.trafficSources.length === 0 && (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Top Countries (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.countries.slice(0, 8).map((country, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate max-w-[180px] text-muted-foreground">
                    {country.country}
                  </span>
                  <span className="font-medium">{country.sessions.toLocaleString()}</span>
                </div>
              ))}
              {data.countries.length === 0 && (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
