import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Crown, Zap, Building2, Sparkles, ArrowLeft, Loader2, Shield, CreditCard, ChevronDown, Brain, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSubscription, SUBSCRIPTION_TIERS, SubscriptionTier } from '@/contexts/SubscriptionContext';
import { SEO } from '@/components/shared/SEO';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const tierIcons: Record<SubscriptionTier, React.ReactNode> = {
  free: <Sparkles className="w-6 h-6" />,
  starter: <Zap className="w-6 h-6" />,
  pro: <Crown className="w-6 h-6" />,
  business: <Building2 className="w-6 h-6" />,
  enterprise: <Star className="w-6 h-6" />,
};

const tierAccentColors: Record<SubscriptionTier, string> = {
  free: 'from-muted-foreground/20 to-muted-foreground/10',
  starter: 'from-blue-500/20 to-blue-600/10',
  pro: 'from-purple-500/20 to-purple-600/10',
  business: 'from-amber-500/20 to-amber-600/10',
  enterprise: 'from-yellow-400/20 to-amber-500/10',
};

const tierGlowColors: Record<SubscriptionTier, string> = {
  free: 'group-hover:shadow-[0_0_40px_-10px_hsl(var(--muted-foreground)/0.3)]',
  starter: 'group-hover:shadow-[0_0_50px_-10px_rgba(59,130,246,0.4)]',
  pro: 'shadow-[0_0_60px_-10px_rgba(139,92,246,0.3)] group-hover:shadow-[0_0_80px_-10px_rgba(139,92,246,0.5)]',
  business: 'group-hover:shadow-[0_0_50px_-10px_rgba(245,158,11,0.4)]',
  enterprise: 'group-hover:shadow-[0_0_60px_-10px_rgba(250,204,21,0.4)]',
};

const tierCheckColors: Record<SubscriptionTier, string> = {
  free: 'bg-muted-foreground',
  starter: 'bg-blue-500',
  pro: 'bg-purple-500',
  business: 'bg-amber-500',
  enterprise: 'bg-yellow-500',
};

const tierButtonStyles: Record<SubscriptionTier, string> = {
  free: 'bg-muted hover:bg-muted/80 text-foreground',
  starter: 'bg-blue-500 hover:bg-blue-600 text-white',
  pro: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white',
  business: 'bg-amber-500 hover:bg-amber-600 text-white',
  enterprise: 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-semibold',
};

const faqItems = [
  {
    question: 'What are credits?',
    answer: 'Credits are used for AI interactions. Free users get 5 credits per day (resets daily). Paid users receive their full monthly allowance upfront.'
  },
  {
    question: 'What is PDF & Excel generation?',
    answer: 'Paid users can ask AYN to generate professional documents. PDF generation costs 30 credits and Excel costs 25 credits.'
  },
  {
    question: 'Can I upgrade or downgrade anytime?',
    answer: 'Yes! You can change your plan at any time. Upgrades take effect immediately, and downgrades take effect at the end of your billing cycle.'
  },
  {
    question: 'What happens if I run out of credits?',
    answer: 'Free users wait until the next day for credits to reset. Paid users need to wait until their monthly reset or upgrade to a higher plan.'
  },
  {
    question: 'Is there a free trial?',
    answer: 'Our Free tier gives you 5 credits per day to try AYN - no credit card required.'
  },
  {
    question: 'What is your refund policy?',
    answer: 'All payments are final and non-refundable. You can cancel anytime and keep access until the end of your billing period.'
  },
  {
    question: 'What is included in Enterprise?',
    answer: 'Enterprise plans include custom credit limits, dedicated account manager, tailored AI solutions, and 24/7 priority support. Contact our sales team to discuss your needs.'
  }
];

const Pricing = () => {
  const navigate = useNavigate();
  const { tier: currentTier, isLoading, isSubscribed, startCheckout, openCustomerPortal } = useSubscription();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [enterpriseForm, setEnterpriseForm] = useState({ companyName: '', email: '', requirements: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = (tier: SubscriptionTier) => {
    if (tier === 'enterprise') {
      setShowEnterpriseModal(true);
      return;
    }

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

  const handleEnterpriseSubmit = async () => {
    if (!enterpriseForm.companyName || !enterpriseForm.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('contact_messages').insert({
        name: enterpriseForm.companyName,
        email: enterpriseForm.email,
        message: `[ENTERPRISE INQUIRY]\n\n${enterpriseForm.requirements || 'User requested Enterprise pricing information'}`
      });

      if (error) throw error;

      toast.success('Thank you! Our team will contact you within 24 hours.');
      setShowEnterpriseModal(false);
      setEnterpriseForm({ companyName: '', email: '', requirements: '' });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Enterprise inquiry error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getButtonText = (tier: SubscriptionTier) => {
    if (tier === 'enterprise') return 'Contact Sales';
    if (tier === currentTier) {
      return isSubscribed ? 'Manage Plan' : 'Current Plan';
    }
    if (tier === 'free') {
      return isSubscribed ? 'Downgrade' : 'Get Started';
    }
    const tierOrder: SubscriptionTier[] = ['free', 'starter', 'pro', 'business', 'enterprise'];
    const currentIndex = tierOrder.indexOf(currentTier);
    const targetIndex = tierOrder.indexOf(tier);
    return targetIndex > currentIndex ? 'Upgrade' : 'Switch Plan';
  };

  const displayTiers: SubscriptionTier[] = ['free', 'starter', 'pro', 'business', 'enterprise'];

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
              {/* Pricing Cards - 5 columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-12">
                {displayTiers.map((tier, index) => {
                  const config = SUBSCRIPTION_TIERS[tier];
                  const isCurrentPlan = tier === currentTier;
                  const isPopular = tier === 'pro';
                  const isEnterprise = tier === 'enterprise';
                  
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
                          'relative p-6 h-full flex flex-col rounded-3xl transition-all duration-500',
                          'bg-card/40 backdrop-blur-xl',
                          'border border-white/10 dark:border-white/5',
                          'hover:scale-[1.02] hover:border-white/20 dark:hover:border-white/10',
                          tierGlowColors[tier],
                          isCurrentPlan && 'ring-2 ring-primary',
                          isEnterprise && 'border-yellow-400/30 dark:border-yellow-400/20'
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
                          <div className="flex items-center gap-3 mb-5">
                            <div className={cn(
                              'p-2.5 rounded-xl transition-colors',
                              tier === 'free' && 'bg-muted-foreground/10',
                              tier === 'starter' && 'bg-blue-500/10',
                              tier === 'pro' && 'bg-purple-500/10',
                              tier === 'business' && 'bg-amber-500/10',
                              tier === 'enterprise' && 'bg-yellow-500/10'
                            )}>
                              {tierIcons[tier]}
                            </div>
                            <h3 className="text-lg font-semibold">{config.name}</h3>
                          </div>

                          {/* Price */}
                          <div className="mb-6">
                            {isEnterprise ? (
                              <>
                                <span className="text-3xl font-display font-bold tracking-tight">
                                  Contact Us
                                </span>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Tailored for your business
                                </p>
                              </>
                            ) : (
                              <>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-4xl font-display font-bold tracking-tight">
                                    ${config.price}
                                  </span>
                                  <span className="text-muted-foreground text-base">/month</span>
                                </div>
                                {tier !== 'free' && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Billed monthly. Cancel anytime.
                                  </p>
                                )}
                              </>
                            )}
                          </div>

                          {/* Features */}
                          <ul className="space-y-3 mb-6 flex-grow">
                            {config.features.map((feature, i) => (
                              <motion.li 
                                key={i} 
                                className="flex items-start gap-2.5"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 + i * 0.05 + 0.5 }}
                              >
                                <div className={cn(
                                  'w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                                  tierCheckColors[tier]
                                )}>
                                  <Check className="w-2.5 h-2.5 text-white" />
                                </div>
                                <span className="text-sm text-foreground/80">{feature}</span>
                              </motion.li>
                            ))}
                          </ul>

                          {/* CTA Button */}
                          <Button
                            onClick={() => handleAction(tier)}
                            variant={isCurrentPlan && !isSubscribed ? "outline" : "default"}
                            className={cn(
                              'w-full h-11 rounded-xl font-medium transition-all duration-300',
                              isCurrentPlan && !isSubscribed
                                ? 'border-2 border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 cursor-default' 
                                : isCurrentPlan && isSubscribed
                                  ? 'bg-card border border-border hover:bg-muted'
                                  : tierButtonStyles[tier]
                            )}
                            disabled={false}
                          >
                            {isCurrentPlan && !isSubscribed ? (
                              <span className="flex items-center gap-2">
                                <Check className="w-4 h-4" />
                                Current Plan
                              </span>
                            ) : getButtonText(tier)}
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
                className="flex flex-wrap items-center justify-center gap-6 md:gap-12 text-sm text-muted-foreground mb-6"
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
                  <Shield className="w-5 h-5" />
                  <span>No Hidden Fees</span>
                </div>
              </motion.div>

              {/* Policy Note */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-center text-xs text-muted-foreground/70 mb-20"
              >
                By subscribing, you agree to our Terms of Service and No Refund Policy.
              </motion.p>
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

        {/* Enterprise Contact Modal */}
        <Dialog open={showEnterpriseModal} onOpenChange={setShowEnterpriseModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Enterprise Inquiry
              </DialogTitle>
              <DialogDescription>
                Tell us about your business needs and we'll create a custom plan for you.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  placeholder="Your company name"
                  value={enterpriseForm.companyName}
                  onChange={(e) => setEnterpriseForm(prev => ({ ...prev, companyName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Contact Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={enterpriseForm.email}
                  onChange={(e) => setEnterpriseForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements (optional)</Label>
                <Textarea
                  id="requirements"
                  placeholder="Tell us about your specific needs..."
                  rows={4}
                  value={enterpriseForm.requirements}
                  onChange={(e) => setEnterpriseForm(prev => ({ ...prev, requirements: e.target.value }))}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowEnterpriseModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-semibold"
                  onClick={handleEnterpriseSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Pricing;
