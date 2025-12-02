import { useState, useRef, useEffect } from 'react';
import { Brain, ArrowRight, CheckCircle, Send, Loader2, Sparkles, Globe, Shield, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AuthModal } from './auth/AuthModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './theme-toggle';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { TypewriterText } from './TypewriterText';
import { ConversationExamples } from './ConversationExamples';
import { Hero } from './Hero';
import { z } from 'zod';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';
const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [demoMessage, setDemoMessage] = useState('');
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const {
    t,
    language
  } = useLanguage();
  const {
    toast
  } = useToast();

  // Hover handlers with collapse delay
  const handleMouseEnter = () => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    setIsMenuExpanded(true);
  };
  const handleMouseLeave = () => {
    collapseTimeoutRef.current = setTimeout(() => {
      setIsMenuExpanded(false);
    }, 150);
  };

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuExpanded(false);
    }
  };

  // Auto-collapse on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100 && isMenuExpanded) {
        setIsMenuExpanded(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMenuExpanded]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Contact form validation schema
  const contactSchema = z.object({
    name: z.string().trim().min(1, {
      message: language === 'ar' ? 'الاسم مطلوب' : 'Name is required'
    }).max(100, {
      message: language === 'ar' ? 'الاسم يجب أن يكون أقل من 100 حرف' : 'Name must be less than 100 characters'
    }),
    email: z.string().trim().email({
      message: language === 'ar' ? 'البريد الإلكتروني غير صالح' : 'Invalid email address'
    }).max(255, {
      message: language === 'ar' ? 'البريد الإلكتروني يجب أن يكون أقل من 255 حرف' : 'Email must be less than 255 characters'
    }),
    message: z.string().trim().min(1, {
      message: language === 'ar' ? 'الرسالة مطلوبة' : 'Message is required'
    }).max(1000, {
      message: language === 'ar' ? 'الرسالة يجب أن تكون أقل من 1000 حرف' : 'Message must be less than 1000 characters'
    })
  });

  // Handle contact form submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactErrors({});

    // Validate form
    try {
      contactSchema.parse(contactForm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setContactErrors(errors);
        return;
      }
    }
    setIsSubmitting(true);

    // Simulate form submission (replace with actual API call)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSubmitted(true);
      setContactForm({
        name: '',
        email: '',
        message: ''
      });
      toast({
        title: language === 'ar' ? 'تم الإرسال بنجاح' : 'Message Sent',
        description: language === 'ar' ? 'سنتواصل معك قريباً' : "We'll get back to you soon"
      });

      // Reset submitted state after 3 seconds
      setTimeout(() => setIsSubmitted(false), 3000);
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حدث خطأ. يرجى المحاولة مرة أخرى' : 'Something went wrong. Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ScrollReveal component for smooth scroll animations
  const ScrollReveal = ({
    children,
    direction = 'up',
    delay = 0
  }: {
    children: React.ReactNode;
    direction?: 'up' | 'left' | 'right' | 'scale';
    delay?: number;
  }) => {
    const [ref, isVisible] = useScrollAnimation();
    return <div ref={ref as React.RefObject<HTMLDivElement>} className={cn('scroll-animate', direction === 'left' && 'scroll-animate-left', direction === 'right' && 'scroll-animate-right', direction === 'scale' && 'scroll-animate-scale', isVisible && 'visible')} style={{
      transitionDelay: `${delay}s`
    }}>
        {children}
      </div>;
  };
  const services = [{
    number: '01',
    title: language === 'ar' ? 'مواقع المؤثرين المميزة' : 'Premium Influencer Sites',
    description: language === 'ar' ? 'مواقع ويب فاخرة مصممة خصيصاً لبناء علامتك التجارية الشخصية وجذب فرص التعاون.' : 'Luxury websites custom-built to showcase your personal brand and attract collaboration opportunities.',
    features: language === 'ar' ? ['تصميم فاخر حسب الطلب', 'محفظة أعمال تفاعلية', 'محسّن لتحويل العملاء'] : ['Custom luxury design', 'Interactive portfolio', 'Conversion optimized']
  }, {
    number: '02',
    title: language === 'ar' ? 'وكلاء الذكاء الاصطناعي المخصصون' : 'Custom AI Agents',
    description: language === 'ar' ? 'مساعدون أذكياء يعملون 24/7 مدربون على بيانات عملك لأتمتة دعم العملاء والعمليات.' : '24/7 intelligent assistants trained on your business data to automate customer support and operations.',
    features: language === 'ar' ? ['فهم اللغة الطبيعية', 'تكامل مع الأنظمة الموجودة', 'تعلّم مستمر'] : ['Natural language understanding', 'Integrates with existing systems', 'Continuous learning']
  }, {
    number: '03',
    title: language === 'ar' ? 'أتمتة العمليات' : 'Process Automation',
    description: language === 'ar' ? 'توفير 15+ ساعة أسبوعياً من خلال أتمتة المهام المتكررة والربط بين أنظمتك التجارية.' : 'Save 15+ hours per week by automating repetitive tasks and connecting your business systems.',
    features: language === 'ar' ? ['سير عمل مخصص', 'لا حاجة لكتابة الكود', 'توفير فوري للوقت'] : ['Custom workflows', 'No-code setup', 'Instant time savings']
  }];
  return <div className="min-h-screen bg-background">
      {/* Expandable Logo Navigation */}
      <nav className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
        <motion.div ref={menuRef} layout onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="flex items-center bg-card/80 dark:bg-card/80 backdrop-blur-xl border border-border rounded-full shadow-2xl overflow-hidden cursor-pointer" transition={{
        type: "spring",
        stiffness: 400,
        damping: 30
      }}>
          {/* Logo - Always visible */}
          <motion.div layout className="flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3">
            <motion.div layout className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-foreground flex items-center justify-center">
              <Brain className="w-4 h-4 md:w-5 md:h-5 text-background" />
            </motion.div>
            <motion.span layout className="text-lg md:text-xl font-bold tracking-tight">AYN</motion.span>
          </motion.div>
          
          {/* Expandable Menu Items */}
          <AnimatePresence mode="popLayout">
            {isMenuExpanded && <motion.div initial={{
            width: 0,
            opacity: 0
          }} animate={{
            width: 'auto',
            opacity: 1
          }} exit={{
            width: 0,
            opacity: 0
          }} transition={{
            type: "spring",
            stiffness: 400,
            damping: 30
          }} className="flex items-center gap-2 md:gap-3 overflow-hidden">
                {/* About Link */}
                <motion.button
                  onClick={() => scrollToSection('about')}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ delay: 0.05 }}
                  className="text-sm font-medium hover:text-foreground/80 transition-colors px-2"
                >
                  {language === 'ar' ? 'عن AYN' : 'About'}
                </motion.button>
                
                {/* Services Link */}
                <motion.button
                  onClick={() => scrollToSection('services')}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm font-medium hover:text-foreground/80 transition-colors px-2"
                >
                  {language === 'ar' ? 'خدماتنا' : 'Services'}
                </motion.button>
                
                {/* Separator */}
                <div className="w-px h-5 bg-border mx-1" />
                
                <motion.div initial={{
              x: -20,
              opacity: 0
            }} animate={{
              x: 0,
              opacity: 1
            }} exit={{
              x: -20,
              opacity: 0
            }} transition={{
              delay: 0.15
            }}>
                  <LanguageSwitcher />
                </motion.div>
                <motion.div initial={{
              x: -20,
              opacity: 0
            }} animate={{
              x: 0,
              opacity: 1
            }} exit={{
              x: -20,
              opacity: 0
            }} transition={{
              delay: 0.2
            }}>
                  <ThemeToggle />
                </motion.div>
                <motion.div initial={{
              x: -20,
              opacity: 0
            }} animate={{
              x: 0,
              opacity: 1
            }} exit={{
              x: -20,
              opacity: 0
            }} transition={{
              delay: 0.25
            }} className="pr-3 md:pr-4">
                  <Button onClick={() => {
                setIsMenuExpanded(false);
                setShowAuthModal(true);
              }} size="sm" className="rounded-full">
                    {t('nav.getStarted')}
                  </Button>
                </motion.div>
              </motion.div>}
          </AnimatePresence>
        </motion.div>
      </nav>

      {/* Mobile Sheet Navigation (fallback for small screens) */}
      <div className="fixed top-4 right-4 z-50 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[320px]">
            <div className="flex flex-col gap-6 pt-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
                  <Brain className="w-6 h-6 text-background" />
                </div>
                <span className="text-2xl font-bold">AYN</span>
              </div>
              
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => scrollToSection('about')}
                  className="text-left py-2 text-sm font-medium hover:text-foreground/80 transition-colors"
                >
                  {language === 'ar' ? 'عن AYN' : 'About'}
                </button>
                <button
                  onClick={() => scrollToSection('services')}
                  className="text-left py-2 text-sm font-medium hover:text-foreground/80 transition-colors"
                >
                  {language === 'ar' ? 'خدماتنا' : 'Services'}
                </button>
                
                <div className="h-px bg-border my-2" />
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{language === 'ar' ? 'اللغة' : 'Language'}</span>
                  <LanguageSwitcher />
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{language === 'ar' ? 'المظهر' : 'Theme'}</span>
                  <ThemeToggle />
                </div>
                
                <Button onClick={() => setShowAuthModal(true)} className="w-full rounded-xl">
                  {t('nav.getStarted')}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Hero Section - Premium AI Eye Experience */}
      <Hero onGetStarted={() => setShowAuthModal(true)} onDemoMessage={msg => setDemoMessage(msg)} />

      {/* About AYN - Value Proposition Section */}
      <section id="about" className="py-16 md:py-32 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl text-center">
          <ScrollReveal>
            <span className="text-sm font-mono text-muted-foreground tracking-wider uppercase mb-4 block">
              {language === 'ar' ? 'عن AYN' : 'About AYN'}
            </span>

            <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold mb-4 md:mb-6">
              {language === 'ar' ? 'ذكاء اصطناعي يفهمك حقاً' : 'AI That Actually Understands You'}
            </h2>

            <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 md:mb-16">
              {language === 'ar' ? 'مصمم للشرق الأوسط، يجمع AYN بين أحدث تقنيات الذكاء الاصطناعي وفهم عميق لاحتياجات الأعمال الإقليمية. نتحدث لغتك - حرفياً ومجازياً.' : 'Built for the Middle East, AYN combines cutting-edge AI with deep understanding of regional business needs. We speak your language—literally and figuratively.'}
            </p>
          </ScrollReveal>

          {/* 3 Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <ScrollReveal delay={0.1}>
              <div className="text-center space-y-3 md:space-y-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-muted/50 mx-auto flex items-center justify-center">
                  <Brain className="w-7 h-7 md:w-8 md:h-8 text-foreground" />
                </div>
                <h3 className="text-lg md:text-xl font-bold">
                  {language === 'ar' ? 'ذكاء سياقي' : 'Contextual Intelligence'}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {language === 'ar' ? 'يفهم صناعتك ونموذج عملك وتحدياتك المحددة' : 'Understands your industry, business model, and specific challenges'}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="text-center space-y-3 md:space-y-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-muted/50 mx-auto flex items-center justify-center">
                  <Globe className="w-7 h-7 md:w-8 md:h-8 text-foreground" />
                </div>
                <h3 className="text-lg md:text-xl font-bold">
                  {language === 'ar' ? 'ثنائي اللغة بالتصميم' : 'Bilingual by Design'}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {language === 'ar' ? 'انتقل بسلاسة بين العربية والإنجليزية مع فهم أصيل' : 'Seamlessly switch between Arabic and English with native understanding'}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <div className="text-center space-y-3 md:space-y-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-muted/50 mx-auto flex items-center justify-center">
                  <Shield className="w-7 h-7 md:w-8 md:h-8 text-foreground" />
                </div>
                <h3 className="text-lg md:text-xl font-bold">
                  {language === 'ar' ? 'أمان المؤسسات' : 'Enterprise Security'}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {language === 'ar' ? 'تشفير بمستوى البنوك مع خصوصية كاملة للبيانات والامتثال' : 'Bank-level encryption with complete data privacy and compliance'}
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Services Section - Magazine Editorial Layout */}
      <section id="services" className="py-16 md:py-32 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          {/* Section header */}
          <ScrollReveal>
            <div className="text-center mb-12 md:mb-24">
              <span className="text-sm font-mono text-muted-foreground tracking-wider uppercase mb-4 block">
                {language === 'ar' ? 'ما نفعله بشكل أفضل' : 'What We Do Best'}
              </span>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold mb-4 md:mb-6">
                {language === 'ar' ? 'خدماتنا' : 'Our Services'}
              </h2>
            </div>
          </ScrollReveal>

          {/* Service cards - Floating, borderless */}
          <div className="space-y-16 md:space-y-32">
            {services.map((service, index) => <ScrollReveal key={index} delay={index * 0.2}>
                <div className="group">
                  <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center", index % 2 === 1 && "md:grid-flow-dense")}>
                    {/* Text content */}
                    <div className={cn("space-y-4 md:space-y-6", index % 2 === 1 && "md:col-start-2")}>
                      <span className="text-sm font-mono text-muted-foreground">{service.number}</span>
                      <h3 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight">{service.title}</h3>
                      <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                        {service.description}
                      </p>
                      
                      {/* Features list */}
                      <ul className="space-y-2 md:space-y-3 pt-2 md:pt-4">
                        {service.features.map((feature, i) => <li key={i} className="flex items-center gap-2 md:gap-3">
                            <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-foreground flex-shrink-0" />
                            <span className="text-sm md:text-base text-foreground/80">{feature}</span>
                          </li>)}
                      </ul>

                      <div className="pt-4 md:pt-6">
                        <Button onClick={() => setShowAuthModal(true)} variant="outline" className="group/btn">
                          {language === 'ar' ? 'اعرف المزيد' : 'Learn More'}
                          <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>

                    {/* Visual placeholder */}
                    <div className={cn("aspect-square rounded-2xl md:rounded-3xl bg-muted/50 border border-border hover-glow transition-all duration-500", index % 2 === 1 && "md:col-start-1 md:row-start-1")}>
                      <div className="w-full h-full flex items-center justify-center">
                        <Brain className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground/30" />
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>)}
          </div>
        </div>
      </section>

      {/* Premium Contact Section */}
      <section id="contact" className="py-16 md:py-32 px-4 md:px-6">
        <div className="container mx-auto max-w-3xl">
          <ScrollReveal>
            <div className="text-center mb-10 md:mb-16">
              <span className="text-sm font-mono text-muted-foreground tracking-wider uppercase mb-4 block">
                {language === 'ar' ? 'تواصل معنا' : 'Get In Touch'}
              </span>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold mb-4 md:mb-6">
                {language === 'ar' ? 'لنبدأ المحادثة' : "Let's Start a Conversation"}
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
                {language === 'ar' ? 'أخبرنا عن مشروعك وسنساعدك في تحويل رؤيتك إلى واقع' : "Tell us about your project and we'll help transform your vision into reality"}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            {isSubmitted ?
          // Success state
          <div className="text-center py-20 animate-scale-fade-in">
                <div className="w-16 h-16 rounded-full bg-foreground mx-auto mb-6 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-background" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  {language === 'ar' ? 'شكراً لتواصلك!' : 'Thank You!'}
                </h3>
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'سنتواصل معك خلال 24 ساعة' : "We'll be in touch within 24 hours"}
                </p>
              </div> :
          // Contact form
          <form onSubmit={handleContactSubmit} className="space-y-6">
                {/* Name input */}
                <div className="space-y-2 group">
                  <label htmlFor="name" className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                    {language === 'ar' ? 'الاسم' : 'Name'}
                  </label>
                  <Input id="name" type="text" value={contactForm.name} onChange={e => setContactForm({
                ...contactForm,
                name: e.target.value
              })} placeholder={language === 'ar' ? 'اسمك الكامل' : 'Your full name'} className={cn("h-14 bg-transparent border-2 border-border rounded-none text-base transition-all duration-300", "focus:border-foreground focus:ring-0", "group-hover:border-muted-foreground", contactErrors.name && "border-destructive")} disabled={isSubmitting} />
                  {contactErrors.name && <p className="text-sm text-destructive animate-slide-down-fade">{contactErrors.name}</p>}
                </div>

                {/* Email input */}
                <div className="space-y-2 group">
                  <label htmlFor="email" className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <Input id="email" type="email" value={contactForm.email} onChange={e => setContactForm({
                ...contactForm,
                email: e.target.value
              })} placeholder={language === 'ar' ? 'بريدك الإلكتروني' : 'your@email.com'} className={cn("h-14 bg-transparent border-2 border-border rounded-none text-base transition-all duration-300", "focus:border-foreground focus:ring-0", "group-hover:border-muted-foreground", contactErrors.email && "border-destructive")} disabled={isSubmitting} />
                  {contactErrors.email && <p className="text-sm text-destructive animate-slide-down-fade">{contactErrors.email}</p>}
                </div>

                {/* Message textarea */}
                <div className="space-y-2 group">
                  <label htmlFor="message" className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                    {language === 'ar' ? 'الرسالة' : 'Message'}
                  </label>
                  <Textarea id="message" value={contactForm.message} onChange={e => setContactForm({
                ...contactForm,
                message: e.target.value
              })} placeholder={language === 'ar' ? 'أخبرنا عن مشروعك...' : 'Tell us about your project...'} rows={6} className={cn("bg-transparent border-2 border-border rounded-none text-base transition-all duration-300 resize-none", "focus:border-foreground focus:ring-0", "group-hover:border-muted-foreground", contactErrors.message && "border-destructive")} disabled={isSubmitting} />
                  {contactErrors.message && <p className="text-sm text-destructive animate-slide-down-fade">{contactErrors.message}</p>}
                </div>

                {/* Submit button */}
                <Button type="submit" size="lg" disabled={isSubmitting} className={cn("w-full h-14 rounded-none font-mono uppercase tracking-wider transition-all duration-300", "hover:shadow-2xl")}>
                  {isSubmitting ? <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {language === 'ar' ? 'جاري الإرسال...' : 'Sending...'}
                    </> : <>
                      {language === 'ar' ? 'إرسال الرسالة' : 'Send Message'}
                      <Send className="ml-2 h-5 w-5" />
                    </>}
                </Button>
              </form>}
          </ScrollReveal>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-6 border-t border-border">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
              <Brain className="w-5 h-5 text-background" />
            </div>
            <span className="text-2xl font-bold">AYN</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>;
};
export default LandingPage;