import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Lightbulb,
  Target,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export interface MarketingReportData {
  type: 'report' | 'marketing_report';
  title: string;
  period?: string;
  summary?: string;
  highlights?: Array<{
    label: string;
    value: string | number;
    change?: number;
    status?: 'positive' | 'negative' | 'neutral';
  }>;
  insights?: Array<{
    type: 'success' | 'warning' | 'info';
    title: string;
    description: string;
  }>;
  recommendations?: string[];
  goals?: Array<{
    name: string;
    current: number;
    target: number;
    unit?: string;
  }>;
  nextSteps?: string[];
}

interface MarketingReportCardProps {
  data: MarketingReportData;
  className?: string;
}

const HighlightCard = ({ 
  label, 
  value, 
  change, 
  status 
}: { 
  label: string; 
  value: string | number;
  change?: number;
  status?: 'positive' | 'negative' | 'neutral';
}) => {
  const TrendIcon = change && change > 0 ? TrendingUp : change && change < 0 ? TrendingDown : Minus;
  const statusColors = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-500',
  };

  return (
    <div className={cn(
      "p-4 rounded-xl",
      "bg-white/60 dark:bg-gray-800/60",
      "border border-gray-200/50 dark:border-gray-700/50"
    )}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-sm",
            statusColors[status || (change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral')]
          )}>
            <TrendIcon className="w-4 h-4" />
            {Math.abs(change)}%
          </div>
        )}
      </div>
    </div>
  );
};

const InsightCard = ({ 
  type, 
  title, 
  description 
}: { 
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
}) => {
  const config = {
    success: {
      icon: CheckCircle2,
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200/50 dark:border-green-800/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    warning: {
      icon: AlertCircle,
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200/50 dark:border-amber-800/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    info: {
      icon: Lightbulb,
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200/50 dark:border-blue-800/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
  };

  // Defensive: fallback to 'info' if type is invalid
  const validType = (type && config[type]) ? type : 'info';
  const Icon = config[validType].icon;

  return (
    <div className={cn(
      "p-4 rounded-xl border",
      config[validType].bg,
      config[validType].border
    )}>
      <div className="flex items-start gap-3">
        <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", config[validType].iconColor)} />
        <div>
          <p className="font-medium text-foreground text-sm">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
};

const GoalProgress = ({ 
  name, 
  current, 
  target, 
  unit 
}: { 
  name: string; 
  current: number; 
  target: number;
  unit?: string;
}) => {
  const progress = Math.min((current / target) * 100, 100);
  const isAchieved = current >= target;

  return (
    <div className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">{name}</span>
        <span className={cn(
          "text-xs font-medium",
          isAchieved ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
        )}>
          {current}{unit} / {target}{unit}
        </span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            isAchieved 
              ? "bg-green-500" 
              : progress > 70 
              ? "bg-purple-500" 
              : progress > 40 
              ? "bg-blue-500" 
              : "bg-amber-500"
          )}
        />
      </div>
    </div>
  );
};

const MarketingReportCardComponent = ({ data, className }: MarketingReportCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-900 dark:to-indigo-950/20",
        "border border-indigo-200/50 dark:border-indigo-800/30",
        "shadow-xl",
        className
      )}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{data.title}</h3>
            {data.period && (
              <p className="text-sm text-muted-foreground">{data.period}</p>
            )}
          </div>
        </div>
      </div>

      <div className={cn(
        "p-6 space-y-6 max-h-[400px] overflow-y-auto",
        "[&::-webkit-scrollbar]:w-1.5",
        "[&::-webkit-scrollbar-track]:bg-transparent",
        "[&::-webkit-scrollbar-thumb]:bg-indigo-300/50 dark:[&::-webkit-scrollbar-thumb]:bg-indigo-600/50",
        "[&::-webkit-scrollbar-thumb]:rounded-full",
        "[&::-webkit-scrollbar-thumb]:hover:bg-indigo-400/70 dark:[&::-webkit-scrollbar-thumb]:hover:bg-indigo-500/70"
      )}>
        {/* Summary */}
        {data.summary && (
          <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-200/30 dark:border-indigo-800/20">
            <p className="text-sm text-foreground leading-relaxed">{data.summary}</p>
          </div>
        )}

        {/* Key Highlights */}
        {data.highlights && data.highlights.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-500" />
              Key Metrics
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {data.highlights.map((highlight, idx) => (
                <HighlightCard 
                  key={idx}
                  label={highlight.label}
                  value={highlight.value}
                  change={highlight.change}
                  status={highlight.status}
                />
              ))}
            </div>
          </div>
        )}

        {/* Goals Progress */}
        {data.goals && data.goals.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-500" />
              Goal Progress
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.goals.map((goal, idx) => (
                <GoalProgress 
                  key={idx}
                  name={goal.name}
                  current={goal.current}
                  target={goal.target}
                  unit={goal.unit}
                />
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        {data.insights && data.insights.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-indigo-500" />
              Key Insights
            </h4>
            <div className="space-y-3">
              {data.insights.map((insight, idx) => (
                <InsightCard 
                  key={idx}
                  type={insight.type}
                  title={insight.title}
                  description={insight.description}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              Recommendations
            </h4>
            <div className="space-y-2">
              {data.recommendations.map((rec, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-2 p-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50"
                >
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-medium flex-shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-foreground">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        {data.nextSteps && data.nextSteps.length > 0 && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 border border-purple-200/50 dark:border-purple-800/30">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-purple-500" />
              Next Steps
            </h4>
            <div className="space-y-2">
              {data.nextSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const MarketingReportCard = memo(MarketingReportCardComponent);
