/**
 * Threat Detection Utilities for Real-time Security Monitoring
 */

import { supabase } from '@/integrations/supabase/client';

export interface ThreatEvent {
  type: 'failed_login' | 'ddos' | 'suspicious_request' | 'rate_limit_violation' | 'malicious_input';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  endpoint?: string;
  userAgent?: string;
}

/**
 * Report a security threat event with enhanced rate limiting
 */
export async function reportThreatEvent(event: ThreatEvent): Promise<boolean> {
  try {
    // Check rate limiting before reporting
    const { data: rateLimitOk } = await supabase.rpc('enhanced_rate_limit_check', {
      _action_type: 'threat_reporting',
      _max_attempts: 10,
      _window_minutes: 5
    });

    if (!rateLimitOk) {
      console.warn('Threat reporting rate limited');
      return false;
    }

    const clientIp = await getClientIP();
    
    // Call edge function for threat processing
    const { data, error } = await supabase.functions.invoke('threat-detector', {
      body: {
        source_ip: clientIp,
        threat_type: event.type,
        severity: event.severity,
        details: event.details,
        endpoint: event.endpoint,
        user_agent: event.userAgent || navigator.userAgent
      }
    });

    if (error) {
      console.error('Threat reporting failed:', error);
      return false;
    }

    // If threat is critical, trigger immediate protective measures
    if (event.severity === 'critical') {
      await triggerEmergencyProtocol(event);
    }

    return data?.blocked || false;
  } catch (error) {
    console.error('Failed to report threat:', error);
    return false;
  }
}

/**
 * Check if current IP is blocked
 */
export async function checkIPBlocked(): Promise<boolean> {
  try {
    const clientIp = await getClientIP();
    
    const { data, error } = await supabase
      .rpc('is_ip_blocked', { _ip_address: clientIp });

    if (error) {
      console.error('IP check failed:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('IP blocking check failed:', error);
    return false;
  }
}

/**
 * Monitor suspicious patterns in user behavior
 */
export class ThreatMonitor {
  private requestCounts: Map<string, number> = new Map();
  private suspiciousPatterns: Map<string, number> = new Map();
  private lastRequestTime: Map<string, number> = new Map();

  /**
   * Track a request and detect suspicious patterns
   */
  trackRequest(endpoint: string, userId?: string): boolean {
    const key = userId || 'anonymous';
    const now = Date.now();
    
    // Track request frequency
    const count = this.requestCounts.get(key) || 0;
    this.requestCounts.set(key, count + 1);
    
    // Check for rapid requests (potential DDoS)
    const lastRequest = this.lastRequestTime.get(key) || 0;
    const timeDiff = now - lastRequest;
    this.lastRequestTime.set(key, now);
    
    if (timeDiff < 100) { // Less than 100ms between requests
      const rapidCount = this.suspiciousPatterns.get(`rapid_${key}`) || 0;
      this.suspiciousPatterns.set(`rapid_${key}`, rapidCount + 1);
      
      if (rapidCount > 10) {
        this.reportSuspiciousBehavior('ddos', key, {
          endpoint,
          rapid_requests: rapidCount,
          time_diff: timeDiff
        });
        return true;
      }
    }
    
    // Check total request count
    if (count > 100) { // More than 100 requests
      this.reportSuspiciousBehavior('rate_limit_violation', key, {
        endpoint,
        total_requests: count
      });
      return true;
    }
    
    return false;
  }

  /**
   * Report suspicious behavior
   */
  private async reportSuspiciousBehavior(type: string, key: string, details: Record<string, any>) {
    await reportThreatEvent({
      type: type as ThreatEvent['type'],
      severity: 'high',
      details: {
        user_key: key,
        ...details,
        detection_time: new Date().toISOString()
      }
    });
  }

  /**
   * Reset counters (call periodically)
   */
  reset() {
    this.requestCounts.clear();
    this.suspiciousPatterns.clear();
    this.lastRequestTime.clear();
  }
}

/**
 * Enhanced input validation with comprehensive security checks
 */
export function detectMaliciousInput(input: string): { isMalicious: boolean; threats: string[] } {
  const threats: string[] = [];
  
  // Length validation
  if (input.length > 10000) {
    threats.push('Input exceeds maximum length');
  }
  
  // SQL Injection patterns (enhanced)
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|TRUNCATE|REPLACE)\b)/gi,
    /'(\s)*(OR|AND)\s*('?\d|'?\w)/gi,
    /;\s*(SELECT|INSERT|UPDATE|DELETE|DROP)/gi,
    /(UNION\s+SELECT|ORDER\s+BY|GROUP\s+BY)/gi,
    /(\|\||&&|\bAND\b|\bOR\b)\s*['"]?(\d+|true|false)['"]?\s*=\s*['"]?(\d+|true|false)/gi
  ];
  
  sqlPatterns.forEach(pattern => {
    if (pattern.test(input)) {
      threats.push('SQL injection attempt');
    }
  });
  
  // XSS patterns (enhanced)
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:\s*[^;]*/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi,
    /<iframe[^>]*>/gi,
    /eval\s*\([^)]*\)/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /expression\s*\([^)]*\)/gi,
    /vbscript:/gi,
    /data:\s*text\/html/gi
  ];
  
  xssPatterns.forEach(pattern => {
    if (pattern.test(input)) {
      threats.push('XSS attempt');
    }
  });
  
  // Command injection (enhanced)
  const commandPatterns = [
    /;\s*(rm|del|format|shutdown|reboot|halt)/gi,
    /\|\s*(nc|netcat|wget|curl|cat|ls|ps|kill)/gi,
    /`[^`]*`/g,
    /\$\([^)]*\)/g,
    /\$\{[^}]*\}/g,
    /(&&|\|\|)\s*(rm|del|cat|ls)/gi
  ];
  
  commandPatterns.forEach(pattern => {
    if (pattern.test(input)) {
      threats.push('Command injection attempt');
    }
  });
  
  // Path traversal
  const pathTraversalPatterns = [
    /\.\.[\/\\]/g,
    /[\/\\]\.\.[\/\\]/g,
    /%2e%2e[\/\\]/gi,
    /\.\.%2f/gi
  ];
  
  pathTraversalPatterns.forEach(pattern => {
    if (pattern.test(input)) {
      threats.push('Path traversal attempt');
    }
  });
  
  // LDAP injection
  const ldapPatterns = [
    /\(\s*\|\s*\(/g,
    /\(\s*&\s*\(/g,
    /\)\(\|\(/g,
    /\)\(&\(/g
  ];
  
  ldapPatterns.forEach(pattern => {
    if (pattern.test(input)) {
      threats.push('LDAP injection attempt');
    }
  });
  
  return {
    isMalicious: threats.length > 0,
    threats
  };
}

/**
 * Trigger emergency security protocol
 */
async function triggerEmergencyProtocol(event: ThreatEvent) {
  try {
    // Trigger emergency alert in database
    await supabase.rpc('trigger_emergency_alert', {
      _alert_level: 'red',
      _alert_type: 'security_threat',
      _trigger_reason: `Critical threat detected: ${event.type}`,
      _threat_assessment: {
        threat_type: event.type,
        severity: event.severity,
        details: event.details,
        timestamp: new Date().toISOString()
      }
    });

    // Notify administrators via edge function
    await supabase.functions.invoke('send-notifications', {
      body: {
        type: 'emergency_alert',
        message: `CRITICAL SECURITY THREAT: ${event.type} detected`,
        details: event.details,
        alert_level: 'red'
      }
    });

  } catch (error) {
    console.error('Failed to trigger emergency protocol:', error);
  }
}

/**
 * Get client IP address (best effort)
 */
async function getClientIP(): Promise<string> {
  try {
    // Try to get IP from various sources
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    // Fallback to local detection
    return '127.0.0.1';
  }
}

// Global threat monitor instance
export const globalThreatMonitor = new ThreatMonitor();

// Reset threat monitor every 5 minutes
setInterval(() => {
  globalThreatMonitor.reset();
}, 5 * 60 * 1000);