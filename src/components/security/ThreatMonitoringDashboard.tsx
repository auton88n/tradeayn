import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, AlertTriangle, Ban, Eye, Activity, 
  Globe, Clock, Zap, TrendingUp, Users 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ThreatData {
  id: string;
  source_ip: string;
  threat_type: string;
  severity: string;
  detected_at: string;
  details: any;
  is_blocked: boolean;
}

interface IPBlock {
  id: string;
  ip_address: string;
  block_reason: string;
  blocked_at: string;
  blocked_until: string | null;
  threat_level: string;
  is_active: boolean;
}

interface EmergencyAlert {
  id: string;
  alert_level: string;
  alert_type: string;
  trigger_reason: string;
  is_active: boolean;
  created_at: string;
  threat_assessment: any;
}

export const ThreatMonitoringDashboard = () => {
  const [threats, setThreats] = useState<ThreatData[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<IPBlock[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalThreats: 0,
    activeBlocks: 0,
    criticalAlerts: 0,
    threatTrends: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSecurityData();
    
    // Set up real-time monitoring
    const interval = setInterval(loadSecurityData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadSecurityData = async () => {
    try {
      setIsLoading(true);
      
      // Load threat detection data with enhanced logging
      const { data: threatsData, error: threatsError } = await supabase
        .from('threat_detection')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(50);

      if (threatsError) throw threatsError;

      // Load blocked IPs
      const { data: blocksData, error: blocksError } = await supabase
        .from('ip_blocks')
        .select('*')
        .eq('is_active', true)
        .order('blocked_at', { ascending: false });

      if (blocksError) throw blocksError;

      // Load emergency alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('emergency_alerts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (alertsError) throw alertsError;

      // Load security dashboard data (optional, may not exist yet)
      try {
        const { data: dashboardQuery } = await supabase
          .from('api_rate_limits')
          .select('count(*)')
          .limit(1);
        
        console.log('Enhanced security monitoring active');
      } catch (dashboardError) {
        console.warn('Enhanced security features not fully initialized');
      }

      setThreats((threatsData || []).map(t => ({
        ...t,
        source_ip: t.source_ip as string
      })));
      setBlockedIPs((blocksData || []).map(b => ({
        ...b,
        ip_address: b.ip_address as string
      })));
      setEmergencyAlerts(alertsData || []);

      // Enhanced statistics calculation
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const recentThreats = threatsData?.filter(t => 
        new Date(t.detected_at) > hourAgo
      ).length || 0;
      
      const dailyThreats = threatsData?.filter(t => 
        new Date(t.detected_at) > dayAgo
      ).length || 0;
      
      const criticalAlerts = alertsData?.filter(a => 
        a.alert_level === 'critical' || a.alert_level === 'red'
      ).length || 0;

      setStats({
        totalThreats: dailyThreats,
        activeBlocks: blocksData?.length || 0,
        criticalAlerts,
        threatTrends: recentThreats
      });

      // Log security monitoring access
      await supabase.rpc('log_admin_action', {
        _action: 'security_dashboard_access',
        _target_table: 'threat_monitoring',
        _details: {
          threats_loaded: threatsData?.length || 0,
          blocks_loaded: blocksData?.length || 0,
          alerts_loaded: alertsData?.length || 0
        }
      });

    } catch (error) {
      console.error('Failed to load security data:', error);
      toast({
        title: 'Security Data Error',
        description: 'Failed to load threat monitoring data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblockIP = async (ipId: string) => {
    try {
      const { error } = await supabase
        .from('ip_blocks')
        .update({ is_active: false })
        .eq('id', ipId);

      if (error) throw error;

      toast({
        title: 'IP Unblocked',
        description: 'IP address has been unblocked successfully'
      });

      await loadSecurityData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to unblock IP address',
        variant: 'destructive'
      });
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('emergency_alerts')
        .update({ 
          is_active: false,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: 'Alert Resolved',
        description: 'Emergency alert has been resolved'
      });

      await loadSecurityData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resolve alert',
        variant: 'destructive'
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getAlertLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return 'bg-red-500';
      case 'red': return 'bg-red-400';
      case 'yellow': return 'bg-yellow-400';
      default: return 'bg-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 animate-spin" />
          Loading security data...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Threats</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalThreats}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeBlocks}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.criticalAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Needs attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threat Trend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.threatTrends}</div>
            <p className="text-xs text-muted-foreground">
              Last hour
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Threats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Recent Threat Detection
            </CardTitle>
            <CardDescription>
              Latest security threats detected by the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {threats.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No threats detected recently
                  </p>
                ) : (
                  threats.map((threat) => (
                    <div key={threat.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant={getSeverityColor(threat.severity)}>
                          {threat.severity.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(threat.detected_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">{threat.threat_type.replace('_', ' ').toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground">
                          IP: {threat.source_ip}
                        </p>
                        {threat.details && (
                          <div className="text-xs bg-muted p-2 rounded">
                            <pre>{JSON.stringify(threat.details, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                      {threat.is_blocked && (
                        <Badge variant="destructive" className="w-fit">
                          Blocked
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Blocked IPs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5" />
              Blocked IP Addresses
            </CardTitle>
            <CardDescription>
              Currently blocked IP addresses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {blockedIPs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No blocked IPs currently
                  </p>
                ) : (
                  blockedIPs.map((block) => (
                    <div key={block.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-medium">{block.ip_address}</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUnblockIP(block.id)}
                        >
                          Unblock
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm">{block.block_reason}</p>
                        <p className="text-xs text-muted-foreground">
                          Blocked: {new Date(block.blocked_at).toLocaleString()}
                        </p>
                        {block.blocked_until && (
                          <p className="text-xs text-muted-foreground">
                            Until: {new Date(block.blocked_until).toLocaleString()}
                          </p>
                        )}
                        <Badge variant={getSeverityColor(block.threat_level)}>
                          {block.threat_level}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Alerts */}
      {emergencyAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Active Emergency Alerts
            </CardTitle>
            <CardDescription>
              Critical security alerts requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emergencyAlerts.map((alert) => (
                <div key={alert.id} className="border border-red-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getAlertLevelColor(alert.alert_level)}`} />
                      <span className="font-medium">{alert.alert_level.toUpperCase()} ALERT</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{alert.alert_type.replace('_', ' ').toUpperCase()}</p>
                    <p className="text-sm text-muted-foreground">{alert.trigger_reason}</p>
                  </div>
                  {alert.threat_assessment && (
                    <div className="text-xs bg-red-50 p-2 rounded border">
                      <pre>{JSON.stringify(alert.threat_assessment, null, 2)}</pre>
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleResolveAlert(alert.id)}
                    className="w-full"
                  >
                    Resolve Alert
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};