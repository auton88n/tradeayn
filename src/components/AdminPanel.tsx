import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Sun, 
  Moon, 
  RefreshCw, 
  LayoutDashboard, 
  Users, 
  Shield, 
  Settings,
  Loader2
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { UserManagement } from '@/components/admin/UserManagement';
import { RateLimitMonitoring } from '@/components/admin/RateLimitMonitoring';
import { SystemSettings } from '@/components/admin/SystemSettings';

// Types
interface Profile {
  company_name: string | null;
  contact_person: string | null;
  avatar_url: string | null;
}

interface AccessGrantWithProfile {
  id: string;
  user_id: string;
  is_active: boolean;
  granted_at: string | null;
  expires_at: string | null;
  current_month_usage: number | null;
  monthly_limit: number | null;
  created_at: string;
  profiles: Profile | null;
  user_email?: string;
}

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  todayMessages: number;
  weeklyGrowth: number;
}

interface SystemConfig {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  defaultMonthlyLimit: number;
  requireApproval: boolean;
  maxLoginAttempts: number;
  sessionTimeout: number;
}

interface AdminPanelProps {
  onBackClick?: () => void;
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'rate-limits', label: 'Rate Limits', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const AdminPanel = ({ onBackClick }: AdminPanelProps) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [allUsers, setAllUsers] = useState<AccessGrantWithProfile[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    todayMessages: 0,
    weeklyGrowth: 0,
  });
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    maintenanceMode: false,
    maintenanceMessage: '',
    defaultMonthlyLimit: 100,
    requireApproval: true,
    maxLoginAttempts: 5,
    sessionTimeout: 30,
  });

  const fetchData = useCallback(async () => {
    try {
      // Fetch all data in parallel
      const [usersResult, profilesResult, messagesResult, configResult] = await Promise.all([
        supabase.from('access_grants').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('user_id, company_name, contact_person, avatar_url'),
        supabase.from('messages').select('id', { count: 'exact' }).gte('created_at', new Date().toISOString().split('T')[0]),
        supabase.from('system_config').select('key, value'),
      ]);

      if (usersResult.error) throw usersResult.error;
      
      // Map profiles to users
      const profilesMap = new Map(
        (profilesResult.data || []).map(p => [p.user_id, p])
      );

      const usersWithProfiles: AccessGrantWithProfile[] = (usersResult.data || []).map(user => ({
        ...user,
        profiles: profilesMap.get(user.user_id) || null,
      }));

      setAllUsers(usersWithProfiles);

      // Calculate metrics
      const activeCount = usersWithProfiles.filter(u => u.is_active).length;
      const pendingCount = usersWithProfiles.filter(u => !u.is_active && !u.granted_at).length;
      
      setSystemMetrics({
        totalUsers: usersWithProfiles.length,
        activeUsers: activeCount,
        pendingUsers: pendingCount,
        todayMessages: messagesResult.count || 0,
        weeklyGrowth: 0,
      });

      // Parse system config
      if (configResult.data) {
        const configMap = new Map(configResult.data.map(c => [c.key, c.value]));
        setSystemConfig(prev => ({
          ...prev,
          maintenanceMode: (configMap.get('maintenance_mode') as boolean) || false,
          maintenanceMessage: (configMap.get('maintenance_message') as string) || '',
          defaultMonthlyLimit: (configMap.get('default_monthly_limit') as number) || 100,
          requireApproval: (configMap.get('require_approval') as boolean) ?? true,
          maxLoginAttempts: (configMap.get('max_login_attempts') as number) || 5,
          sessionTimeout: (configMap.get('session_timeout') as number) || 30,
        }));
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    console.log('[AdminPanel] Fetching data...');
    fetchData();
    
    // Safety timeout - if data doesn't load in 8 seconds, stop loading spinner
    const safetyTimeout = setTimeout(() => {
      console.warn('[AdminPanel] Safety timeout triggered after 8s');
      setIsLoading(false);
      setIsRefreshing(false);
    }, 8000);
    
    return () => clearTimeout(safetyTimeout);
  }, [fetchData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate('/');
    }
  };

  const updateSystemConfig = async (updates: Partial<SystemConfig>) => {
    try {
      const keyMap: Record<string, string> = {
        maintenanceMode: 'maintenance_mode',
        maintenanceMessage: 'maintenance_message',
        defaultMonthlyLimit: 'default_monthly_limit',
        requireApproval: 'require_approval',
        maxLoginAttempts: 'max_login_attempts',
        sessionTimeout: 'session_timeout',
      };

      for (const [key, value] of Object.entries(updates)) {
        const dbKey = keyMap[key];
        if (dbKey) {
          await supabase
            .from('system_config')
            .upsert({ key: dbKey, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
        }
      }

      setSystemConfig(prev => ({ ...prev, ...updates }));
      toast.success('Settings updated');
    } catch (error) {
      console.error('Error updating config:', error);
      toast.error('Failed to update settings');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={handleBackClick}
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-xl hover:bg-muted/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Manage users, settings, and system</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-10 h-10 rounded-xl"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-10 h-10 rounded-xl"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-muted/50 rounded-xl w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <ScrollArea className="h-[calc(100vh-220px)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ErrorBoundary>
              {activeTab === 'overview' && (
                <AdminDashboard 
                  systemMetrics={systemMetrics} 
                  allUsers={allUsers} 
                />
              )}
              {activeTab === 'users' && (
                <UserManagement 
                  allUsers={allUsers} 
                  onRefresh={fetchData} 
                />
              )}
              {activeTab === 'rate-limits' && (
                <RateLimitMonitoring />
              )}
              {activeTab === 'settings' && (
                <SystemSettings 
                  systemConfig={systemConfig}
                  onUpdateConfig={updateSystemConfig}
                />
              )}
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
};
