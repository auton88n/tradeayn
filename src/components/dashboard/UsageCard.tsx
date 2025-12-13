import { useMemo, useRef, useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, Zap } from 'lucide-react';
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

  // Detect usage changes for pulse animation
  useEffect(() => {
    if (currentUsage !== prevUsageRef.current) {
      setShowPulse(true);
      const timeout = setTimeout(() => setShowPulse(false), 600);
      prevUsageRef.current = currentUsage;
      return () => clearTimeout(timeout);
    }
  }, [currentUsage]);
  const {
    percentage,
    daysUntilReset,
    formattedResetDate,
    colorClass,
    bgColorClass
  } = useMemo(() => {
    const pct = monthlyLimit ? Math.min(currentUsage / monthlyLimit * 100, 100) : 0;
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
      bgColorClass: bgColor
    };
  }, [currentUsage, monthlyLimit, resetDate]);
  const creditsLeft = monthlyLimit ? Math.max(0, monthlyLimit - currentUsage) : null;
  if (compact) {
    return <motion.div className={cn("w-full px-3 py-2.5 rounded-lg bg-muted/40 cursor-pointer relative overflow-hidden", showPulse && "ring-2 ring-primary/30")} animate={showPulse ? {
      scale: [1, 1.01, 1]
    } : {}} transition={{
      duration: 0.3
    }}>
        <AnimatePresence>
          {showPulse && <motion.div initial={{
          opacity: 0.5,
          scale: 0.8
        }} animate={{
          opacity: 0,
          scale: 2
        }} exit={{
          opacity: 0
        }} transition={{
          duration: 0.6
        }} className="absolute inset-0 bg-primary/10 rounded-lg" />}
        </AnimatePresence>
        
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Credits</span>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {monthlyLimit ? <motion.span key={creditsLeft} initial={{
            opacity: 0,
            y: -4
          }} animate={{
            opacity: 1,
            y: 0
          }} className="font-medium">
                {creditsLeft} left
              </motion.span> : <span className="font-medium">Unlimited</span>}
            
          </div>
        </div>
        
        {/* Progress bar */}
        <Progress value={monthlyLimit ? percentage : 100} className="h-2 w-full" indicatorClassName={monthlyLimit ? bgColorClass : "bg-primary"} />
      </motion.div>;
  }
  return <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", monthlyLimit ? "bg-muted/60" : "bg-emerald-500/10")}>
            <Zap className={cn("w-4 h-4", monthlyLimit ? colorClass : "text-emerald-500")} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Usage This Month</p>
            <p className="text-xs text-muted-foreground">
              {monthlyLimit ? `${currentUsage} of ${monthlyLimit} messages` : `${currentUsage} messages (Unlimited)`}
            </p>
          </div>
        </div>
        {monthlyLimit && <span className={cn("text-lg font-semibold", colorClass)}>
            {Math.round(percentage)}%
          </span>}
      </div>

      {monthlyLimit && <Progress value={percentage} className="h-2" indicatorClassName={bgColorClass} />}

      {resetDate && <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <span>Resets on {formattedResetDate}</span>
          <span className="text-muted-foreground/60">•</span>
          <span>{daysUntilReset} days remaining</span>
        </div>}
    </div>;
};