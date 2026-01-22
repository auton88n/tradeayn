import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Crown, Zap, Building2, Sparkles, ArrowLeft, Loader2, Shield, CreditCard, RefreshCw, ChevronDown, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSubscription, SUBSCRIPTION_TIERS, SubscriptionTier } from '@/contexts/SubscriptionContext';
import { SEO } from '@/components/SEO';
import { cn } from '@/lib/utils';

const tierIcons: Record<SubscriptionTier, React.ReactNode> = {
  free: <Sparkles className="w-6 h-6" />,
  starter: <Zap className="w-6 h-6" />,
  pro: <Crown className="w-6 h-6" />,
  business: <Building2 className="w-6 h-6" />,
};

const tierAccentColors: Record<SubscriptionTier, string> = {
  free: 'from-muted-foreground/20 to-muted-foreground/10',
  starter: 'from-blue-500/20 to-blue-600/10',
  pro: 'from-purple-500/20 to-purple-600/10',
  business: 'from-amber-500/20 to-amber-600/10',
};

const tierGlowColors: Record<SubscriptionTier, string> = {
  free: 'group-hover:shadow-[0_0_40px_-10px_hsl(var(--muted-foreground)/0.3)]',
  starter: 'group-hover:shadow-[0_0_50px_-10px_rgba(59,130,246,0.4)]',
  pro: 'shadow-[0_0_60px_-10px_rgba(139,92,246,0.3)] group-hover:shadow-[0_0_80px_-10px_rgba(139,92,246,0.5)]',
  business: 'group-hover:shadow-[0_0_50px_-10px_rgba(245,158,11,0.4)]',
};

const tierCheckColors: Record<SubscriptionTier, string> = {
  free: 'bg-muted-foreground',
  starter: 'bg-blue-500',
  pro: 'bg-purple-500',
  business: 'bg-amber-500',
};

const tierButtonStyles: Record<SubscriptionTier, string> = {
  free: 'bg-muted hover:bg-muted/80 text-foreground',
  starter: 'bg-blue-500 hover:bg-blue-600 text-white',
  pro: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white',
  business: 'bg-amber-500 hover:bg-amber-600 text-white',
};

const faqItems = [
  {
    question: 'What are credits?',
    answer: 'Credits are used for AI interactions. Each message or query uses 1 credit. Your credits reset at the beginning of each billing cycle.'
  },
  {
    question: 'Can I upgrade or downgrade anytime?',
    answer: 'Yes! You can change your plan at any time. Upgrades take effect immediately, and downgrades take effect at the end of your current billing cycle.'
  },
  {
    question: 'What happens if I run out of credits?',
    answer: "You'll need to wait until your credits reset or upgrade to a higher plan for more monthly credits."
  },
  {
    question: 'Is there a free trial?',
    answer: 'Our Free tier gives you 50 credits per month to try AYN. No credit card required to get started.'
  }
];

const Pricing = () => {
  const navigate = useNavigate();
  const { tier: currentTier, isLoading, isSubscribed, startCheckout, openCustomerPortal } = useSubscription();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
      
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <motion.div 
            className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]"
            animate={{ 
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]"
            animate={{ 
              x: [0, -20, 0],
              y: [0, 30, 0],
              scale: [1.1, 1, 1.1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.3, 0.5]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <div className="absolute inset-0 bg-noise opacity-[0.02]" />
        </div>

        <div className="container max-w-7xl mx-auto px-4 py-12 relative z-10">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mb-8 hover:bg-card/50 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </motion.div>
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            {/* Brain Logo */}
            <motion.div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-foreground mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Brain className="w-12 h-12 text-background" />
            </motion.div>
            
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 tracking-tight">
              Choose Your Plan
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Unlock the full power of AYN. All plans include access to core features.
              <br className="hidden md:block" />
              Upgrade or downgrade anytime.
            </p>
          </motion.div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Pricing Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {(Object.keys(SUBSCRIPTION_TIERS) as SubscriptionTier[]).map((tier, index) => {
                  const config = SUBSCRIPTION_TIERS[tier];
                  const isCurrentPlan = tier === currentTier;
                  const isPopular = tier === 'pro';
                  
                  return (
                    <motion.div
                      key={tier}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                      className="relative group"
                    >
                      {/* Popular Badge */}
                      <AnimatePresence>
                        {isPopular && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute -top-4 left-1/2 -translate-x-1/2 z-10"
                          >
                            <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-1.5 text-sm font-medium shadow-lg">
                              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                              Most Popular
                            </Badge>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Card */}
                      <div
                        className={cn(
                          'relative p-8 h-full flex flex-col rounded-3xl transition-all duration-500',
                          'bg-card/40 backdrop-blur-xl',
                          'border border-white/10 dark:border-white/5',
                          'hover:scale-[1.02] hover:border-white/20 dark:hover:border-white/10',
                          tierGlowColors[tier],
                          isCurrentPlan && 'ring-2 ring-primary'
                        )}
                      >
                        {/* Gradient Overlay */}
                        <div className={cn(
                          'absolute inset-0 rounded-3xl opacity-50 pointer-events-none',
                          `bg-gradient-to-b ${tierAccentColors[tier]}`
                        )} />

                        {/* Current Plan Badge */}
                        {isCurrentPlan && (
                          <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs">
                            Your Plan
                          </Badge>
                        )}

                        {/* Content */}
                        <div className="relative z-10 flex flex-col h-full">
                          {/* Icon & Name */}
                          <div className="flex items-center gap-3 mb-6">
                            <div className={cn(
                              'p-3 rounded-xl transition-colors',
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
                          <div className="mb-8">
                            <div className="flex items-baseline gap-1">
                              <span className="text-5xl md:text-6xl font-display font-bold tracking-tight">
                                ${config.price}
                              </span>
                              <span className="text-muted-foreground text-lg">/month</span>
                            </div>
                            {tier !== 'free' && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Billed monthly. Cancel anytime.
                              </p>
                            )}
                          </div>

                          {/* Features */}
                          <ul className="space-y-4 mb-8 flex-grow">
                            {config.features.map((feature, i) => (
                              <motion.li 
                                key={i} 
                                className="flex items-start gap-3"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 + i * 0.05 + 0.5 }}
                              >
                                <div className={cn(
                                  'w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                                  tierCheckColors[tier]
                                )}>
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-sm text-foreground/80">{feature}</span>
                              </motion.li>
                            ))}
                          </ul>

                          {/* CTA Button */}
                          <Button
                            onClick={() => handleAction(tier)}
                            className={cn(
                              'w-full h-12 rounded-xl font-medium transition-all duration-300',
                              isCurrentPlan 
                                ? 'bg-card border border-border hover:bg-muted' 
                                : tierButtonStyles[tier]
                            )}
                            disabled={tier === 'free' && !isSubscribed && tier === currentTier}
                          >
                            {getButtonText(tier)}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-wrap items-center justify-center gap-6 md:gap-12 text-sm text-muted-foreground mb-20"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span>Secure Payments</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Cancel Anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  <span>30-Day Guarantee</span>
                </div>
              </motion.div>
            </>
          )}

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {faqItems.map((item, index) => (
                <Collapsible
                  key={index}
                  open={openFaq === index}
                  onOpenChange={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <div className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 overflow-hidden transition-all duration-300 hover:bg-card/80">
                    <CollapsibleTrigger className="w-full p-5 flex items-center justify-between text-left">
                      <span className="font-medium">{item.question}</span>
                      <ChevronDown className={cn(
                        "w-5 h-5 text-muted-foreground transition-transform duration-300",
                        openFaq === index && "rotate-180"
                      )} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-5 pb-5">
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {item.answer}
                      </p>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Pricing;
