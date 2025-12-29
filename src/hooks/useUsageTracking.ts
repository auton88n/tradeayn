import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UsageData {
  currentUsage: number;
  dailyLimit: number | null;
  isUnlimited: boolean;
  resetDate: string | null;
  isLoading: boolean;
}

export const useUsageTracking = (userId: string | null): UsageData & { refreshUsage: () => void } => {
  const [usageData, setUsageData] = useState<UsageData>({
    currentUsage: 0,
    dailyLimit: null,
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
      // Read from user_ai_limits - the table that backend actually enforces
      const { data, error } = await supabase
        .from('user_ai_limits')
        .select('current_daily_messages, daily_messages, is_unlimited, daily_reset_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        setUsageData({
          currentUsage: data.current_daily_messages || 0,
          dailyLimit: data.is_unlimited ? null : (data.daily_messages || 10),
          isUnlimited: data.is_unlimited || false,
          resetDate: data.daily_reset_at,
          isLoading: false
        });
      } else {
        // No record yet - will be created on first AI call
        setUsageData({
          currentUsage: 0,
          dailyLimit: 10, // Default limit
          isUnlimited: false,
          resetDate: null,
          isLoading: false
        });
      }
    } catch (err) {
      console.error('[useUsageTracking] Error fetching usage:', err);
      setUsageData(prev => ({ ...prev, isLoading: false }));
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Real-time subscription for usage updates on user_ai_limits
  useEffect(() => {
    if (!userId) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase
        .channel(`usage-tracking-${userId}`)
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
              is_unlimited: boolean | null;
              daily_reset_at: string | null;
            };
            
            setUsageData(prev => ({
              ...prev,
              currentUsage: newData.current_daily_messages || 0,
              dailyLimit: newData.is_unlimited ? null : (newData.daily_messages || 10),
              isUnlimited: newData.is_unlimited || false,
              resetDate: newData.daily_reset_at
            }));
          }
        )
        .subscribe((status, err) => {
          if (status === 'CHANNEL_ERROR' || err) {
            console.warn('[useUsageTracking] Real-time subscription unavailable, using polling fallback');
          }
        });
    } catch (err) {
      console.warn('[useUsageTracking] Failed to setup real-time subscription:', err);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId]);

  return {
    ...usageData,
    refreshUsage: fetchUsage
  };
};
