import { supabase } from '@/integrations/supabase/client';
import type { EmailType } from '@/lib/email-templates';

interface SendEmailResponse {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Hook for sending emails via the send-email edge function
 */
export const useEmail = () => {
  /**
   * Generic email send function
   */
  const sendEmail = async (
    to: string,
    emailType: EmailType,
    data: { [key: string]: unknown },
    userId?: string
  ): Promise<SendEmailResponse> => {
    try {
      const { data: response, error } = await supabase.functions.invoke('send-email', {
        body: { to, emailType, data, userId }
      });

      if (error) {
        console.error('[useEmail] Error sending email:', error);
        return { success: false, error: error.message };
      }

      return { success: true, id: response?.id };
    } catch (err) {
      console.error('[useEmail] Exception:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  };

  /**
   * Send welcome email to new user
   */
  const sendWelcomeEmail = async (
    to: string, 
    userName: string, 
    userId?: string
  ): Promise<SendEmailResponse> => {
    return sendEmail(to, 'welcome', { userName }, userId);
  };

  /**
   * Send credit warning email when user reaches 90% usage
   */
  const sendCreditWarning = async (
    to: string,
    userName: string,
    creditsLeft: number,
    totalCredits: number,
    userId?: string
  ): Promise<SendEmailResponse> => {
    return sendEmail(to, 'credit_warning', { userName, creditsLeft, totalCredits }, userId);
  };

  /**
   * Send auto-delete warning email before data cleanup
   */
  const sendAutoDeleteWarning = async (
    to: string,
    userName: string,
    itemCount: number,
    daysLeft: number,
    userId?: string
  ): Promise<SendEmailResponse> => {
    return sendEmail(to, 'auto_delete_warning', { userName, itemCount, daysLeft }, userId);
  };

  /**
   * Send payment receipt email after successful payment
   */
  const sendPaymentReceipt = async (
    to: string,
    userName: string,
    amount: string,
    plan: string,
    date: string,
    userId?: string
  ): Promise<SendEmailResponse> => {
    return sendEmail(to, 'payment_receipt', { userName, amount, plan, date }, userId);
  };

  return {
    sendEmail,
    sendWelcomeEmail,
    sendCreditWarning,
    sendAutoDeleteWarning,
    sendPaymentReceipt,
  };
};
