import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, Shield, AlertTriangle
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
                  className={language === 'ar' ? 'text-right' : ''}
                />
              </div>
              
              <div className="space-y-2">
                <label className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('admin.endTime')}</label>
                <Input 
                  type="datetime-local" 
                  value={systemConfig.maintenanceEndTime}
                  onChange={(e) => onUpdateConfig({ maintenanceEndTime: e.target.value })}
                  className={language === 'ar' ? 'text-right' : ''}
                />
              </div>
            </div>

            <div className={`p-3 bg-yellow-50 border border-yellow-200 rounded-lg ${language === 'ar' ? 'text-right' : ''}`}>
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
            <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
              <Settings className="w-5 h-5" />
              {t('admin.defaultUserSettings')}
            </CardTitle>
            <CardDescription className={language === 'ar' ? 'text-right' : ''}>{t('admin.defaultUserSettingsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('admin.defaultMonthlyLimit')}</label>
              <Input 
                type="number" 
                value={systemConfig.defaultMonthlyLimit}
                onChange={(e) => onUpdateConfig({ defaultMonthlyLimit: parseInt(e.target.value) })}
                className={language === 'ar' ? 'text-right' : ''}
              />
              <p className={`text-xs text-muted-foreground ${language === 'ar' ? 'text-right' : ''}`}>
                {t('admin.defaultMonthlyLimitDesc')}
              </p>
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('admin.autoApproveRequests')}</label>
              <div className={`flex items-center space-x-2 ${language === 'ar' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <Switch 
                  checked={systemConfig.autoApproveRequests}
                  onCheckedChange={(checked) => onUpdateConfig({ autoApproveRequests: checked })}
                />
                <span className="text-sm text-muted-foreground">
                  {t('admin.autoApproveRequestsDesc')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('admin.notificationEmail')}</label>
              <Input 
                type="email" 
                value={systemConfig.notificationEmail}
                onChange={(e) => onUpdateConfig({ notificationEmail: e.target.value })}
                placeholder={t('admin.notificationEmailPlaceholder')} 
                className={language === 'ar' ? 'text-right' : ''}
              />
              <p className={`text-xs text-muted-foreground ${language === 'ar' ? 'text-right' : ''}`}>
                {t('admin.notificationEmailDesc')}
              </p>
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('admin.sessionTimeout')}</label>
              <Input 
                type="number" 
                value={systemConfig.sessionTimeout}
                onChange={(e) => onUpdateConfig({ sessionTimeout: parseInt(e.target.value) })}
                className={language === 'ar' ? 'text-right' : ''}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
              <Shield className="w-5 h-5" />
              {t('admin.securityAccessControl')}
            </CardTitle>
            <CardDescription className={language === 'ar' ? 'text-right' : ''}>{t('admin.securityAccessControlDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('admin.requireAdminApproval')}</label>
              <div className={`flex items-center space-x-2 ${language === 'ar' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <Switch 
                  checked={systemConfig.requireAdminApproval}
                  onCheckedChange={(checked) => onUpdateConfig({ requireAdminApproval: checked })}
                />
                <span className="text-sm text-muted-foreground">
                  {t('admin.requireAdminApprovalDesc')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('admin.enableAuditLogging')}</label>
              <div className={`flex items-center space-x-2 ${language === 'ar' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <Switch 
                  checked={systemConfig.enableAuditLogging}
                  onCheckedChange={(checked) => onUpdateConfig({ enableAuditLogging: checked })}
                />
                <span className="text-sm text-muted-foreground">
                  {t('admin.enableAuditLoggingDesc')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('admin.rateLimitPerMinute')}</label>
              <Input 
                type="number" 
                value={systemConfig.rateLimitPerMinute}
                onChange={(e) => onUpdateConfig({ rateLimitPerMinute: parseInt(e.target.value) })}
                className={language === 'ar' ? 'text-right' : ''}
              />
              <p className={`text-xs text-muted-foreground ${language === 'ar' ? 'text-right' : ''}`}>
                {t('admin.rateLimitPerMinuteDesc')}
              </p>
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>{t('admin.maxConcurrentSessions')}</label>
              <Input 
                type="number" 
                value={systemConfig.maxConcurrentSessions}
                onChange={(e) => onUpdateConfig({ maxConcurrentSessions: parseInt(e.target.value) })}
                className={language === 'ar' ? 'text-right' : ''}
              />
              <p className={`text-xs text-muted-foreground ${language === 'ar' ? 'text-right' : ''}`}>
                {t('admin.maxConcurrentSessionsDesc')}
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};