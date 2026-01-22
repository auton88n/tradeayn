import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Tier configuration
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    productId: null,
    limits: { monthlyCredits: 50, monthlyEngineering: 10 },
    features: ['50 credits/month', '10 engineering calcs', 'Basic support'],
  },
  starter: {
    name: 'Starter',
    price: 9,
    priceId: 'price_1SsEOZDBJlSjDe8ADVHgJugk',
    productId: 'prod_TpuCGCGKRjz1QR',
    limits: { monthlyCredits: 200, monthlyEngineering: 50 },
    features: ['200 credits/month', '50 engineering calcs', 'Email support'],
  },
  pro: {
    name: 'Pro',
    price: 29,
    priceId: 'price_1SsEP3DBJlSjDe8AednfTBY4',
    productId: 'prod_TpuDZjjDGHOFfO',
    limits: { monthlyCredits: 1000, monthlyEngineering: 200 },
    features: ['1,000 credits/month', '200 engineering calcs', 'Priority support'],
  },
  business: {
    name: 'Business',
    price: 79,
    priceId: 'price_1SsEPKDBJlSjDe8AoLaqnZYP',
    productId: 'prod_TpuDQFgkmlTXAH',
    limits: { monthlyCredits: 5000, monthlyEngineering: -1 },
    features: ['5,000 credits/month', 'Unlimited engineering', 'Team features', 'Priority support'],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
export type TierKey = SubscriptionTier;

interface SubscriptionState {
  isLoading: boolean;
  isSubscribed: boolean;
  tier: SubscriptionTier;
  productId: string | null;
  subscriptionEnd: string | null;
  limits: {
    monthlyCredits: number;
    monthlyEngineering: number;
  };
}

interface SubscriptionContextType extends SubscriptionState {
  checkSubscription: () => Promise<void>;
  startCheckout: (tier: SubscriptionTier) => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider = ({ children }: SubscriptionProviderProps) => {
  const [state, setState] = useState<SubscriptionState>({
    isLoading: true,
    isSubscribed: false,
    tier: 'free',
    productId: null,
    subscriptionEnd: null,
    limits: SUBSCRIPTION_TIERS.free.limits,
  });

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isSubscribed: false,
          tier: 'free',
          limits: SUBSCRIPTION_TIERS.free.limits,
        }));
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('[SubscriptionContext] Error checking subscription:', error);
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const tier = (data?.tier || 'free') as SubscriptionTier;
      setState({
        isLoading: false,
        isSubscribed: data?.subscribed || false,
        tier,
        productId: data?.product_id || null,
        subscriptionEnd: data?.subscription_end || null,
        limits: SUBSCRIPTION_TIERS[tier]?.limits || SUBSCRIPTION_TIERS.free.limits,
      });
    } catch (err) {
      console.error('[SubscriptionContext] Error:', err);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const startCheckout = useCallback(async (tier: SubscriptionTier) => {
    if (tier === 'free') {
      toast.info('Free tier does not require checkout');
      return;
    }

    const priceId = SUBSCRIPTION_TIERS[tier].priceId;
    if (!priceId) {
      toast.error('Invalid tier selected');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('[SubscriptionContext] Checkout error:', err);
      toast.error('Failed to start checkout. Please try again.');
    }
  }, []);

  const openCustomerPortal = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('[SubscriptionContext] Portal error:', err);
      toast.error('Failed to open subscription management. Please try again.');
    }
  }, []);

  // Check subscription on mount and auth state change
  useEffect(() => {
    checkSubscription();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkSubscription]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  return (
    <SubscriptionContext.Provider
      value={{
        ...state,
        checkSubscription,
        startCheckout,
        openCustomerPortal,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
