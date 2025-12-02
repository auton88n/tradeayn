import { useState } from 'react';
import { Brain, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthModal } from './auth/AuthModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './theme-toggle';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { t, language } = useLanguage();

  // ScrollReveal component for smooth scroll animations
  const ScrollReveal = ({ children, direction = 'up', delay = 0 }: {
    children: React.ReactNode;
    direction?: 'up' | 'left' | 'right' | 'scale';
    delay?: number;
  }) => {
    const [ref, isVisible] = useScrollAnimation();
    return (
      <div 
        ref={ref as React.RefObject<HTMLDivElement>}
        className={cn(
          'scroll-animate',
          direction === 'left' && 'scroll-animate-left',
          direction === 'right' && 'scroll-animate-right',
          direction === 'scale' && 'scroll-animate-scale',
          isVisible && 'visible'
        )}
        style={{ transitionDelay: `${delay}s` }}
      >
        {children}
      </div>
    );
  };

  const services = [
    {
      number: '01',
      title: language === 'ar' ? 'مواقع المؤثرين المميزة' : 'Premium Influencer Sites',
      description: language === 'ar' 
        ? 'مواقع ويب فاخرة مصممة خصيصاً لبناء علامتك التجارية الشخصية وجذب فرص التعاون.'
        : 'Luxury websites custom-built to showcase your personal brand and attract collaboration opportunities.',
      features: language === 'ar' 
        ? ['تصميم فاخر حسب الطلب', 'محفظة أعمال تفاعلية', 'محسّن لتحويل العملاء']
        : ['Custom luxury design', 'Interactive portfolio', 'Conversion optimized']
    },
    {
      number: '02',
      title: language === 'ar' ? 'وكلاء الذكاء الاصطناعي المخصصون' : 'Custom AI Agents',
      description: language === 'ar'
        ? 'مساعدون أذكياء يعملون 24/7 مدربون على بيانات عملك لأتمتة دعم العملاء والعمليات.'
        : '24/7 intelligent assistants trained on your business data to automate customer support and operations.',
      features: language === 'ar'
        ? ['فهم اللغة الطبيعية', 'تكامل مع الأنظمة الموجودة', 'تعلّم مستمر']
        : ['Natural language understanding', 'Integrates with existing systems', 'Continuous learning']
    },
    {
      number: '03',
      title: language === 'ar' ? 'أتمتة العمليات' : 'Process Automation',
      description: language === 'ar'
        ? 'توفير 15+ ساعة أسبوعياً من خلال أتمتة المهام المتكررة والربط بين أنظمتك التجارية.'
        : 'Save 15+ hours per week by automating repetitive tasks and connecting your business systems.',
      features: language === 'ar'
        ? ['سير عمل مخصص', 'لا حاجة لكتابة الكود', 'توفير فوري للوقت']
        : ['Custom workflows', 'No-code setup', 'Instant time savings']
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Floating Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
        <div className="flex items-center gap-8 px-6 py-3 bg-card/80 dark:bg-card/80 backdrop-blur-xl border border-border rounded-full shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
              <Brain className="w-5 h-5 text-background" />
            </div>
            <span className="text-xl font-bold tracking-tight">AYN</span>
          </div>
          
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button 
              onClick={() => setShowAuthModal(true)}
              size="sm"
              className="rounded-full"
            >
              {t('nav.getStarted')}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Editorial Masterpiece */}
      <section className="min-h-screen flex flex-col justify-center items-center px-6 relative overflow-hidden">
        {/* Subtle noise texture */}
        <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
        
        {/* Main headline with staggered animation */}
        <ScrollReveal>
          <h1 className="text-display text-[clamp(3rem,12vw,8rem)] font-serif font-bold text-center leading-[0.9] mb-12">
            <span className="block opacity-0 animate-[fade-in_0.8s_ease-out_0.2s_forwards]">
              {language === 'ar' ? 'الذكاء' : 'Intelligence'}
            </span>
            <span className="block opacity-0 animate-[fade-in_0.8s_ease-out_0.5s_forwards]">
              {language === 'ar' ? 'يلتقي' : 'Meets'}
            </span>
            <span className="block opacity-0 animate-[fade-in_0.8s_ease-out_0.8s_forwards]">
              {language === 'ar' ? 'الأعمال' : 'Business'}
            </span>
          </h1>
        </ScrollReveal>
        
        {/* Minimal subtitle */}
        <ScrollReveal delay={1}>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-xl text-center mb-12 leading-relaxed">
            {language === 'ar' 
              ? 'استشارات الذكاء الاصطناعي التي تحوّل طريقة عملك'
              : 'AI consulting that transforms how you work'}
          </p>
        </ScrollReveal>
        
        {/* Single elegant CTA */}
        <ScrollReveal delay={1.2}>
          <Button 
            onClick={() => setShowAuthModal(true)}
            size="lg"
            className="h-14 px-10 text-lg rounded-full group hover-lift"
          >
            {language === 'ar' ? 'ابدأ مجاناً' : 'Start Free'}
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </ScrollReveal>

        {/* Floating brain icon */}
        <ScrollReveal delay={1.5}>
          <div className="absolute bottom-32 animate-float">
            <div className="w-16 h-16 rounded-full bg-foreground/5 border border-border flex items-center justify-center">
              <Brain className="w-8 h-8 text-foreground/60" />
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Services Section - Magazine Editorial Layout */}
      <section id="services" className="py-32 px-6">
        <div className="container mx-auto max-w-6xl">
          {/* Section header */}
          <ScrollReveal>
            <div className="text-center mb-24">
              <span className="text-sm font-mono text-muted-foreground tracking-wider uppercase mb-4 block">
                {language === 'ar' ? 'ما نفعله بشكل أفضل' : 'What We Do Best'}
              </span>
              <h2 className="text-5xl md:text-6xl font-serif font-bold mb-6">
                {language === 'ar' ? 'خدماتنا' : 'Our Services'}
              </h2>
            </div>
          </ScrollReveal>

          {/* Service cards - Floating, borderless */}
          <div className="space-y-32">
            {services.map((service, index) => (
              <ScrollReveal key={index} delay={index * 0.2}>
                <div className="group">
                  <div className={cn(
                    "grid md:grid-cols-2 gap-12 items-center",
                    index % 2 === 1 && "md:grid-flow-dense"
                  )}>
                    {/* Text content */}
                    <div className={cn(
                      "space-y-6",
                      index % 2 === 1 && "md:col-start-2"
                    )}>
                      <span className="text-sm font-mono text-muted-foreground">{service.number}</span>
                      <h3 className="text-4xl md:text-5xl font-bold leading-tight">{service.title}</h3>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        {service.description}
                      </p>
                      
                      {/* Features list */}
                      <ul className="space-y-3 pt-4">
                        {service.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-foreground flex-shrink-0" />
                            <span className="text-foreground/80">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="pt-6">
                        <Button 
                          onClick={() => setShowAuthModal(true)}
                          variant="outline"
                          className="group/btn"
                        >
                          {language === 'ar' ? 'اعرف المزيد' : 'Learn More'}
                          <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>

                    {/* Visual placeholder */}
                    <div className={cn(
                      "aspect-square rounded-3xl bg-muted/50 border border-border hover-glow transition-all duration-500",
                      index % 2 === 1 && "md:col-start-1 md:row-start-1"
                    )}>
                      <div className="w-full h-full flex items-center justify-center">
                        <Brain className="w-16 h-16 text-muted-foreground/30" />
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-24 border-t border-border">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
            {/* Logo & tagline */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                  <Brain className="w-5 h-5 text-background" />
                </div>
                <span className="text-2xl font-bold">AYN</span>
              </div>
              <p className="text-muted-foreground">
                {language === 'ar' ? 'الذكاء يلتقي الأعمال' : 'Intelligence meets business'}
              </p>
            </div>
            
            {/* Minimal links */}
            <nav className="flex gap-8 text-sm">
              <a href="#services" className="text-muted-foreground hover:text-foreground transition-colors">
                {language === 'ar' ? 'الخدمات' : 'Services'}
              </a>
              <a href="#" onClick={() => setShowAuthModal(true)} className="text-muted-foreground hover:text-foreground transition-colors">
                {language === 'ar' ? 'تواصل' : 'Contact'}
              </a>
            </nav>
          </div>
          
          <div className="pt-8 border-t border-border text-sm text-muted-foreground">
            © 2024 AYN. {language === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
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
