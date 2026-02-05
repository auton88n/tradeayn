import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UsageData {
  currentUsage: number;
  limit: number | null;
  bonusCredits: number;
  isUnlimited: boolean;
  resetDate: string | null;
  isLoading: boolean;
  isDaily: boolean;
  tier: string;
}

export const useUsageTracking = (userId: string | null): UsageData & { refreshUsage: () => void } => {
  const [usageData, setUsageData] = useState<UsageData>({
    currentUsage: 0,
    limit: null,
    bonusCredits: 0,
    isUnlimited: false,
    resetDate: null,
    isLoading: true,
    isDaily: true,
    tier: 'free'
  });

  const fetchUsage = useCallback(async () => {
    if (!userId) {
      setUsageData(prev => ({ ...prev, isLoading: false }));
      return;
    }
    
    try {
      // Read from user_ai_limits and user_subscriptions for tier info
      const [limitsResult, subscriptionResult] = await Promise.all([
        supabase
        .from('user_ai_limits')
        .select('current_daily_messages, daily_messages, current_monthly_messages, monthly_messages, bonus_credits, is_unlimited, daily_reset_at, monthly_reset_at')
        .eq('user_id', userId)
        .maybeSingle(),
        supabase
        .from('user_subscriptions')
        .select('subscription_tier')
        .eq('user_id', userId)
        .maybeSingle()
      ]);

      const data = limitsResult.data;
      const tier = subscriptionResult.data?.subscription_tier || 'free';
      const isDaily = tier === 'free' || !tier;

      if (!limitsResult.error && data) {
        const currentUsage = isDaily 
          ? (data.current_daily_messages || 0)
          : (data.current_monthly_messages || 0);
        
        const limit = data.is_unlimited 
          ? null 
          : isDaily 
            ? (data.daily_messages || 5)
            : (data.monthly_messages || 50);
        
        const resetDate = isDaily ? data.daily_reset_at : data.monthly_reset_at;

        setUsageData({
          currentUsage,
          limit,
          bonusCredits: data.bonus_credits || 0,
          isUnlimited: data.is_unlimited || false,
          resetDate,
          isLoading: false,
          isDaily,
          tier
        });
      } else {
        // No record yet - default to free tier with daily limits
        setUsageData({
          currentUsage: 0,
          limit: 5, // Default free tier daily limit
          bonusCredits: 0,
          isUnlimited: false,
          resetDate: null,
          isLoading: false,
          isDaily: true,
          tier: 'free'
        });
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[useUsageTracking] Error fetching usage:', err);
      }
      setUsageData(prev => ({ ...prev, isLoading: false }));
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Real-time subscription for usage updates - with stable channel name
  useEffect(() => {
    if (!userId) return;

    // Use a stable channel name that won't cause reconnections
    const channelName = `usage-${userId.slice(0, 8)}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_ai_limits',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newData = payload.new as {
            current_daily_messages: number | null;
            daily_messages: number | null;
            current_monthly_messages: number | null;
            monthly_messages: number | null;
            bonus_credits: number | null;
            is_unlimited: boolean | null;
            daily_reset_at: string | null;
            monthly_reset_at: string | null;
          };
          
          setUsageData(prev => {
            const currentUsage = prev.isDaily 
              ? (newData.current_daily_messages || 0)
              : (newData.current_monthly_messages || 0);
            
            const limit = newData.is_unlimited 
              ? null 
              : prev.isDaily 
                ? (newData.daily_messages || 5)
                : (newData.monthly_messages || 50);
            
            const resetDate = prev.isDaily ? newData.daily_reset_at : newData.monthly_reset_at;

            return {
              ...prev,
              currentUsage,
              limit,
              bonusCredits: newData.bonus_credits || 0,
              isUnlimited: newData.is_unlimited || false,
              resetDate
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return {
    ...usageData,
    refreshUsage: fetchUsage
  };
};
