import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  UserCheck, 
  Clock, 
  MessageSquare,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

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

interface AdminDashboardProps {
  systemMetrics: SystemMetrics;
  allUsers: AccessGrantWithProfile[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
};

export const AdminDashboard = ({ systemMetrics, allUsers }: AdminDashboardProps) => {
  const metrics = [
    { 
      label: 'Total Users', 
      value: systemMetrics.totalUsers, 
      icon: Users, 
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    { 
      label: 'Active Users', 
      value: systemMetrics.activeUsers, 
      icon: UserCheck, 
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    { 
      label: 'Pending', 
      value: systemMetrics.pendingUsers, 
      icon: Clock, 
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    },
    { 
      label: 'Messages Today', 
      value: systemMetrics.todayMessages, 
      icon: MessageSquare, 
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
  ];

  const recentUsers = allUsers.slice(0, 10);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <motion.div key={metric.label} variants={itemVariants}>
              <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                      <p className="text-3xl font-bold mt-1">{metric.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${metric.bg}`}>
                      <Icon className={`w-6 h-6 ${metric.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {recentUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No recent activity
                  </p>
                ) : (
                  recentUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {(user.profiles?.company_name || user.profiles?.contact_person || 'U')
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {user.profiles?.company_name || user.profiles?.contact_person || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(user.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={user.is_active ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {user.is_active ? 'Active' : 'Pending'}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
