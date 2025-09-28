import { useState, useEffect, useCallback } from 'react';
import { log } from '@/lib/secureLogger';

interface SecureSession {
  isAuthenticated: boolean;
  authenticatedAt: number | null;
  sessionTimeout: number;
  expiresAt?: number;
  userRole?: string;
}

interface SessionConfig {
  timeout?: number;
  enableRotation?: boolean;
  storageKey?: string;
}

const DEFAULT_SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function useSecureSession(config: SessionConfig = {}) {
  const {
    timeout = DEFAULT_SESSION_TIMEOUT,
    enableRotation = true,
    storageKey = 'secure_session'
  } = config;

  const [session, setSession] = useState<SecureSession>(() => {
    try {
      // Try to restore from sessionStorage (not localStorage for security)
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        
        // Check server expiration first if available
        if (parsed.expiresAt && now >= parsed.expiresAt) {
          sessionStorage.removeItem(storageKey);
          return {
            isAuthenticated: false,
            authenticatedAt: null,
            sessionTimeout: timeout
          };
        }
        
        // Fallback to local timeout check
        if (parsed.authenticatedAt && (now - parsed.authenticatedAt < timeout)) {
          return {
            isAuthenticated: true,
            authenticatedAt: parsed.authenticatedAt,
            sessionTimeout: timeout,
            expiresAt: parsed.expiresAt,
            userRole: parsed.userRole
          };
        }
      }
    } catch (error) {
      log.error('Session restoration failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
    
    return {
      isAuthenticated: false,
      authenticatedAt: null,
      sessionTimeout: timeout
    };
  });

  const authenticate = useCallback((sessionData: { 
    sessionToken?: string; 
    expiresAt?: number; 
    userRole?: string;
  } = {}) => {
    const now = Date.now();
    const newSession: SecureSession = {
      isAuthenticated: true,
      authenticatedAt: now,
      sessionTimeout: timeout,
      expiresAt: sessionData.expiresAt,
      userRole: sessionData.userRole
    };

    setSession(newSession);
    
    try {
      // Store in sessionStorage only (cleared when browser closes)
      sessionStorage.setItem(storageKey, JSON.stringify({
        authenticatedAt: now,
        sessionTimeout: timeout,
        expiresAt: sessionData.expiresAt,
        userRole: sessionData.userRole
        // Note: sessionToken is NOT stored client-side for security
      }));
      
      log.security('user_authenticated', { 
        userRole: sessionData.userRole,
        expiresAt: sessionData.expiresAt 
      }, 'low');
    } catch (error) {
      log.error('Failed to persist session', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }, [timeout, storageKey]);

  const logout = useCallback(() => {
    const wasAuthenticated = session.isAuthenticated;
    
    const newSession: SecureSession = {
      isAuthenticated: false,
      authenticatedAt: null,
      sessionTimeout: timeout,
      expiresAt: undefined,
      userRole: undefined
    };
    
    setSession(newSession);
    
    try {
      sessionStorage.removeItem(storageKey);
      
      // Clear any other sensitive data from storage
      const keysToRemove = ['admin_session', 'rate_limit_data'];
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      if (wasAuthenticated) {
        log.security('user_logged_out', {}, 'low');
      }
    } catch (error) {
      log.error('Logout cleanup failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }, [session.isAuthenticated, timeout, storageKey]);

  const checkSession = useCallback(() => {
    if (session.isAuthenticated && session.authenticatedAt) {
      const now = Date.now();
      
      // Check server-provided expiration if available
      if (session.expiresAt && now >= session.expiresAt) {
        log.security('session_expired_server', {}, 'medium');
        logout();
        return false;
      }
      
      // Fallback to local timeout check
      if (now - session.authenticatedAt >= timeout) {
        log.security('session_expired_timeout', {}, 'medium');
        logout();
        return false;
      }
      return true;
    }
    return false;
  }, [session, timeout, logout]);

  const getRemainingTime = useCallback(() => {
    if (session.isAuthenticated && session.authenticatedAt) {
      const elapsed = Date.now() - session.authenticatedAt;
      const remaining = timeout - elapsed;
      return Math.max(0, remaining);
    }
    return 0;
  }, [session, timeout]);

  const rotateSession = useCallback(async () => {
    if (!enableRotation || !session.isAuthenticated) return;

    try {
      // This would call an API endpoint to rotate the session
      // For now, we'll just refresh the timestamp
      const now = Date.now();
      const rotatedSession = {
        ...session,
        authenticatedAt: now
      };
      
      setSession(rotatedSession);
      sessionStorage.setItem(storageKey, JSON.stringify({
        authenticatedAt: now,
        sessionTimeout: timeout,
        expiresAt: session.expiresAt,
        userRole: session.userRole
      }));
      
      log.security('session_rotated', {}, 'low');
    } catch (error) {
      log.error('Session rotation failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }, [session, enableRotation, timeout, storageKey]);

  // Auto logout on timeout and session rotation
  useEffect(() => {
    if (session.isAuthenticated) {
      const interval = setInterval(() => {
        if (!checkSession()) {
          clearInterval(interval);
        } else if (enableRotation) {
          // Rotate session every 10 minutes if enabled
          const timeActive = Date.now() - (session.authenticatedAt || 0);
          if (timeActive > 10 * 60 * 1000) {
            rotateSession();
          }
        }
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [session.isAuthenticated, checkSession, enableRotation, rotateSession]);

  return {
    isAuthenticated: session.isAuthenticated,
    userRole: session.userRole,
    authenticate,
    logout,
    checkSession,
    getRemainingTime,
    rotateSession,
    sessionTimeout: timeout
  };
}