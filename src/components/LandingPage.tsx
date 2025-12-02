import { useState } from 'react';
import { Brain, ArrowRight, Sparkles, MessageSquare, Calendar, TrendingUp, Zap, BarChart, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AuthModal } from './auth/AuthModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './theme-toggle';

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Navigation Header - Glass Effect */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-background/40 border-b border-border/30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                AYN
              </span>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {language === 'ar' ? 'الميزات' : 'Features'}
              </a>
              <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {language === 'ar' ? 'الأسعار' : 'Pricing'}
              </a>
              <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {language === 'ar' ? 'اتصل بنا' : 'Contact'}
              </a>
            </nav>
            
            {/* Actions */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <ThemeToggle />
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setShowAuthModal(true)}
                className="hidden md:inline-flex"
              >
                {language === 'ar' ? 'تسجيل الدخول' : 'Log in'}
              </Button>
              <Button 
                onClick={() => setShowAuthModal(true)}
                size="sm"
                className="bg-foreground text-background hover:bg-foreground/90"
              >
                {t('nav.getStarted')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Floating Cards */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-6">
        {/* Floating Glass Cards */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Chat Preview Card - Top Left */}
          <Card className="absolute top-[15%] left-[8%] w-80 glass backdrop-blur-xl bg-card/60 border-border/30 shadow-2xl transform hover:scale-105 transition-all duration-500 animate-float pointer-events-auto hidden lg:block">
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{language === 'ar' ? 'محادثة AI' : 'AI Chat'}</div>
                  <div className="text-xs text-muted-foreground">{language === 'ar' ? 'الآن' : 'Now'}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="bg-muted/50 rounded-lg p-3 text-xs">
                  {language === 'ar' ? 'كيف يمكنني زيادة إيراداتي؟' : 'How can I increase my revenue?'}
                </div>
                <div className="bg-primary/10 rounded-lg p-3 text-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-3 h-3" />
                    <span className="font-medium">AYN</span>
                  </div>
                  {language === 'ar' ? 'دعني أحلل عملك...' : 'Let me analyze your business...'}
                </div>
              </div>
            </div>
          </Card>

          {/* Analytics Card - Top Right */}
          <Card className="absolute top-[20%] right-[10%] w-72 glass backdrop-blur-xl bg-card/60 border-border/30 shadow-2xl transform hover:scale-105 transition-all duration-500 animate-float pointer-events-auto hidden xl:block" style={{ animationDelay: '1s' }}>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold">{language === 'ar' ? 'النمو' : 'Growth'}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{language === 'ar' ? 'الإيرادات' : 'Revenue'}</span>
                  <span className="font-bold text-green-600">+42%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-[42%] bg-gradient-to-r from-green-500 to-teal-500 rounded-full" />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{language === 'ar' ? 'التحويلات' : 'Conversions'}</span>
                  <span className="font-bold text-blue-600">+28%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-[28%] bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                </div>
              </div>
            </div>
          </Card>

          {/* Calendar Card - Bottom Left */}
          <Card className="absolute bottom-[20%] left-[12%] w-64 glass backdrop-blur-xl bg-card/60 border-border/30 shadow-2xl transform hover:scale-105 transition-all duration-500 animate-float pointer-events-auto hidden lg:block" style={{ animationDelay: '0.5s' }}>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-semibold">{language === 'ar' ? 'اليوم' : 'Today'}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>9:00 AM - Team Meeting</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>2:00 PM - Client Call</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>4:30 PM - Strategy Review</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Feature Pill - Bottom Right */}
          <Card className="absolute bottom-[25%] right-[15%] glass backdrop-blur-xl bg-card/60 border-border/30 shadow-2xl transform hover:scale-105 transition-all duration-500 animate-float pointer-events-auto hidden xl:block" style={{ animationDelay: '1.5s' }}>
            <div className="px-5 py-3 flex items-center gap-3">
              <Zap className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-xs font-semibold">{language === 'ar' ? 'توليد تلقائي' : 'Auto-generate'}</div>
                <div className="text-xs text-muted-foreground">{language === 'ar' ? 'تقرير ربع سنوي' : 'Quarterly report'}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground ml-2" />
            </div>
          </Card>

          {/* Stats Card - Bottom Center */}
          <Card className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-56 glass backdrop-blur-xl bg-card/60 border-border/30 shadow-2xl transform hover:scale-105 transition-all duration-500 animate-float pointer-events-auto hidden md:block" style={{ animationDelay: '0.75s' }}>
            <div className="p-4 text-center">
              <BarChart className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
              <div className="text-2xl font-bold mb-1">10,000+</div>
              <div className="text-xs text-muted-foreground">{language === 'ar' ? 'الشركات تستخدم AYN' : 'Businesses using AYN'}</div>
            </div>
          </Card>
        </div>

        {/* Main Hero Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass backdrop-blur-xl bg-card/40 border-border/30 text-sm font-medium mb-8 shadow-lg">
              <Sparkles className="w-4 h-4 text-primary" />
              {language === 'ar' ? 'قوة خارقة لعملك' : 'Superpowers for your business'}
            </div>

            {/* Headline */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                {language === 'ar' ? 'حوّل عملك' : 'Transform your'}
              </span>
              <br />
              <span className="bg-gradient-to-r from-foreground/70 via-foreground/60 to-foreground/50 bg-clip-text text-transparent">
                {language === 'ar' ? 'بالذكاء الاصطناعي' : 'business with AI'}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              {language === 'ar' 
                ? 'استشاري AI يساعدك على اتخاذ قرارات أفضل وتنمية عملك بشكل أسرع'
                : 'AI consultant that helps you make better decisions and grow your business faster'}
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={() => setShowAuthModal(true)}
                size="xl"
                className="group bg-foreground text-background hover:bg-foreground/90 shadow-2xl hover:shadow-3xl transition-all duration-300"
              >
                {t('nav.getStarted')}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Trust Badge */}
            <div className="mt-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-background" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 border-2 border-background" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 border-2 border-background" />
              </div>
              <span>{language === 'ar' ? 'انضم إلى آلاف الشركات' : 'Join thousands of businesses'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
      />
    </div>
  );
};

export default LandingPage;
