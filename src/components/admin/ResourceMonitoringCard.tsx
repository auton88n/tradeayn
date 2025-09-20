import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Database, 
  Users, 
  Activity, 
  HardDrive, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ResourceMetric {
  id: string;
  metric_type: string;
  current_value: number;
  limit_value: number;
  usage_percentage: number;
  alert_threshold_percentage: number;
  last_alerted_at: string | null;
  created_at: string;
}

interface ResourceData {
  storage: { used: number; limit: number; percentage: number };
  mau: { used: number; limit: number; percentage: number };
  functions: { used: number; limit: number; percentage: number };
  bandwidth: { used: number; limit: number; percentage: number };
  connections: { used: number; limit: number; percentage: number };
}

export function ResourceMonitoringCard() {
  const [metrics, setMetrics] = useState<ResourceMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchResourceMetrics();
    // Set up polling every 5 minutes
    const interval = setInterval(fetchResourceMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchResourceMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('resource_usage')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMetrics(data || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching resource metrics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch resource metrics",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMetricByType = (type: string): ResourceMetric | null => {
    return metrics.find(m => m.metric_type === type) || null;
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 95) return 'text-red-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 95) return <Badge variant="destructive">Critical</Badge>;
    if (percentage >= 80) return <Badge variant="secondary">Warning</Badge>;
    return <Badge variant="default">Healthy</Badge>;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const resourceTypes = [
    {
      type: 'storage',
      name: 'Database Storage',
      icon: Database,
      description: 'Database storage usage',
      format: (value: number) => formatBytes(value)
    },
    {
      type: 'mau',
      name: 'Monthly Active Users',
      icon: Users,
      description: 'Active users this month',
      format: (value: number) => value.toLocaleString()
    },
    {
      type: 'function_invocations',
      name: 'Function Invocations',
      icon: Zap,
      description: 'Edge function calls this month',
      format: (value: number) => value.toLocaleString()
    },
    {
      type: 'bandwidth',
      name: 'Bandwidth Usage',
      icon: Activity,
      description: 'Data transfer this month',
      format: (value: number) => formatBytes(value)
    },
    {
      type: 'db_connections',
      name: 'Database Connections',
      icon: HardDrive,
      description: 'Active database connections',
      format: (value: number) => value.toString()
    }
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Resource Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            Loading resource data...
          </div>
        </CardContent>
      </Card>
    );
  }

  const criticalResources = metrics.filter(m => m.usage_percentage >= 95);
  const warningResources = metrics.filter(m => m.usage_percentage >= 80 && m.usage_percentage < 95);

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Resource Status Overview
          </CardTitle>
          <CardDescription>
            Last updated: {lastUpdated?.toLocaleTimeString() || 'Never'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.filter(m => m.usage_percentage < 80).length}</div>
              <div className="text-sm text-muted-foreground">Healthy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{warningResources.length}</div>
              <div className="text-sm text-muted-foreground">Warning</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{criticalResources.length}</div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </div>
          </div>

          {criticalResources.length > 0 && (
            <Alert className="mt-4" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {criticalResources.length} resource(s) are in critical state (≥95% usage). 
                Immediate action may be required.
              </AlertDescription>
            </Alert>
          )}

          {warningResources.length > 0 && criticalResources.length === 0 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {warningResources.length} resource(s) are approaching limits (≥80% usage). 
                Consider monitoring closely.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Resource Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resourceTypes.map((resource) => {
          const metric = getMetricByType(resource.type);
          const IconComponent = resource.icon;
          
          if (!metric) {
            return (
              <Card key={resource.type}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      {resource.name}
                    </div>
                    <Badge variant="secondary">No Data</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    No monitoring data available
                  </div>
                </CardContent>
              </Card>
            );
          }

          const percentage = metric.usage_percentage;
          
          return (
            <Card key={resource.type}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    {resource.name}
                  </div>
                  {getStatusBadge(percentage)}
                </CardTitle>
                <CardDescription className="text-sm">
                  {resource.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Usage</span>
                    <span className={getStatusColor(percentage)}>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className="h-2"
                  />
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{resource.format(metric.current_value)}</span>
                    <span>{resource.format(metric.limit_value)} limit</span>
                  </div>
                  
                  {percentage >= 80 && (
                    <div className="flex items-center gap-2 text-xs">
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                      <span className="text-yellow-600">
                        {percentage >= 95 ? 'Critical usage level' : 'Approaching limit'}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Projections */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Projections</CardTitle>
          <CardDescription>
            Estimated time until resource limits are reached
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics
              .filter(m => m.usage_percentage > 0 && m.usage_percentage < 95)
              .map(metric => {
                const resourceType = resourceTypes.find(r => r.type === metric.metric_type);
                if (!resourceType) return null;

                // Simple projection based on current usage rate
                const remainingCapacity = metric.limit_value - metric.current_value;
                const dailyUsageRate = metric.current_value / 30; // Rough estimate
                const daysUntilFull = dailyUsageRate > 0 ? remainingCapacity / dailyUsageRate : Infinity;
                
                return (
                  <div key={metric.id} className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center gap-2">
                      <resourceType.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{resourceType.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {daysUntilFull === Infinity ? 
                        'No projection available' : 
                        daysUntilFull > 365 ? 
                          '1+ year remaining' :
                          `~${Math.floor(daysUntilFull)} days remaining`
                      }
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}