import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityEventData {
  action: string;
  details?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export const useSecurityMonitoring = () => {
  const logSecurityEvent = async (eventData: SecurityEventData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's IP address (limited info available in browser)
      const userAgent = navigator.userAgent;
      
      await supabase.rpc('log_security_event', {
        _action: eventData.action,
        _details: eventData.details || {},
        _severity: eventData.severity || 'info',
        _user_agent: userAgent
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  const checkRateLimit = async (actionType: string, maxAttempts = 5, windowMinutes = 15) => {
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        _action_type: actionType,
        _max_attempts: maxAttempts,
        _window_minutes: windowMinutes
      });

      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return true; // Allow action if check fails
    }
  };

  // Set up client-side security monitoring
  useEffect(() => {
    // Monitor for potential XSS attempts
    const originalEval = window.eval;
    window.eval = function(code: string) {
      logSecurityEvent({
        action: 'potential_xss_attempt',
        details: { code: code.substring(0, 100) },
        severity: 'critical'
      });
      return originalEval.call(this, code);
    };

    // Monitor for console access (potential debugging attempts)
    let consoleAccessCount = 0;
    const originalLog = console.log;
    console.log = function(...args) {
      consoleAccessCount++;
      if (consoleAccessCount > 50) {
        logSecurityEvent({
          action: 'excessive_console_access',
          details: { count: consoleAccessCount },
          severity: 'medium'
        });
      }
      return originalLog.apply(this, args);
    };

    // Monitor for suspicious navigation patterns
    let navigationCount = 0;
    const handleBeforeUnload = () => {
      navigationCount++;
      if (navigationCount > 20) {
        logSecurityEvent({
          action: 'suspicious_navigation_pattern',
          details: { count: navigationCount },
          severity: 'medium'
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.eval = originalEval;
      console.log = originalLog;
    };
  }, []);

  return {
    logSecurityEvent,
    checkRateLimit
  };
};