import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Loader2, Users, Infinity, Crown, Zap, Sparkles, User } from 'lucide-react';
import { SUBSCRIPTION_TIERS, type TierKey } from '@/contexts/SubscriptionContext';

interface UserData {
  user_id: string;
  user_email?: string;
  company_name?: string;
  current_month_usage: number;
  monthly_limit: number | null;
  current_tier?: TierKey;
}

export interface UpdatePayload {
  tier: TierKey;
  customLimit: number | null;
  useCustomLimit: boolean;
}

interface EditLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: UpdatePayload) => Promise<void>;
  users: UserData[];
  isBulk?: boolean;
}

const tierIcons: Record<TierKey, React.ElementType> = {
  free: User,
  starter: Zap,
  pro: Sparkles,
  business: Crown,
  enterprise: Crown,
};

export const EditLimitModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  users, 
  isBulk = false 
}: EditLimitModalProps) => {
  const [selectedTier, setSelectedTier] = useState<TierKey>('free');
  const [useCustomLimit, setUseCustomLimit] = useState(false);
  const [customLimit, setCustomLimit] = useState<string>('');
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const user = users?.[0];
  
  // Initialize with current tier if available
  useEffect(() => {
    if (user?.current_tier) {
      setSelectedTier(user.current_tier);
    }
    if (user?.monthly_limit !== null && user?.monthly_limit !== undefined) {
      const tierData = SUBSCRIPTION_TIERS[user.current_tier || 'free'];
      // Check if current limit differs from tier default
      if (tierData && user.monthly_limit !== tierData.limits.monthlyCredits) {
        setUseCustomLimit(true);
        setCustomLimit(String(user.monthly_limit));
      }
    }
  }, [user]);

  // Safety guard
  if (!users || users.length === 0) {
    return null;
  }

  const currentTierData = SUBSCRIPTION_TIERS[selectedTier];
  const effectiveLimit = useCustomLimit 
    ? (isUnlimited ? null : (customLimit ? Number(customLimit) : null))
    : currentTierData?.limits.monthlyCredits;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (useCustomLimit && !isUnlimited && (!customLimit || isNaN(Number(customLimit)) || Number(customLimit) < 0)) {
      return;
    }

    setIsLoading(true);
    try {
      const payload: UpdatePayload = {
        tier: selectedTier,
        customLimit: useCustomLimit ? (isUnlimited ? null : Number(customLimit)) : null,
        useCustomLimit,
      };
      await onConfirm(payload);
      handleClose();
    } catch (error) {
      console.error('Error updating limit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setSelectedTier('free');
      setUseCustomLimit(false);
      setCustomLimit('');
      setIsUnlimited(false);
    }
  };

  const getUsagePercentage = (usage: number, limit: number | null) => {
    if (!limit) return 0;
    return Math.min((usage / limit) * 100, 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {isBulk ? 'Edit Bulk Subscription' : 'Edit User Subscription'}
          </DialogTitle>
          <DialogDescription>
            {isBulk 
              ? `Editing subscription for ${users.length} users`
              : `Editing subscription for ${user.company_name || user.user_email || 'User'}`
            }
          </DialogDescription>
        </DialogHeader>

        {!isBulk && (
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Current Usage</span>
                <Badge variant="outline">
                  {user.current_month_usage} / {user.monthly_limit ?? '∞'}
                </Badge>
              </div>
              {user.monthly_limit && (
                <Progress 
                  value={getUsagePercentage(user.current_month_usage, user.monthly_limit)} 
                  className="h-2"
                />
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tier Selection */}
          <div className="space-y-2">
            <Label>Subscription Tier</Label>
            <Select value={selectedTier} onValueChange={(v) => setSelectedTier(v as TierKey)} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => {
                  const Icon = tierIcons[key as TierKey];
                  const credits = tier.limits.monthlyCredits === -1 ? 'Custom' : tier.limits.monthlyCredits;
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{tier.name}</span>
                        <span className="text-muted-foreground text-xs">
                          ({credits} credits)
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Default: {currentTierData?.limits.monthlyCredits === -1 ? 'Custom' : currentTierData?.limits.monthlyCredits} credits/month
            </p>
          </div>

          <Separator />

          {/* Custom Override Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="custom-override">Custom Credit Override</Label>
              <p className="text-xs text-muted-foreground">
                Set a custom credit limit different from the tier default
              </p>
            </div>
            <Switch
              id="custom-override"
              checked={useCustomLimit}
              onCheckedChange={setUseCustomLimit}
              disabled={isLoading}
            />
          </div>

          {/* Custom Limit Input - only shown when override is enabled */}
          {useCustomLimit && (
            <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border/50">
              <Label htmlFor="limit">Custom Monthly Limit</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    id="limit"
                    type="number"
                    value={customLimit}
                    onChange={(e) => setCustomLimit(e.target.value)}
                    disabled={isUnlimited || isLoading}
                    placeholder="Enter custom limit"
                    min="0"
                  />
                </div>
                <Button
                  type="button"
                  variant={isUnlimited ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setIsUnlimited(!isUnlimited);
                    if (!isUnlimited) setCustomLimit('');
                  }}
                  disabled={isLoading}
                  className="flex items-center gap-1"
                >
                  <Infinity className="w-4 h-4" />
                  Unlimited
                </Button>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm font-medium">Summary</p>
            <p className="text-sm text-muted-foreground">
              Tier: <span className="font-medium text-foreground">{currentTierData?.name}</span>
              {' · '}
              Credits: <span className="font-medium text-foreground">
                {effectiveLimit === null ? '∞ Unlimited' : effectiveLimit}
              </span>
              {useCustomLimit && <Badge variant="outline" className="ml-2 text-xs">Custom Override</Badge>}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || (useCustomLimit && !isUnlimited && (!customLimit || isNaN(Number(customLimit)) || Number(customLimit) < 0))}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Update Subscription
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
