import { useState, useEffect } from 'react';

interface AdminSession {
  isAuthenticated: boolean;
  authenticatedAt: number | null;
  sessionTimeout: number; // 30 minutes in milliseconds
  sessionToken?: string;
  expiresAt?: number;
}

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const SESSION_KEY = 'admin_session';

export function useAdminSession() {
  const [session, setSession] = useState<AdminSession>(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const now = Date.now();
      
      // Check server expiration first if available
      if (parsed.expiresAt && now >= parsed.expiresAt) {
        return {
          isAuthenticated: false,
          authenticatedAt: null,
          sessionTimeout: SESSION_TIMEOUT
        };
      }
      
      // Fallback to local timeout check
      if (parsed.authenticatedAt && (now - parsed.authenticatedAt < SESSION_TIMEOUT)) {
        return {
          isAuthenticated: true,
          authenticatedAt: parsed.authenticatedAt,
          sessionTimeout: SESSION_TIMEOUT,
          sessionToken: parsed.sessionToken,
          expiresAt: parsed.expiresAt
        };
      }
    }
    return {
      isAuthenticated: false,
      authenticatedAt: null,
      sessionTimeout: SESSION_TIMEOUT
    };
  });

  const authenticate = (sessionToken?: string, expiresAt?: number) => {
    const now = Date.now();
    const newSession = {
      isAuthenticated: true,
      authenticatedAt: now,
      sessionTimeout: SESSION_TIMEOUT,
      sessionToken,
      expiresAt
    };
    setSession(newSession);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
  };

  const logout = () => {
    const newSession = {
      isAuthenticated: false,
      authenticatedAt: null,
      sessionTimeout: SESSION_TIMEOUT,
      sessionToken: undefined,
      expiresAt: undefined
    };
    setSession(newSession);
    localStorage.removeItem(SESSION_KEY);
  };

  const checkSession = () => {
    if (session.isAuthenticated && session.authenticatedAt) {
      const now = Date.now();
      
      // Check server-provided expiration if available
      if (session.expiresAt && now >= session.expiresAt) {
        logout();
        return false;
      }
      
      // Fallback to local timeout check
      if (now - session.authenticatedAt >= SESSION_TIMEOUT) {
        logout();
        return false;
      }
      return true;
    }
    return false;
  };

  const getRemainingTime = () => {
    if (session.isAuthenticated && session.authenticatedAt) {
      const elapsed = Date.now() - session.authenticatedAt;
      const remaining = SESSION_TIMEOUT - elapsed;
      return Math.max(0, remaining);
    }
    return 0;
  };

  // Auto logout on timeout
  useEffect(() => {
    if (session.isAuthenticated) {
      const interval = setInterval(() => {
        if (!checkSession()) {
          clearInterval(interval);
        }
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [session.isAuthenticated]);

  return {
    isAuthenticated: session.isAuthenticated,
    authenticate,
    logout,
    checkSession,
    getRemainingTime,
    sessionTimeout: SESSION_TIMEOUT
  };
}