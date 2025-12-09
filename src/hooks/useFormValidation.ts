import { useState, useCallback } from 'react';
import { z } from 'zod';

// Base validation schema for common fields
export const baseApplicationSchema = z.object({
  fullName: z.string()
    .trim()
    .min(1, 'Full name is required')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  phone: z.string()
    .max(20, 'Phone number too long')
    .optional()
    .or(z.literal('')),
  message: z.string()
    .max(2000, 'Message must be less than 2000 characters')
    .optional()
    .or(z.literal(''))
});

// Content Creator Sites specific schema
export const contentCreatorSchema = baseApplicationSchema.extend({
  instagram: z.string().max(50).optional().or(z.literal('')),
  tiktok: z.string().max(50).optional().or(z.literal('')),
  youtube: z.string().max(100).optional().or(z.literal('')),
  followerCount: z.string().min(1, 'Please select follower count'),
  contentNiche: z.string().min(1, 'Please select content niche'),
  desiredFeatures: z.string().max(1000).optional().or(z.literal('')),
  budget: z.string().min(1, 'Please select budget range'),
  timeline: z.string().min(1, 'Please select timeline')
});

// AI Agents specific schema
export const aiAgentsSchema = baseApplicationSchema.extend({
  companyName: z.string().max(100).optional().or(z.literal('')),
  industry: z.string().min(1, 'Please select industry'),
  agentType: z.string().min(1, 'Please select agent type'),
  useCase: z.string()
    .trim()
    .min(1, 'Use case description is required')
    .max(2000, 'Use case must be less than 2000 characters'),
  integrations: z.string().max(1000).optional().or(z.literal('')),
  budget: z.string().min(1, 'Please select budget range'),
  timeline: z.string().min(1, 'Please select timeline')
});

// Automation specific schema
export const automationSchema = baseApplicationSchema.extend({
  companyName: z.string()
    .trim()
    .min(1, 'Company name is required')
    .max(100, 'Company name must be less than 100 characters'),
  industry: z.string().min(1, 'Please select industry'),
  currentTools: z.array(z.string()).optional(),
  processesToAutomate: z.string()
    .trim()
    .min(1, 'Please describe the processes you want to automate')
    .max(2000, 'Description must be less than 2000 characters'),
  painPoints: z.string().max(1000).optional().or(z.literal('')),
  budget: z.string().min(1, 'Please select budget range'),
  timeline: z.string().min(1, 'Please select timeline')
});

// AI Employee specific schema
export const aiEmployeeSchema = baseApplicationSchema.extend({
  companyName: z.string().max(100).optional().or(z.literal('')),
  industry: z.string().optional().or(z.literal('')),
  teamSize: z.string().optional().or(z.literal('')),
  roles: z.string().max(500).optional().or(z.literal('')),
  workload: z.string().optional().or(z.literal('')),
  budget: z.string().optional().or(z.literal(''))
});

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export function useFormValidation<T extends z.ZodSchema>(schema: T) {
  const [errors, setErrors] = useState<FormErrors<z.infer<T>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof z.infer<T>, boolean>>>({});

  const validateField = useCallback((field: keyof z.infer<T>, value: unknown, allData: z.infer<T>) => {
    try {
      // Create a partial schema for just this field
      const result = schema.safeParse({ ...allData, [field]: value });
      
      if (!result.success) {
        const fieldError = result.error.errors.find(e => e.path[0] === field);
        if (fieldError) {
          setErrors(prev => ({ ...prev, [field]: fieldError.message }));
          return false;
        }
      }
      
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      return true;
    } catch {
      return true;
    }
  }, [schema]);

  const validateForm = useCallback((data: z.infer<T>): boolean => {
    const result = schema.safeParse(data);
    
    if (!result.success) {
      const newErrors: FormErrors<z.infer<T>> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof z.infer<T>;
        if (!newErrors[field]) {
          newErrors[field] = err.message;
        }
      });
      setErrors(newErrors);
      
      // Mark all fields with errors as touched
      const newTouched: Partial<Record<keyof z.infer<T>, boolean>> = {};
      Object.keys(newErrors).forEach(key => {
        newTouched[key as keyof z.infer<T>] = true;
      });
      setTouched(prev => ({ ...prev, ...newTouched }));
      
      return false;
    }
    
    setErrors({});
    return true;
  }, [schema]);

  const handleBlur = useCallback((field: keyof z.infer<T>) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const getFieldError = useCallback((field: keyof z.infer<T>): string | undefined => {
    return touched[field] ? errors[field] : undefined;
  }, [errors, touched]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return {
    errors,
    touched,
    validateField,
    validateForm,
    handleBlur,
    getFieldError,
    clearErrors
  };
}
