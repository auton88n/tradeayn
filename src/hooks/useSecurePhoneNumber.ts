import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurePhoneNumberHook {
  phoneNumber: string | null;
  isLoading: boolean;
  error: string | null;
  getPhoneNumber: (userId: string) => Promise<void>;
  updatePhoneNumber: (userId: string, newPhone: string) => Promise<boolean>;
  validatePhoneFormat: (phone: string) => boolean;
}

export function useSecurePhoneNumber(): SecurePhoneNumberHook {
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const validatePhoneFormat = useCallback((phone: string): boolean => {
    if (!phone || phone.trim() === '') return true; // Allow empty
    
    // International phone number format validation
    const phoneRegex = /^\+?[0-9\-\s\(\)]{7,20}$/;
    const cleanPhone = phone.replace(/[^0-9+\-\s\(\)]/g, '');
    
    return phoneRegex.test(cleanPhone);
  }, []);

  const getPhoneNumber = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_phone_number_secure', {
        _user_id: userId
      });

      if (error) {
        throw error;
      }

      setPhoneNumber(data);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to retrieve phone number';
      setError(errorMessage);
      
      if (errorMessage.includes('Access denied')) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to view this phone number',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updatePhoneNumber = useCallback(async (userId: string, newPhone: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Client-side validation
      if (!validatePhoneFormat(newPhone)) {
        throw new Error('Invalid phone number format. Please use international format (e.g., +1-555-123-4567)');
      }

      const { data, error } = await supabase.rpc('update_phone_number_secure', {
        _user_id: userId,
        _new_phone: newPhone.trim()
      });

      if (error) {
        throw error;
      }

      // Update local state
      setPhoneNumber(newPhone.trim() || null);
      
      toast({
        title: 'Success',
        description: 'Phone number updated securely',
      });

      return true;
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update phone number';
      setError(errorMessage);
      
      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [validatePhoneFormat, toast]);

  return {
    phoneNumber,
    isLoading,
    error,
    getPhoneNumber,
    updatePhoneNumber,
    validatePhoneFormat
  };
}