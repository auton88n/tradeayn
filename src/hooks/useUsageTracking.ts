import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UsageData {
  currentUsage: number;
  monthlyLimit: number | null;
  bonusCredits: number;
  isUnlimited: boolean;
  resetDate: string | null;
  isLoading: boolean;
}

export const useUsageTracking = (userId: string | null): UsageData & { refreshUsage: () => void } => {
  const [usageData, setUsageData] = useState<UsageData>({
    currentUsage: 0,
    monthlyLimit: null,
    bonusCredits: 0,
    isUnlimited: false,
    resetDate: null,
    isLoading: true
  });

  const fetchUsage = useCallback(async () => {
    if (!userId) {
      setUsageData(prev => ({ ...prev, isLoading: false }));
      return;
    }
    
    try {
      // Read from user_ai_limits - now using monthly tracking with bonus credits
      const { data, error } = await supabase
        .from('user_ai_limits')
        .select('current_monthly_messages, monthly_messages, bonus_credits, is_unlimited, monthly_reset_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        setUsageData({
          currentUsage: data.current_monthly_messages || 0,
          monthlyLimit: data.is_unlimited ? null : (data.monthly_messages || 50),
          bonusCredits: data.bonus_credits || 0,
          isUnlimited: data.is_unlimited || false,
          resetDate: data.monthly_reset_at,
          isLoading: false
        });
      } else {
        // No record yet - will be created on first AI call
        setUsageData({
          currentUsage: 0,
          monthlyLimit: 50, // Default free tier limit
          bonusCredits: 0,
          isUnlimited: false,
          resetDate: null,
          isLoading: false
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
            current_monthly_messages: number | null;
            monthly_messages: number | null;
            bonus_credits: number | null;
            is_unlimited: boolean | null;
            monthly_reset_at: string | null;
          };
          
          setUsageData(prev => ({
            ...prev,
            currentUsage: newData.current_monthly_messages || 0,
            monthlyLimit: newData.is_unlimited ? null : (newData.monthly_messages || 50),
            bonusCredits: newData.bonus_credits || 0,
            isUnlimited: newData.is_unlimited || false,
            resetDate: newData.monthly_reset_at
          }));
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
