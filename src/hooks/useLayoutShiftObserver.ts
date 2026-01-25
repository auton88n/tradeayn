import { useEffect } from 'react';
import { useDebugContextOptional } from '@/contexts/DebugContext';

export const useLayoutShiftObserver = () => {
  const debug = useDebugContextOptional();
  
  useEffect(() => {
    if (!debug?.isDebugMode || !('PerformanceObserver' in window)) return;
    
    console.log('[Layout Shift Observer] Started monitoring');
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Only log shifts not caused by user input
        if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
          debug.addLayoutShift(entry);
        }
      }
    });
    
    try {
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.warn('[Layout Shift Observer] Not supported in this browser');
    }
    
    return () => {
      observer.disconnect();
      console.log('[Layout Shift Observer] Stopped monitoring');
    };
  }, [debug?.isDebugMode, debug?.addLayoutShift]);
};
