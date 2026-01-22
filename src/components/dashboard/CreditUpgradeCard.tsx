import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Infinity, ArrowRight, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { differenceInDays, differenceInHours } from 'date-fns';

interface CreditUpgradeCardProps {
  currentUsage: number;
  monthlyLimit?: number | null;
  isUnlimited?: boolean;
  resetDate: string | null;
  currentTier?: string;
}

export const CreditUpgradeCard = ({
  currentUsage,
  monthlyLimit,
  isUnlimited = false,
  resetDate,
  currentTier = 'free'
}: CreditUpgradeCardProps) => {
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);
  const [displayCount, setDisplayCount] = useState(currentUsage);
  
  const showUpgrade = currentTier === 'free' && !isDismissed;
  const limit = monthlyLimit ?? 50;
  const creditsLeft = isUnlimited ? 999 : Math.max(0, limit - currentUsage);

  // Animate count changes
  useEffect(() => {
    if (currentUsage !== displayCount) {
      const start = displayCount;
      const end = currentUsage;
      const duration = 300;
      const startTime = performance.now();
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayCount(Math.round(start + (end - start) * eased));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [currentUsage]);

  // Calculate reset time
  const formattedResetTime = useMemo(() => {
    if (!resetDate) return null;
    const reset = new Date(resetDate);
    const days = differenceInDays(reset, new Date());
    if (days > 0) return `${days}d`;
    const hours = differenceInHours(reset, new Date());
    return hours > 0 ? `${hours}h` : 'Soon';
  }, [resetDate]);

  const percentage = isUnlimited ? 100 : Math.min((currentUsage / limit) * 100, 100);
  const isLow = !isUnlimited && creditsLeft < (limit * 0.2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-xl overflow-hidden",
        "bg-gradient-to-br from-card/80 via-card/60 to-card/40",
        "backdrop-blur-xl",
        "border border-white/10 dark:border-white/5",
        "shadow-sm"
      )}
    >
      {/* Credit Section */}
      <div className="px-3 py-2.5 space-y-2">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className={cn(
              "p-1 rounded-md transition-colors",
              isLow ? "bg-destructive/20" : "bg-foreground/10"
            )}>
              {isLow ? (
                <Zap className="w-3 h-3 text-destructive" />
              ) : (
                <Sparkles className="w-3 h-3 text-foreground" />
              )}
            </div>
            <span className="font-medium text-xs">HOO Credit</span>
          </div>
          <div className="flex items-baseline gap-0.5">
            <motion.span 
              key={displayCount}
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-sm font-bold tabular-nums"
            >
              {isUnlimited ? '∞' : String(creditsLeft)}
            </motion.span>
            <span className="text-[10px] text-muted-foreground">left</span>
          </div>
        </div>

        {/* Status Row */}
        <div className="flex items-center gap-2">
          {isUnlimited ? (
            <div className="px-2 py-1 rounded-md bg-foreground text-background text-[10px] font-medium flex items-center gap-1">
              <Infinity className="w-2.5 h-2.5" />
              Unlimited
            </div>
          ) : (
            <div className="flex-1">
              <Progress 
                value={100 - percentage} 
                className={cn(
                  "h-1.5",
                  isLow && "[&>div]:bg-destructive"
                )}
              />
            </div>
          )}
          {formattedResetTime && (
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              Resets {formattedResetTime}
            </span>
          )}
        </div>
      </div>

      {/* Upgrade Section - only for free tier */}
      <AnimatePresence>
        {showUpgrade && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Gradient Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
            
            <div className="px-3 py-2.5 space-y-2 relative">
              {/* Dismiss Button */}
              <button
                onClick={() => setIsDismissed(true)}
                className={cn(
                  "absolute top-2 right-2",
                  "w-5 h-5 rounded-full",
                  "flex items-center justify-center",
                  "bg-muted/50 hover:bg-muted",
                  "text-muted-foreground hover:text-foreground",
                  "transition-colors duration-200"
                )}
              >
                <X className="w-2.5 h-2.5" />
              </button>

              {/* Upgrade Header */}
              <div className="flex items-center gap-1.5 pr-6">
                <div className="p-1 rounded-md bg-primary/20">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
                <span className="font-medium text-xs">Upgrade to Pro</span>
              </div>

              {/* Benefits */}
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                1,000 credits/mo & priority support
              </p>

              {/* CTA Button */}
              <Button
                onClick={() => navigate('/pricing')}
                size="sm"
                className={cn(
                  "w-full h-7 text-xs",
                  "bg-gradient-to-r from-primary to-primary/80",
                  "hover:from-primary/90 hover:to-primary/70",
                  "text-primary-foreground font-medium",
                  "rounded-lg",
                  "transition-all duration-200"
                )}
              >
                View Plans
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
