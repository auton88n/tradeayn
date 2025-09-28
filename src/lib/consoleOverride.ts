/**
 * Console Override for Production Security
 * Replaces console methods with secure logging in production
 */

import { log } from './secureLogger';

// Store original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
};

export function initializeSecureConsole() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Override console methods in production
    console.log = (...args: unknown[]) => {
      log.info('Console log', { data: args });
    };

    console.error = (...args: unknown[]) => {
      log.error('Console error', { data: args });
    };

    console.warn = (...args: unknown[]) => {
      log.warn('Console warning', { data: args });
    };

    console.info = (...args: unknown[]) => {
      log.info('Console info', { data: args });
    };

    console.debug = (...args: unknown[]) => {
      if (process.env.NODE_ENV === 'development') {
        log.debug('Console debug', { data: args });
      }
    };

    // Log the override
    log.security('console_override_activated', {
      environment: 'production',
      timestamp: new Date().toISOString()
    }, 'low');
  }
}

export function restoreOriginalConsole() {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
}

// Development helper - allows temporary restoration for debugging
export function enableDebugConsole() {
  if (process.env.NODE_ENV === 'development') {
    restoreOriginalConsole();
    log.debug('Debug console restored for development');
  }
}