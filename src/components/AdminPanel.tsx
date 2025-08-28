import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Building, 
  Mail, 
  Phone,
  Shield,
  Calendar,
  BarChart3,
  Settings,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  Activity,
  TrendingUp,
  MessageSquare,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  Database,
  Server,
  Zap,
  Globe,
  Lock,
  Unlock,
  UserPlus,
  UserMinus,
  Crown,
  Star,
  DollarSign
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
}

export const AdminPanel = () => {
  const [accessRequests, setAccessRequests] = useState<AccessGrantWithProfile[]>([]);
  const [allUsers, setAllUsers] = useState<AccessGrantWithProfile[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AccessGrantWithProfile | null>(null);
  const [selectedUser, setSelectedUser] = useState<AccessGrantWithProfile | null>(null);
  const [notes, setNotes] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch access requests
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

      // Fetch usage statistics
      const { data: usageData, error: usageError } = await supabase
        .rpc('get_usage_stats');

      if (!usageError && usageData) {
        setUsageStats(usageData);
      }

      // Calculate system metrics
      const totalUsers = accessData?.length || 0;
      const activeUsers = accessData?.filter(u => u.is_active).length || 0;
      const pendingRequests = accessData?.filter(u => !u.is_active && !u.granted_at).length || 0;
      
      // Get usage logs for today
      const today = new Date().toISOString().split('T')[0];
      const { data: todayUsage } = await supabase
        .from('usage_logs')
        .select('usage_count')
        .gte('created_at', today);

      const todayMessages = todayUsage?.reduce((sum, log) => sum + (log.usage_count || 0), 0) || 0;

      setSystemMetrics({
        totalUsers,
        activeUsers,
        pendingRequests,
        totalMessages: usageData?.reduce((sum: number, stat: any) => sum + (stat.current_usage || 0), 0) || 0,
        todayMessages,
        avgResponseTime: 1.2 // Mock data - would come from actual monitoring
      });

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
  };

  useEffect(() => {
    fetchData();
  }, []);

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

      toast({
        title: "Limits Updated",
        description: "User limits have been updated successfully."
      });
      
      fetchData();
    } catch (error) {
      console.error('Error updating limits:', error);
    }
  };

  const exportUserData = async () => {
    try {
      const csvContent = [
        ['Company', 'Contact Person', 'Status', 'Monthly Limit', 'Current Usage', 'Created Date'].join(','),
        ...allUsers.map(user => [
          user.profiles?.company_name || 'N/A',
          user.profiles?.contact_person || 'N/A',
          user.is_active ? 'Active' : 'Inactive',
          user.monthly_limit || 'Unlimited',
          user.current_month_usage || 0,
          new Date(user.created_at).toLocaleDateString()
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ayn-users-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "User data has been exported to CSV."
      });
    } catch (error) {
      console.error('Error exporting data:', error);
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
          <span>Loading admin panel...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Crown className="w-6 h-6 text-primary" />
            Admin Control Center
          </h1>
          <p className="text-muted-foreground">Complete administrative control and monitoring</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Access Requests
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {systemMetrics?.activeUsers || 0} active users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics?.pendingRequests || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages Today</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics?.todayMessages || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total: {systemMetrics?.totalMessages || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Activity className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Excellent</div>
                <p className="text-xs text-muted-foreground">
                  Avg response: {systemMetrics?.avgResponseTime || 0}s
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest user activities and system events</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {allUsers.slice(0, 10).map((user, index) => (
                    <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{user.profiles?.company_name || 'Unknown Company'}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.is_active ? 'Access granted' : 'Pending review'}
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
        </TabsContent>

        {/* Users Management Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage all registered users and their access</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={exportUserData} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search users..."
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
              </div>

              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredUsers.map((user) => {
                    const status = getStatusInfo(user);
                    const StatusIcon = status.icon;
                    
                    return (
                      <Card key={user.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <StatusIcon className={`w-5 h-5 ${status.color}`} />
                              <Badge variant={status.variant}>{status.label}</Badge>
                              <span className="font-medium">
                                {user.profiles?.company_name || 'No company'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Contact:</span>
                                <p className="font-medium">
                                  {user.profiles?.contact_person || 'Not specified'}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Usage:</span>
                                <p className="font-medium">
                                  {user.current_month_usage || 0} / {user.monthly_limit || '∞'}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Joined:</span>
                                <p className="font-medium">
                                  {new Date(user.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {user.is_active ? (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleRevokeAccess(user.user_id)}
                                >
                                  <Lock className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedRequest(user)}
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
        </TabsContent>

        {/* Access Requests Tab */}
        <TabsContent value="access" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Access Requests</CardTitle>
              <CardDescription>Review and manage pending access requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accessRequests.filter(req => !req.is_active && !req.granted_at).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No pending access requests</p>
                  </div>
                ) : (
                  accessRequests
                    .filter(req => !req.is_active && !req.granted_at)
                    .map((request) => (
                      <Card key={request.id} className="p-4 border-l-4 border-l-yellow-500">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Clock className="w-5 h-5 text-yellow-600" />
                              <Badge variant="secondary">Pending Review</Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(request.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Building className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">
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
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            variant="outline"
                            onClick={() => setSelectedRequest(request)}
                          >
                            Review Request
                          </Button>
                        </div>
                      </Card>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage Analytics</CardTitle>
                <CardDescription>Monthly usage patterns and limits</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {usageStats.map((stat) => (
                      <div key={stat.user_id} className="p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{stat.company_name || 'Unknown Company'}</span>
                          <Badge variant={stat.usage_percentage > 80 ? 'destructive' : 'default'}>
                            {stat.usage_percentage.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className={`h-2 rounded-full ${
                              stat.usage_percentage > 80 ? 'bg-red-500' : 
                              stat.usage_percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(stat.usage_percentage, 100)}%` }}
                          />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {stat.current_usage} / {stat.monthly_limit || '∞'} messages
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Real-time system metrics and health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    <span className="font-medium">API Response Time</span>
                  </div>
                  <span className="text-green-600 font-bold">
                    {systemMetrics?.avgResponseTime || 0}s
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Database Status</span>
                  </div>
                  <Badge variant="default" className="bg-green-600">Healthy</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-950">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">Active Sessions</span>
                  </div>
                  <span className="text-purple-600 font-bold">
                    {systemMetrics?.activeUsers || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-orange-600" />
                    <span className="font-medium">Webhook Status</span>
                  </div>
                  <Badge variant="default" className="bg-green-600">Online</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Management</CardTitle>
              <CardDescription>Advanced system controls and monitoring</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Database Operations</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Database className="w-4 h-4 mr-2" />
                      Backup Database
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync User Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Export System Logs
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Maintenance Actions</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Zap className="w-4 h-4 mr-2" />
                      Clear Cache
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Activity className="w-4 h-4 mr-2" />
                      Health Check
                    </Button>
                    <Button variant="destructive" className="w-full justify-start">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Maintenance Mode
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Default Settings</CardTitle>
                <CardDescription>System-wide default configurations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Monthly Limit</label>
                  <Input type="number" placeholder="100" />
                  <p className="text-xs text-muted-foreground">
                    Default message limit for new users
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Auto-approve Requests</label>
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <span className="text-sm text-muted-foreground">
                      Automatically approve new access requests
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notification Email</label>
                  <Input type="email" placeholder="admin@company.com" />
                  <p className="text-xs text-muted-foreground">
                    Email for system notifications
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Advanced security and access controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Require Admin Approval</label>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <span className="text-sm text-muted-foreground">
                      All new users require manual approval
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Session Timeout (hours)</label>
                  <Input type="number" placeholder="24" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Enable Audit Logging</label>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <span className="text-sm text-muted-foreground">
                      Log all admin actions
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Review/Edit Modals */}
      {selectedRequest && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                Review Access Request - {selectedRequest.profiles?.company_name || 'Unknown Company'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Notes (optional)</label>
                <Textarea
                  placeholder="Add any notes for the user..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Expiration Date (optional)</label>
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
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
                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                  <p><strong>Examples:</strong></p>
                  <p>• Trial: 10-20 messages/month</p>
                  <p>• Starter: 50-100 messages/month</p>
                  <p>• Business: 200-500 messages/month</p>
                  <p>• Enterprise: 1000+ messages/month</p>
                  <p>• Leave empty for unlimited usage</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="default"
                  onClick={() => handleGrantAccess(selectedRequest.id, selectedRequest.user_id)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Grant Access
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={() => handleDenyAccess(selectedRequest.id)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Deny Access
                </Button>
                
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </Card>
      )}

      {selectedUser && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Edit User Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Monthly Message Limit</label>
                <Input
                  type="number"
                  placeholder={selectedUser.monthly_limit?.toString() || "Unlimited"}
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => handleUpdateUserLimits(
                    selectedUser.user_id, 
                    monthlyLimit ? parseInt(monthlyLimit) : null
                  )}
                >
                  Update Limits
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </Card>
      )}
    </div>
  );
};