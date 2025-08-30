import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, Shield, AlertTriangle, Server, Target, Info, Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface SystemConfig {
  defaultMonthlyLimit: number;
  autoApproveRequests: boolean;
  requireAdminApproval: boolean;
  sessionTimeout: number;
  enableAuditLogging: boolean;
  maxConcurrentSessions: number;
  rateLimitPerMinute: number;
  enableMaintenance: boolean;
  maintenanceMessage: string;
  maintenanceStartTime: string;
  maintenanceEndTime: string;
  notificationEmail: string;
}

interface SystemSettingsProps {
  systemConfig: SystemConfig;
  onUpdateConfig: (newConfig: Partial<SystemConfig>) => void;
  onPerformMaintenance: (action: string) => void;
}

export const SystemSettings = ({ 
  systemConfig, 
  onUpdateConfig, 
  onPerformMaintenance 
}: SystemSettingsProps) => {
  const { toast } = useToast();
  const { t, language } = useLanguage();

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className={language === 'ar' ? 'text-right' : ''}>
        <h2 className="text-2xl font-bold">{t('admin.systemConfiguration')}</h2>
        <p className="text-muted-foreground">{t('admin.systemConfigDesc')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maintenance Mode */}
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <AlertTriangle className="w-5 h-5" />
              {t('admin.maintenanceMode')}
            </CardTitle>
            <CardDescription>{t('admin.maintenanceModeDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center space-x-2 ${language === 'ar' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <Switch 
                  checked={systemConfig.enableMaintenance}
                  onCheckedChange={(checked) => onUpdateConfig({ enableMaintenance: checked })}
                  size="sm"
                  rtl={language === 'ar'}
                />
                <span className="text-sm text-muted-foreground">
                  {t('admin.showMaintenance')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('admin.maintenanceMessage')}</label>
              <Textarea 
                value={systemConfig.maintenanceMessage}
                onChange={(e) => onUpdateConfig({ maintenanceMessage: e.target.value })}
                placeholder={t('admin.maintenancePlaceholder')}
                rows={3}
                className={language === 'ar' ? 'text-right' : ''}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('admin.startTime')}</label>
                <Input 
                  type="datetime-local" 
                  value={systemConfig.maintenanceStartTime}
                  onChange={(e) => onUpdateConfig({ maintenanceStartTime: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <label className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('admin.endTime')}</label>
                <Input 
                  type="datetime-local" 
                  value={systemConfig.maintenanceEndTime}
                  onChange={(e) => onUpdateConfig({ maintenanceEndTime: e.target.value })}
                />
              </div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className={`flex items-center gap-2 mb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">{t('admin.preview')}</span>
              </div>
              <div className="text-sm text-yellow-700">
                {systemConfig.maintenanceMessage || 'Your maintenance message will appear here'}
              </div>
              {systemConfig.maintenanceStartTime && systemConfig.maintenanceEndTime && (
                <div className="text-xs text-yellow-600 mt-1">
                  {new Date(systemConfig.maintenanceStartTime).toLocaleString()} - {new Date(systemConfig.maintenanceEndTime).toLocaleString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Default Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Default User Settings
            </CardTitle>
            <CardDescription>System-wide defaults for new users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Monthly Limit</label>
              <Input 
                type="number" 
                value={systemConfig.defaultMonthlyLimit}
                onChange={(e) => onUpdateConfig({ defaultMonthlyLimit: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Default message limit for new users (0 = unlimited)
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Auto-approve New Requests</label>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={systemConfig.autoApproveRequests}
                  onCheckedChange={(checked) => onUpdateConfig({ autoApproveRequests: checked })}
                />
                <span className="text-sm text-muted-foreground">
                  Automatically approve new access requests
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notification Email</label>
              <Input 
                type="email" 
                value={systemConfig.notificationEmail}
                onChange={(e) => onUpdateConfig({ notificationEmail: e.target.value })}
                placeholder="admin@company.com" 
              />
              <p className="text-xs text-muted-foreground">
                Email for system notifications and alerts
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Session Timeout (hours)</label>
              <Input 
                type="number" 
                value={systemConfig.sessionTimeout}
                onChange={(e) => onUpdateConfig({ sessionTimeout: parseInt(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security & Access Control
            </CardTitle>
            <CardDescription>Advanced security settings and policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Require Admin Approval</label>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={systemConfig.requireAdminApproval}
                  onCheckedChange={(checked) => onUpdateConfig({ requireAdminApproval: checked })}
                />
                <span className="text-sm text-muted-foreground">
                  All new users require manual approval
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Enable Audit Logging</label>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={systemConfig.enableAuditLogging}
                  onCheckedChange={(checked) => onUpdateConfig({ enableAuditLogging: checked })}
                />
                <span className="text-sm text-muted-foreground">
                  Log all administrative actions
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Rate Limit (per minute)</label>
              <Input 
                type="number" 
                value={systemConfig.rateLimitPerMinute}
                onChange={(e) => onUpdateConfig({ rateLimitPerMinute: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Maximum requests per minute per user
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Max Concurrent Sessions</label>
              <Input 
                type="number" 
                value={systemConfig.maxConcurrentSessions}
                onChange={(e) => onUpdateConfig({ maxConcurrentSessions: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Maximum simultaneous sessions per user
              </p>
            </div>
          </CardContent>
        </Card>

        {/* System Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              System Maintenance
            </CardTitle>
            <CardDescription>Perform system maintenance tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                onClick={() => onPerformMaintenance('backup')}
                className="justify-start"
              >
                <Zap className="w-4 h-4 mr-2" />
                Create Database Backup
              </Button>
              
              <Button
                variant="outline"
                onClick={() => onPerformMaintenance('clear_cache')}
                className="justify-start"
              >
                <Zap className="w-4 h-4 mr-2" />
                Clear System Cache
              </Button>
              
              <Button
                variant="outline"
                onClick={() => onPerformMaintenance('health_check')}
                className="justify-start"
              >
                <Zap className="w-4 h-4 mr-2" />
                Run Health Check
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Feature Toggles & Experimental Features
          </CardTitle>
          <CardDescription>Enable or disable system features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Real-time Analytics</div>
                  <div className="text-sm text-muted-foreground">Live usage monitoring</div>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Advanced User Filtering</div>
                  <div className="text-sm text-muted-foreground">Enhanced search capabilities</div>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Bulk Operations</div>
                  <div className="text-sm text-muted-foreground">Multi-user actions</div>
                </div>
                <Switch defaultChecked />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">API Rate Limiting</div>
                  <div className="text-sm text-muted-foreground">Automatic throttling</div>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Security Alerts</div>
                  <div className="text-sm text-muted-foreground">Instant notifications</div>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Maintenance Mode</div>
                  <div className="text-sm text-muted-foreground">System maintenance banner</div>
                </div>
                <Switch 
                  checked={systemConfig.enableMaintenance}
                  onCheckedChange={(checked) => onUpdateConfig({ enableMaintenance: checked })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-blue-50">
              <div className="font-medium">System Version</div>
              <div className="text-2xl font-bold text-blue-600">v2.4.1</div>
              <div className="text-xs text-blue-500">Latest stable</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50">
              <div className="font-medium">Database Version</div>
              <div className="text-2xl font-bold text-green-600">PostgreSQL 15</div>
              <div className="text-xs text-green-500">Supabase hosted</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-50">
              <div className="font-medium">Last Updated</div>
              <div className="text-lg font-bold text-purple-600">2 days ago</div>
              <div className="text-xs text-purple-500">Auto-updates enabled</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};