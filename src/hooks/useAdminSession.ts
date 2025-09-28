import { useState, useEffect } from 'react';
import { useSecureSession } from './useSecureSession';
import { log } from '@/lib/secureLogger';

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
  // Use secure session management with enhanced security
  const secureSession = useSecureSession({
    timeout: SESSION_TIMEOUT,
    enableRotation: true,
    storageKey: 'admin_secure_session'
  });

  const [adminData, setAdminData] = useState<{
    sessionToken?: string;
    expiresAt?: number;
  }>({});

  // Legacy compatibility layer
  const session: AdminSession = {
    isAuthenticated: secureSession.isAuthenticated,
    authenticatedAt: secureSession.isAuthenticated ? Date.now() : null,
    sessionTimeout: SESSION_TIMEOUT,
    sessionToken: adminData.sessionToken,
    expiresAt: adminData.expiresAt
  };

  const authenticate = (sessionToken?: string, expiresAt?: number) => {
    // Use secure session authentication
    secureSession.authenticate({ sessionToken, expiresAt, userRole: 'admin' });
    
    // Store admin-specific data securely (no sensitive tokens in localStorage)
    setAdminData({ sessionToken, expiresAt });
    
    log.security('admin_authenticated', { 
      hasToken: !!sessionToken, 
      expiresAt 
    }, 'medium');
  };

  const logout = () => {
    // Use secure logout
    secureSession.logout();
    
    // Clear admin-specific data
    setAdminData({});
    
    log.security('admin_logged_out', {}, 'low');
  };

  const checkSession = () => {
    return secureSession.checkSession();
  };

  const getRemainingTime = () => {
    return secureSession.getRemainingTime();
  };

  // Session management is handled by useSecureSession

  return {
    isAuthenticated: session.isAuthenticated,
    authenticate,
    logout,
    checkSession,
    getRemainingTime,
    sessionTimeout: SESSION_TIMEOUT
  };
}