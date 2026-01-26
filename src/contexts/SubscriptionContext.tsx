import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getErrorMessage, ErrorCodes } from '@/lib/errorMessages';

// Tier configuration
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    productId: null,
    limits: { monthlyCredits: 5, monthlyEngineering: 10, isDaily: true },
    features: ['5 credits/day', '10 engineering calcs', 'Basic support'],
  },
  starter: {
    name: 'Starter',
    price: 9,
    priceId: 'price_1SsEOZDBJlSjDe8ADVHgJugk',
    productId: 'prod_TpuCGCGKRjz1QR',
    limits: { monthlyCredits: 500, monthlyEngineering: 50 },
    features: ['500 credits/month', '50 engineering calcs', 'PDF & Excel generation', 'Email support'],
  },
  pro: {
    name: 'Pro',
    price: 29,
    priceId: 'price_1SsEP3DBJlSjDe8AednfTBY4',
    productId: 'prod_TpuDZjjDGHOFfO',
    limits: { monthlyCredits: 1000, monthlyEngineering: 200 },
    features: ['1,000 credits/month', '200 engineering calcs', 'PDF & Excel generation', 'Priority support'],
  },
  business: {
    name: 'Business',
    price: 79,
    priceId: 'price_1SsEPKDBJlSjDe8AoLaqnZYP',
    productId: 'prod_TpuDQFgkmlTXAH',
    limits: { monthlyCredits: 3000, monthlyEngineering: 500 },
    features: ['3,000 credits/month', '500 engineering calcs', 'PDF & Excel generation', 'Priority support'],
  },
  enterprise: {
    name: 'Enterprise',
    price: -1, // -1 indicates "Contact Us"
    priceId: null,
    productId: null,
    limits: { monthlyCredits: -1, monthlyEngineering: -1 },
    features: ['Custom credit allocation', 'Tailored AI solutions', 'Dedicated account manager', '24/7 priority support'],
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
    isDaily?: boolean;
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
        if (import.meta.env.DEV) {
          console.error('[SubscriptionContext] Error checking subscription:', error);
        }
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
      if (import.meta.env.DEV) {
        console.error('[SubscriptionContext] Error:', err);
      }
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const startCheckout = useCallback(async (tier: SubscriptionTier) => {
    if (tier === 'free' || tier === 'enterprise') {
      if (tier === 'free') toast.info('Free tier does not require checkout');
      return;
    }

    const priceId = SUBSCRIPTION_TIERS[tier].priceId;
    if (!priceId) {
      toast.error(getErrorMessage(ErrorCodes.INVALID_TIER).description);
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
      if (import.meta.env.DEV) {
        console.error('[SubscriptionContext] Checkout error:', err);
      }
      toast.error(getErrorMessage(ErrorCodes.CHECKOUT_FAILED).description);
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
      if (import.meta.env.DEV) {
        console.error('[SubscriptionContext] Portal error:', err);
      }
      toast.error(getErrorMessage(ErrorCodes.PORTAL_FAILED).description);
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
