import { useState, useEffect } from 'react';
import { Brain, TrendingUp, Target, BarChart3, Zap, Users, ArrowRight, Sparkles, Check, ChevronRight, Send, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AuthModal } from './auth/AuthModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './theme-toggle';
import { TypewriterText } from '@/components/TypewriterText';
import { Badge } from '@/components/ui/badge';

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [demoInput, setDemoInput] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const { language } = useLanguage();

  // Demo placeholder suggestions
  const placeholders = language === 'ar' ? [
    'كيف يمكنني زيادة إيراداتي؟',
    'حلل اتجاهات السوق في مجالي',
    'اقترح استراتيجية تسويق',
    'كيف أحسن قمع المبيعات؟'
  ] : [
    'How can I increase my revenue?',
    'Analyze market trends in my industry',
    'Suggest a marketing strategy',
    'How do I optimize my sales funnel?'
  ];

  // Rotate placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  // Update placeholder visibility
  useEffect(() => {
    setShowPlaceholder(!demoInput.trim());
  }, [demoInput]);

  // Handle demo send - trigger auth modal
  const handleDemoSend = () => {
    if (!demoInput.trim()) return;
    setShowAuthModal(true);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleDemoSend();
    }
  };

  const features = [
    {
      icon: BarChart3,
      title: language === 'ar' ? 'أبحاث السوق' : 'Market Research',
      description: language === 'ar' ? 'احصل على رؤى عميقة حول السوق والمنافسين' : 'Get deep insights into your market and competitors'
    },
    {
      icon: Target,
      title: language === 'ar' ? 'تحسين المبيعات' : 'Sales Optimization', 
      description: language === 'ar' ? 'حسّن قمع المبيعات وزد معدلات التحويل' : 'Optimize your sales funnel and increase conversion rates'
    },
    {
      icon: TrendingUp,
      title: language === 'ar' ? 'تحليل الاتجاهات' : 'Trend Analysis',
      description: language === 'ar' ? 'راقب اتجاهات الصناعة وتوقع التغييرات' : 'Monitor industry trends and predict changes'
    },
    {
      icon: Zap,
      title: language === 'ar' ? 'التخطيط الاستراتيجي' : 'Strategic Planning',
      description: language === 'ar' ? 'احصل على استراتيجيات قابلة للتنفيذ' : 'Get actionable strategies for growth'
    }
  ];

  const services = [
    {
      title: language === 'ar' ? 'مواقع المؤثرين' : 'Influencer Portfolio Sites',
      description: language === 'ar' ? 'تميّز عن الآخرين' : 'Stand out from the crowd',
      features: language === 'ar' ? [
        'تصميم احترافي مخصص',
        'استجابة كاملة للموبايل',
        'تحسين SEO متقدم',
        'استضافة سريعة وآمنة'
      ] : [
        'Custom professional design',
        'Fully mobile responsive',
        'Advanced SEO optimization',
        'Fast and secure hosting'
      ]
    },
    {
      title: language === 'ar' ? 'روبوتات AI مخصصة' : 'Custom AI Agents',
      description: language === 'ar' ? 'احصل على ميزة تنافسية' : 'Gain competitive advantage',
      features: language === 'ar' ? [
        'مساعد ذكي مدرّب على بياناتك',
        'تكامل مع أنظمتك الحالية',
        'دعم متعدد اللغات',
        'تعلّم وتحسّن مستمر'
      ] : [
        'AI trained on your data',
        'Integrate with existing systems',
        'Multilingual support',
        'Continuous learning'
      ]
    },
    {
      title: language === 'ar' ? 'أتمتة العمليات' : 'Process Automation',
      description: language === 'ar' ? 'وفّر الوقت والمال' : 'Save time and money',
      features: language === 'ar' ? [
        'أتمتة المهام المتكررة',
        'تكامل بين الأنظمة',
        'تقارير وتحليلات آلية',
        'تقليل الأخطاء البشرية'
      ] : [
        'Automate repetitive tasks',
        'Connect different systems',
        'Automated reports and analytics',
        'Reduce human errors'
      ]
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation Header - Transparent */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <Brain className="w-5 h-5 text-black" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">AYN</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-white/60 hover:text-white transition-colors">
                {language === 'ar' ? 'المميزات' : 'Features'}
              </a>
              <a href="#services" className="text-white/60 hover:text-white transition-colors">
                {language === 'ar' ? 'الخدمات' : 'Services'}
              </a>
              <a href="#contact" className="text-white/60 hover:text-white transition-colors">
                {language === 'ar' ? 'اتصل بنا' : 'Contact'}
              </a>
            </nav>
            
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <ThemeToggle />
              <Button 
                onClick={() => setShowAuthModal(true)}
                className="bg-white text-black hover:bg-white/90"
              >
                {language === 'ar' ? 'ابدأ الآن' : 'Get Started'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Interactive Demo - Black Background */}
      <section id="home" className="relative min-h-screen bg-black text-white pt-20 overflow-hidden">
        {/* Subtle blur orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white font-medium mb-8 backdrop-blur-sm">
            <Sparkles className="w-5 h-5" />
            <span>{language === 'ar' ? 'مدعوم بالذكاء الاصطناعي المتقدم' : 'Powered by Advanced AI'}</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-black leading-tight text-center mb-6 tracking-tight">
            <span className="block bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
              {language === 'ar' ? 'مستشارك الذكي' : 'Your AI Business'}
            </span>
            <span className="block text-white/80 mt-2">
              {language === 'ar' ? 'في الأعمال' : 'Consultant'}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/60 max-w-3xl mx-auto text-center mb-12">
            {language === 'ar'
              ? 'اسأل أي سؤال عن عملك واحصل على إجابات فورية مدعومة بالذكاء الاصطناعي'
              : 'Ask any question about your business and get instant AI-powered answers'}
          </p>

          {/* Interactive Demo Input */}
          <div className="w-full max-w-4xl mb-8">
            <div className="relative group">
              <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-3 hover:border-white/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 px-4 py-2 rounded-2xl bg-white/10 text-white text-sm font-semibold">
                    {language === 'ar' ? 'نمط عام' : 'General Mode'}
                  </div>

                  <div className="relative flex-1">
                    <Textarea
                      value={demoInput}
                      onChange={(e) => setDemoInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder=""
                      rows={1}
                      className="w-full resize-none border-0 bg-transparent text-lg focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[56px] max-h-[200px] text-white"
                      unstyled
                    />
                    
                    {showPlaceholder && !demoInput.trim() && (
                      <div className="absolute top-4 left-4 pointer-events-none">
                        <TypewriterText
                          key={`${placeholderIndex}-${language}`}
                          text={placeholders[placeholderIndex]}
                          speed={50}
                          className="text-white/40 text-lg"
                          showCursor={true}
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleDemoSend}
                    disabled={!demoInput.trim()}
                    size="lg"
                    className="flex-shrink-0 h-14 w-14 rounded-2xl bg-white text-black hover:bg-white/90 disabled:opacity-50"
                  >
                    <Send className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setDemoInput(language === 'ar' ? 'كيف أزيد مبيعاتي؟' : 'How do I increase sales?')}
              className="rounded-full bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              💡 {language === 'ar' ? 'كيف أزيد مبيعاتي؟' : 'How do I increase sales?'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setDemoInput(language === 'ar' ? 'حلل منافسيني' : 'Analyze my competitors')}
              className="rounded-full bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              🎯 {language === 'ar' ? 'حلل منافسيني' : 'Analyze my competitors'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setDemoInput(language === 'ar' ? 'اقترح استراتيجية تسويق' : 'Suggest marketing strategy')}
              className="rounded-full bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              📊 {language === 'ar' ? 'استراتيجية تسويق' : 'Marketing strategy'}
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">10,000+</div>
              <div className="text-white/60">{language === 'ar' ? 'شركة تستخدم AYN' : 'Businesses Using AYN'}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">98%</div>
              <div className="text-white/60">{language === 'ar' ? 'نسبة الرضا' : 'Satisfaction Rate'}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-white/60">{language === 'ar' ? 'دعم متاح' : 'Support Available'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - White Background */}
      <section id="features" className="py-24 bg-white text-black">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-6 text-black border-black/20">
              {language === 'ar' ? 'القدرات' : 'CAPABILITIES'}
            </Badge>
            <h2 className="text-5xl font-bold mb-4 tracking-tight">
              {language === 'ar' ? 'كل ما تحتاجه' : 'Everything You Need'}
            </h2>
            <p className="text-xl text-black/60 max-w-2xl mx-auto">
              {language === 'ar' ? 'أدوات قوية لتنمية أعمالك' : 'Powerful tools to grow your business'}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white border border-black/10 rounded-2xl p-6 hover:bg-black/5 transition-colors">
                <div className="w-16 h-16 rounded-xl bg-black flex items-center justify-center mb-4">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-black/60 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section - Black Background */}
      <section id="services" className="py-24 bg-black text-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-6 text-white border-white/20">
              {language === 'ar' ? 'الخدمات' : 'SERVICES'}
            </Badge>
            <h2 className="text-5xl font-bold mb-4 tracking-tight">
              {language === 'ar' ? 'ما نقدمه' : 'What We Offer'}
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              {language === 'ar' ? 'حلول متكاملة لنجاح أعمالك' : 'Complete solutions for your business success'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {services.map((service, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
                <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
                <p className="text-white/60 mb-6">{service.description}</p>
                <ul className="space-y-3 mb-6">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={() => setShowAuthModal(true)}
                  className="w-full bg-white/10 text-white hover:bg-white/20 border border-white/20"
                >
                  {language === 'ar' ? 'ابدأ الآن' : 'Get Started'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ))}
          </div>

          {/* AYN Eng - Coming Soon */}
          <div className="relative rounded-2xl p-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-transparent bg-clip-padding"
               style={{
                 backgroundImage: 'linear-gradient(black, black), linear-gradient(90deg, #0066FF, #8B5CF6)',
                 backgroundOrigin: 'border-box',
                 backgroundClip: 'padding-box, border-box'
               }}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="w-8 h-8 text-blue-400" />
                  <h3 className="text-3xl font-bold">
                    {language === 'ar' ? 'AYN Eng: الذكاء الاصطناعي للهندسة المدنية' : 'AYN Eng: Civil Engineering AI'}
                  </h3>
                  <Badge className="bg-blue-500 text-white">
                    {language === 'ar' ? 'قريباً' : 'Coming Soon'}
                  </Badge>
                </div>
                <p className="text-white/60 text-lg">
                  {language === 'ar'
                    ? 'أول مساعد ذكي متخصص في الهندسة المدنية - تحليل، تصميم، وحسابات دقيقة'
                    : 'The first AI assistant specialized in civil engineering - analysis, design, and precise calculations'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact/CTA Section - White Background */}
      <section id="contact" className="py-24 bg-white text-black">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <h2 className="text-5xl font-bold mb-4 tracking-tight">
            {language === 'ar' ? 'ابدأ اليوم' : 'Start Today'}
          </h2>
          <p className="text-xl text-black/60 mb-12">
            {language === 'ar'
              ? 'انضم لآلاف الشركات التي تنمو مع AYN'
              : 'Join thousands of businesses growing with AYN'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto mb-4">
            <input
              type="email"
              placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
              className="flex-1 px-6 py-4 rounded-full border border-black/20 focus:outline-none focus:border-black/40 bg-white text-black"
            />
            <Button 
              onClick={() => setShowAuthModal(true)}
              size="lg"
              className="bg-black text-white hover:bg-black/90 rounded-full px-8"
            >
              {language === 'ar' ? 'ابدأ مجاناً' : 'Get Started Free'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
          <p className="text-sm text-black/40">
            {language === 'ar' ? 'لا حاجة لبطاقة ائتمان' : 'No credit card required'}
          </p>
        </div>
      </section>

      {/* Footer - Black */}
      <footer className="bg-black text-white border-t border-white/10 py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <Brain className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-bold">AYN</span>
            </div>
            <div className="text-white/60">
              © 2024 AYN AI. {language === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                {language === 'ar' ? 'الخصوصية' : 'Privacy'}
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                {language === 'ar' ? 'الشروط' : 'Terms'}
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        prefilledMessage={demoInput}
      />
    </div>
  );
};

export default LandingPage;
