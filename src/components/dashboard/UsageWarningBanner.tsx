import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UsageWarningBannerProps {
  currentUsage: number;
  monthlyLimit: number | null;
  resetDate: string | null;
  className?: string;
}

export const UsageWarningBanner = ({
  currentUsage,
  monthlyLimit,
  resetDate,
  className,
}: UsageWarningBannerProps) => {
  // Don't show if no limit set (unlimited)
  if (monthlyLimit === null) return null;
  
  const remaining = monthlyLimit - currentUsage;
  const usagePercentage = (currentUsage / monthlyLimit) * 100;
  
  // Only show when approaching limit (>80% used) or <= 10 remaining
  const shouldShow = usagePercentage >= 80 || remaining <= 10;
  
  if (!shouldShow || remaining < 0) return null;
  
  // Format the reset date nicely
  const formattedResetDate = resetDate 
    ? format(new Date(resetDate), "MMM d 'at' h:mm a")
    : 'next month';

  // Determine urgency level for styling
  const isUrgent = remaining <= 3;
  const isWarning = remaining <= 10 && !isUrgent;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: 10, height: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={cn(
          "flex items-center justify-center gap-2 px-4 py-2.5 mx-4 mb-2",
          "rounded-xl border backdrop-blur-sm",
          "text-sm font-medium",
          // Color variations based on urgency
          isUrgent && "bg-destructive/10 border-destructive/30 text-destructive",
          isWarning && "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
          !isUrgent && !isWarning && "bg-muted/50 border-border/50 text-muted-foreground",
          className
        )}
      >
        <AlertCircle className={cn(
          "w-4 h-4 shrink-0",
          isUrgent && "animate-pulse"
        )} />
        <span>
          {remaining} message{remaining !== 1 ? 's' : ''} remaining until {formattedResetDate}
        </span>
      </motion.div>
    </AnimatePresence>
  );
};
