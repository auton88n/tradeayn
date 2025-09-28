import { useState, useCallback } from 'react';
import { detectMaliciousInput, reportThreatEvent } from '@/lib/threatDetection';
import { useToast } from '@/hooks/use-toast';

interface SecureInputOptions {
  maxLength?: number;
  allowHtml?: boolean;
  reportThreats?: boolean;
  onThreatDetected?: (threats: string[]) => void;
}

export function useSecureInput(options: SecureInputOptions = {}) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const { toast } = useToast();
  const {
    maxLength = 5000,
    allowHtml = false,
    reportThreats = true,
    onThreatDetected
  } = options;

  const validateInput = useCallback(async (input: string): Promise<boolean> => {
    setValidationError(null);

    // Length validation
    if (input.length > maxLength) {
      const error = `Input exceeds maximum length of ${maxLength} characters`;
      setValidationError(error);
      return false;
    }

    // Basic HTML validation if not allowed
    if (!allowHtml && /<[^>]*>/g.test(input)) {
      const error = 'HTML tags are not allowed in this field';
      setValidationError(error);
      return false;
    }

    // Malicious input detection
    const { isMalicious, threats } = detectMaliciousInput(input);
    
    if (isMalicious) {
      const error = 'Invalid input detected. Please check your content.';
      setValidationError(error);
      
      // Report the threat if enabled
      if (reportThreats) {
        try {
          await reportThreatEvent({
            type: 'malicious_input',
            severity: 'high',
            details: {
              input_preview: input.substring(0, 100),
              threats,
              field_context: 'user_input_validation',
              timestamp: new Date().toISOString()
            }
          });
        } catch (error) {
          console.error('Failed to report threat:', error);
        }
      }

      // Call threat detected callback
      if (onThreatDetected) {
        onThreatDetected(threats);
      }

      // Show user-friendly toast
      toast({
        title: 'Security Warning',
        description: 'Your input contains potentially unsafe content. Please review and try again.',
        variant: 'destructive'
      });

      return false;
    }

    return true;
  }, [maxLength, allowHtml, reportThreats, onThreatDetected, toast]);

  const sanitizeInput = useCallback((input: string): string => {
    // Basic sanitization
    let sanitized = input.trim();
    
    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');
    
    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');
    
    // If HTML is not allowed, escape HTML entities
    if (!allowHtml) {
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    }
    
    return sanitized;
  }, [allowHtml]);

  return {
    validateInput,
    sanitizeInput,
    validationError,
    clearError: () => setValidationError(null)
  };
}