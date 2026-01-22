import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Crown, Zap, Building2, Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription, SUBSCRIPTION_TIERS, SubscriptionTier } from '@/contexts/SubscriptionContext';
import { SEO } from '@/components/SEO';
import { cn } from '@/lib/utils';

const tierIcons: Record<SubscriptionTier, React.ReactNode> = {
  free: <Sparkles className="w-6 h-6" />,
  starter: <Zap className="w-6 h-6" />,
  pro: <Crown className="w-6 h-6" />,
  business: <Building2 className="w-6 h-6" />,
};

const tierColors: Record<SubscriptionTier, string> = {
  free: 'from-muted to-muted/50',
  starter: 'from-blue-500/20 to-blue-600/10',
  pro: 'from-purple-500/20 to-purple-600/10',
  business: 'from-amber-500/20 to-amber-600/10',
};

const tierBorderColors: Record<SubscriptionTier, string> = {
  free: 'border-muted-foreground/20',
  starter: 'border-blue-500/30',
  pro: 'border-purple-500/30',
  business: 'border-amber-500/30',
};

const Pricing = () => {
  const navigate = useNavigate();
  const { tier: currentTier, isLoading, isSubscribed, startCheckout, openCustomerPortal } = useSubscription();

  const handleAction = (tier: SubscriptionTier) => {
    if (tier === currentTier) {
      if (isSubscribed) {
        openCustomerPortal();
      }
      return;
    }
    
    if (tier === 'free') {
      if (isSubscribed) {
        openCustomerPortal();
      }
      return;
    }
    
    startCheckout(tier);
  };

  const getButtonText = (tier: SubscriptionTier) => {
    if (tier === currentTier) {
      return isSubscribed ? 'Manage Plan' : 'Current Plan';
    }
    if (tier === 'free') {
      return isSubscribed ? 'Downgrade' : 'Get Started';
    }
    const tierOrder: SubscriptionTier[] = ['free', 'starter', 'pro', 'business'];
    const currentIndex = tierOrder.indexOf(currentTier);
    const targetIndex = tierOrder.indexOf(tier);
    return targetIndex > currentIndex ? 'Upgrade' : 'Switch Plan';
  };

  return (
    <>
      <SEO 
        title="Pricing - AYN"
        description="Choose the perfect plan for your needs. From free to enterprise, we have options for everyone."
        noIndex={true}
      />
      
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-12">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Simple, Transparent Pricing
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose the plan that fits your needs. All plans include access to AYN's core features.
                Upgrade or downgrade anytime.
              </p>
            </motion.div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            /* Pricing Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(Object.keys(SUBSCRIPTION_TIERS) as SubscriptionTier[]).map((tier, index) => {
                const config = SUBSCRIPTION_TIERS[tier];
                const isCurrentPlan = tier === currentTier;
                
                return (
                  <motion.div
                    key={tier}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      className={cn(
                        'relative p-6 h-full flex flex-col transition-all duration-300 hover:shadow-lg',
                        `bg-gradient-to-b ${tierColors[tier]}`,
                        tierBorderColors[tier],
                        isCurrentPlan && 'ring-2 ring-primary shadow-lg'
                      )}
                    >
                      {/* Current Plan Badge */}
                      {isCurrentPlan && (
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                          Your Plan
                        </Badge>
                      )}

                      {/* Icon & Name */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className={cn(
                          'p-2 rounded-lg',
                          tier === 'free' && 'bg-muted-foreground/10',
                          tier === 'starter' && 'bg-blue-500/10',
                          tier === 'pro' && 'bg-purple-500/10',
                          tier === 'business' && 'bg-amber-500/10'
                        )}>
                          {tierIcons[tier]}
                        </div>
                        <h3 className="text-xl font-semibold">{config.name}</h3>
                      </div>

                      {/* Price */}
                      <div className="mb-6">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold">
                            ${config.price}
                          </span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                      </div>

                      {/* Features */}
                      <ul className="space-y-3 mb-8 flex-grow">
                        {config.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA Button */}
                      <Button
                        onClick={() => handleAction(tier)}
                        variant={isCurrentPlan ? 'outline' : 'default'}
                        className={cn(
                          'w-full',
                          !isCurrentPlan && tier !== 'free' && 'bg-primary hover:bg-primary/90'
                        )}
                        disabled={tier === 'free' && !isSubscribed && tier === currentTier}
                      >
                        {getButtonText(tier)}
                      </Button>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16 text-center"
          >
            <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
            <div className="max-w-2xl mx-auto space-y-4 text-left">
              <div className="p-4 rounded-lg bg-muted/50">
                <h3 className="font-medium mb-2">What are credits?</h3>
                <p className="text-sm text-muted-foreground">
                  Credits are used for AI interactions. Each message or query uses 1 credit. 
                  Your credits reset at the beginning of each billing cycle.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h3 className="font-medium mb-2">Can I upgrade or downgrade anytime?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes! You can change your plan at any time. Upgrades take effect immediately,
                  and downgrades take effect at the end of your current billing cycle.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h3 className="font-medium mb-2">What happens if I run out of credits?</h3>
                <p className="text-sm text-muted-foreground">
                  You'll need to wait until your credits reset or upgrade to a higher plan
                  for more monthly credits.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Pricing;
