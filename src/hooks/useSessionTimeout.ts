import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SessionTimeoutConfig {
  timeoutMinutes?: number;
  warningMinutes?: number;
}

export const useSessionTimeout = (config: SessionTimeoutConfig = {}) => {
  const { timeoutMinutes = 30, warningMinutes = 1 } = config;
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningTimeoutRef = useRef<NodeJS.Timeout>();
  const countdownRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef(Date.now());

  const TIMEOUT_MS = timeoutMinutes * 60 * 1000;
  const WARNING_MS = warningMinutes * 60 * 1000;

  const logout = useCallback(async () => {
    clearAllTimers();
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sign out timeout')), 2000);
      });
      
      // Use local scope to clear local session without requiring server validation
      await Promise.race([
        supabase.auth.signOut({ scope: 'local' }),
        timeoutPromise
      ]);
    } catch (error) {
      console.log('Logout timeout or error, forcing local cleanup');
    } finally {
      // Always force local logout by clearing storage
      localStorage.removeItem('sb-dfkoxuokfkttjhfjcecx-auth-token');
      sessionStorage.clear();
      window.location.href = '/';
    }
  }, []);

  const clearAllTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const startCountdown = useCallback(() => {
    setRemainingSeconds(60);
    countdownRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [logout]);

  const resetTimer = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    lastActivityRef.current = Date.now();
    localStorage.setItem('lastActivity', Date.now().toString());

    // Set warning timer (1 minute before logout)
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      startCountdown();
    }, TIMEOUT_MS - WARNING_MS);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      logout();
    }, TIMEOUT_MS);
  }, [TIMEOUT_MS, WARNING_MS, logout, startCountdown]);

  const handleStayLoggedIn = useCallback(() => {
    setShowWarning(false);
    resetTimer();
  }, [resetTimer]);

  const handleLogoutNow = useCallback(() => {
    logout();
  }, [logout]);

  // Track user activity
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    
    const handleActivity = () => {
      const now = Date.now();
      const lastActivity = lastActivityRef.current;
      
      // Only reset if more than 1 second has passed (debounce)
      if (now - lastActivity > 1000) {
        resetTimer();
      }
    };

    // Set up event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Listen for activity in other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lastActivity') {
        const otherTabActivity = parseInt(e.newValue || '0', 10);
        if (otherTabActivity > lastActivityRef.current) {
          resetTimer();
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Initialize timer
    resetTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      window.removeEventListener('storage', handleStorageChange);
      clearAllTimers();
    };
  }, [resetTimer]);

  return {
    showWarning,
    remainingSeconds,
    handleStayLoggedIn,
    handleLogoutNow,
  };
};
