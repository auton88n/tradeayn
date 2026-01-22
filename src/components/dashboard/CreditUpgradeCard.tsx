import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Infinity, ArrowRight, X, Zap, Crown } from 'lucide-react';
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
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative rounded-xl overflow-hidden",
        "bg-gradient-to-br from-card/90 via-card/70 to-card/50",
        "backdrop-blur-xl",
        "shadow-lg shadow-black/10",
        "transition-all duration-300"
      )}
    >
      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-xl p-[1px] pointer-events-none">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 via-white/5 to-transparent" />
      </div>

      {/* Credit Section */}
      <div className="relative px-3 py-2.5 space-y-2">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className={cn(
              "relative p-1 rounded-md transition-colors",
              isLow 
                ? "bg-destructive/20" 
                : "bg-gradient-to-br from-primary/20 to-purple-500/20"
            )}>
              {/* Icon glow */}
              <div className="absolute inset-0 rounded-md bg-primary/10 blur-sm" />
              {isLow ? (
                <Zap className="relative w-3 h-3 text-destructive" />
              ) : (
                <Sparkles className="relative w-3 h-3 text-primary" />
              )}
            </div>
            <span className="font-semibold text-xs bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              HOO Credit
            </span>
          </div>
          <div className="flex items-baseline gap-0.5">
            <motion.span 
              key={displayCount}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-base font-bold tabular-nums"
            >
              {isUnlimited ? '∞' : String(creditsLeft)}
            </motion.span>
            <span className="text-[10px] text-muted-foreground">left</span>
          </div>
        </div>

        {/* Status Row */}
        <div className="flex items-center gap-2">
          {isUnlimited ? (
            <div className={cn(
              "px-2 py-0.5 rounded-md",
              "bg-gradient-to-r from-purple-500/20 via-primary/20 to-blue-500/20",
              "border border-white/10",
              "flex items-center gap-1"
            )}>
              <Crown className="w-2.5 h-2.5 text-amber-400" />
              <Infinity className="w-2.5 h-2.5 text-primary animate-pulse" />
              <span className="text-[10px] font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Unlimited
              </span>
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
            {/* Animated Gradient Divider */}
            <div className="relative h-px">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
            </div>
            
            <div className="relative px-3 py-2.5 space-y-2">
              {/* Dismiss Button */}
              <button
                onClick={() => setIsDismissed(true)}
                className={cn(
                  "absolute top-1.5 right-1.5",
                  "w-4 h-4 rounded-full",
                  "flex items-center justify-center",
                  "bg-muted/30 hover:bg-muted/50",
                  "text-muted-foreground/50 hover:text-muted-foreground",
                  "transition-all duration-200"
                )}
              >
                <X className="w-2 h-2" />
              </button>

              {/* Upgrade Header */}
              <div className="flex items-center gap-1.5 pr-5">
                <div className="relative p-1 rounded-md bg-gradient-to-br from-purple-500/20 to-primary/20">
                  <div className="absolute inset-0 rounded-md bg-purple-500/10 blur-sm" />
                  <Sparkles className="relative w-3 h-3 text-purple-400" />
                </div>
                <span className="font-semibold text-xs">
                  Go{' '}
                  <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    Pro
                  </span>
                </span>
              </div>

              {/* Benefits */}
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                ✦ 1,000 credits/mo ✦ Priority support
              </p>

              {/* Premium CTA Button */}
              <Button
                onClick={() => navigate('/pricing')}
                size="sm"
                className={cn(
                  "w-full h-7 text-xs font-medium",
                  "bg-gradient-to-r from-purple-500 via-primary to-blue-500",
                  "hover:from-purple-600 hover:via-primary hover:to-blue-600",
                  "text-white rounded-lg",
                  "shadow-md shadow-primary/20",
                  "hover:shadow-lg hover:shadow-primary/30",
                  "transition-all duration-300",
                  "group"
                )}
              >
                <span>View Plans</span>
                <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};