import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Sun, Moon, RefreshCw, LayoutDashboard, Users, Shield, Settings, FileText, Loader2, MessageSquare, LineChart, Bot, DollarSign, Gauge } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { UserManagement } from '@/components/admin/UserManagement';
import { RateLimitMonitoring } from '@/components/admin/RateLimitMonitoring';
import { SystemSettings } from '@/components/admin/SystemSettings';
import { ApplicationManagement, ServiceApplication } from '@/components/admin/ApplicationManagement';
import SupportManagement from '@/components/admin/SupportManagement';
import { GoogleAnalytics } from '@/components/admin/GoogleAnalytics';
import { LLMManagement } from '@/components/admin/LLMManagement';
import { AICostDashboard } from '@/components/admin/AICostDashboard';
import { UserAILimits } from '@/components/admin/UserAILimits';
import { AdminAIAssistant, AdminAIButton } from '@/components/admin/AdminAIAssistant';

// Supabase config - use direct values to avoid any import issues
const SUPABASE_URL = 'https://dfkoxuokfkttjhfjcecx.supabase.co' as const;
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw';

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
  maintenanceStartTime: string;
  maintenanceEndTime: string;
  preMaintenanceNotice: boolean;
  preMaintenanceMessage: string;
  defaultMonthlyLimit: number;
  requireApproval: boolean;
  maxLoginAttempts: number;
  sessionTimeout: number;
}
interface AdminPanelProps {
  session: Session;
  onBackClick?: () => void;
  isAdmin?: boolean;
  isDuty?: boolean;
}

// All tabs - filtered based on role
const allTabs = [{
  id: 'overview',
  label: 'Overview',
  icon: LayoutDashboard,
  adminOnly: true
}, {
  id: 'google-analytics',
  label: 'Analytics',
  icon: LineChart,
  adminOnly: true
}, {
  id: 'applications',
  label: 'Applications',
  icon: FileText,
  adminOnly: false
}, {
  id: 'support',
  label: 'Support',
  icon: MessageSquare,
  adminOnly: false
}, {
  id: 'users',
  label: 'Users',
  icon: Users,
  adminOnly: true
}, {
  id: 'rate-limits',
  label: 'Rate Limits',
  icon: Shield,
  adminOnly: true
}, {
  id: 'settings',
  label: 'Settings',
  icon: Settings,
  adminOnly: true
}, {
  id: 'ai-models',
  label: 'AI Models',
  icon: Bot,
  adminOnly: true
}, {
  id: 'ai-costs',
  label: 'AI Costs',
  icon: DollarSign,
  adminOnly: true
}, {
  id: 'ai-limits',
  label: 'AI Limits',
  icon: Gauge,
  adminOnly: true
}];
export const AdminPanel = ({
  session,
  onBackClick,
  isAdmin = false,
  isDuty = false
}: AdminPanelProps) => {
  const navigate = useNavigate();
  const {
    theme,
    setTheme
  } = useTheme();

  // Filter tabs based on role - duty users only see Applications and Support
  const tabs = allTabs.filter(tab => isAdmin || !tab.adminOnly);

  // Set default tab based on role
  const defaultTab = isAdmin ? 'overview' : 'applications';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [allUsers, setAllUsers] = useState<AccessGrantWithProfile[]>([]);
  const [applications, setApplications] = useState<ServiceApplication[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    todayMessages: 0,
    weeklyGrowth: 0
  });
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    maintenanceMode: false,
    maintenanceMessage: '',
    maintenanceStartTime: '',
    maintenanceEndTime: '',
    preMaintenanceNotice: false,
    preMaintenanceMessage: '',
    defaultMonthlyLimit: 100,
    requireApproval: true,
    maxLoginAttempts: 5,
    sessionTimeout: 30
  });

  // Direct REST API fetch to avoid Supabase client deadlock
  const fetchWithAuth = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const token = session.access_token;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    // Handle empty responses (e.g., from POST/PATCH/DELETE operations)
    const text = await response.text();
    if (!text) {
      return null;
    }
    return JSON.parse(text);
  }, [session.access_token]);

  // Fetch with retry logic for transient failures
  const fetchWithRetry = useCallback(async (endpoint: string, retries = 1): Promise<unknown[]> => {
    try {
      return await fetchWithAuth(endpoint);
    } catch (error) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 500));
        return fetchWithRetry(endpoint, retries - 1);
      }
      console.error(`Failed to fetch ${endpoint}:`, error);
      return [];
    }
  }, [fetchWithAuth]);
  const fetchData = useCallback(async () => {
    try {
      // Fetch all data in parallel using Promise.allSettled for resilience
      const results = await Promise.allSettled([fetchWithRetry('access_grants?select=*&order=created_at.desc'), fetchWithRetry('profiles?select=user_id,company_name,contact_person,avatar_url'), fetchWithRetry(`messages?select=id&created_at=gte.${new Date().toISOString().split('T')[0]}`), fetchWithRetry('system_config?select=key,value'), fetchWithRetry('service_applications?select=*&order=created_at.desc')]);

      // Log any failures for debugging
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Query ${index} failed:`, result.reason);
        }
      });

      // Extract values, defaulting to empty arrays on failure
      const usersData = results[0].status === 'fulfilled' ? results[0].value as AccessGrantWithProfile[] : [];
      const profilesData = results[1].status === 'fulfilled' ? results[1].value as {
        user_id: string;
        company_name: string | null;
        contact_person: string | null;
        avatar_url: string | null;
      }[] : [];
      const messagesData = results[2].status === 'fulfilled' ? results[2].value as {
        id: string;
      }[] : [];
      const configData = results[3].status === 'fulfilled' ? results[3].value as {
        key: string;
        value: unknown;
      }[] : [];
      const applicationsData = results[4].status === 'fulfilled' ? results[4].value as ServiceApplication[] : [];

      // Map profiles to users
      const profilesMap = new Map(profilesData.map(p => [p.user_id, p]));
      const usersWithProfiles: AccessGrantWithProfile[] = usersData.map((user: AccessGrantWithProfile) => ({
        ...user,
        profiles: profilesMap.get(user.user_id) || null
      }));
      setAllUsers(usersWithProfiles);
      setApplications(applicationsData);

      // Calculate metrics
      const activeCount = usersWithProfiles.filter((u: AccessGrantWithProfile) => u.is_active).length;
      const pendingCount = usersWithProfiles.filter((u: AccessGrantWithProfile) => !u.is_active && !u.granted_at).length;
      setSystemMetrics({
        totalUsers: usersWithProfiles.length,
        activeUsers: activeCount,
        pendingUsers: pendingCount,
        todayMessages: messagesData.length,
        weeklyGrowth: 0
      });

      // Parse system config
      if (configData.length > 0) {
        const configMap = new Map(configData.map(c => [c.key, c.value]));
        setSystemConfig(prev => ({
          ...prev,
          maintenanceMode: configMap.get('maintenance_mode') as boolean || false,
          maintenanceMessage: configMap.get('maintenance_message') as string || '',
          maintenanceStartTime: configMap.get('maintenance_start_time') as string || '',
          maintenanceEndTime: configMap.get('maintenance_end_time') as string || '',
          preMaintenanceNotice: configMap.get('pre_maintenance_notice') as boolean || false,
          preMaintenanceMessage: configMap.get('pre_maintenance_message') as string || '',
          defaultMonthlyLimit: configMap.get('default_monthly_limit') as number || 100,
          requireApproval: configMap.get('require_approval') as boolean ?? true,
          maxLoginAttempts: configMap.get('max_login_attempts') as number || 5,
          sessionTimeout: configMap.get('session_timeout') as number || 30
        }));
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fetchWithRetry]);
  useEffect(() => {
    // Small delay to ensure token is fully propagated before admin queries
    const initTimer = setTimeout(() => {
      fetchData();
    }, 100);

    // Safety timeout - if data doesn't load in 8 seconds, stop loading spinner
    const safetyTimeout = setTimeout(() => {
      setIsLoading(false);
      setIsRefreshing(false);
    }, 8000);
    return () => {
      clearTimeout(initTimer);
      clearTimeout(safetyTimeout);
    };
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
        maintenanceStartTime: 'maintenance_start_time',
        maintenanceEndTime: 'maintenance_end_time',
        preMaintenanceNotice: 'pre_maintenance_notice',
        preMaintenanceMessage: 'pre_maintenance_message',
        defaultMonthlyLimit: 'default_monthly_limit',
        requireApproval: 'require_approval',
        maxLoginAttempts: 'max_login_attempts',
        sessionTimeout: 'session_timeout'
      };
      
      for (const [key, value] of Object.entries(updates)) {
        const dbKey = keyMap[key];
        if (dbKey) {
          // Use PATCH to update existing records
          const response = await fetch(`${SUPABASE_URL}/rest/v1/system_config?key=eq.${dbKey}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'apikey': SUPABASE_ANON_KEY,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              value,
              updated_at: new Date().toISOString()
            })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to update ${dbKey}: ${response.status}`);
          }
        }
      }
      
      setSystemConfig(prev => ({
        ...prev,
        ...updates
      }));
      toast.success('Settings updated');
    } catch (error) {
      console.error('Error updating config:', error);
      toast.error('Failed to update settings');
    }
  };
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div animate={{
        rotate: 360
      }} transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }}>
          <Loader2 className="w-8 h-8 text-primary" />
        </motion.div>
      </div>;
  }
  return <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={handleBackClick} variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-muted/50">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{isAdmin ? 'Admin Panel' : 'Duty Panel'}</h1>
              {isDuty && !isAdmin && <Badge variant="secondary">Duty</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? 'Manage users, settings, and system' : 'Manage applications and support'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          
          
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-muted/50 rounded-xl w-fit flex-wrap">
        {tabs.map(tab => {
        const Icon = tab.icon;
        const newAppsCount = tab.id === 'applications' ? applications.filter(a => a.status === 'new').length : 0;
        return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <Icon className="w-4 h-4" />
              {tab.label}
              {newAppsCount > 0 && <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">
                  {newAppsCount}
                </Badge>}
            </button>;
      })}
      </div>

      {/* Content */}
      <ScrollArea className="h-[calc(100vh-220px)]">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} exit={{
          opacity: 0,
          y: -10
        }} transition={{
          duration: 0.2
        }}>
            <ErrorBoundary>
              {activeTab === 'overview' && <AdminDashboard systemMetrics={systemMetrics} allUsers={allUsers} />}
              {activeTab === 'google-analytics' && <GoogleAnalytics />}
              {activeTab === 'applications' && <ApplicationManagement session={session} applications={applications} onRefresh={fetchData} />}
              {activeTab === 'support' && <SupportManagement />}
              {activeTab === 'users' && <UserManagement session={session} allUsers={allUsers} onRefresh={fetchData} />}
              {activeTab === 'rate-limits' && <RateLimitMonitoring session={session} />}
              {activeTab === 'settings' && <SystemSettings systemConfig={systemConfig} onUpdateConfig={updateSystemConfig} />}
              {activeTab === 'ai-models' && <LLMManagement />}
              {activeTab === 'ai-costs' && <AICostDashboard />}
              {activeTab === 'ai-limits' && <UserAILimits />}
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </ScrollArea>
      
      {/* Floating Admin AI Assistant */}
      {isAdmin && <AdminAIAssistant />}
    </div>;
};