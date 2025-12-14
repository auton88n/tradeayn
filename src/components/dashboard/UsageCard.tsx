import { useMemo, useRef, useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, Zap, Infinity, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface UsageCardProps {
  currentUsage: number;
  monthlyLimit: number | null; // null = unlimited
  resetDate: string | null; // ISO date string
  compact?: boolean;
}

export const UsageCard = ({
  currentUsage,
  monthlyLimit,
  resetDate,
  compact = false
}: UsageCardProps) => {
  const prevUsageRef = useRef(currentUsage);
  const [showPulse, setShowPulse] = useState(false);
  const [displayCount, setDisplayCount] = useState(currentUsage);

  // Animate counter on usage change
  useEffect(() => {
    if (currentUsage !== prevUsageRef.current) {
      setShowPulse(true);
      const timeout = setTimeout(() => setShowPulse(false), 600);
      
      // Animate counter
      const start = prevUsageRef.current;
      const end = currentUsage;
      const duration = 400;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        setDisplayCount(Math.round(start + (end - start) * eased));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
      
      prevUsageRef.current = currentUsage;
      return () => clearTimeout(timeout);
    }
  }, [currentUsage]);

  const {
    percentage,
    daysUntilReset,
    formattedResetDate,
    statusColor,
    statusBg
  } = useMemo(() => {
    const pct = monthlyLimit ? Math.min(currentUsage / monthlyLimit * 100, 100) : 0;
    let days = 0;
    let formattedDate = '';
    
    if (resetDate) {
      const reset = new Date(resetDate);
      days = Math.max(0, differenceInDays(reset, new Date()));
      formattedDate = format(reset, 'MMM d');
    }

    // Color based on usage percentage
    let color = 'text-emerald-500';
    let bg = 'bg-emerald-500';
    if (monthlyLimit) {
      if (pct >= 90) {
        color = 'text-red-500';
        bg = 'bg-red-500';
      } else if (pct >= 75) {
        color = 'text-amber-500';
        bg = 'bg-amber-500';
      }
    }
    
    return {
      percentage: pct,
      daysUntilReset: days,
      formattedResetDate: formattedDate,
      statusColor: color,
      statusBg: bg
    };
  }, [currentUsage, monthlyLimit, resetDate]);

  const isUnlimited = !monthlyLimit;
  const creditsLeft = monthlyLimit ? Math.max(0, monthlyLimit - currentUsage) : null;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div 
              className={cn(
                "w-full px-3 py-3 rounded-xl cursor-pointer relative overflow-hidden",
                "bg-gradient-to-r from-muted/60 to-muted/40",
                "border border-border/50 backdrop-blur-sm",
                "hover:border-border/80 transition-all duration-300",
                showPulse && "ring-2 ring-primary/20"
              )}
              animate={showPulse ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {/* Pulse effect */}
              <AnimatePresence>
                {showPulse && (
                  <motion.div 
                    initial={{ opacity: 0.4, scale: 0.8 }}
                    animate={{ opacity: 0, scale: 1.5 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                  />
                )}
              </AnimatePresence>
              
              {/* Main content */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isUnlimited ? (
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                  ) : (
                    <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", 
                      percentage >= 90 ? "bg-red-500/10" : percentage >= 75 ? "bg-amber-500/10" : "bg-emerald-500/10"
                    )}>
                      <Zap className={cn("w-3.5 h-3.5", statusColor)} />
                    </div>
                  )}
                  <span className="text-sm font-medium text-foreground">Usage</span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <motion.span 
                    key={displayCount}
                    className="text-sm font-semibold text-foreground tabular-nums"
                  >
                    {displayCount}
                  </motion.span>
                  <span className="text-xs text-muted-foreground">
                    {isUnlimited ? 'msgs' : `/ ${monthlyLimit}`}
                  </span>
                </div>
              </div>
              
              {/* Progress or Unlimited indicator */}
              {isUnlimited ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10">
                    <Infinity className="w-3 h-3 text-primary" />
                    <span className="text-xs font-medium text-primary">Unlimited</span>
                  </div>
                  {resetDate && (
                    <span className="text-[10px] text-muted-foreground">
                      Resets {formattedResetDate}
                    </span>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Progress 
                    value={percentage} 
                    className="h-1.5 w-full bg-muted/60" 
                    indicatorClassName={statusBg}
                  />
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{creditsLeft} left</span>
                    {resetDate && <span>Resets {formattedResetDate}</span>}
                  </div>
                </div>
              )}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[200px]">
            <div className="space-y-1">
              <p className="font-medium">{isUnlimited ? 'Unlimited Plan' : 'Usage This Month'}</p>
              <p className="text-xs text-muted-foreground">
                {currentUsage} messages sent
                {resetDate && ` • Resets in ${daysUntilReset} days`}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full size card (non-compact)
  return (
    <motion.div 
      className={cn(
        "p-4 rounded-xl space-y-3 relative overflow-hidden",
        "bg-gradient-to-br from-muted/50 via-muted/30 to-transparent",
        "border border-border/50 backdrop-blur-sm"
      )}
      animate={showPulse ? { scale: [1, 1.01, 1] } : {}}
    >
      <AnimatePresence>
        {showPulse && (
          <motion.div 
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-primary/5"
          />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            isUnlimited ? "bg-primary/10" : percentage >= 90 ? "bg-red-500/10" : percentage >= 75 ? "bg-amber-500/10" : "bg-emerald-500/10"
          )}>
            {isUnlimited ? (
              <Sparkles className="w-5 h-5 text-primary" />
            ) : (
              <Zap className={cn("w-5 h-5", statusColor)} />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Usage This Month</p>
            <p className="text-xs text-muted-foreground">
              <motion.span className="font-semibold text-foreground tabular-nums">
                {displayCount}
              </motion.span>
              {' '}messages sent
            </p>
          </div>
        </div>
        
        {isUnlimited ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <Infinity className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Unlimited</span>
          </div>
        ) : (
          <div className="text-right">
            <span className={cn("text-xl font-bold tabular-nums", statusColor)}>
              {Math.round(percentage)}%
            </span>
            <p className="text-xs text-muted-foreground">{creditsLeft} left</p>
          </div>
        )}
      </div>

      {!isUnlimited && (
        <Progress 
          value={percentage} 
          className="h-2 bg-muted/60" 
          indicatorClassName={statusBg} 
        />
      )}

      {resetDate && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>Resets {formattedResetDate}</span>
          <span className="text-muted-foreground/50">•</span>
          <span>{daysUntilReset} days remaining</span>
        </div>
      )}
    </motion.div>
  );
};