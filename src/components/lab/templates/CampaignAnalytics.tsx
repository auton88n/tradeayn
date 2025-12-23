import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MousePointer, 
  Users,
  Target,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

export interface CampaignData {
  type: 'campaign';
  name: string;
  period?: string;
  metrics: {
    reach?: number;
    impressions?: number;
    engagement?: number;
    clicks?: number;
    conversions?: number;
    spend?: number;
    roi?: number;
  };
  trend?: string;
  comparison?: {
    period: string;
    change: number;
  };
  platforms?: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  timeline?: Array<{
    date: string;
    value: number;
    label?: string;
  }>;
  demographics?: Array<{
    name: string;
    value: number;
  }>;
}

interface CampaignAnalyticsProps {
  data: CampaignData;
  className?: string;
}

const CHART_COLORS = [
  'hsl(262, 83%, 58%)', // Purple
  'hsl(330, 81%, 60%)', // Pink
  'hsl(210, 100%, 56%)', // Blue
  'hsl(158, 64%, 52%)', // Teal
  'hsl(43, 96%, 56%)', // Yellow
  'hsl(0, 84%, 60%)', // Red
];

const formatNumber = (num: number | undefined): string => {
  if (!num) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

const MetricCard = ({ 
  icon: Icon, 
  label, 
  value, 
  change,
  color = 'purple'
}: { 
  icon: React.ElementType;
  label: string;
  value: string | number;
  change?: number;
  color?: string;
}) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-xl",
        "bg-white/60 dark:bg-gray-800/60",
        "border border-gray-200/50 dark:border-gray-700/50",
        "shadow-sm"
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn(
          "p-2 rounded-lg",
          color === 'purple' && "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400",
          color === 'blue' && "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
          color === 'green' && "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400",
          color === 'orange' && "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400"
        )}>
          <Icon className="w-4 h-4" />
        </div>
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-0.5 text-xs font-medium",
            isPositive && "text-green-600 dark:text-green-400",
            isNegative && "text-red-600 dark:text-red-400",
            !isPositive && !isNegative && "text-gray-500"
          )}>
            {isPositive && <ArrowUpRight className="w-3 h-3" />}
            {isNegative && <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-foreground">
          {typeof value === 'number' ? formatNumber(value) : value}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
};

const CampaignAnalyticsComponent = ({ data, className }: CampaignAnalyticsProps) => {
  const metrics = data.metrics;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-slate-50 to-purple-50/50 dark:from-slate-900 dark:to-purple-950/30",
        "border border-purple-200/50 dark:border-purple-800/30",
        "shadow-xl",
        className
      )}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              {data.name}
            </h3>
            {data.period && (
              <p className="text-sm text-muted-foreground mt-0.5">{data.period}</p>
            )}
          </div>
          {data.trend && (
            <div className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5",
              data.trend.includes('+') || data.trend.includes('↑')
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : data.trend.includes('-') || data.trend.includes('↓')
                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            )}>
              {data.trend.includes('+') || data.trend.includes('↑') ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {data.trend}
            </div>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.reach !== undefined && (
            <MetricCard 
              icon={Eye} 
              label="Reach" 
              value={metrics.reach}
              color="purple"
            />
          )}
          {metrics.impressions !== undefined && (
            <MetricCard 
              icon={Users} 
              label="Impressions" 
              value={metrics.impressions}
              color="blue"
            />
          )}
          {metrics.engagement !== undefined && (
            <MetricCard 
              icon={TrendingUp} 
              label="Engagement %" 
              value={`${metrics.engagement}%`}
              color="green"
            />
          )}
          {metrics.clicks !== undefined && (
            <MetricCard 
              icon={MousePointer} 
              label="Clicks" 
              value={metrics.clicks}
              color="orange"
            />
          )}
        </div>

        {/* Platform Distribution */}
        {data.platforms && data.platforms.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-foreground mb-4">Platform Distribution</h4>
            <div className="flex gap-6">
              {/* Pie Chart */}
              <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.platforms}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {data.platforms.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `${value}%`}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend */}
              <div className="flex-1 flex flex-col justify-center gap-2">
                {data.platforms.map((platform, index) => (
                  <div key={platform.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ 
                        backgroundColor: platform.color || CHART_COLORS[index % CHART_COLORS.length] 
                      }}
                    />
                    <span className="text-sm text-foreground">{platform.name}</span>
                    <span className="text-sm font-medium text-muted-foreground ml-auto">
                      {platform.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Timeline Chart */}
        {data.timeline && data.timeline.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-foreground mb-4">Performance Timeline</h4>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.timeline}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatNumber(value)}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatNumber(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(262, 83%, 58%)"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(262, 83%, 58%)', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Demographics Bar Chart */}
        {data.demographics && data.demographics.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-foreground mb-4">Audience Demographics</h4>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.demographics} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip 
                    formatter={(value: number) => `${value}%`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(262, 83%, 58%)" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const CampaignAnalytics = memo(CampaignAnalyticsComponent);
