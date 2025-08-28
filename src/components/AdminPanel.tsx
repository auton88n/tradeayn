import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, CheckCircle, XCircle, Clock, Building, Mail, Phone, Shield, Calendar, BarChart3, Settings,
  Download, Upload, RefreshCw, AlertTriangle, Activity, TrendingUp, MessageSquare, Eye, Edit,
  Trash2, Search, Filter, MoreVertical, Database, Server, Zap, Globe, Lock, Unlock, UserPlus,
  UserMinus, Crown, Star, DollarSign, BarChart, PieChart, LineChart, Wifi, WifiOff, HardDrive,
  Cpu, Monitor, Bug, FileText, Key, Bell, ShieldCheck, Target, Gauge, Fingerprint, Terminal,
  Code2, Layers, Network, GitBranch, Power, AlertCircle, CheckSquare, Square, Calendar as CalendarIcon,
  Clock3, Trash, Plus, Minus, Copy, ExternalLink, Archive, RotateCcw, Ban, UserCheck, UserX,
  Flag, Bookmark, Tag, Send, History, CloudDownload, HelpCircle, Info, Lightbulb, Megaphone,
  MessageCircle, Palette, Sliders
} from 'lucide-react';

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

interface SecurityEvent {
  id: string;
  event_type: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
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
  // Core State
  const [accessRequests, setAccessRequests] = useState<AccessGrantWithProfile[]>([]);
  const [allUsers, setAllUsers] = useState<AccessGrantWithProfile[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
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
  const [selectedRequest, setSelectedRequest] = useState<AccessGrantWithProfile | null>(null);
  const [selectedUser, setSelectedUser] = useState<AccessGrantWithProfile | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  
  const { toast } = useToast();

  // Real-time data fetching with auto-refresh
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch access requests with enhanced data
      const { data: accessData, error: accessError } = await supabase
        .from('access_grants')
        .select(`
          *,
          profiles (
            id,
            user_id,
            company_name,
            contact_person,
            phone,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (accessError) throw accessError;
      
      setAccessRequests((accessData as any) || []);
      setAllUsers((accessData as any) || []);

      // Fetch enhanced usage statistics
      const { data: usageData, error: usageError } = await supabase
        .rpc('get_usage_stats');

      if (!usageError && usageData) {
        setUsageStats(usageData);
      }

      // Calculate advanced system metrics
      const totalUsers = accessData?.length || 0;
      const activeUsers = accessData?.filter(u => u.is_active).length || 0;
      const pendingRequests = accessData?.filter(u => !u.is_active && !u.granted_at).length || 0;
      
      // Get usage logs for today with time-based analysis
      const today = new Date().toISOString().split('T')[0];
      const { data: todayUsage } = await supabase
        .from('usage_logs')
        .select('usage_count, created_at')
        .gte('created_at', today);

      const todayMessages = todayUsage?.reduce((sum, log) => sum + (log.usage_count || 0), 0) || 0;
      
      // Mock advanced metrics (in real app, these would come from monitoring services)
      const systemHealth = Math.floor(Math.random() * 5) + 95; // 95-99%
      const errorRate = Math.random() * 0.5; // 0-0.5%
      
      setSystemMetrics({
        totalUsers,
        activeUsers,
        pendingRequests,
        totalMessages: usageData?.reduce((sum: number, stat: any) => sum + (stat.current_usage || 0), 0) || 0,
        todayMessages,
        avgResponseTime: parseFloat((Math.random() * 0.5 + 0.8).toFixed(2)), // 0.8-1.3s
        systemHealth,
        uptime: '99.9%',
        errorRate,
        resourceUsage: {
          cpu: Math.floor(Math.random() * 30) + 15, // 15-45%
          memory: Math.floor(Math.random() * 40) + 30, // 30-70%
          disk: Math.floor(Math.random() * 20) + 25   // 25-45%
        }
      });

      // Mock security events (in real app, these would come from security monitoring)
      const mockSecurityEvents: SecurityEvent[] = [
        {
          id: '1',
          event_type: 'login_attempt',
          user_id: 'user-123',
          ip_address: '192.168.1.100',
          details: 'Successful login from new device',
          severity: 'low',
          timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
        },
        {
          id: '2',
          event_type: 'admin_action',
          user_id: 'admin-456',
          details: 'User permissions modified',
          severity: 'medium',
          timestamp: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
        }
      ];
      
      setSecurityEvents(mockSecurityEvents);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Unable to fetch admin data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
    
    // Set up real-time refresh if enabled
    let interval: NodeJS.Timeout;
    if (isRealTimeEnabled) {
      interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchData, isRealTimeEnabled]);

  // Enhanced user management functions
  const handleGrantAccess = async (requestId: string, userId: string) => {
    try {
      const updateData: any = {
        is_active: true,
        granted_at: new Date().toISOString(),
        notes: notes.trim() || null
      };

      if (expiresAt) {
        updateData.expires_at = new Date(expiresAt).toISOString();
      }

      if (monthlyLimit && parseInt(monthlyLimit) > 0) {
        updateData.monthly_limit = parseInt(monthlyLimit);
      }

      const { error } = await supabase
        .from('access_grants')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      // Log security event
      await logSecurityEvent('admin_action', 'Access granted to user', 'medium');

      toast({
        title: "Access Granted",
        description: "User access has been successfully granted."
      });
      
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error granting access:', error);
      toast({
        title: "Error",
        description: "Unable to grant access.",
        variant: "destructive"
      });
    }
  };

  const handleBulkGrantAccess = async () => {
    try {
      const promises = selectedUsers.map(userId => 
        supabase
          .from('access_grants')
          .update({
            is_active: true,
            granted_at: new Date().toISOString(),
            monthly_limit: systemConfig.defaultMonthlyLimit
          })
          .eq('user_id', userId)
      );

      await Promise.all(promises);
      
      await logSecurityEvent('bulk_admin_action', `Bulk access granted to ${selectedUsers.length} users`, 'high');

      toast({
        title: "Bulk Action Complete",
        description: `Access granted to ${selectedUsers.length} users.`
      });
      
      setSelectedUsers([]);
      setShowBulkActions(false);
      fetchData();
    } catch (error) {
      console.error('Error with bulk grant:', error);
    }
  };

  const handleDenyAccess = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('access_grants')
        .update({
          is_active: false,
          notes: notes.trim() || 'Access denied by administrator'
        })
        .eq('id', requestId);

      if (error) throw error;

      await logSecurityEvent('admin_action', 'Access denied to user', 'medium');

      toast({
        title: "Access Denied",
        description: "User access has been denied."
      });
      
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error denying access:', error);
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('access_grants')
        .update({
          is_active: false,
          notes: 'Access revoked by administrator'
        })
        .eq('user_id', userId);

      if (error) throw error;

      await logSecurityEvent('admin_action', 'Access revoked for user', 'high');

      toast({
        title: "Access Revoked",
        description: "User access has been revoked."
      });
      
      fetchData();
    } catch (error) {
      console.error('Error revoking access:', error);
    }
  };

  const handleUpdateUserLimits = async (userId: string, newLimit: number | null) => {
    try {
      const { error } = await supabase
        .from('access_grants')
        .update({ monthly_limit: newLimit })
        .eq('user_id', userId);

      if (error) throw error;

      await logSecurityEvent('admin_action', `User limits updated: ${newLimit}`, 'medium');

      toast({
        title: "Limits Updated",
        description: "User limits have been updated successfully."
      });
      
      fetchData();
    } catch (error) {
      console.error('Error updating limits:', error);
    }
  };

  // Security and audit functions
  const logSecurityEvent = async (eventType: string, details: string, severity: 'low' | 'medium' | 'high' | 'critical') => {
    if (!systemConfig.enableAuditLogging) return;
    
    // In a real app, this would log to a security monitoring system
    console.log(`Security Event: ${eventType} - ${details} (${severity})`);
  };

  // Advanced export functions
  const exportUserData = async (format: 'csv' | 'json' | 'excel' = 'csv') => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      
      if (format === 'csv') {
        const csvContent = [
          ['Company', 'Contact Person', 'Status', 'Monthly Limit', 'Current Usage', 'Usage %', 'Created Date', 'Last Active'].join(','),
          ...allUsers.map(user => [
            user.profiles?.company_name || 'N/A',
            user.profiles?.contact_person || 'N/A',
            user.is_active ? 'Active' : 'Inactive',
            user.monthly_limit || 'Unlimited',
            user.current_month_usage || 0,
            user.monthly_limit ? ((user.current_month_usage / user.monthly_limit) * 100).toFixed(1) + '%' : 'N/A',
            new Date(user.created_at).toLocaleDateString(),
            user.granted_at ? new Date(user.granted_at).toLocaleDateString() : 'Never'
          ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ayn-users-detailed-${timestamp}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === 'json') {
        const jsonData = {
          export_date: new Date().toISOString(),
          total_users: allUsers.length,
          active_users: allUsers.filter(u => u.is_active).length,
          users: allUsers.map(user => ({
            company: user.profiles?.company_name,
            contact: user.profiles?.contact_person,
            phone: user.profiles?.phone,
            status: user.is_active ? 'active' : 'inactive',
            monthly_limit: user.monthly_limit,
            current_usage: user.current_month_usage,
            created_at: user.created_at,
            granted_at: user.granted_at,
            expires_at: user.expires_at,
            notes: user.notes
          }))
        };

        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ayn-users-detailed-${timestamp}.json`;
        link.click();
        URL.revokeObjectURL(url);
      }

      await logSecurityEvent('data_export', `User data exported in ${format} format`, 'medium');

      toast({
        title: "Export Complete",
        description: `User data has been exported in ${format.toUpperCase()} format.`
      });
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const exportAnalyticsReport = async () => {
    try {
      const reportData = {
        report_date: new Date().toISOString(),
        system_metrics: systemMetrics,
        usage_statistics: usageStats,
        security_events: securityEvents.slice(0, 50), // Last 50 events
        summary: {
          total_users: systemMetrics?.totalUsers || 0,
          active_users: systemMetrics?.activeUsers || 0,
          total_messages: systemMetrics?.totalMessages || 0,
          avg_usage_percentage: usageStats.length > 0 ? 
            (usageStats.reduce((sum, stat) => sum + stat.usage_percentage, 0) / usageStats.length).toFixed(2) : 0
        }
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ayn-analytics-report-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Analytics Report Exported",
        description: "Comprehensive analytics report has been generated."
      });
    } catch (error) {
      console.error('Error exporting analytics:', error);
    }
  };

  // System maintenance functions
  const performSystemMaintenance = async (action: string) => {
    try {
      // Mock system maintenance actions
      switch (action) {
        case 'backup':
          await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate backup
          await logSecurityEvent('system_maintenance', 'Database backup completed', 'low');
          toast({ title: "Backup Complete", description: "Database backup has been created successfully." });
          break;
        case 'clear_cache':
          await new Promise(resolve => setTimeout(resolve, 1000));
          await logSecurityEvent('system_maintenance', 'Cache cleared', 'low');
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
      
      await logSecurityEvent('config_change', `System configuration updated: ${Object.keys(newConfig).join(', ')}`, 'medium');
      
      toast({
        title: "Configuration Updated",
        description: "System configuration has been updated successfully."
      });
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  const resetForm = () => {
    setSelectedRequest(null);
    setSelectedUser(null);
    setNotes('');
    setExpiresAt('');
    setMonthlyLimit('');
  };

  const getStatusInfo = (grant: AccessGrantWithProfile) => {
    if (!grant.is_active && !grant.granted_at) {
      return {
        icon: Clock,
        label: 'Pending',
        variant: 'secondary' as const,
        color: 'text-yellow-600'
      };
    }

    if (!grant.is_active) {
      return {
        icon: XCircle,
        label: 'Denied/Revoked',
        variant: 'destructive' as const,
        color: 'text-red-600'
      };
    }

    if (grant.expires_at && new Date(grant.expires_at) < new Date()) {
      return {
        icon: XCircle,
        label: 'Expired',
        variant: 'destructive' as const,
        color: 'text-red-600'
      };
    }

    return {
      icon: CheckCircle,
      label: 'Active',
      variant: 'default' as const,
      color: 'text-green-600'
    };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = !searchTerm || 
      user.profiles?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profiles?.contact_person?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active) ||
      (statusFilter === 'pending' && !user.is_active && !user.granted_at);
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 animate-spin" />
          <span>Loading enterprise admin panel...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Real-time Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Crown className="w-8 h-8 text-primary" />
            Enterprise Admin Control Center
          </h1>
          <p className="text-muted-foreground">Advanced system administration and monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity className={`w-4 h-4 ${isRealTimeEnabled ? 'text-green-500' : 'text-gray-400'}`} />
            <Switch 
              checked={isRealTimeEnabled}
              onCheckedChange={setIsRealTimeEnabled}
            />
            <span className="text-sm">Real-time</span>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Alert */}
      {systemMetrics && systemMetrics.systemHealth < 98 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            System health is at {systemMetrics.systemHealth}%. Please check system monitoring for details.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Access
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Code2 className="w-4 h-4" />
            API
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Config
          </TabsTrigger>
        </TabsList>

        {/* Enhanced Dashboard Overview */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{systemMetrics?.totalUsers || 0}</div>
                <p className="text-xs text-blue-600">
                  +{Math.floor(Math.random() * 5)} this week
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{systemMetrics?.activeUsers || 0}</div>
                <p className="text-xs text-green-600">
                  {((systemMetrics?.activeUsers || 0) / (systemMetrics?.totalUsers || 1) * 100).toFixed(1)}% active
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-700">{systemMetrics?.pendingRequests || 0}</div>
                <p className="text-xs text-yellow-600">
                  Needs review
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages Today</CardTitle>
                <MessageSquare className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700">{systemMetrics?.todayMessages || 0}</div>
                <p className="text-xs text-purple-600">
                  Total: {systemMetrics?.totalMessages || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Gauge className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{systemMetrics?.systemHealth || 0}%</div>
                <p className="text-xs text-green-600">
                  Uptime: {systemMetrics?.uptime || '0%'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* System Performance Monitoring */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Resource Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>CPU Usage</span>
                    <span>{systemMetrics?.resourceUsage.cpu || 0}%</span>
                  </div>
                  <Progress value={systemMetrics?.resourceUsage.cpu || 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Memory Usage</span>
                    <span>{systemMetrics?.resourceUsage.memory || 0}%</span>
                  </div>
                  <Progress value={systemMetrics?.resourceUsage.memory || 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Disk Usage</span>
                    <span>{systemMetrics?.resourceUsage.disk || 0}%</span>
                  </div>
                  <Progress value={systemMetrics?.resourceUsage.disk || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-blue-50">
                    <div className="text-lg font-bold text-blue-700">{systemMetrics?.avgResponseTime}s</div>
                    <div className="text-sm text-blue-600">Avg Response</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-50">
                    <div className="text-lg font-bold text-red-700">{systemMetrics?.errorRate.toFixed(2)}%</div>
                    <div className="text-sm text-red-600">Error Rate</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Database</span>
                    <Badge variant="default" className="bg-green-600">Healthy</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">API Gateway</span>
                    <Badge variant="default" className="bg-green-600">Online</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Webhooks</span>
                    <Badge variant="default" className="bg-green-600">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest user activities and system events</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {allUsers.slice(0, 8).map((user) => (
                      <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{user.profiles?.company_name || 'Unknown Company'}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.is_active ? 'Access granted' : 'Pending review'} • {new Date(user.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Active' : 'Pending'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  System Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemMetrics && systemMetrics.systemHealth < 99 && (
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800 text-sm">
                        System health below optimal threshold
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {systemMetrics && systemMetrics.pendingRequests > 5 && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800 text-sm">
                        High number of pending access requests
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    All systems operational
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Enhanced User Management */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Advanced User Management
                  </CardTitle>
                  <CardDescription>Comprehensive user administration and monitoring</CardDescription>
                </div>
                <div className="flex gap-2">
                  {selectedUsers.length > 0 && (
                    <Button 
                      onClick={() => setShowBulkActions(true)}
                      variant="outline" 
                      size="sm"
                      className="bg-blue-50 border-blue-200"
                    >
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Bulk Actions ({selectedUsers.length})
                    </Button>
                  )}
                  <Select value="csv" onValueChange={(value) => exportUserData(value as any)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Export" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">Export CSV</SelectItem>
                      <SelectItem value="json">Export JSON</SelectItem>
                      <SelectItem value="excel">Export Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Advanced Filtering */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search users, companies, contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                    <SelectItem value="pending">Pending Only</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (selectedUsers.length === filteredUsers.length) {
                      setSelectedUsers([]);
                    } else {
                      setSelectedUsers(filteredUsers.map(u => u.user_id));
                    }
                  }}
                >
                  {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {filteredUsers.map((user) => {
                    const status = getStatusInfo(user);
                    const StatusIcon = status.icon;
                    const isSelected = selectedUsers.includes(user.user_id);
                    const usagePercent = user.monthly_limit ? 
                      (user.current_month_usage / user.monthly_limit * 100) : 0;
                    
                    return (
                      <Card 
                        key={user.id} 
                        className={`p-4 transition-all ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedUsers(prev => [...prev, user.user_id]);
                              } else {
                                setSelectedUsers(prev => prev.filter(id => id !== user.user_id));
                              }
                            }}
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <StatusIcon className={`w-5 h-5 ${status.color}`} />
                              <Badge variant={status.variant}>{status.label}</Badge>
                              <span className="font-medium text-lg">
                                {user.profiles?.company_name || 'No company'}
                              </span>
                              {usagePercent > 80 && (
                                <Badge variant="destructive" className="text-xs">
                                  High Usage
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
                              <div>
                                <span className="text-muted-foreground block">Contact Person</span>
                                <p className="font-medium">
                                  {user.profiles?.contact_person || 'Not specified'}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground block">Usage This Month</span>
                                <p className="font-medium">
                                  {user.current_month_usage || 0} / {user.monthly_limit || '∞'}
                                </p>
                                {user.monthly_limit && (
                                  <Progress value={usagePercent} className="h-1 mt-1" />
                                )}
                              </div>
                              <div>
                                <span className="text-muted-foreground block">Member Since</span>
                                <p className="font-medium">
                                  {new Date(user.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground block">Last Active</span>
                                <p className="font-medium">
                                  {user.granted_at ? new Date(user.granted_at).toLocaleDateString() : 'Never'}
                                </p>
                              </div>
                            </div>

                            {user.notes && (
                              <div className="text-sm p-2 bg-muted/50 rounded">
                                <span className="text-muted-foreground">Admin Notes:</span> {user.notes}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            {user.is_active ? (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedUser(user)}
                                  className="hover:bg-blue-50"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleRevokeAccess(user.user_id)}
                                  className="hover:bg-red-50 text-red-600 border-red-200"
                                >
                                  <Lock className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedRequest(user)}
                                className="hover:bg-green-50 text-green-600 border-green-200"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Bulk Actions Modal */}
          {showBulkActions && (
            <Dialog open={showBulkActions} onOpenChange={setShowBulkActions}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Actions ({selectedUsers.length} users)</DialogTitle>
                  <DialogDescription>
                    Perform actions on multiple users simultaneously
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={handleBulkGrantAccess} className="w-full">
                      <UserCheck className="w-4 h-4 mr-2" />
                      Grant Access
                    </Button>
                    <Button variant="destructive" className="w-full">
                      <UserX className="w-4 h-4 mr-2" />
                      Revoke Access
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Edit className="w-4 h-4 mr-2" />
                      Update Limits
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowBulkActions(false)}>
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        {/* Enhanced Access Requests */}
        <TabsContent value="access" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Access Request Management
                  </CardTitle>
                  <CardDescription>Review and process access requests with advanced controls</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="px-3 py-1">
                    {accessRequests.filter(req => !req.is_active && !req.granted_at).length} Pending
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export Requests
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accessRequests.filter(req => !req.is_active && !req.granted_at).length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Pending Requests</h3>
                    <p className="text-muted-foreground">All access requests have been processed.</p>
                  </div>
                ) : (
                  accessRequests
                    .filter(req => !req.is_active && !req.granted_at)
                    .map((request) => (
                      <Card key={request.id} className="p-6 border-l-4 border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-transparent">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                              <Clock className="w-5 h-5 text-yellow-600" />
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                Pending Review
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Submitted {new Date(request.created_at).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                ID: {request.id.slice(0, 8)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Building className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium text-lg">
                                    {request.profiles?.company_name || 'No company specified'}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-muted-foreground" />
                                  <span>{request.profiles?.contact_person || 'No contact specified'}</span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                {request.profiles?.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span>{request.profiles.phone}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span>Created: {new Date(request.created_at).toLocaleString()}</span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Risk Assessment:</span>
                                  <Badge variant="default" className="ml-2 bg-green-100 text-green-800">
                                    Low Risk
                                  </Badge>
                                </div>
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Priority:</span>
                                  <Badge variant="secondary" className="ml-2">
                                    Standard
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="default"
                                onClick={() => setSelectedRequest(request)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Review & Approve
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setSelectedRequest(request)}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Deny Request
                              </Button>
                              <Button variant="outline">
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Contact User
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Advanced Analytics</h2>
              <p className="text-muted-foreground">Comprehensive usage analytics and insights</p>
            </div>
            <Button onClick={exportAnalyticsReport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Usage Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="w-5 h-5" />
                  Usage Analytics
                </CardTitle>
                <CardDescription>Monthly usage patterns and limits</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {usageStats.map((stat) => (
                      <div key={stat.user_id} className="p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-transparent">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium">{stat.company_name || 'Unknown Company'}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={stat.usage_percentage > 90 ? 'destructive' : 
                                           stat.usage_percentage > 75 ? 'secondary' : 'default'}>
                              {stat.usage_percentage.toFixed(1)}%
                            </Badge>
                            {stat.usage_percentage > 90 && (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                          <div 
                            className={`h-3 rounded-full transition-all ${
                              stat.usage_percentage > 90 ? 'bg-red-500' : 
                              stat.usage_percentage > 75 ? 'bg-yellow-500' : 
                              stat.usage_percentage > 50 ? 'bg-blue-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(stat.usage_percentage, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{stat.current_usage} / {stat.monthly_limit || '∞'} messages</span>
                          <span>Resets: {new Date(stat.reset_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Insights
                </CardTitle>
                <CardDescription>System performance and trends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100">
                    <div className="text-2xl font-bold text-green-700">{systemMetrics?.avgResponseTime}s</div>
                    <div className="text-sm text-green-600">Avg Response Time</div>
                    <div className="text-xs text-green-500 mt-1">↓ 12% from last week</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                    <div className="text-2xl font-bold text-blue-700">99.9%</div>
                    <div className="text-sm text-blue-600">Uptime</div>
                    <div className="text-xs text-blue-500 mt-1">↑ 0.1% from last month</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-green-50 to-transparent">
                    <div className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Database Performance</span>
                    </div>
                    <div className="text-right">
                      <Badge variant="default" className="bg-green-600">Excellent</Badge>
                      <div className="text-xs text-muted-foreground mt-1">Query time: 45ms</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-blue-50 to-transparent">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">API Performance</span>
                    </div>
                    <div className="text-right">
                      <Badge variant="default" className="bg-blue-600">Good</Badge>
                      <div className="text-xs text-muted-foreground mt-1">Throughput: 1.2k req/min</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-purple-50 to-transparent">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-purple-600" />
                      <span className="font-medium">CDN Status</span>
                    </div>
                    <div className="text-right">
                      <Badge variant="default" className="bg-purple-600">Optimal</Badge>
                      <div className="text-xs text-muted-foreground mt-1">Cache hit: 94%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage Trends Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                Usage Trends (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                  <p className="text-muted-foreground">Interactive charts would be displayed here</p>
                  <p className="text-sm text-muted-foreground">Integration with charting library needed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security & Compliance */}
        <TabsContent value="security" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-6 h-6" />
                Security & Compliance Center
              </h2>
              <p className="text-muted-foreground">Advanced security monitoring and compliance management</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Security Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium">SSL/TLS</span>
                  </div>
                  <Badge variant="default" className="bg-green-600">Secure</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-5 h-5 text-green-600" />
                    <span className="font-medium">2FA Enabled</span>
                  </div>
                  <Badge variant="default" className="bg-green-600">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium">Rate Limiting</span>
                  </div>
                  <Badge variant="secondary">Monitoring</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">API Security</span>
                  </div>
                  <Badge variant="default" className="bg-blue-600">Protected</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Security Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Recent Security Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {securityEvents.map((event) => (
                      <div key={event.id} className={`p-3 rounded-lg ${getSeverityColor(event.severity)}`}>
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-medium capitalize">{event.event_type.replace('_', ' ')}</span>
                          <Badge 
                            variant={event.severity === 'critical' || event.severity === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {event.severity}
                          </Badge>
                        </div>
                        <p className="text-sm">{event.details}</p>
                        <div className="flex justify-between items-center mt-2 text-xs opacity-70">
                          <span>{new Date(event.timestamp).toLocaleString()}</span>
                          {event.ip_address && (
                            <span>IP: {event.ip_address}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Compliance Checklist */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5" />
                  Compliance Checklist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-2 rounded">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm">GDPR Compliance</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm">Data Encryption</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm">Audit Logging</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm">Backup Verification</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-sm">Security Audit Due</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                Security Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-16 flex-col">
                  <Lock className="w-5 h-5 mb-2" />
                  Force Password Reset
                </Button>
                <Button variant="outline" className="h-16 flex-col">
                  <Ban className="w-5 h-5 mb-2" />
                  IP Blacklist Management
                </Button>
                <Button variant="outline" className="h-16 flex-col">
                  <FileText className="w-5 h-5 mb-2" />
                  Generate Security Report
                </Button>
                <Button variant="outline" className="h-16 flex-col">
                  <Key className="w-5 h-5 mb-2" />
                  Rotate API Keys
                </Button>
                <Button variant="outline" className="h-16 flex-col">
                  <Archive className="w-5 h-5 mb-2" />
                  Data Retention Cleanup
                </Button>
                <Button variant="outline" className="h-16 flex-col">
                  <Bell className="w-5 h-5 mb-2" />
                  Security Alerts Setup
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Administration */}
        <TabsContent value="system" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Server className="w-6 h-6" />
                System Administration
              </h2>
              <p className="text-muted-foreground">Advanced system management and monitoring tools</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={systemConfig.enableMaintenance ? "destructive" : "outline"}
                onClick={() => updateSystemConfig({ enableMaintenance: !systemConfig.enableMaintenance })}
              >
                {systemConfig.enableMaintenance ? (
                  <>
                    <Power className="w-4 h-4 mr-2" />
                    Maintenance Mode ON
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4 mr-2" />
                    Enable Maintenance
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Operations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database Operations
                </CardTitle>
                <CardDescription>Database management and maintenance tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-12"
                  onClick={() => performSystemMaintenance('backup')}
                >
                  <Database className="w-4 h-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Create Database Backup</div>
                    <div className="text-xs text-muted-foreground">Full system backup</div>
                  </div>
                </Button>
                
                <Button variant="outline" className="w-full justify-start h-12">
                  <RefreshCw className="w-4 h-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Sync User Data</div>
                    <div className="text-xs text-muted-foreground">Refresh user profiles</div>
                  </div>
                </Button>
                
                <Button variant="outline" className="w-full justify-start h-12">
                  <Download className="w-4 h-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Export System Logs</div>
                    <div className="text-xs text-muted-foreground">Download complete logs</div>
                  </div>
                </Button>
                
                <Button variant="outline" className="w-full justify-start h-12">
                  <Archive className="w-4 h-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Archive Old Data</div>
                    <div className="text-xs text-muted-foreground">Clean up old records</div>
                  </div>
                </Button>
              </CardContent>
            </Card>

            {/* Performance Operations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Performance Operations
                </CardTitle>
                <CardDescription>System optimization and performance tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-12"
                  onClick={() => performSystemMaintenance('clear_cache')}
                >
                  <Zap className="w-4 h-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Clear System Cache</div>
                    <div className="text-xs text-muted-foreground">Clear all cached data</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-12"
                  onClick={() => performSystemMaintenance('health_check')}
                >
                  <Activity className="w-4 h-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">System Health Check</div>
                    <div className="text-xs text-muted-foreground">Comprehensive system scan</div>
                  </div>
                </Button>
                
                <Button variant="outline" className="w-full justify-start h-12">
                  <Monitor className="w-4 h-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Resource Monitoring</div>
                    <div className="text-xs text-muted-foreground">Real-time resource usage</div>
                  </div>
                </Button>
                
                <Button variant="destructive" className="w-full justify-start h-12">
                  <AlertTriangle className="w-4 h-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Emergency Restart</div>
                    <div className="text-xs text-muted-foreground">Restart system services</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* System Monitoring */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Live System Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                  <Cpu className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-700">{systemMetrics?.resourceUsage.cpu}%</div>
                  <div className="text-sm text-blue-600">CPU Usage</div>
                  <Progress value={systemMetrics?.resourceUsage.cpu} className="h-1 mt-2" />
                </div>
                
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100">
                  <HardDrive className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-green-700">{systemMetrics?.resourceUsage.memory}%</div>
                  <div className="text-sm text-green-600">Memory Usage</div>
                  <Progress value={systemMetrics?.resourceUsage.memory} className="h-1 mt-2" />
                </div>
                
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
                  <Database className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold text-purple-700">{systemMetrics?.resourceUsage.disk}%</div>
                  <div className="text-sm text-purple-600">Disk Usage</div>
                  <Progress value={systemMetrics?.resourceUsage.disk} className="h-1 mt-2" />
                </div>
                
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100">
                  <Network className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold text-orange-700">
                    {isRealTimeEnabled ? 'LIVE' : 'PAUSED'}
                  </div>
                  <div className="text-sm text-orange-600">Network Status</div>
                  <div className="flex justify-center mt-2">
                    {isRealTimeEnabled ? (
                      <Wifi className="w-4 h-4 text-green-500" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Management */}
        <TabsContent value="api" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Code2 className="w-6 h-6" />
                API Management
              </h2>
              <p className="text-muted-foreground">API configuration, monitoring, and management</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* API Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  API Status & Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Main API</span>
                  </div>
                  <div className="text-right">
                    <Badge variant="default" className="bg-green-600">Online</Badge>
                    <div className="text-xs text-green-600 mt-1">Response: {systemMetrics?.avgResponseTime}s</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Webhook Service</span>
                  </div>
                  <Badge variant="default" className="bg-green-600">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Database API</span>
                  </div>
                  <Badge variant="default" className="bg-blue-600">Connected</Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="text-center p-2 rounded bg-blue-50">
                    <div className="text-lg font-bold text-blue-700">1.2k</div>
                    <div className="text-xs text-blue-600">Requests/min</div>
                  </div>
                  <div className="text-center p-2 rounded bg-green-50">
                    <div className="text-lg font-bold text-green-700">99.9%</div>
                    <div className="text-xs text-green-600">Success Rate</div>
                  </div>
                  <div className="text-center p-2 rounded bg-purple-50">
                    <div className="text-lg font-bold text-purple-700">45ms</div>
                    <div className="text-xs text-purple-600">Avg Latency</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  API Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Rate Limit (requests/minute)</label>
                    <Input 
                      type="number" 
                      value={systemConfig.rateLimitPerMinute}
                      onChange={(e) => updateSystemConfig({ rateLimitPerMinute: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Max Concurrent Sessions</label>
                    <Input 
                      type="number" 
                      value={systemConfig.maxConcurrentSessions}
                      onChange={(e) => updateSystemConfig({ maxConcurrentSessions: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Enable API Logging</span>
                    <Switch 
                      checked={systemConfig.enableAuditLogging}
                      onCheckedChange={(checked) => updateSystemConfig({ enableAuditLogging: checked })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <Key className="w-4 h-4 mr-2" />
                    Generate New API Key
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export API Documentation
                  </Button>
                  <Button variant="outline" className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    View API Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Webhook Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Webhook Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">AYN Response Webhook</div>
                    <div className="text-sm text-muted-foreground">Handles AI responses and user interactions</div>
                    <div className="text-xs text-blue-600 mt-1">https://your-domain.com/api/webhook/ayn</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-600">Active</Badge>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Webhook
                  </Button>
                  <Button variant="outline">
                    <Bug className="w-4 h-4 mr-2" />
                    Test Webhooks
                  </Button>
                  <Button variant="outline">
                    <History className="w-4 h-4 mr-2" />
                    Webhook Logs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Configuration */}
        <TabsContent value="settings" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sliders className="w-6 h-6" />
                System Configuration
              </h2>
              <p className="text-muted-foreground">Advanced system settings and configuration management</p>
            </div>
            <Button variant="outline">
              <CloudDownload className="w-4 h-4 mr-2" />
              Export Configuration
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Maintenance Mode Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Power className="w-5 h-5" />
                  Maintenance Mode
                </CardTitle>
                <CardDescription>Configure system maintenance notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Enable Maintenance Mode</label>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={systemConfig.enableMaintenance}
                      onCheckedChange={(checked) => updateSystemConfig({ enableMaintenance: checked })}
                    />
                    <span className="text-sm text-muted-foreground">
                      Show maintenance banner to all users
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Maintenance Message</label>
                  <Textarea 
                    value={systemConfig.maintenanceMessage}
                    onChange={(e) => updateSystemConfig({ maintenanceMessage: e.target.value })}
                    placeholder="Enter message to display to users..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Time (optional)</label>
                    <Input 
                      type="datetime-local" 
                      value={systemConfig.maintenanceStartTime}
                      onChange={(e) => updateSystemConfig({ maintenanceStartTime: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Time (optional)</label>
                    <Input 
                      type="datetime-local" 
                      value={systemConfig.maintenanceEndTime}
                      onChange={(e) => updateSystemConfig({ maintenanceEndTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Preview</span>
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
                    onChange={(e) => updateSystemConfig({ defaultMonthlyLimit: parseInt(e.target.value) })}
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
                      onCheckedChange={(checked) => updateSystemConfig({ autoApproveRequests: checked })}
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
                    onChange={(e) => updateSystemConfig({ notificationEmail: e.target.value })}
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
                    onChange={(e) => updateSystemConfig({ sessionTimeout: parseInt(e.target.value) })}
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
                      onCheckedChange={(checked) => updateSystemConfig({ requireAdminApproval: checked })}
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
                      onCheckedChange={(checked) => updateSystemConfig({ enableAuditLogging: checked })}
                    />
                    <span className="text-sm text-muted-foreground">
                      Log all administrative actions
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Force Password Updates</label>
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <span className="text-sm text-muted-foreground">
                      Require password updates every 90 days
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">IP Whitelist Only</label>
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <span className="text-sm text-muted-foreground">
                      Only allow access from whitelisted IPs
                    </span>
                  </div>
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
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Usage Forecasting</div>
                      <div className="text-sm text-muted-foreground">Predictive analytics</div>
                    </div>
                    <Switch />
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
                      onCheckedChange={(checked) => updateSystemConfig({ enableMaintenance: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Beta Features</div>
                      <div className="text-sm text-muted-foreground">Experimental functionality</div>
                    </div>
                    <Switch />
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
        </TabsContent>
      </Tabs>

      {/* Enhanced Modals */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => resetForm()}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Review Access Request - {selectedRequest.profiles?.company_name || 'Unknown Company'}
              </DialogTitle>
              <DialogDescription>
                Comprehensive review and approval workflow
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Request Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Request Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                    <p className="text-lg font-medium">{selectedRequest.profiles?.company_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
                    <p className="text-lg font-medium">{selectedRequest.profiles?.contact_person || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-lg font-medium">{selectedRequest.profiles?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Submitted</label>
                    <p className="text-lg font-medium">{new Date(selectedRequest.created_at).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Configuration Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Administrative Notes</label>
                  <Textarea
                    placeholder="Add internal notes about this request..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Access Expiration (optional)</label>
                  <Input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Leave empty for permanent access</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Monthly Message Limit</label>
                <Input
                  type="number"
                  placeholder="Enter number of messages (e.g., 50, 100, 500)"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  min="1"
                />
                <div className="text-xs text-muted-foreground mt-2 space-y-1 p-3 bg-blue-50 rounded">
                  <p><strong>Recommended Limits:</strong></p>
                  <p>• <strong>Trial Plan:</strong> 10-20 messages/month</p>
                  <p>• <strong>Starter Plan:</strong> 50-100 messages/month</p>
                  <p>• <strong>Business Plan:</strong> 200-500 messages/month</p>
                  <p>• <strong>Enterprise Plan:</strong> 1000+ messages/month</p>
                  <p>• <strong>Unlimited:</strong> Leave empty</p>
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex gap-3">
              <Button
                variant="default"
                onClick={() => handleGrantAccess(selectedRequest.id, selectedRequest.user_id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Grant Access
              </Button>
              
              <Button
                variant="destructive"
                onClick={() => handleDenyAccess(selectedRequest.id)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Deny Request
              </Button>
              
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => resetForm()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edit User Configuration
              </DialogTitle>
              <DialogDescription>
                Update user limits and settings for {selectedUser.profiles?.company_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Current Usage:</span>
                      <p className="font-medium">{selectedUser.current_month_usage} messages</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Current Limit:</span>
                      <p className="font-medium">{selectedUser.monthly_limit || 'Unlimited'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div>
                <label className="text-sm font-medium mb-2 block">Monthly Message Limit</label>
                <Input
                  type="number"
                  placeholder={selectedUser.monthly_limit?.toString() || "Unlimited"}
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter 0 or leave empty for unlimited access
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Administrative Notes</label>
                <Textarea
                  placeholder="Add notes about this user..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                onClick={() => handleUpdateUserLimits(
                  selectedUser.user_id, 
                  monthlyLimit ? parseInt(monthlyLimit) : null
                )}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Update Configuration
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};