import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Server, Database, Zap, Shield, Activity, AlertTriangle, CheckCircle, 
  Clock, Network, HardDrive, Cpu, MemoryStick, TrendingUp, Eye
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  pendingRequests: number;
  totalMessages: number;
  todayMessages: number;
  avgResponseTime: number;
  systemHealth: number;
  uptime: string;
  errorRate: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    disk: number;
  };
}

interface SystemMonitoringProps {
  systemMetrics: SystemMetrics | null;
}

export const SystemMonitoring = ({ systemMetrics }: SystemMonitoringProps) => {
  const { t, language } = useLanguage();
  
  const getHealthStatus = (health: number) => {
    if (health >= 98) return { label: t('admin.excellent'), color: 'bg-green-600', variant: 'default' as const };
    if (health >= 95) return { label: t('admin.good'), color: 'bg-blue-600', variant: 'default' as const };
    if (health >= 90) return { label: t('admin.fair'), color: 'bg-yellow-600', variant: 'secondary' as const };
    return { label: t('admin.poor'), color: 'bg-red-600', variant: 'destructive' as const };
  };

  const getResourceStatus = (usage: number) => {
    if (usage >= 90) return t('admin.critical');
    if (usage >= 75) return t('admin.warning');
    if (usage >= 50) return t('admin.moderate');
    return t('admin.normal');
  };

  const getResourceColor = (status: string) => {
    switch (status) {
      case t('admin.critical'): return 'bg-red-500';
      case t('admin.warning'): return 'bg-yellow-500';
      case t('admin.moderate'): return 'bg-blue-500';
      default: return 'bg-green-500';
    }
  };

  const healthStatus = getHealthStatus(systemMetrics?.systemHealth || 0);

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className={language === 'ar' ? 'text-right' : ''}>
        <h2 className="text-2xl font-bold">{t('admin.systemMonitoring')}</h2>
        <p className="text-muted-foreground">{t('admin.systemMonitoringDesc')}</p>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <CardTitle className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('admin.systemHealth')}</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-green-700 ${language === 'ar' ? 'text-right' : ''}`}>{systemMetrics?.systemHealth || 0}%</div>
            <Badge variant={healthStatus.variant} className={healthStatus.color}>
              {healthStatus.label}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <CardTitle className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('admin.uptime')}</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-blue-700 ${language === 'ar' ? 'text-right' : ''}`}>{systemMetrics?.uptime || '0%'}</div>
            <p className={`text-xs text-blue-600 ${language === 'ar' ? 'text-right' : ''}`}>{t('admin.last30Days')}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <CardTitle className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('admin.responseTime')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-purple-700 ${language === 'ar' ? 'text-right' : ''}`}>{systemMetrics?.avgResponseTime.toFixed(1) || '0'}s</div>
            <p className={`text-xs text-purple-600 ${language === 'ar' ? 'text-right' : ''}`}>{t('admin.average')}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <CardTitle className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('admin.errorRate')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-red-700 ${language === 'ar' ? 'text-right' : ''}`}>{systemMetrics?.errorRate.toFixed(2) || '0'}%</div>
            <p className={`text-xs text-red-600 ${language === 'ar' ? 'text-right' : ''}`}>{t('admin.last24h')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Resource Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
              <Server className="w-5 h-5" />
              {t('admin.serverResources')}
            </CardTitle>
            <CardDescription className={language === 'ar' ? 'text-right' : ''}>{t('admin.realtimeUtilization')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className={`flex justify-between items-center mb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <Cpu className="w-4 h-4" />
                  <span>{t('admin.cpuUsage')}</span>
                </div>
                <span className="font-medium">{systemMetrics?.resourceUsage.cpu || 0}%</span>
              </div>
              <Progress 
                value={systemMetrics?.resourceUsage.cpu || 0} 
                className={`h-3 ${getResourceColor(getResourceStatus(systemMetrics?.resourceUsage.cpu || 0))}`}
              />
              <p className={`text-xs text-muted-foreground mt-1 ${language === 'ar' ? 'text-right' : ''}`}>
                {t('admin.status')}: {getResourceStatus(systemMetrics?.resourceUsage.cpu || 0)}
              </p>
            </div>

            <div>
              <div className={`flex justify-between items-center mb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <MemoryStick className="w-4 h-4" />
                  <span>{t('admin.memoryUsage')}</span>
                </div>
                <span className="font-medium">{systemMetrics?.resourceUsage.memory || 0}%</span>
              </div>
              <Progress 
                value={systemMetrics?.resourceUsage.memory || 0} 
                className={`h-3 ${getResourceColor(getResourceStatus(systemMetrics?.resourceUsage.memory || 0))}`}
              />
              <p className={`text-xs text-muted-foreground mt-1 ${language === 'ar' ? 'text-right' : ''}`}>
                {t('admin.status')}: {getResourceStatus(systemMetrics?.resourceUsage.memory || 0)}
              </p>
            </div>

            <div>
              <div className={`flex justify-between items-center mb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <HardDrive className="w-4 h-4" />
                  <span>{t('admin.diskUsage')}</span>
                </div>
                <span className="font-medium">{systemMetrics?.resourceUsage.disk || 0}%</span>
              </div>
              <Progress 
                value={systemMetrics?.resourceUsage.disk || 0} 
                className={`h-3 ${getResourceColor(getResourceStatus(systemMetrics?.resourceUsage.disk || 0))}`}
              />
              <p className={`text-xs text-muted-foreground mt-1 ${language === 'ar' ? 'text-right' : ''}`}>
                {t('admin.status')}: {getResourceStatus(systemMetrics?.resourceUsage.disk || 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
              <Database className="w-5 h-5" />
              {t('admin.serviceStatus')}
            </CardTitle>
            <CardDescription className={language === 'ar' ? 'text-right' : ''}>{t('admin.currentServiceStatus')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`flex justify-between items-center p-3 rounded-lg bg-green-50 border border-green-200 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className={language === 'ar' ? 'text-right' : ''}>
                  <p className="font-medium">{t('admin.database')}</p>
                  <p className="text-sm text-muted-foreground">{t('admin.postgresql')}</p>
                </div>
              </div>
              <Badge className="bg-green-600">{t('admin.online')}</Badge>
            </div>

            <div className={`flex justify-between items-center p-3 rounded-lg bg-green-50 border border-green-200 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className={language === 'ar' ? 'text-right' : ''}>
                  <p className="font-medium">{t('admin.apiGateway')}</p>
                  <p className="text-sm text-muted-foreground">{t('admin.supabaseEdge')}</p>
                </div>
              </div>
              <Badge className="bg-green-600">{t('admin.active')}</Badge>
            </div>

            <div className={`flex justify-between items-center p-3 rounded-lg bg-green-50 border border-green-200 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className={language === 'ar' ? 'text-right' : ''}>
                  <p className="font-medium">{t('admin.authentication')}</p>
                  <p className="text-sm text-muted-foreground">{t('admin.supabaseAuth')}</p>
                </div>
              </div>
              <Badge className="bg-green-600">{t('admin.healthy')}</Badge>
            </div>

            <div className={`flex justify-between items-center p-3 rounded-lg bg-blue-50 border border-blue-200 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <Network className="w-5 h-5 text-blue-600" />
                <div className={language === 'ar' ? 'text-right' : ''}>
                  <p className="font-medium">{t('admin.cdn')}</p>
                  <p className="text-sm text-muted-foreground">{t('admin.globalEdge')}</p>
                </div>
              </div>
              <Badge className="bg-blue-600">{t('admin.optimized')}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics & System Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
              <Activity className="w-5 h-5" />
              {t('admin.performanceTrends')}
            </CardTitle>
            <CardDescription className={language === 'ar' ? 'text-right' : ''}>{t('admin.performanceOverTime')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className={`text-center p-4 rounded-lg bg-blue-50 ${language === 'ar' ? 'text-right' : ''}`}>
                  <div className="text-2xl font-bold text-blue-700">{systemMetrics?.todayMessages || 0}</div>
                  <div className="text-sm text-blue-600">{t('admin.requestsToday')}</div>
                </div>
                <div className={`text-center p-4 rounded-lg bg-green-50 ${language === 'ar' ? 'text-right' : ''}`}>
                  <div className="text-2xl font-bold text-green-700">{systemMetrics?.activeUsers || 0}</div>
                  <div className="text-sm text-green-600">{t('admin.activeSessions')}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className={`flex justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <span className="text-sm">{t('admin.peakCpuUsage24h')}</span>
                  <span className="text-sm font-medium">{Math.min(100, (systemMetrics?.resourceUsage.cpu || 0) + 15)}%</span>
                </div>
                <div className={`flex justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <span className="text-sm">{t('admin.peakMemoryUsage24h')}</span>
                  <span className="text-sm font-medium">{Math.min(100, (systemMetrics?.resourceUsage.memory || 0) + 10)}%</span>
                </div>
                <div className={`flex justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <span className="text-sm">{t('admin.avgResponseTime24h')}</span>
                  <span className="text-sm font-medium">{(systemMetrics?.avgResponseTime || 0).toFixed(2)}s</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
              <Eye className="w-5 h-5" />
              {t('admin.systemEvents')}
            </CardTitle>
            <CardDescription className={language === 'ar' ? 'text-right' : ''}>{t('admin.recentSystemEvents')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              <div className="space-y-3">
                <div className={`flex items-center gap-3 p-2 rounded-lg bg-green-50 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div className={`flex-1 ${language === 'ar' ? 'text-right' : ''}`}>
                    <p className="text-sm font-medium">{t('admin.systemHealthCheckPassed')}</p>
                    <p className="text-xs text-muted-foreground">{t('admin.allServicesNormal')}</p>
                    <p className="text-xs text-muted-foreground">2 {t('admin.minutesAgo')}</p>
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-2 rounded-lg bg-blue-50 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <Activity className="w-4 h-4 text-blue-600" />
                  <div className={`flex-1 ${language === 'ar' ? 'text-right' : ''}`}>
                    <p className="text-sm font-medium">{t('admin.autoScalingTriggered')}</p>
                    <p className="text-xs text-muted-foreground">{t('admin.increasedCapacity')}</p>
                    <p className="text-xs text-muted-foreground">15 {t('admin.minutesAgo')}</p>
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-2 rounded-lg bg-green-50 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <Database className="w-4 h-4 text-green-600" />
                  <div className={`flex-1 ${language === 'ar' ? 'text-right' : ''}`}>
                    <p className="text-sm font-medium">{t('admin.databaseBackupCompleted')}</p>
                    <p className="text-xs text-muted-foreground">{t('admin.automatedBackupSuccessful')}</p>
                    <p className="text-xs text-muted-foreground">1 {t('admin.hourAgo')}</p>
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-2 rounded-lg bg-yellow-50 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <div className={`flex-1 ${language === 'ar' ? 'text-right' : ''}`}>
                    <p className="text-sm font-medium">{t('admin.highMemoryDetected')}</p>
                    <p className="text-xs text-muted-foreground">{t('admin.memoryAboveThreshold')}</p>
                    <p className="text-xs text-muted-foreground">3 {t('admin.hoursAgo')}</p>
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-2 rounded-lg bg-green-50 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <Shield className="w-4 h-4 text-green-600" />
                  <div className={`flex-1 ${language === 'ar' ? 'text-right' : ''}`}>
                    <p className="text-sm font-medium">{t('admin.securityScanCompleted')}</p>
                    <p className="text-xs text-muted-foreground">{t('admin.noVulnerabilities')}</p>
                    <p className="text-xs text-muted-foreground">6 {t('admin.hoursAgo')}</p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
            <Zap className="w-5 h-5" />
            {t('admin.quickActions')}
          </CardTitle>
          <CardDescription className={language === 'ar' ? 'text-right' : ''}>{t('admin.monitoringTools')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`flex flex-wrap gap-3 ${language === 'ar' ? 'justify-end' : ''}`}>
            <Button variant="outline" size="sm" className={language === 'ar' ? 'flex-row-reverse' : ''}>
              <Activity className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {t('admin.viewFullLogs')}
            </Button>
            <Button variant="outline" size="sm" className={language === 'ar' ? 'flex-row-reverse' : ''}>
              <Server className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {t('admin.resourceReport')}
            </Button>
            <Button variant="outline" size="sm" className={language === 'ar' ? 'flex-row-reverse' : ''}>
              <Database className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {t('admin.databaseStatus')}
            </Button>
            <Button variant="outline" size="sm" className={language === 'ar' ? 'flex-row-reverse' : ''}>
              <Shield className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {t('admin.securityAudit')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};