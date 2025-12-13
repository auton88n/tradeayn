import { useMemo, useRef, useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, Zap, Infinity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface UsageCardProps {
  currentUsage: number;
  monthlyLimit: number | null; // null = unlimited
  resetDate: string | null; // ISO date string
  compact?: boolean;
}

export const UsageCard = ({ currentUsage, monthlyLimit, resetDate, compact = false }: UsageCardProps) => {
  const prevUsageRef = useRef(currentUsage);
  const [showPulse, setShowPulse] = useState(false);

  // Detect usage changes for pulse animation
  useEffect(() => {
    if (currentUsage !== prevUsageRef.current) {
      setShowPulse(true);
      const timeout = setTimeout(() => setShowPulse(false), 600);
      prevUsageRef.current = currentUsage;
      return () => clearTimeout(timeout);
    }
  }, [currentUsage]);

  const { percentage, daysUntilReset, formattedResetDate, colorClass, bgColorClass } = useMemo(() => {
    const pct = monthlyLimit ? Math.min((currentUsage / monthlyLimit) * 100, 100) : 0;
    
    let days = 0;
    let formattedDate = '';
    if (resetDate) {
      const reset = new Date(resetDate);
      days = Math.max(0, differenceInDays(reset, new Date()));
      formattedDate = format(reset, 'MMM d, yyyy');
    }

    // Color based on usage percentage
    let color = 'text-emerald-500';
    let bgColor = 'bg-emerald-500';
    if (monthlyLimit) {
      if (pct >= 90) {
        color = 'text-red-500';
        bgColor = 'bg-red-500';
      } else if (pct >= 75) {
        color = 'text-amber-500';
        bgColor = 'bg-amber-500';
      }
    }

    return {
      percentage: pct,
      daysUntilReset: days,
      formattedResetDate: formattedDate,
      colorClass: color,
      bgColorClass: bgColor,
    };
  }, [currentUsage, monthlyLimit, resetDate]);

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div 
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 cursor-default relative overflow-hidden",
                showPulse && "ring-2 ring-primary/30"
              )}
              animate={showPulse ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <AnimatePresence>
                {showPulse && (
                  <motion.div
                    initial={{ opacity: 0.5, scale: 0.8 }}
                    animate={{ opacity: 0, scale: 2 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 bg-primary/10 rounded-lg"
                  />
                )}
              </AnimatePresence>
              <Zap className={cn("w-3.5 h-3.5", colorClass)} />
              <div className="flex items-center gap-1.5 text-xs">
                <motion.span 
                  key={currentUsage}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-medium text-foreground"
                >
                  {currentUsage}
                </motion.span>
                <span className="text-muted-foreground">/</span>
                {monthlyLimit ? (
                  <span className="text-muted-foreground">{monthlyLimit}</span>
                ) : (
                  <Infinity className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>
              {monthlyLimit && (
                <Progress 
                  value={percentage} 
                  className="w-12 h-1.5" 
                  indicatorClassName={bgColorClass}
                />
              )}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px]">
            <div className="space-y-1.5 text-xs">
              <p className="font-medium">
                {monthlyLimit 
                  ? `${currentUsage} of ${monthlyLimit} messages used`
                  : `${currentUsage} messages used (Unlimited)`
                }
              </p>
              {monthlyLimit && (
                <p className={cn("font-medium", colorClass)}>
                  {Math.round(percentage)}% of limit
                </p>
              )}
              {resetDate && (
                <p className="text-muted-foreground">
                  Resets {formattedResetDate} ({daysUntilReset} days)
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", 
            monthlyLimit ? "bg-muted/60" : "bg-emerald-500/10")}>
            <Zap className={cn("w-4 h-4", monthlyLimit ? colorClass : "text-emerald-500")} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Usage This Month</p>
            <p className="text-xs text-muted-foreground">
              {monthlyLimit 
                ? `${currentUsage} of ${monthlyLimit} messages`
                : `${currentUsage} messages (Unlimited)`
              }
            </p>
          </div>
        </div>
        {monthlyLimit && (
          <span className={cn("text-lg font-semibold", colorClass)}>
            {Math.round(percentage)}%
          </span>
        )}
      </div>

      {monthlyLimit && (
        <Progress 
          value={percentage} 
          className="h-2" 
          indicatorClassName={bgColorClass}
        />
      )}

      {resetDate && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <span>Resets on {formattedResetDate}</span>
          <span className="text-muted-foreground/60">•</span>
          <span>{daysUntilReset} days remaining</span>
        </div>
      )}
    </div>
  );
};
