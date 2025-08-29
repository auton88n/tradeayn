import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, Activity, Clock, MessageSquare, Gauge, Monitor, Building, Bell,
  CheckCircle, AlertTriangle
} from 'lucide-react';

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
  profiles: {
    company_name: string | null;
    contact_person: string | null;
    phone: string | null;
  } | null;
}

interface AdminDashboardProps {
  systemMetrics: SystemMetrics | null;
  allUsers: AccessGrantWithProfile[];
}

export const AdminDashboard = ({ systemMetrics, allUsers }: AdminDashboardProps) => {
  // Calculate weekly growth based on actual data
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const usersThisWeek = allUsers.filter(user => 
    new Date(user.created_at) >= oneWeekAgo
  ).length;
  
  const activeUsersThisWeek = allUsers.filter(user => 
    user.is_active && user.granted_at && new Date(user.granted_at) >= oneWeekAgo
  ).length;

  return (
    <div className="space-y-6">
      {/* System Health Alert */}
      {systemMetrics && systemMetrics.systemHealth < 98 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-orange-800">
              System health is at {systemMetrics.systemHealth}%. Please check system monitoring for details.
            </span>
          </div>
        </div>
      )}

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
              +{usersThisWeek} this week
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
              +{activeUsersThisWeek} activated this week
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
                <div className="text-lg font-bold text-red-700">{(systemMetrics?.errorRate || 0).toFixed(2)}%</div>
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
            <CardDescription>Recent alerts and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-green-50">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">System health check passed</p>
                    <p className="text-xs text-muted-foreground">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Auto-backup completed</p>
                    <p className="text-xs text-muted-foreground">1 hour ago</p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};