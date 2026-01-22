import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  CreditCard, 
  Users, 
  DollarSign, 
  TrendingUp,
  Search,
  Edit2,
  Crown,
  Zap,
  Sparkles,
  UserCheck,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SUBSCRIPTION_TIERS, type TierKey } from '@/contexts/SubscriptionContext';

interface UserSubscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_tier: string;
  status: string;
  current_period_end: string | null;
  created_at: string;
  user_email?: string;
  profile?: {
    company_name: string | null;
    contact_person: string | null;
  } | null;
}

interface RevenueMetrics {
  totalMRR: number;
  totalSubscribers: number;
  freeUsers: number;
  starterUsers: number;
  proUsers: number;
  businessUsers: number;
  churnRate: number;
}

const tierConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  free: { icon: Users, color: 'text-muted-foreground', bg: 'bg-muted' },
  starter: { icon: Zap, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  pro: { icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  business: { icon: Crown, color: 'text-amber-500', bg: 'bg-amber-500/10' },
};

export const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<UserSubscription | null>(null);
  const [newTier, setNewTier] = useState<TierKey>('free');
  const [isUpdating, setIsUpdating] = useState(false);

  const [metrics, setMetrics] = useState<RevenueMetrics>({
    totalMRR: 0,
    totalSubscribers: 0,
    freeUsers: 0,
    starterUsers: 0,
    proUsers: 0,
    businessUsers: 0,
    churnRate: 0,
  });

  const fetchSubscriptions = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch subscriptions with user emails
      const { data: subs, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, company_name, contact_person');

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedSubs: UserSubscription[] = (subs || []).map(sub => ({
        id: sub.id,
        user_id: sub.user_id,
        stripe_customer_id: sub.stripe_customer_id,
        stripe_subscription_id: sub.stripe_subscription_id,
        subscription_tier: sub.subscription_tier || 'free',
        status: sub.status || 'inactive',
        current_period_end: sub.current_period_end,
        created_at: sub.created_at || new Date().toISOString(),
        profile: profileMap.get(sub.user_id) || null,
      }));

      setSubscriptions(enrichedSubs);

      // Calculate metrics
      const tierCounts = { free: 0, starter: 0, pro: 0, business: 0 };
      let mrr = 0;

      enrichedSubs.forEach(sub => {
        const tier = sub.subscription_tier as TierKey;
        if (tier in tierCounts) {
          tierCounts[tier as keyof typeof tierCounts]++;
          const tierData = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
          if (sub.status === 'active' && tier !== 'free' && tierData) {
            mrr += tierData.price || 0;
          }
        }
      });

      setMetrics({
        totalMRR: mrr,
        totalSubscribers: enrichedSubs.filter(s => s.status === 'active' && s.subscription_tier !== 'free').length,
        freeUsers: tierCounts.free,
        starterUsers: tierCounts.starter,
        proUsers: tierCounts.pro,
        businessUsers: tierCounts.business,
        churnRate: 0,
      });
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleOverrideTier = async () => {
    if (!editingUser) return;
    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          subscription_tier: newTier,
          status: newTier === 'free' ? 'inactive' : 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      // Also update user_ai_limits
      const tierData = SUBSCRIPTION_TIERS[newTier as keyof typeof SUBSCRIPTION_TIERS];
      if (tierData) {
        const { error: limitsError } = await supabase
          .from('user_ai_limits')
          .update({
            monthly_messages: tierData.limits.monthlyCredits,
            monthly_engineering: tierData.limits.monthlyEngineering,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', editingUser.user_id);

        if (limitsError) throw limitsError;
      }

      toast.success(`User tier updated to ${tierData?.name || newTier}`);
      setEditingUser(null);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error updating tier:', error);
      toast.error('Failed to update user tier');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.profile?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.profile?.contact_person?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = filterTier === 'all' || sub.subscription_tier === filterTier;
    return matchesSearch && matchesTier;
  });

  const metricCards = [
    { 
      label: 'Monthly Revenue', 
      value: `$${metrics.totalMRR}`, 
      icon: DollarSign, 
      gradient: 'from-emerald-500/20 to-emerald-600/5',
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10'
    },
    { 
      label: 'Paid Subscribers', 
      value: metrics.totalSubscribers, 
      icon: UserCheck, 
      gradient: 'from-blue-500/20 to-blue-600/5',
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10'
    },
    { 
      label: 'Pro Users', 
      value: metrics.proUsers, 
      icon: Sparkles, 
      gradient: 'from-purple-500/20 to-purple-600/5',
      iconColor: 'text-purple-500',
      iconBg: 'bg-purple-500/10'
    },
    { 
      label: 'Business Users', 
      value: metrics.businessUsers, 
      icon: Crown, 
      gradient: 'from-amber-500/20 to-amber-600/5',
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-500/10'
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="relative overflow-hidden border border-border/50 shadow-lg bg-card/80 backdrop-blur-xl">
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-60`} />
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">{metric.label}</p>
                    <p className="text-3xl font-bold tracking-tight">{metric.value}</p>
                  </div>
                  <div className={`p-3.5 rounded-2xl ${metric.iconBg}`}>
                    <Icon className={`w-6 h-6 ${metric.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tier Distribution */}
      <Card className="border border-border/50 shadow-lg bg-card/80 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            Subscription Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(tierConfig).map(([tier, config]) => {
              const Icon = config.icon;
              const count = tier === 'free' ? metrics.freeUsers 
                : tier === 'starter' ? metrics.starterUsers 
                : tier === 'pro' ? metrics.proUsers 
                : metrics.businessUsers;
              const total = subscriptions.length || 1;
              const percentage = ((count / total) * 100).toFixed(1);
              
              return (
                <div key={tier} className="text-center p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className={`mx-auto w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-6 h-6 ${config.color}`} />
                  </div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground capitalize">{tier}</p>
                  <p className="text-xs text-muted-foreground/60">{percentage}%</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* User Subscriptions List */}
      <Card className="border border-border/50 shadow-lg bg-card/80 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <CreditCard className="w-4 h-4 text-primary" />
              </div>
              User Subscriptions
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchSubscriptions}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          <div className="flex gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredSubscriptions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No subscriptions found</p>
                </div>
              ) : (
                filteredSubscriptions.map((sub) => {
                  const tier = sub.subscription_tier as keyof typeof tierConfig;
                  const config = tierConfig[tier] || tierConfig.free;
                  const Icon = config.icon;
                  
                  return (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {(sub.profile?.company_name || sub.profile?.contact_person || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {sub.profile?.company_name || sub.profile?.contact_person || sub.user_id.slice(0, 8)}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {sub.current_period_end 
                              ? `Renews ${format(new Date(sub.current_period_end), 'MMM d, yyyy')}`
                              : 'No billing date'
                            }
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="secondary" 
                          className={`${config.bg} ${config.color} border-0 gap-1.5`}
                        >
                          <Icon className="w-3 h-3" />
                          {tier.charAt(0).toUpperCase() + tier.slice(1)}
                        </Badge>
                        <Badge 
                          variant={sub.status === 'active' ? 'default' : 'secondary'}
                          className={sub.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                            : 'bg-muted text-muted-foreground'
                          }
                        >
                          {sub.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingUser(sub);
                            setNewTier(sub.subscription_tier as TierKey);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Tier Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Subscription Tier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>User</Label>
              <p className="text-sm text-muted-foreground">
                {editingUser?.profile?.company_name || editingUser?.profile?.contact_person || editingUser?.user_id}
              </p>
            </div>
            <div className="space-y-2">
              <Label>New Tier</Label>
              <Select value={newTier} onValueChange={(v) => setNewTier(v as TierKey)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => (
                    <SelectItem key={key} value={key}>
                      {tier.name} - ${tier.price}/mo ({tier.limits.monthlyCredits} credits)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              This will manually override the user's subscription tier and update their credit limits.
              Use with caution - this bypasses Stripe billing.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleOverrideTier} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Save Override'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
