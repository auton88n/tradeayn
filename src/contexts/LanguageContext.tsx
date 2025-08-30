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
    'hero.joinBusiness': 'Join 10,000+ growing businesses',
    'hero.readyToAnalyze': 'Ready to analyze your business',
    'hero.aiConsultantQuote': 'I can help you with market research, competitive analysis, sales optimization, and strategic planning. What would you like to explore first?',
    
    // Features Section
    'features.title': 'Comprehensive Business Intelligence',
    'features.subtitle': 'One AI agent with multiple specialized capabilities to accelerate your business growth',
    'features.marketResearch.title': 'Market Research',
    'features.marketResearch.description': 'Get strategic business insights with comprehensive market analysis and competitive intelligence.',
    'features.salesOptimization.title': 'Sales Optimization',
    'features.salesOptimization.description': 'Optimize your sales funnel and conversion rates with data-driven recommendations.',
    'features.trendAnalysis.title': 'Trend Analysis',
    'features.trendAnalysis.description': 'Analyze market trends and identify emerging opportunities before your competitors.',
    'features.strategicPlanning.title': 'Strategic Planning',
    'features.strategicPlanning.description': 'Comprehensive business consulting and strategic planning powered by advanced AI.',
    
    // Testimonials Section
    'testimonials.title': 'Trusted by Industry Leaders',
    'testimonials.subtitle': 'See how AYN is transforming businesses worldwide',
    'testimonials.sarah.quote': 'AYN transformed our business strategy. The insights were game-changing.',
    'testimonials.marcus.quote': 'The market analysis capabilities are incredibly detailed and actionable.',
    'testimonials.emma.quote': 'AYN\'s trend predictions helped us pivot our strategy at the perfect time.',
    
    // Footer
    'footer.copyright': '© 2024 AYN AI Business Consulting. All rights reserved.',
    
    // Dashboard
    'dashboard.loading': 'Loading AYN...',
    'dashboard.templates.marketAnalysis': 'Market Analysis',
    'dashboard.templates.marketAnalysisPrompt': 'Analyze the current market trends and opportunities in my industry',
    'dashboard.templates.salesFunnel': 'Sales Funnel Audit',
    'dashboard.templates.salesFunnelPrompt': 'Review my sales process and identify conversion bottlenecks',
    'dashboard.templates.competitorResearch': 'Competitor Research',
    'dashboard.templates.competitorResearchPrompt': 'Research my main competitors and their strategies',
    'dashboard.templates.growthStrategy': 'Growth Strategy',
    'dashboard.templates.growthStrategyPrompt': 'Develop a comprehensive growth strategy for scaling my business',
    'dashboard.placeholders.askAyn': 'Ask AYN anything about your business...',
    'dashboard.placeholders.increaseRevenue': 'How can I increase my revenue?',
    'dashboard.placeholders.marketTrends': 'What are the latest market trends?',
    'dashboard.placeholders.competitionStrategy': 'Analyze my competition strategy...',
    'dashboard.placeholders.optimizeSales': 'How do I optimize my sales funnel?',
    'dashboard.placeholders.growthOpportunities': 'What growth opportunities exist?',
    'dashboard.placeholders.pricingStrategy': 'Help me with pricing strategy...',
    'dashboard.placeholders.targetMarket': 'Research my target market...',
    
    // Auth & Access
    'auth.termsRequired': 'Terms Required',
    'auth.termsRequiredDesc': 'Please accept the terms and conditions before using AYN AI.',
    'auth.accessRequired': 'Access Required',
    'auth.accessRequiredDesc': 'You need active access to use AYN. Please contact our team.',
    'auth.welcomeTitle': 'Welcome to AYN!',
    'auth.welcomeDesc': 'You can now start using AYN AI Business Consulting services.',
    
    // Errors & Messages
    'error.usageLimit': 'Usage Limit Reached',
    'error.usageLimitDesc': 'You\'ve reached your monthly message limit. Please contact support or wait for next month\'s reset.',
    'error.systemError': 'System Error',
    'error.systemErrorDesc': 'Unable to process your request. Please try again.',
    
    // Common
    'common.signOut': 'Sign Out',
    'common.settings': 'Settings',
    'common.admin': 'Admin',
    'common.chat': 'Chat',
    'common.language': 'Language',
  },
  ar: {
    // Navigation
    'nav.features': 'المميزات',
    'nav.testimonials': 'آراء العملاء',
    'nav.getStarted': 'ابدأ الآن',
    
    // Hero Section
    'hero.title': 'شريك نمو أعمالك',
    'hero.titleHighlight': 'المدعوم بالذكاء الاصطناعي',
    'hero.description': 'احصل على رؤى استراتيجية للأعمال، وأبحاث السوق، وتحسين المبيعات، وتحليل الاتجاهات - كل ذلك من مستشار ذكي واحد.',
    'hero.cta': 'ابدأ الاستشارة مع AYN',
    'hero.joinBusiness': 'انضم إلى أكثر من 10,000 شركة نامية',
    'hero.readyToAnalyze': 'جاهز لتحليل أعمالك',
    'hero.aiConsultantQuote': 'يمكنني مساعدتك في أبحاث السوق، والتحليل التنافسي، وتحسين المبيعات، والتخطيط الاستراتيجي. بماذا تود أن نبدأ؟',
    
    // Features Section
    'features.title': 'ذكاء أعمال شامل',
    'features.subtitle': 'وكيل ذكي واحد بقدرات متخصصة متعددة لتسريع نمو أعمالك',
    'features.marketResearch.title': 'أبحاث السوق',
    'features.marketResearch.description': 'احصل على رؤى استراتيجية للأعمال مع تحليل شامل للسوق والذكاء التنافسي.',
    'features.salesOptimization.title': 'تحسين المبيعات',
    'features.salesOptimization.description': 'حسن قمع المبيعات ومعدلات التحويل باستخدام توصيات مدفوعة بالبيانات.',
    'features.trendAnalysis.title': 'تحليل الاتجاهات',
    'features.trendAnalysis.description': 'حلل اتجاهات السوق وحدد الفرص الناشئة قبل منافسيك.',
    'features.strategicPlanning.title': 'التخطيط الاستراتيجي',
    'features.strategicPlanning.description': 'استشارات أعمال شاملة وتخطيط استراتيجي مدعوم بالذكاء الاصطناعي المتقدم.',
    
    // Testimonials Section
    'testimonials.title': 'موثوق به من قادة الصناعة',
    'testimonials.subtitle': 'اكتشف كيف يحول AYN الأعمال حول العالم',
    'testimonials.sarah.quote': 'لقد غير AYN استراتيجية أعمالنا. كانت الرؤى ثورية.',
    'testimonials.marcus.quote': 'قدرات تحليل السوق مفصلة بشكل لا يصدق وقابلة للتنفيذ.',
    'testimonials.emma.quote': 'ساعدتنا توقعات اتجاهات AYN في تغيير استراتيجيتنا في الوقت المثالي.',
    
    // Footer
    'footer.copyright': '© 2024 AYN للاستشارات التجارية بالذكاء الاصطناعي. جميع الحقوق محفوظة.',
    
    // Dashboard
    'dashboard.loading': 'جاري تحميل AYN...',
    'dashboard.templates.marketAnalysis': 'تحليل السوق',
    'dashboard.templates.marketAnalysisPrompt': 'حلل الاتجاهات الحالية للسوق والفرص في صناعتي',
    'dashboard.templates.salesFunnel': 'مراجعة قمع المبيعات',
    'dashboard.templates.salesFunnelPrompt': 'راجع عملية المبيعات الخاصة بي وحدد عقد التحويل',
    'dashboard.templates.competitorResearch': 'بحث المنافسين',
    'dashboard.templates.competitorResearchPrompt': 'ابحث عن منافسيي الرئيسيين واستراتيجياتهم',
    'dashboard.templates.growthStrategy': 'استراتيجية النمو',
    'dashboard.templates.growthStrategyPrompt': 'طور استراتيجية نمو شاملة لتوسيع أعمالي',
    'dashboard.placeholders.askAyn': 'اسأل AYN أي شيء عن أعمالك...',
    'dashboard.placeholders.increaseRevenue': 'كيف يمكنني زيادة إيراداتي؟',
    'dashboard.placeholders.marketTrends': 'ما هي أحدث اتجاهات السوق؟',
    'dashboard.placeholders.competitionStrategy': 'حلل استراتيجية منافستي...',
    'dashboard.placeholders.optimizeSales': 'كيف أحسن قمع المبيعات؟',
    'dashboard.placeholders.growthOpportunities': 'ما هي فرص النمو الموجودة؟',
    'dashboard.placeholders.pricingStrategy': 'ساعدني في استراتيجية التسعير...',
    'dashboard.placeholders.targetMarket': 'ابحث عن السوق المستهدف...',
    
    // Auth & Access
    'auth.termsRequired': 'الشروط مطلوبة',
    'auth.termsRequiredDesc': 'يرجى قبول الشروط والأحكام قبل استخدام AYN AI.',
    'auth.accessRequired': 'الوصول مطلوب',
    'auth.accessRequiredDesc': 'تحتاج إلى وصول نشط لاستخدام AYN. يرجى الاتصال بفريقنا.',
    'auth.welcomeTitle': 'مرحباً بك في AYN!',
    'auth.welcomeDesc': 'يمكنك الآن البدء في استخدام خدمات الاستشارات التجارية لـ AYN AI.',
    
    // Errors & Messages
    'error.usageLimit': 'تم الوصول لحد الاستخدام',
    'error.usageLimitDesc': 'لقد وصلت إلى حد الرسائل الشهرية. يرجى الاتصال بالدعم أو انتظار إعادة تعيين الشهر القادم.',
    'error.systemError': 'خطأ في النظام',
    'error.systemErrorDesc': 'غير قادر على معالجة طلبك. يرجى المحاولة مرة أخرى.',
    
    // Common
    'common.signOut': 'تسجيل الخروج',
    'common.settings': 'الإعدادات',
    'common.admin': 'المشرف',
    'common.chat': 'المحادثة',
    'common.language': 'اللغة',
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
    
    // Add/remove RTL class for styling
    if (language === 'ar') {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
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