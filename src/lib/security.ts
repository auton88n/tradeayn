/**
 * Security utilities for input validation and sanitization
 */

// HTML entities to prevent XSS attacks
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escapes HTML entities to prevent XSS attacks
 */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"'/]/g, (match) => HTML_ENTITIES[match] || match);
}

/**
 * Sanitizes user input by removing potentially dangerous content
 */
export function sanitizeUserInput(input: string): string {
  // Remove script tags and event handlers
  let sanitized = input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '');

  // Escape remaining HTML
  return escapeHtml(sanitized);
}

/**
 * Validates that text doesn't contain malicious patterns
 */
export function isValidUserInput(input: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\(/i,
    /document\./i,
    /window\./i,
  ];

  return !dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Rate limiting check (client-side helper)
 */
export function checkRateLimit(
  key: string, 
  maxAttempts: number = 5, 
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now();
  const windowKey = `rate_limit_${key}`;
  
  const storedData = localStorage.getItem(windowKey);
  let attempts: number[] = storedData ? JSON.parse(storedData) : [];
  
  // Clean old attempts outside the window
  attempts = attempts.filter(timestamp => now - timestamp < windowMs);
  
  if (attempts.length >= maxAttempts) {
    return false; // Rate limit exceeded
  }
  
  attempts.push(now);
  localStorage.setItem(windowKey, JSON.stringify(attempts));
  
  return true;
}

/**
 * Log security events to Supabase
 */
export async function logSecurityEvent(
  action: string,
  details: Record<string, any> = {},
  severity: string = 'info'
): Promise<void> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    await supabase.rpc('log_security_event', {
      _action: action,
      _details: details,
      _severity: severity
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}