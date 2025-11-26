import { useState } from 'react';
import { Brain, TrendingUp, Target, BarChart3, Zap, Users, ArrowRight, Sparkles, Palette, Cog, FileSpreadsheet, MessageSquare, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AuthModal } from './auth/AuthModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './theme-toggle';

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { t, language } = useLanguage();

  const features = [
    {
      icon: BarChart3,
      title: t('features.marketResearch.title'),
      description: t('features.marketResearch.description')
    },
    {
      icon: Target,
      title: t('features.salesOptimization.title'), 
      description: t('features.salesOptimization.description')
    },
    {
      icon: TrendingUp,
      title: t('features.trendAnalysis.title'),
      description: t('features.trendAnalysis.description')
    },
    {
      icon: Zap,
      title: t('features.strategicPlanning.title'),
      description: t('features.strategicPlanning.description')
    }
  ];


  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg brain-container flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold">AYN</span>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('nav.features')}
              </a>
            <a href="#services" className="text-muted-foreground hover:text-foreground transition-colors">
              {language === 'ar' ? 'خدماتنا' : 'Services'}
            </a>
            </nav>
            
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <ThemeToggle />
              <Button 
                onClick={() => setShowAuthModal(true)}
                variant="white"
              >
                {t('nav.getStarted')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Soft Radial Gradient Background */}
        
        <div className="absolute inset-0 bg-gradient-radial from-primary/8 via-background to-accent/5" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="animate-fade-in-up">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                {t('hero.title')}
                <span className="text-foreground block mt-2">
                  {t('hero.titleHighlight')}
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                {t('hero.description')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  onClick={() => setShowAuthModal(true)}
                  variant="white"
                  size="xl"
                  className="group"
                >
                  {t('hero.cta')}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{t('hero.joinBusiness')}</span>
                </div>
              </div>
            </div>
            
            {/* Floating AYN Agent Preview */}
            <div className="mt-16 animate-float">
              <Card className="bg-card border border-border max-w-md mx-auto p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full brain-container-lg flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">AYN AI Consultant</h3>
                    <p className="text-sm text-muted-foreground">{t('hero.readyToAnalyze')}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  "{t('hero.aiConsultantQuote')}"
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 gradient-text">
              {t('features.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card border border-border glass-hover p-6 text-center group">
                <div className="w-16 h-16 rounded-full brain-container-lg mx-auto mb-4 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <feature.icon className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section - Ultimate Redesign */}
      <section id="services" className="py-32 px-4 relative overflow-hidden">
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-pink-500/5" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.1),transparent_50%)]" />
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)]" />
        </div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          {/* Section Header with Stagger Animation */}
          <div className="text-center mb-24 space-y-6">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 text-primary text-sm font-bold mb-4 animate-pulse backdrop-blur-sm">
              <Sparkles className="w-5 h-5 animate-spin-slow" />
              {language === 'ar' ? 'ما نقدمه بأفضل شكل' : 'What We Do Best'}
            </div>
            
            <h2 className="text-5xl md:text-7xl font-black leading-tight">
              <span className="block bg-gradient-to-r from-foreground via-primary to-purple-600 bg-clip-text text-transparent animate-gradient-x">
                {language === 'ar' ? 'حوّل عملك' : 'Transform Your Business'}
              </span>
              <span className="block text-foreground/70 mt-2">
                {language === 'ar' ? 'بحلول الذكاء الاصطناعي' : 'with AI Solutions'}
              </span>
            </h2>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              {language === 'ar' 
                ? 'لا نبني أدوات فقط—نصنع أنظمة ذكية تنمو مع عملك'
                : "We don't just build tools—we create intelligent systems that grow with your business"}
            </p>
          </div>

          {/* Services Grid - Staggered Layout */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            
            {/* Service 1: Influencer Portfolios - Hero Card (Full Height Left) */}
            <div className="lg:row-span-2 group relative overflow-hidden rounded-[32px] bg-gradient-to-br from-purple-600 via-purple-800 to-black p-[2px] transition-all duration-700 hover:scale-[1.02] hover:shadow-[0_0_80px_rgba(168,85,247,0.5)]">
              {/* Inner card */}
              <div className="relative h-full overflow-hidden rounded-[30px] bg-gradient-to-br from-purple-600 via-purple-900 to-black p-10">
                {/* Animated mesh gradient */}
                <div className="absolute inset-0 opacity-40">
                  <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-400 rounded-full blur-[120px] animate-pulse" />
                  <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-400 rounded-full blur-[120px] animate-pulse animation-delay-700" />
                </div>
                
                {/* Floating particles */}
                <div className="absolute inset-0">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-white rounded-full animate-float"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${5 + Math.random() * 10}s`
                      }}
                    />
                  ))}
                </div>
                
                <div className="relative z-10 h-full flex flex-col text-white">
                  {/* Icon with premium glow */}
                  <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-2xl shadow-purple-500/50 border border-white/20">
                    <Palette className="w-10 h-10 text-white" />
                  </div>
                  
                  <h3 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                    {language === 'ar' ? 'مواقع المؤثرين' : 'Influencer Portfolio Sites'}
                  </h3>
                  
                  <p className="text-xl text-white/90 mb-8 leading-relaxed flex-grow">
                    {language === 'ar'
                      ? 'تميّز عن الآخرين. نصمم مواقع احترافية مذهلة تعرض علامتك التجارية وتحوّل المتابعين إلى عملاء—مع نماذج اتصال مدعومة بالذكاء الاصطناعي'
                      : 'Stand out from the crowd. We craft stunning, personal portfolio websites that showcase your brand and convert followers into clients—complete with AI-powered contact forms'}
                  </p>
                  
                  {/* Features with icons */}
                  <ul className="space-y-4 mb-10 text-lg">
                    <li className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-400/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-200">✓</span>
                      </div>
                      <span>{language === 'ar' ? 'تصميم مخصص يناسب جمالياتك' : 'Custom design that matches your aesthetic'}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-400/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-200">✓</span>
                      </div>
                      <span>{language === 'ar' ? 'روبوت محادثة مدرّب على محتواك' : 'AI chatbot trained on your content'}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-400/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-200">✓</span>
                      </div>
                      <span>{language === 'ar' ? 'تكامل تلقائي مع وسائل التواصل' : 'Automatic social media integration'}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-400/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-200">✓</span>
                      </div>
                      <span>{language === 'ar' ? 'مدعوم بعلامة AYN AI' : 'Powered by AYN AI branding'}</span>
                    </li>
                  </ul>
                  
                  {/* Premium CTA */}
                  <a 
                    href="https://ghazi.today" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group/btn inline-flex items-center gap-3 px-8 py-5 rounded-2xl bg-white text-purple-900 font-bold text-lg hover:bg-purple-50 transition-all shadow-2xl hover:shadow-[0_20px_60px_rgba(255,255,255,0.4)] hover:scale-105"
                  >
                    <span>{language === 'ar' ? 'شاهد المثال الحي' : 'See Live Example'}</span>
                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                  </a>
                </div>
              </div>
            </div>

            {/* Service 2: Custom AI Agents - Top Right */}
            <div className="group relative overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border-2 border-blue-500/30 p-10 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(59,130,246,0.4)] hover:border-blue-400/50">
              {/* Animated orb */}
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-400 rounded-full blur-[100px] opacity-20 animate-pulse" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-xl">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-3xl font-black mb-4">
                  {language === 'ar' ? 'وكلاء ذكاء مخصصون' : 'Custom AI Agents'}
                </h3>
                
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  {language === 'ar'
                    ? 'عملك فريد. ذكاؤك الاصطناعي يجب أن يكون كذلك. نبني وكلاء أذكياء مصممين لسير عملك'
                    : "Your business is unique. Your AI should be too. We build intelligent agents tailored to your workflows"}
                </p>
                
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">✓</span>
                    <span>{language === 'ar' ? 'مدرّب على قاعدة معرفة شركتك' : "Trained on your company's knowledge base"}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">✓</span>
                    <span>{language === 'ar' ? 'يتكامل مع أدواتك الحالية' : 'Integrates with your existing tools'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">✓</span>
                    <span>{language === 'ar' ? 'يتعامل مع الاستفسارات 24/7' : 'Handles customer inquiries 24/7'}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Service 3: Process Automation - Bottom Right */}
            <div className="group relative overflow-hidden rounded-[32px] bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm border-2 border-green-500/30 p-10 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(34,197,94,0.4)] hover:border-green-400/50">
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-green-400 rounded-full blur-[100px] opacity-20 animate-pulse animation-delay-500" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-[360deg] transition-all duration-700 shadow-xl">
                  <Cog className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-3xl font-black mb-4">
                  {language === 'ar' ? 'أتمتة العمليات' : 'Process Automation'}
                </h3>
                
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  {language === 'ar'
                    ? 'توقف عن إضاعة الوقت. نحلل عملياتك ونطبق أتمتة ذكية توفر ساعات كل يوم'
                    : 'Stop wasting time. We analyze your operations and deploy smart automation that saves hours every day'}
                </p>
                
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>{language === 'ar' ? 'ردود بريد إلكتروني تلقائية' : 'Automated email responses'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>{language === 'ar' ? 'معالجة ذكية للمستندات' : 'Smart document processing'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>{language === 'ar' ? 'إدارة التقويم والجدولة' : 'Calendar management'}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* AYN Eng - Premium Full Width Card */}
          <div className="relative overflow-hidden rounded-[40px] p-[3px] bg-gradient-to-r from-orange-500 via-red-500 via-pink-500 to-orange-500 bg-[length:200%_auto] animate-gradient-flow shadow-2xl hover:shadow-[0_0_100px_rgba(249,115,22,0.6)] transition-all duration-500 hover:scale-[1.01]">
            <div className="relative overflow-hidden rounded-[37px] bg-gradient-to-br from-orange-50/95 to-pink-50/95 dark:from-orange-950/95 dark:to-pink-950/95 backdrop-blur-2xl p-16">
              {/* Animated background orbs */}
              <div className="absolute inset-0 opacity-40">
                <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-orange-400 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] bg-pink-400 rounded-full blur-[150px] animate-pulse animation-delay-1000" />
              </div>
              
              <div className="relative z-10 text-center">
                {/* Premium badge */}
                <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white text-base font-black mb-8 shadow-xl animate-bounce-slow">
                  <FileSpreadsheet className="w-6 h-6" />
                  <span>{language === 'ar' ? 'قريباً - تقنية ثورية' : 'COMING SOON - Revolutionary Tech'}</span>
                </div>
                
                <h3 className="text-5xl md:text-6xl font-black mb-8 leading-tight">
                  <span className="bg-gradient-to-r from-orange-600 to-pink-600 dark:from-orange-400 dark:to-pink-400 bg-clip-text text-transparent">
                    {language === 'ar' ? 'AYN Eng: ذكاء الهندسة المدنية' : 'AYN Eng: Civil Engineering AI'}
                  </span>
                </h3>
                
                <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-5xl mx-auto leading-relaxed">
                  {language === 'ar'
                    ? 'ذكاء اصطناعي ثوري للمهندسين المدنيين. حمّل بيانات المسح، واحصل على تحليل قطع/ملء فوري، وملفات DXF جاهزة لـ AutoCAD—كل ذلك في ثوانٍ'
                    : 'Revolutionary AI for civil engineers. Upload survey data, get instant cut/fill analysis, AutoCAD-ready DXF files—all in seconds'}
                </p>
                
                {/* Feature pills with icons */}
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="px-8 py-4 rounded-2xl bg-white/90 dark:bg-black/50 backdrop-blur-sm border-2 border-orange-500/40 font-bold text-lg shadow-xl hover:scale-105 transition-transform">
                    📐 {language === 'ar' ? 'تحليل المنحدرات' : 'Slope Analysis'}
                  </div>
                  <div className="px-8 py-4 rounded-2xl bg-white/90 dark:bg-black/50 backdrop-blur-sm border-2 border-orange-500/40 font-bold text-lg shadow-xl hover:scale-105 transition-transform">
                    📊 {language === 'ar' ? 'حساب الحجم' : 'Volume Calculations'}
                  </div>
                  <div className="px-8 py-4 rounded-2xl bg-white/90 dark:bg-black/50 backdrop-blur-sm border-2 border-orange-500/40 font-bold text-lg shadow-xl hover:scale-105 transition-transform">
                    📁 {language === 'ar' ? 'تصدير DXF' : 'DXF Export'}
                  </div>
                  <div className="px-8 py-4 rounded-2xl bg-white/90 dark:bg-black/50 backdrop-blur-sm border-2 border-orange-500/40 font-bold text-lg shadow-xl hover:scale-105 transition-transform">
                    ✅ {language === 'ar' ? 'توافق GCC' : 'GCC Compliance'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Premium CTA */}
          <div className="text-center mt-20">
            <p className="text-3xl font-bold text-muted-foreground mb-10">
              {language === 'ar' ? 'جاهز لأتمتة عملك والتوسع بشكل أسرع؟' : 'Ready to automate your business and scale faster?'}
            </p>
            <Button 
              size="lg" 
              className="text-xl px-12 py-8 rounded-full shadow-2xl hover:shadow-[0_20px_80px_rgba(168,85,247,0.5)] transition-all hover:scale-110 bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:from-primary/90 hover:via-purple-600/90 hover:to-pink-600/90 border-2 border-white/20"
              onClick={() => setShowAuthModal(true)}
            >
              <Building2 className="w-7 h-7 mr-3" />
              <span>{language === 'ar' ? 'لنبني شيئاً مذهلاً' : "Let's Build Something Amazing"}</span>
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg brain-container flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold">AYN</span>
            </div>
            
            <p className="text-muted-foreground text-center md:text-right">
              {t('footer.copyright')}
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
      />
    </div>
  );
};

export default LandingPage;