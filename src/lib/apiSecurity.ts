/**
 * API Security Middleware - Rate Limiting, Validation, and Protection
 */

import { log } from './secureLogger';
import { supabase } from '@/integrations/supabase/client';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  endpoint: string;
}

interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'uuid';
  maxLength?: number;
  pattern?: RegExp;
}

class APISecurityManager {
  private rateLimitStore = new Map<string, { count: number; resetTime: number }>();
  
  // Enhanced rate limiting with user-specific limits
  async checkRateLimit(config: RateLimitConfig, userId?: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const identifier = userId || 'anonymous';
    const key = `${config.endpoint}:${identifier}`;
    const now = Date.now();
    
    // Clean expired entries
    const current = this.rateLimitStore.get(key);
    if (current && now > current.resetTime) {
      this.rateLimitStore.delete(key);
    }
    
    const entry = this.rateLimitStore.get(key) || { count: 0, resetTime: now + config.windowMs };
    
    if (entry.count >= config.maxRequests) {
      log.security('rate_limit_exceeded', {
        endpoint: config.endpoint,
        userId: identifier,
        attempts: entry.count,
        limit: config.maxRequests
      }, 'high');
      
      // Report to threat detection system
      if (userId) {
        try {
          await supabase.rpc('log_security_event', {
            _action: 'rate_limit_violation',
            _details: {
              endpoint: config.endpoint,
              attempts: entry.count,
              limit: config.maxRequests
            },
            _severity: 'high'
          });
        } catch (error) {
          log.error('Failed to log security event', { error: error instanceof Error ? error.message : 'Unknown' });
        }
      }
      
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: entry.resetTime 
      };
    }
    
    entry.count++;
    this.rateLimitStore.set(key, entry);
    
    return { 
      allowed: true, 
      remaining: config.maxRequests - entry.count, 
      resetTime: entry.resetTime 
    };
  }
  
  // Enhanced input validation with security patterns
  validateInput(data: Record<string, unknown>, rules: ValidationRule[]): { isValid: boolean; errors: string[]; sanitized: Record<string, unknown> } {
    const errors: string[] = [];
    const sanitized: Record<string, unknown> = {};
    
    for (const rule of rules) {
      const value = data[rule.field];
      
      // Required field check
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} is required`);
        continue;
      }
      
      if (value !== undefined && value !== null && value !== '') {
        // Type validation
        if (rule.type) {
          switch (rule.type) {
            case 'string':
              if (typeof value !== 'string') {
                errors.push(`${rule.field} must be a string`);
                continue;
              }
              break;
            case 'number':
              if (typeof value !== 'number' && !Number.isFinite(Number(value))) {
                errors.push(`${rule.field} must be a number`);
                continue;
              }
              break;
            case 'email':
              if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                errors.push(`${rule.field} must be a valid email`);
                continue;
              }
              break;
            case 'uuid':
              if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
                errors.push(`${rule.field} must be a valid UUID`);
                continue;
              }
              break;
          }
        }
        
        // Length validation
        if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
          errors.push(`${rule.field} exceeds maximum length of ${rule.maxLength}`);
          continue;
        }
        
        // Pattern validation
        if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
          errors.push(`${rule.field} format is invalid`);
          continue;
        }
        
        // Security pattern checks
        if (typeof value === 'string') {
          const securityPatterns = [
            { pattern: /<script[^>]*>.*?<\/script>/gi, name: 'script injection' },
            { pattern: /javascript:/gi, name: 'javascript protocol' },
            { pattern: /on\w+\s*=/gi, name: 'event handler' },
            { pattern: /eval\s*\(/gi, name: 'eval injection' },
            { pattern: /(union|select|insert|update|delete|drop|create|alter)\s/gi, name: 'SQL injection' }
          ];
          
          for (const { pattern, name } of securityPatterns) {
            if (pattern.test(value)) {
              errors.push(`${rule.field} contains potentially malicious content (${name})`);
              log.security('malicious_input_detected', {
                field: rule.field,
                pattern: name,
                value: value.substring(0, 100) // Log only first 100 chars
              }, 'critical');
              break;
            }
          }
        }
        
        // Sanitize the value
        if (typeof value === 'string') {
          sanitized[rule.field] = value
            .replace(/[<>]/g, '') // Remove angle brackets
            .replace(/\0/g, '') // Remove null bytes
            .trim();
        } else {
          sanitized[rule.field] = value;
        }
      }
    }
    
    return { isValid: errors.length === 0, errors, sanitized };
  }
  
  // Request sanitization
  sanitizeRequest(req: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(req)) {
      if (typeof value === 'string') {
        sanitized[key] = value
          .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
          .replace(/\0/g, '') // Remove null bytes
          .trim();
      } else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          sanitized[key] = value.map(item => 
            typeof item === 'string' ? item.replace(/[<>'"]/g, '').trim() : item
          );
        } else {
          sanitized[key] = this.sanitizeRequest(value as Record<string, unknown>);
        }
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  // CORS security headers
  getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:;"
    };
  }
  
  // API versioning security
  validateApiVersion(version: string): { isValid: boolean; supportedVersion: string } {
    const supportedVersions = ['v1', 'v2'];
    const isValid = supportedVersions.includes(version);
    
    if (!isValid) {
      log.security('unsupported_api_version', { requestedVersion: version }, 'medium');
    }
    
    return { isValid, supportedVersion: supportedVersions[supportedVersions.length - 1] };
  }
}

export const apiSecurity = new APISecurityManager();

// Common rate limit configurations
export const RATE_LIMITS = {
  AUTH: { maxRequests: 5, windowMs: 15 * 60 * 1000, endpoint: 'auth' }, // 5 per 15 min
  API: { maxRequests: 100, windowMs: 60 * 1000, endpoint: 'api' }, // 100 per minute
  UPLOAD: { maxRequests: 10, windowMs: 60 * 1000, endpoint: 'upload' }, // 10 per minute
  ADMIN: { maxRequests: 20, windowMs: 60 * 1000, endpoint: 'admin' }, // 20 per minute
} as const;

// Common validation rules
export const VALIDATION_RULES = {
  EMAIL: { field: 'email', required: true, type: 'email' as const, maxLength: 254 },
  PASSWORD: { field: 'password', required: true, type: 'string' as const, minLength: 8, maxLength: 128 },
  USER_ID: { field: 'user_id', required: true, type: 'uuid' as const },
  MESSAGE: { field: 'message', required: true, type: 'string' as const, maxLength: 4000 },
  COMPANY_NAME: { field: 'company_name', type: 'string' as const, maxLength: 200 },
} as const;