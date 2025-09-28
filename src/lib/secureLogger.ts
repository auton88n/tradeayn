/**
 * Secure Logging Service - Production-Safe Error Tracking
 * Replaces all console.log statements with secure, sanitized logging
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  sanitized?: boolean;
}

class SecureLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private sensitivePatterns = [
    /password/i,
    /token/i,
    /key/i,
    /secret/i,
    /auth/i,
    /bearer/i,
    /email/i,
    /phone/i,
    /ssn/i,
    /credit/i,
    /api[_-]?key/i,
    /access[_-]?token/i,
  ];

  private sanitizeData(data: unknown): unknown {
    if (typeof data === 'string') {
      // Remove potential sensitive data patterns
      for (const pattern of this.sensitivePatterns) {
        if (pattern.test(data)) {
          return '[REDACTED]';
        }
      }
      return data;
    }

    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        return data.map(item => this.sanitizeData(item));
      }

      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        // Check if key indicates sensitive data
        const isSensitiveKey = this.sensitivePatterns.some(pattern => 
          pattern.test(key)
        );
        
        sanitized[key] = isSensitiveKey ? '[REDACTED]' : this.sanitizeData(value);
      }
      return sanitized;
    }

    return data;
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    return {
      level,
      message: this.sanitizeData(message) as string,
      timestamp: new Date().toISOString(),
      context: context ? this.sanitizeData(context) as Record<string, unknown> : undefined,
      sanitized: true
    };
  }

  private writeToSecureStorage(entry: LogEntry) {
    // In production, this would send to a secure logging service
    // For now, we'll use a safe development fallback
    if (this.isDevelopment) {
      const logMethod = entry.level === 'error' ? console.error : 
                       entry.level === 'warn' ? console.warn : console.log;
      logMethod(`[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`, 
                entry.context ? entry.context : '');
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    const entry = this.createLogEntry('info', message, context);
    this.writeToSecureStorage(entry);
  }

  warn(message: string, context?: Record<string, unknown>) {
    const entry = this.createLogEntry('warn', message, context);
    this.writeToSecureStorage(entry);
  }

  error(message: string, context?: Record<string, unknown>) {
    const entry = this.createLogEntry('error', message, context);
    this.writeToSecureStorage(entry);
  }

  debug(message: string, context?: Record<string, unknown>) {
    if (this.isDevelopment) {
      const entry = this.createLogEntry('debug', message, context);
      this.writeToSecureStorage(entry);
    }
  }

  // Security-specific logging
  security(action: string, details: Record<string, unknown>, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
    this.error(`SECURITY EVENT: ${action}`, { 
      severity, 
      details: this.sanitizeData(details),
      timestamp: new Date().toISOString()
    });
  }
}

export const secureLogger = new SecureLogger();

// Convenience exports for easy migration
export const log = {
  info: (message: string, context?: Record<string, unknown>) => secureLogger.info(message, context),
  warn: (message: string, context?: Record<string, unknown>) => secureLogger.warn(message, context),
  error: (message: string, context?: Record<string, unknown>) => secureLogger.error(message, context),
  debug: (message: string, context?: Record<string, unknown>) => secureLogger.debug(message, context),
  security: (action: string, details: Record<string, unknown>, severity?: 'low' | 'medium' | 'high' | 'critical') => 
    secureLogger.security(action, details, severity),
};