import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, Activity, Clock, MessageSquare, Building, TrendingUp, ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';

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
  current_month_usage: number | null;
  user_email?: string | null;
  profiles: {
    company_name: string | null;
    contact_person: string | null;
  } | null;
}

interface AdminDashboardProps {
  systemMetrics: SystemMetrics | null;
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
    transition: { duration: 0.5 }
  }
};

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

  const metrics = [
    {
      label: 'Total Users',
      value: systemMetrics?.totalUsers || 0,
      change: `+${usersThisWeek} this week`,
      icon: Users,
      trend: 'up'
    },
    {
      label: 'Active Users',
      value: systemMetrics?.activeUsers || 0,
      change: `+${activeUsersThisWeek} activated`,
      icon: Activity,
      trend: 'up'
    },
    {
      label: 'Pending Requests',
      value: systemMetrics?.pendingRequests || 0,
      change: 'Needs review',
      icon: Clock,
      trend: 'neutral'
    },
    {
      label: 'Messages Today',
      value: systemMetrics?.todayMessages || 0,
      change: `${systemMetrics?.totalMessages || 0} total`,
      icon: MessageSquare,
      trend: 'up'
    }
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          
          return (
            <motion.div
              key={metric.label}
              variants={itemVariants}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="group relative overflow-hidden rounded-2xl bg-background border border-border/50 p-6 transition-all duration-300 hover:border-border hover:shadow-lg"
            >
              {/* Subtle gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-foreground/60" />
                  </div>
                  {metric.trend === 'up' && (
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="w-3 h-3" />
                      <ArrowUpRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">{metric.label}</p>
                  <p className="text-3xl font-serif font-medium tracking-tight">{metric.value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{metric.change}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <motion.div 
        variants={itemVariants}
        className="rounded-2xl border border-border/50 bg-background overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-border/50">
          <h2 className="text-lg font-serif font-medium">Recent Activity</h2>
          <p className="text-sm text-muted-foreground">Latest user activities and access grants</p>
        </div>
        
        <ScrollArea className="h-[420px]">
          <div className="p-4">
            <div className="space-y-2">
              {allUsers.slice(0, 12).map((user, index) => (
                <motion.div 
                  key={user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="group flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center shrink-0">
                    <Building className="w-4 h-4 text-foreground/60" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {user.profiles?.company_name || 'Unknown Company'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.user_email && `${user.user_email} • `}
                      {user.is_active ? 'Access granted' : 'Pending'} • {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className={`
                    px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                    ${user.is_active 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    {user.is_active ? 'Active' : 'Pending'}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </motion.div>
    </motion.div>
  );
};