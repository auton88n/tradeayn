import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, Activity, Clock, MessageSquare, Building
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  pendingRequests: number;
  totalMessages: number;
  todayMessages: number;
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
  const { t, language } = useLanguage();
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
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <CardTitle className="text-sm font-medium">{t('admin.totalUsers')}</CardTitle>
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
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <CardTitle className="text-sm font-medium">{t('admin.activeUsers')}</CardTitle>
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
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <CardTitle className="text-sm font-medium">{t('admin.pendingRequests')}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{systemMetrics?.pendingRequests || 0}</div>
            <p className="text-xs text-yellow-600">
              {t('admin.needsReview')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <CardTitle className="text-sm font-medium">{t('admin.messagesToday')}</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{systemMetrics?.todayMessages || 0}</div>
            <p className="text-xs text-purple-600">
              Total: {systemMetrics?.totalMessages || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.recentActivity')}</CardTitle>
          <CardDescription>Latest user activities and access grants</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {allUsers.slice(0, 10).map((user) => (
                <div key={user.id} className={`flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building className="w-4 h-4" />
                  </div>
                  <div className={`flex-1 ${language === 'ar' ? 'text-right' : ''}`}>
                    <p className="font-medium text-sm">{user.profiles?.company_name || t('admin.unknownCompany')}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.user_email && `${user.user_email} • `}
                      {user.is_active ? t('admin.accessGranted') : t('admin.pending')} • {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={user.is_active ? 'default' : 'secondary'}>
                    {user.is_active ? t('admin.active') : t('admin.pending')}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};