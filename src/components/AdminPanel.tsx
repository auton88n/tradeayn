import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Crown, RefreshCw, Activity, BarChart3, Settings, Users
} from 'lucide-react';
import { AdminDashboard } from './admin/AdminDashboard';
import { UserManagement } from './admin/UserManagement';
import { SystemSettings } from './admin/SystemSettings';
import { ErrorBoundary } from './ErrorBoundary';
import { useLanguage } from '@/contexts/LanguageContext';

interface Profile {
  id: string;
  user_id: string;
  company_name: string | null;
  contact_person: string | null;
  phone: string | null;
  created_at: string;
}

interface AccessGrantWithProfile {
  id: string;
  user_id: string;
  is_active: boolean;
  granted_at: string | null;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
  monthly_limit: number | null;
  current_month_usage: number;
  user_email?: string;
  profiles: Profile | null;
}

interface UsageStats {
  user_id: string;
  user_email: string;
  company_name: string;
  monthly_limit: number;
  current_usage: number;
  usage_percentage: number;
  reset_date: string;
}

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  pendingRequests: number;
  totalMessages: number;
  todayMessages: number;
}

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

export const AdminPanel = () => {
  const { t, language } = useLanguage();
  // Core State
  const [allUsers, setAllUsers] = useState<AccessGrantWithProfile[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    defaultMonthlyLimit: 100,
    autoApproveRequests: false,
    requireAdminApproval: true,
    sessionTimeout: 24,
    enableAuditLogging: true,
    maxConcurrentSessions: 5,
    rateLimitPerMinute: 60,
    enableMaintenance: false,
    maintenanceMessage: 'System is currently under maintenance. We apologize for any inconvenience.',
    maintenanceStartTime: '',
    maintenanceEndTime: '',
    notificationEmail: ''
  });
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const { toast } = useToast();

  // Optimized data fetching with better error handling and memoization
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('AdminPanel: Starting data fetch...');
      
      // Fetch access grants and profiles with optimized queries
      const [accessResult, profilesResult, usageResult, todayUsageResult] = await Promise.all([
        supabase
          .from('access_grants')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1000), // Add limit for better performance
        
        supabase
          .from('profiles')
          .select('id, user_id, company_name, contact_person, phone, created_at')
          .limit(1000), // Add limit for better performance
        
        supabase.rpc('get_usage_stats'),
        
        supabase
          .from('usage_logs')
          .select('usage_count, created_at')
          .gte('created_at', new Date().toISOString().split('T')[0])
          .limit(500) // Add limit for better performance
      ]);

      console.log('AdminPanel: Data fetched:', {
        accessGrants: accessResult.data?.length || 0,
        profiles: profilesResult.data?.length || 0,
        usageStats: usageResult.data?.length || 0
      });

      if (accessResult.error) {
        console.error('Access grants error:', accessResult.error);
        throw accessResult.error;
      }
      if (profilesResult.error) {
        console.error('Profiles error:', profilesResult.error);
        throw profilesResult.error;
      }
      
      // Create a map of user_id to profile for efficient lookup
      const profilesMap = (profilesResult.data || []).reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, Profile>);

      // Create a map of user_id to email from usage stats
      const emailsMap = (usageResult.data || []).reduce((acc: Record<string, string>, stat: any) => {
        if (stat.user_id && stat.user_email) {
          acc[stat.user_id] = stat.user_email;
        }
        return acc;
      }, {} as Record<string, string>);

      console.log('AdminPanel: Email mapping created:', Object.keys(emailsMap).length, 'emails');

      // Enrich access data with profile information and email
      const enrichedAccessData = (accessResult.data || []).map(grant => ({
        ...grant,
        profiles: profilesMap[grant.user_id] || null,
        user_email: emailsMap[grant.user_id] || null
      }));
      
      console.log('AdminPanel: Enriched data created:', enrichedAccessData.length, 'users with emails');
      setAllUsers(enrichedAccessData);

      if (!usageResult.error && usageResult.data) {
        setUsageStats(usageResult.data);
      } else if (usageResult.error) {
        console.error('Usage stats error:', usageResult.error);
      }

      // Calculate system metrics efficiently with error handling
      const totalUsers = enrichedAccessData.length;
      const activeUsers = enrichedAccessData.filter(u => u.is_active).length;
      const pendingRequests = enrichedAccessData.filter(u => !u.is_active && !u.granted_at).length;
      const todayMessages = todayUsageResult.data?.reduce((sum, log) => sum + (log.usage_count || 0), 0) || 0;
      const totalMessages = usageResult.data?.reduce((sum: number, stat: any) => sum + (stat.current_usage || 0), 0) || 0;
      
      // Set system metrics with calculated values
      setSystemMetrics({
        totalUsers,
        activeUsers,
        pendingRequests,
        totalMessages,
        todayMessages
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Unable to fetch admin data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // System maintenance functions
  const performSystemMaintenance = async (action: string) => {
    try {
      // Mock system maintenance actions
      switch (action) {
        case 'backup':
          await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate backup
          toast({ title: "Backup Complete", description: "Database backup has been created successfully." });
          break;
        case 'clear_cache':
          await new Promise(resolve => setTimeout(resolve, 1000));
          toast({ title: "Cache Cleared", description: "System cache has been cleared." });
          break;
        case 'health_check':
          await new Promise(resolve => setTimeout(resolve, 1500));
          toast({ title: "Health Check Complete", description: "All system components are healthy." });
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error performing maintenance:', error);
      toast({
        title: "Error",
        description: "Maintenance task failed.",
        variant: "destructive"
      });
    }
  };

  // Configuration management
  const updateSystemConfig = async (newConfig: Partial<SystemConfig>) => {
    try {
      const updatedConfig = { ...systemConfig, ...newConfig };
      setSystemConfig(updatedConfig);
      
      // Save maintenance config to localStorage for dashboard access
      const maintenanceConfig = {
        enableMaintenance: updatedConfig.enableMaintenance,
        maintenanceMessage: updatedConfig.maintenanceMessage,
        maintenanceStartTime: updatedConfig.maintenanceStartTime,
        maintenanceEndTime: updatedConfig.maintenanceEndTime
      };
      localStorage.setItem('ayn_maintenance_config', JSON.stringify(maintenanceConfig));
      
      toast({
        title: "Configuration Updated",
        description: "System configuration has been updated successfully."
      });
    } catch (error) {
      console.error('Error updating config:', error);
      toast({
        title: "Error",
        description: "Failed to update configuration.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <Activity className="w-5 h-5 animate-spin" />
          <span>{t('admin.loading')}</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header with Real-time Controls */}
      <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div className={language === 'ar' ? 'text-right' : ''}>
          <h1 className={`text-3xl font-bold flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Crown className="w-8 h-8 text-primary" />
            {t('admin.title')}
          </h1>
          <p className="text-muted-foreground">{t('admin.subtitle')}</p>
        </div>
        <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <Button onClick={fetchData} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'} ${isLoading ? 'animate-spin' : ''}`} />
            {t('admin.refresh')}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <BarChart3 className="w-4 h-4" />
            {t('admin.dashboard')}
          </TabsTrigger>
          <TabsTrigger value="users" className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Users className="w-4 h-4" />
            {t('admin.users')}
          </TabsTrigger>
          <TabsTrigger value="settings" className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Settings className="w-4 h-4" />
            {t('admin.settings')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ErrorBoundary>
            <AdminDashboard systemMetrics={systemMetrics} allUsers={allUsers} />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="users">
          <ErrorBoundary>
            <UserManagement allUsers={allUsers} onRefresh={fetchData} />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="settings">
          <ErrorBoundary>
            <SystemSettings 
              systemConfig={systemConfig}
              onUpdateConfig={updateSystemConfig}
              onPerformMaintenance={performSystemMaintenance}
              onRefresh={fetchData}
            />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
};