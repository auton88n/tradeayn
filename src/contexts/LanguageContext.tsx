import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation data
const translations = {
  en: {
    // Navigation
    'nav.features': 'Features',
    'nav.testimonials': 'Testimonials',
    'nav.getStarted': 'Get Started',
    
    // Hero Section
    'hero.title': 'Your AI-Powered',
    'hero.titleHighlight': 'Business Growth Partner',
    'hero.description': 'Get strategic business insights, market research, sales optimization, and trend analysis - all from one intelligent AI consultant.',
    'hero.cta': 'Start Consulting with AYN',
    
    // Auth Modal
    'auth.welcomeToAyn': 'Welcome to AYN',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.requestAccess': 'Request Access',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.enterEmail': 'Enter your email',
    'auth.enterPassword': 'Enter your password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.resetPassword': 'Reset Password',
    'auth.resetPasswordDesc': 'Enter your email to receive a password reset link',
    'auth.sendResetLink': 'Send Reset Link',
    'auth.resetLinkSent': 'Reset Link Sent',
    'auth.resetLinkSentDesc': 'Check your email for password reset instructions',
    'auth.backToSignIn': 'Back to Sign In',
    'auth.connectWallet': 'Connect Wallet',
    'auth.connectWithSolana': 'Connect with Solana Wallet',
    'auth.walletConnected': 'Wallet Connected',
    'auth.walletDisconnected': 'Wallet Disconnected',
    'auth.chooseAuthMethod': 'Choose Authentication Method',
    'auth.emailAuth': 'Email & Password',
    'auth.walletAuth': 'Solana Wallet',
    'auth.missingInfo': 'Missing Information',
    'auth.missingInfoDesc': 'Please fill in all required fields.',
    'auth.verifyEmail': 'Verify your email',
    'auth.verifyEmailDesc': 'Confirmation email re-sent. Please verify, then sign in.',
    'auth.verificationError': 'Verification email error',
    'auth.verificationErrorDesc': 'Could not resend email. Please try again.',
    'auth.authError': 'Authentication Error',
    'auth.welcomeBack': 'Welcome back!',
    'auth.welcomeBackDesc': 'You have been successfully logged in.',
    'auth.requestAccessDesc': 'Request access to AYN AI Business Consulting Platform',
    'auth.fullName': 'Full Name',
    'auth.company': 'Company',
    'auth.businessEmail': 'Business Email',
    'auth.phoneNumber': 'Phone Number',
    'auth.createPassword': 'Create a secure password',
    'auth.registrationError': 'Registration Error',
    'auth.registrationSuccess': 'Registration Successful',
    'auth.registrationSuccessDesc': 'Please check your email to verify your account.',
    
    // Common
    'common.signOut': 'Sign Out',
    'common.settings': 'Settings',
    'common.admin': 'Admin',
    'common.chat': 'Chat',
    'common.language': 'Language',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    
    // Errors
    'error.systemError': 'System Error',
    'error.systemErrorDesc': 'Unable to process your request. Please try again.',
    
    // Dashboard
    'dashboard.loading': 'Loading AYN...',
    
    // Admin Panel
    'admin.title': 'Admin Control Center',
    
    // Placeholders
    'placeholders.General': '["Ask about your business strategy...", "How can I help optimize your operations?", "What business challenge are you facing?"]',
    'placeholders.Nen Mode ⚡': '["Ask about your business strategy...", "How can I help optimize your operations?", "What business challenge are you facing?"]',
    'placeholders.Research Pro': '["Research market trends for me...", "Analyze competitor strategies...", "Find industry insights about..."]',
    'placeholders.PDF Analyst': '["Analyze this document for key insights...", "Summarize the main points of this PDF...", "Extract data from this report..."]',
    'placeholders.Vision Lab': '["Analyze this image for business insights...", "What do you see in this visual?", "Extract text from this image..."]',
  },
  ar: {
    // Basic Arabic translations
    'auth.welcomeToAyn': 'مرحبا بك في AYN',
    'auth.signIn': 'تسجيل الدخول',
    'auth.signUp': 'التسجيل',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.emailAuth': 'البريد الإلكتروني وكلمة المرور',
    'auth.walletAuth': 'محفظة Solana',
    'common.cancel': 'إلغاء',
  }
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    // Load saved language from localStorage
    const savedLang = localStorage.getItem('ayn-language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'ar')) {
      setLanguageState(savedLang);
    }
  }, []);

  useEffect(() => {
    // Update document direction and language
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [language, direction]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('ayn-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};