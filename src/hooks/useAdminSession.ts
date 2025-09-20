import { useState, useEffect } from 'react';

interface AdminSession {
  isAuthenticated: boolean;
  authenticatedAt: number | null;
  sessionTimeout: number; // 30 minutes in milliseconds
}

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const SESSION_KEY = 'admin_session';

export function useAdminSession() {
  const [session, setSession] = useState<AdminSession>(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const now = Date.now();
      if (parsed.authenticatedAt && (now - parsed.authenticatedAt < SESSION_TIMEOUT)) {
        return {
          isAuthenticated: true,
          authenticatedAt: parsed.authenticatedAt,
          sessionTimeout: SESSION_TIMEOUT
        };
      }
    }
    return {
      isAuthenticated: false,
      authenticatedAt: null,
      sessionTimeout: SESSION_TIMEOUT
    };
  });

  const authenticate = () => {
    const now = Date.now();
    const newSession = {
      isAuthenticated: true,
      authenticatedAt: now,
      sessionTimeout: SESSION_TIMEOUT
    };
    setSession(newSession);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
  };

  const logout = () => {
    const newSession = {
      isAuthenticated: false,
      authenticatedAt: null,
      sessionTimeout: SESSION_TIMEOUT
    };
    setSession(newSession);
    localStorage.removeItem(SESSION_KEY);
  };

  const checkSession = () => {
    if (session.isAuthenticated && session.authenticatedAt) {
      const now = Date.now();
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