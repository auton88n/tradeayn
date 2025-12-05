import { useState, useEffect } from 'react';

/**
 * Hook to pause animations when tab is hidden
 * Returns true when tab is visible, false when hidden
 */
export const useVisibilityPause = (): boolean => {
  const [isVisible, setIsVisible] = useState(() => 
    typeof document !== 'undefined' ? !document.hidden : true
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
};
