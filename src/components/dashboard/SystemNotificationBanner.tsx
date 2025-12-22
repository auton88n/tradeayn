import { useState } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AlertCircle, Clock, X, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MaintenanceConfig {
  enabled?: boolean;
  message?: string;
  startTime?: string;
  endTime?: string;
  preMaintenanceNotice?: boolean;
  preMaintenanceMessage?: string;
}

interface SystemNotificationBannerProps {
  // Maintenance props
  maintenanceConfig?: MaintenanceConfig;
  // Usage props
  currentUsage?: number;
  monthlyLimit?: number | null;
  usageResetDate?: string | null;
  className?: string;
}

export const SystemNotificationBanner = ({
  maintenanceConfig,
  currentUsage = 0,
  monthlyLimit,
  usageResetDate,
  className,
}: SystemNotificationBannerProps) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [preNoticeDismissed, setPreNoticeDismissed] = useState(false);

  // Priority 1: Active Maintenance (NOT dismissible, blocks chat)
  if (maintenanceConfig?.enabled) {
    const formatTime = (time: string) => {
      try {
        return format(new Date(time), "MMM d 'at' h:mm a");
      } catch {
        return time;
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        className={cn(
          "flex items-center justify-center gap-3 px-4 py-3 mx-4 mb-2",
          "rounded-xl border backdrop-blur-sm",
          "text-sm font-medium",
          "bg-orange-500/15 border-orange-500/40 text-orange-600 dark:text-orange-400",
          className
        )}
      >
        <Wrench className="w-4 h-4 shrink-0 animate-pulse" />
        <span className="flex-1 text-center">
          {maintenanceConfig.message || 'System under maintenance. Back soon!'}
          {maintenanceConfig.endTime && (
            <span className="ml-2 opacity-80">
              • Expected: {formatTime(maintenanceConfig.endTime)}
            </span>
          )}
        </span>
        {/* No dismiss button - maintenance is NOT dismissible */}
      </motion.div>
    );
  }

  // Priority 2: Pre-Maintenance Notice (dismissible)
  if (maintenanceConfig?.preMaintenanceNotice && !preNoticeDismissed) {
    const formatTime = (time: string) => {
      try {
        return format(new Date(time), "MMM d 'at' h:mm a");
      } catch {
        return time;
      }
    };

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: 10, height: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={cn(
            "flex items-center justify-center gap-3 px-4 py-2.5 mx-4 mb-2",
            "rounded-xl border backdrop-blur-sm",
            "text-sm font-medium",
            "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400",
            className
          )}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-center">
            {maintenanceConfig.preMaintenanceMessage || 'Scheduled maintenance coming soon'}
            {maintenanceConfig.startTime && (
              <span className="ml-2 opacity-80">
                • Starts: {formatTime(maintenanceConfig.startTime)}
              </span>
            )}
          </span>
          <button
            onClick={() => setPreNoticeDismissed(true)}
            className="p-1 hover:bg-yellow-500/20 rounded-full transition-colors shrink-0"
            aria-label="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Priority 3: Usage Warning (dismissible)
  if (!isDismissed && monthlyLimit !== null && monthlyLimit !== undefined) {
    const remaining = monthlyLimit - currentUsage;
    const usagePercentage = (currentUsage / monthlyLimit) * 100;
    
    // Only show when approaching limit (>80% used) or <= 10 remaining
    const shouldShow = usagePercentage >= 80 || remaining <= 10;
    
    if (!shouldShow || remaining < 0) return null;
    
    // Format the reset date nicely
    const formattedResetDate = usageResetDate 
      ? format(new Date(usageResetDate), "MMM d 'at' h:mm a")
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
          <span className="flex-1 text-center">
            {remaining} message{remaining !== 1 ? 's' : ''} remaining until {formattedResetDate}
          </span>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors shrink-0"
            aria-label="Dismiss warning"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
};
