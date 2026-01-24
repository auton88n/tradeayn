/**
 * Email template types and utilities for AYN platform
 * These are used for reference and SSR if needed
 */

export type EmailType = 'welcome' | 'credit_warning' | 'auto_delete_warning' | 'payment_receipt' | 'password_reset';

export interface WelcomeEmailData {
  userName: string;
}

export interface CreditWarningEmailData {
  userName: string;
  creditsLeft: number;
  totalCredits: number;
}

export interface AutoDeleteWarningEmailData {
  userName: string;
  itemCount: number;
  daysLeft: number;
}

export interface PaymentReceiptEmailData {
  userName: string;
  amount: string;
  plan: string;
  date: string;
}

export interface PasswordResetEmailData {
  userName: string;
}

export type EmailData = 
  | WelcomeEmailData 
  | CreditWarningEmailData 
  | AutoDeleteWarningEmailData 
  | PaymentReceiptEmailData
  | PasswordResetEmailData;

// AYN branded email header (for reference)
export const AYN_EMAIL_HEADER = `
<div style="text-align:center;margin-bottom:32px;">
  <h1 style="font-size:56px;font-weight:900;letter-spacing:-2px;margin:0;color:#000;">AYN</h1>
  <div style="width:40px;height:4px;background:#000;margin:16px auto;"></div>
</div>`;

// AYN branded email footer (for reference)
export const AYN_EMAIL_FOOTER = `
<div style="margin-top:32px;padding-top:24px;border-top:1px solid #eee;text-align:center;">
  <p style="font-size:12px;color:#999;margin:0;">AYN AI - Your Intelligent Companion</p>
  <p style="font-size:11px;color:#bbb;margin:8px 0 0;">© ${new Date().getFullYear()} AYN Team. All rights reserved.</p>
</div>`;

// Email template subject lines
export const EMAIL_SUBJECTS: Record<EmailType, string | ((data: EmailData) => string)> = {
  welcome: "Welcome to AYN! 🎉 | !AYN مرحباً بك في",
  credit_warning: (data) => `⚠️ AYN: Low Credits Alert - Only ${(data as CreditWarningEmailData).creditsLeft} remaining`,
  auto_delete_warning: (data) => `🗑️ AYN: ${(data as AutoDeleteWarningEmailData).itemCount} items will be deleted in ${(data as AutoDeleteWarningEmailData).daysLeft} days`,
  payment_receipt: (data) => `✅ AYN Payment Confirmation - ${(data as PaymentReceiptEmailData).plan}`,
  password_reset: "🔐 AYN: Password Reset Request | طلب إعادة تعيين كلمة المرور",
};

// Get subject line for email type
export function getEmailSubject(emailType: EmailType, data: EmailData): string {
  const subject = EMAIL_SUBJECTS[emailType];
  return typeof subject === 'function' ? subject(data) : subject;
}
