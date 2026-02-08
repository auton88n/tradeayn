import { useEffect } from 'react';
import { useDebugStore } from '@/stores/debugStore';

export const useLayoutShiftObserver = () => {
  const isDebugMode = useDebugStore((s) => s.isDebugMode);
  const addLayoutShift = useDebugStore((s) => s.addLayoutShift);
  
  useEffect(() => {
    if (!isDebugMode || !('PerformanceObserver' in window)) return;
    
    if (import.meta.env.DEV) {
      console.log('[Layout Shift Observer] Started monitoring');
    }
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Only log shifts not caused by user input
        if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
          addLayoutShift(entry);
        }
      }
    });
    
    try {
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('[Layout Shift Observer] Not supported in this browser');
      }
    }
    
    return () => {
      observer.disconnect();
      if (import.meta.env.DEV) {
        console.log('[Layout Shift Observer] Stopped monitoring');
      }
    };
  }, [isDebugMode, addLayoutShift]);
};
