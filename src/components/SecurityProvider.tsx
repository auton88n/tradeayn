import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { supabase } from '@/integrations/supabase/client';

interface SecurityContextType {
  logSecurityEvent: (eventData: any) => Promise<void>;
  checkRateLimit: (actionType: string, maxAttempts?: number, windowMinutes?: number) => Promise<boolean>;
  isSecureConnection: boolean;
  hasActiveThreats: boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

interface SecurityProviderProps {
  children: ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const { logSecurityEvent, checkRateLimit } = useSecurityMonitoring();
  const [isSecureConnection, setIsSecureConnection] = useState(false);
  const [hasActiveThreats, setHasActiveThreats] = useState(false);

  useEffect(() => {
    // Check if connection is secure (HTTPS)
    setIsSecureConnection(window.location.protocol === 'https:');

    // Log application start
    logSecurityEvent({
      action: 'application_start',
      details: {
        protocol: window.location.protocol,
        host: window.location.host,
        userAgent: navigator.userAgent.substring(0, 100)
      },
      severity: 'low'
    });

    // Set up periodic security checks
    const securityCheckInterval = setInterval(async () => {
      try {
        // Check for suspicious activity
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Monitor for unusual session patterns
          const lastActivity = localStorage.getItem('last_activity');
          const now = Date.now();
          
          if (lastActivity) {
            const timeDiff = now - parseInt(lastActivity);
            // If more than 6 hours since last activity, log it
            if (timeDiff > 6 * 60 * 60 * 1000) {
              await logSecurityEvent({
                action: 'long_session_detected',
                details: { hours_inactive: Math.floor(timeDiff / (60 * 60 * 1000)) },
                severity: 'low'
              });
            }
          }
          
          localStorage.setItem('last_activity', now.toString());
        }
      } catch (error) {
        console.error('Security check failed:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Monitor for tab visibility changes (potential security concern)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logSecurityEvent({
          action: 'tab_hidden',
          severity: 'low'
        });
      } else {
        logSecurityEvent({
          action: 'tab_visible',
          severity: 'low'
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Monitor for potential clickjacking
    if (window.top !== window.self) {
      logSecurityEvent({
        action: 'potential_clickjacking_detected',
        details: { 
          top_origin: window.top?.location.origin || 'unknown',
          self_origin: window.self.location.origin 
        },
        severity: 'critical'
      });
      setHasActiveThreats(true);
    }

    return () => {
      clearInterval(securityCheckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [logSecurityEvent]);

  // Add security headers check
  useEffect(() => {
    // Check for security headers
    fetch(window.location.href, { method: 'HEAD' })
      .then(response => {
        const hasCSP = response.headers.get('Content-Security-Policy');
        const hasXFrame = response.headers.get('X-Frame-Options');
        const hasXSS = response.headers.get('X-XSS-Protection');
        
        if (!hasCSP || !hasXFrame || !hasXSS) {
          logSecurityEvent({
            action: 'missing_security_headers',
            details: {
              csp: Boolean(hasCSP),
              xframe: Boolean(hasXFrame),
              xss: Boolean(hasXSS)
            },
            severity: 'medium'
          });
        }
      })
      .catch(() => {
        // Ignore fetch errors for this check
      });
  }, [logSecurityEvent]);

  const value: SecurityContextType = {
    logSecurityEvent,
    checkRateLimit,
    isSecureConnection,
    hasActiveThreats
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};