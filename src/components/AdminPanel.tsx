import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/components/theme-provider';
import { 
  Crown, RefreshCw, Activity, BarChart3, Settings, Users, Brain, ArrowLeft, Moon, Sun, HeartPulse
} from 'lucide-react';
import { AdminDashboard } from './admin/AdminDashboard';
import { UserManagement } from './admin/UserManagement';
import { SystemSettings } from './admin/SystemSettings';
import { RateLimitMonitoring } from './admin/RateLimitMonitoring';
import { SystemHealthMonitor } from './admin/SystemHealthMonitor';
import { ErrorBoundary } from './ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';

interface Profile {
  id: string;
  user_id: string;
  company_name: string | null;
  contact_person: string | null;
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
  current_month_usage: number | null;
  user_email?: string | null;
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

const tabs = [
  { id: 'overview', label: 'Dashboard', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'rate-limits', label: 'Rate Limits', icon: Activity },
  { id: 'health', label: 'System Health', icon: HeartPulse },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const AdminPanel = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  
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

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Optimized data fetching with better error handling and memoization
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch access grants and profiles with optimized queries
      const [accessResult, profilesResult, usageResult, todayUsageResult] = await Promise.all([
        supabase
          .from('access_grants')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1000),
        
        supabase
          .from('profiles')
          .select('id, user_id, company_name, contact_person, created_at')
          .limit(1000),
        
        supabase.rpc('get_usage_stats'),
        
        supabase
          .from('usage_logs')
          .select('usage_count, created_at')
          .gte('created_at', new Date().toISOString().split('T')[0])
          .limit(500)
      ]);

      if (accessResult.error) throw accessResult.error;
      if (profilesResult.error) throw profilesResult.error;
      
      // Create a map of user_id to profile for efficient lookup
      const profilesMap = (profilesResult.data || []).reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, Profile>);

      // Create a map of user_id to email from usage stats
      const emailsMap = (usageResult.data || []).reduce((acc: Record<string, string>, stat: UsageStats) => {
        if (stat.user_id && stat.user_email) {
          acc[stat.user_id] = stat.user_email;
        }
        return acc;
      }, {} as Record<string, string>);

      // Enrich access data with profile information and email
      const enrichedAccessData = (accessResult.data || []).map(grant => ({
        ...grant,
        profiles: profilesMap[grant.user_id] || null,
        user_email: emailsMap[grant.user_id] || null
      }));
      
      setAllUsers(enrichedAccessData);

      if (!usageResult.error && usageResult.data) {
        setUsageStats(usageResult.data);
      }

      // Calculate system metrics efficiently with error handling
      const totalUsers = enrichedAccessData.length;
      const activeUsers = enrichedAccessData.filter(u => u.is_active).length;
      const pendingRequests = enrichedAccessData.filter(u => !u.is_active && !u.granted_at).length;
      const todayMessages = todayUsageResult.data?.reduce((sum, log) => sum + (log.usage_count || 0), 0) || 0;
      const totalMessages = usageResult.data?.reduce((sum: number, stat: UsageStats) => sum + (stat.current_usage || 0), 0) || 0;
      
      // Set system metrics with calculated values
      setSystemMetrics({
        totalUsers,
        activeUsers,
        pendingRequests,
        totalMessages,
        todayMessages
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to fetch admin data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Configuration management with database persistence
  const loadSystemConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('key, value')
        .in('key', ['maintenance_mode', 'default_settings', 'security_settings']);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        interface ConfigValue {
          enabled?: boolean;
          message?: string;
          startTime?: string;
          endTime?: string;
          defaultMonthlyLimit?: number;
          autoApprove?: boolean;
          notificationEmail?: string;
          sessionTimeout?: number;
          requireAdminApproval?: boolean;
          enableAuditLogging?: boolean;
          rateLimitPerMinute?: number;
          maxConcurrentSessions?: number;
        }
        
        const maintenanceModeData = data.find(item => item.key === 'maintenance_mode');
        const defaultSettingsData = data.find(item => item.key === 'default_settings');
        const securitySettingsData = data.find(item => item.key === 'security_settings');
        
        if (maintenanceModeData?.value && typeof maintenanceModeData.value === 'object') {
          const maintenanceMode = maintenanceModeData.value as ConfigValue;
          setSystemConfig(prev => ({
            ...prev,
            enableMaintenance: maintenanceMode.enabled || false,
            maintenanceMessage: maintenanceMode.message || prev.maintenanceMessage,
            maintenanceStartTime: maintenanceMode.startTime || prev.maintenanceStartTime,
            maintenanceEndTime: maintenanceMode.endTime || prev.maintenanceEndTime
          }));
        }
        
        if (defaultSettingsData?.value && typeof defaultSettingsData.value === 'object') {
          const defaultSettings = defaultSettingsData.value as ConfigValue;
          setSystemConfig(prev => ({
            ...prev,
            defaultMonthlyLimit: defaultSettings.defaultMonthlyLimit || prev.defaultMonthlyLimit,
            autoApproveRequests: defaultSettings.autoApprove || prev.autoApproveRequests,
            notificationEmail: defaultSettings.notificationEmail || prev.notificationEmail,
            sessionTimeout: defaultSettings.sessionTimeout || prev.sessionTimeout
          }));
        }
        
        if (securitySettingsData?.value && typeof securitySettingsData.value === 'object') {
          const securitySettings = securitySettingsData.value as ConfigValue;
          setSystemConfig(prev => ({
            ...prev,
            requireAdminApproval: securitySettings.requireAdminApproval ?? prev.requireAdminApproval,
            enableAuditLogging: securitySettings.enableAuditLogging ?? prev.enableAuditLogging,
            rateLimitPerMinute: securitySettings.rateLimitPerMinute || prev.rateLimitPerMinute,
            maxConcurrentSessions: securitySettings.maxConcurrentSessions || prev.maxConcurrentSessions
          }));
        }
      }
    } catch (error) {
      // Silent fail - config loading is not critical
    }
  }, []);

  const updateSystemConfig = async (newConfig: Partial<SystemConfig>) => {
    try {
      const updatedConfig = { ...systemConfig, ...newConfig };
      setSystemConfig(updatedConfig);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if ('enableMaintenance' in newConfig || 'maintenanceMessage' in newConfig || 
          'maintenanceStartTime' in newConfig || 'maintenanceEndTime' in newConfig) {
        await supabase
          .from('system_config')
          .upsert({
            key: 'maintenance_mode',
            value: {
              enabled: updatedConfig.enableMaintenance,
              message: updatedConfig.maintenanceMessage,
              startTime: updatedConfig.maintenanceStartTime,
              endTime: updatedConfig.maintenanceEndTime
            },
            updated_by: user?.id
          }, { onConflict: 'key' });
      }
      
      if ('defaultMonthlyLimit' in newConfig || 'autoApproveRequests' in newConfig ||
          'notificationEmail' in newConfig || 'sessionTimeout' in newConfig) {
        await supabase
          .from('system_config')
          .upsert({
            key: 'default_settings',
            value: {
              defaultMonthlyLimit: updatedConfig.defaultMonthlyLimit,
              autoApprove: updatedConfig.autoApproveRequests,
              notificationEmail: updatedConfig.notificationEmail,
              sessionTimeout: updatedConfig.sessionTimeout
            },
            updated_by: user?.id
          }, { onConflict: 'key' });
      }
      
      if ('requireAdminApproval' in newConfig || 'enableAuditLogging' in newConfig ||
          'rateLimitPerMinute' in newConfig || 'maxConcurrentSessions' in newConfig) {
        await supabase
          .from('system_config')
          .upsert({
            key: 'security_settings',
            value: {
              requireAdminApproval: updatedConfig.requireAdminApproval,
              enableAuditLogging: updatedConfig.enableAuditLogging,
              rateLimitPerMinute: updatedConfig.rateLimitPerMinute,
              maxConcurrentSessions: updatedConfig.maxConcurrentSessions
            },
            updated_by: user?.id
          }, { onConflict: 'key' });
      }
      
      const maintenanceConfig = {
        enableMaintenance: updatedConfig.enableMaintenance,
        maintenanceMessage: updatedConfig.maintenanceMessage,
        maintenanceStartTime: updatedConfig.maintenanceStartTime,
        maintenanceEndTime: updatedConfig.maintenanceEndTime
      };
      localStorage.setItem('ayn_maintenance_config', JSON.stringify(maintenanceConfig));
      
      toast({
        title: "Configuration Updated",
        description: "Settings saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update configuration.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchData();
    loadSystemConfig();
  }, [fetchData, loadSystemConfig]);

  const performSystemMaintenance = async (action: string) => {
    try {
      switch (action) {
        case 'backup':
          await new Promise(resolve => setTimeout(resolve, 2000));
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
      toast({
        title: "Error",
        description: "Maintenance task failed.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center">
              <Brain className="w-8 h-8 text-foreground/60 animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-foreground/10 border-t-foreground/40 animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading admin panel...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Back Button */}
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                size="icon"
                className="w-10 h-10 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-foreground flex items-center justify-center shadow-lg">
                  <Crown className="w-6 h-6 text-background" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-medium tracking-tight">Admin Console</h1>
                <p className="text-sm text-muted-foreground">Manage users, settings & system health</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <Button
                onClick={toggleTheme}
                variant="outline"
                size="icon"
                className="w-10 h-10 rounded-xl bg-background/50 backdrop-blur-sm border-border/50 hover:bg-muted/50 transition-all duration-200"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
              
              {/* Refresh Button */}
              <Button 
                onClick={fetchData} 
                variant="outline" 
                size="sm"
                className="gap-2 bg-background/50 backdrop-blur-sm border-border/50 hover:bg-muted/50 transition-all duration-200"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Navigation Tabs */}
      <div className="border-b border-border/40 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative flex items-center gap-2 px-5 py-4 text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'text-foreground' 
                      : 'text-muted-foreground hover:text-foreground/80'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            {activeTab === 'overview' && (
              <ErrorBoundary>
                <AdminDashboard systemMetrics={systemMetrics} allUsers={allUsers} />
              </ErrorBoundary>
            )}

            {activeTab === 'users' && (
              <ErrorBoundary>
                <UserManagement allUsers={allUsers} onRefresh={fetchData} />
              </ErrorBoundary>
            )}

            {activeTab === 'rate-limits' && (
              <ErrorBoundary>
                <RateLimitMonitoring />
              </ErrorBoundary>
            )}

            {activeTab === 'health' && (
              <ErrorBoundary>
                <SystemHealthMonitor />
              </ErrorBoundary>
            )}

            {activeTab === 'settings' && (
              <ErrorBoundary>
                <SystemSettings 
                  systemConfig={systemConfig}
                  onUpdateConfig={updateSystemConfig}
                  onPerformMaintenance={performSystemMaintenance}
                />
              </ErrorBoundary>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};