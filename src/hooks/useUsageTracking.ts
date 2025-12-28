import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UsageData {
  currentMonthUsage: number;
  monthlyLimit: number | null;
  usageResetDate: string | null;
  isLoading: boolean;
}

export const useUsageTracking = (userId: string | null): UsageData & { refreshUsage: () => void } => {
  const [usageData, setUsageData] = useState<UsageData>({
    currentMonthUsage: 0,
    monthlyLimit: null,
    usageResetDate: null,
    isLoading: true
  });

  const fetchUsage = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('access_grants')
        .select('current_month_usage, monthly_limit, usage_reset_date')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        setUsageData({
          currentMonthUsage: data.current_month_usage || 0,
          monthlyLimit: data.monthly_limit,
          usageResetDate: data.usage_reset_date,
          isLoading: false
        });
      } else {
        setUsageData(prev => ({ ...prev, isLoading: false }));
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

  // Real-time subscription for usage updates
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
            table: 'access_grants',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const newData = payload.new as {
              current_month_usage: number;
              monthly_limit: number | null;
              usage_reset_date: string | null;
            };
            
            setUsageData(prev => ({
              ...prev,
              currentMonthUsage: newData.current_month_usage || 0,
              monthlyLimit: newData.monthly_limit,
              usageResetDate: newData.usage_reset_date
            }));
          }
        )
        .subscribe((status, err) => {
          if (status === 'CHANNEL_ERROR' || err) {
            // Gracefully handle subscription errors (RLS, auth, or realtime not enabled)
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
