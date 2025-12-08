import { useState, useRef, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Brain, ArrowRight, CheckCircle, Send, Loader2, Sparkles, Globe, Shield, Menu, ChevronDown } from 'lucide-react';
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
import { Hero } from './Hero';
import { z } from 'zod';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import MobileMockup from './services/MobileMockup';
import DeviceMockups from './services/DeviceMockups';
import FloatingIcons from './services/FloatingIcons';

// ScrollReveal component - defined outside to prevent recreation on re-renders
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

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string>('');
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
    // Don't collapse if a dropdown is open
    if (isDropdownOpen) return;
    collapseTimeoutRef.current = setTimeout(() => {
      setIsMenuExpanded(false);
    }, 300);
  };

  // Handle dropdown open state to prevent menu collapse
  const handleDropdownOpenChange = (open: boolean) => {
    setIsDropdownOpen(open);
    if (open && collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
  };

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth'
      });
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

  // Contact form validation schema - memoized to prevent recreation on re-renders
  const contactSchema = useMemo(() => z.object({
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
  }), [language]);

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

    try {
      // Save to database
      const { error: dbError } = await supabase
        .from('contact_messages')
        .insert({
          name: contactForm.name.trim(),
          email: contactForm.email.trim(),
          message: contactForm.message.trim()
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save message');
      }

      // Send email notification
      const { error: emailError } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: contactForm.name.trim(),
          email: contactForm.email.trim(),
          message: contactForm.message.trim()
        }
      });

      if (emailError) {
        console.error('Email error:', emailError);
        // Don't throw - message was saved, just email failed
      }

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
      console.error('Contact form error:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حدث خطأ. يرجى المحاولة مرة أخرى' : 'Something went wrong. Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const services = [{
    number: '01',
    slug: 'content-creator-sites',
    title: language === 'ar' ? 'مواقع لصناع المحتوى' : language === 'fr' ? 'Sites Premium pour Créateurs' : 'Premium Content Creator Sites',
    description: language === 'ar' ? 'موقع احترافي يعكس هويتك ويجذب فرص التعاون.' : language === 'fr' ? 'Sites web de luxe conçus pour mettre en valeur votre marque personnelle.' : 'Luxury websites custom-built to showcase your personal brand.',
    mockup: <MobileMockup />
  }, {
    number: '02',
    slug: 'ai-agents',
    title: language === 'ar' ? 'مساعد ذكي لعملك' : language === 'fr' ? 'Agents IA Personnalisés' : 'Custom AI Agents',
    description: language === 'ar' ? 'مساعد ذكي يعمل ٢٤ ساعة لخدمة عملائك.' : language === 'fr' ? 'Assistants intelligents 24/7 formés sur votre entreprise.' : '24/7 intelligent assistants trained on your business.',
    mockup: <DeviceMockups />
  }, {
    number: '03',
    slug: 'automation',
    title: language === 'ar' ? 'أتمتة العمليات' : language === 'fr' ? 'Automatisation des Processus' : 'Process Automation',
    description: language === 'ar' ? 'أتمتة المهام المتكررة لتوفير الوقت والجهد.' : language === 'fr' ? 'Automatisez les flux de travail pour gagner du temps.' : 'Automate workflows to save time and reduce errors in any business.',
    mockup: <FloatingIcons />
  }];
  return <div className="min-h-screen bg-background scroll-smooth">
      {/* Vertical Dropdown Navigation */}
      <nav className="fixed top-4 md:top-6 left-4 md:left-6 z-50 animate-fade-in">
        <div className="relative">
          {/* Logo Pill - Always visible, acts as trigger */}
          <motion.div ref={menuRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="flex items-center gap-2 px-3 py-2.5 bg-card/80 backdrop-blur-xl border border-border rounded-full shadow-2xl cursor-pointer">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-foreground flex items-center justify-center">
              <Brain className="w-4 h-4 md:w-5 md:h-5 text-background" />
            </div>
            <AnimatePresence mode="popLayout">
              {isMenuExpanded && <motion.span initial={{
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
            }} className="text-lg md:text-xl font-bold tracking-tight overflow-hidden whitespace-nowrap">
                  AYN
                </motion.span>}
            </AnimatePresence>
            <motion.div animate={{
            rotate: isMenuExpanded ? 180 : 0
          }} transition={{
            type: "spring",
            stiffness: 400,
            damping: 30
          }}>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </motion.div>

          {/* Dropdown Panel */}
          <AnimatePresence>
            {isMenuExpanded && <motion.div initial={{
            opacity: 0,
            y: -10,
            scale: 0.95
          }} animate={{
            opacity: 1,
            y: 0,
            scale: 1
          }} exit={{
            opacity: 0,
            y: -10,
            scale: 0.95
          }} transition={{
            type: "spring",
            stiffness: 400,
            damping: 25
          }} className="absolute top-full left-0 mt-2 min-w-[200px] bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                {/* Navigation Links */}
                <div className="p-2">
                  <motion.button initial={{
                x: -20,
                opacity: 0
              }} animate={{
                x: 0,
                opacity: 1
              }} transition={{
                delay: 0.05
              }} onClick={() => scrollToSection('about')} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium">
                    {language === 'ar' ? 'عن AYN' : language === 'fr' ? 'À Propos' : 'About'}
                  </motion.button>
                  <motion.button initial={{
                x: -20,
                opacity: 0
              }} animate={{
                x: 0,
                opacity: 1
              }} transition={{
                delay: 0.1
              }} onClick={() => scrollToSection('services')} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium">
                    {language === 'ar' ? 'خدماتنا' : language === 'fr' ? 'Services' : 'Services'}
                  </motion.button>
                  <motion.button initial={{
                x: -20,
                opacity: 0
              }} animate={{
                x: 0,
                opacity: 1
              }} transition={{
                delay: 0.15
              }} onClick={() => scrollToSection('contact')} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium">
                    {language === 'ar' ? 'تواصل معنا' : language === 'fr' ? 'Contact' : 'Contact'}
                  </motion.button>
                  <motion.div initial={{
                x: -20,
                opacity: 0
              }} animate={{
                x: 0,
                opacity: 1
              }} transition={{
                delay: 0.2
              }}>
                    <Link to="/support" onClick={() => setIsMenuExpanded(false)} className="block w-full text-left px-4 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium">
                      {language === 'ar' ? 'الدعم' : language === 'fr' ? 'Support' : 'Support'}
                    </Link>
                  </motion.div>
                </div>

                {/* Separator */}
                <div className="h-px bg-border mx-2" />

                {/* Settings Row */}
                <motion.div initial={{
              x: -20,
              opacity: 0
            }} animate={{
              x: 0,
              opacity: 1
            }} transition={{
              delay: 0.25
            }} className="p-2 flex items-center justify-between px-4">
                  <LanguageSwitcher onOpenChange={handleDropdownOpenChange} />
                  <ThemeToggle />
                </motion.div>

                {/* Separator */}
                <div className="h-px bg-border mx-2" />

                {/* CTA Button */}
                <motion.div initial={{
              x: -20,
              opacity: 0
            }} animate={{
              x: 0,
              opacity: 1
            }} transition={{
              delay: 0.3
            }} className="p-3">
                  <Button onClick={() => {
                setIsMenuExpanded(false);
                setShowAuthModal(true);
              }} className="w-full rounded-xl">
                    {t('nav.getStarted')}
                  </Button>
                </motion.div>
              </motion.div>}
          </AnimatePresence>
        </div>
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
                <button onClick={() => scrollToSection('about')} className="text-left py-2 text-sm font-medium hover:text-foreground/80 transition-colors">
                  {language === 'ar' ? 'عن AYN' : language === 'fr' ? 'À Propos' : 'About'}
                </button>
                <button onClick={() => scrollToSection('services')} className="text-left py-2 text-sm font-medium hover:text-foreground/80 transition-colors">
                  {language === 'ar' ? 'خدماتنا' : language === 'fr' ? 'Services' : 'Services'}
                </button>
                <button onClick={() => scrollToSection('contact')} className="text-left py-2 text-sm font-medium hover:text-foreground/80 transition-colors">
                  {language === 'ar' ? 'تواصل معنا' : language === 'fr' ? 'Contact' : 'Contact'}
                </button>
                <Link to="/support" className="block text-left py-2 text-sm font-medium hover:text-foreground/80 transition-colors">
                  {language === 'ar' ? 'الدعم' : language === 'fr' ? 'Support' : 'Support'}
                </Link>
                
                <div className="h-px bg-border my-2" />
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{language === 'ar' ? 'اللغة' : language === 'fr' ? 'Langue' : 'Language'}</span>
                  <LanguageSwitcher onOpenChange={handleDropdownOpenChange} />
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{language === 'ar' ? 'المظهر' : language === 'fr' ? 'Thème' : 'Theme'}</span>
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
      <Hero onGetStarted={(prefillMessage) => {
        if (prefillMessage) {
          setPendingMessage(prefillMessage);
          localStorage.setItem('ayn_pending_message', prefillMessage);
        }
        setShowAuthModal(true);
      }} />

      {/* About AYN - Value Proposition Section */}
      <section id="about" className="py-16 md:py-32 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl text-center">
          <ScrollReveal>
            <span className="text-sm font-mono text-muted-foreground tracking-wider uppercase mb-4 block">
              {language === 'ar' ? 'من نحن' : language === 'fr' ? 'À Propos d\'AYN' : 'About AYN'}
            </span>

            <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold mb-4 md:mb-6">
              {language === 'ar' ? 'رفيقك الذكي' : language === 'fr' ? 'Votre Compagnon de Vie Intelligent' : 'Your Intelligent Life Companion'}
            </h2>

            <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 md:mb-16">
              {language === 'ar' ? 'AYN يتعرّف عليك ويتعلم عاداتك ويساعدك على البقاء منظماً كل يوم.' : language === 'fr' ? 'AYN apprend à vous connaître. Il comprend vos habitudes, vos objectifs, et vous aide à rester organisé et concentré chaque jour.' : 'AYN gets to know you. It learns your habits, understands your goals, and helps you stay organized and focused every day.'}
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
                  {language === 'ar' ? 'يتكيّف معك' : language === 'fr' ? 'Compréhension Adaptative' : 'Adaptive Understanding'}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {language === 'ar' ? 'يتعلم تفضيلاتك ويقدم إرشادات تناسبك.' : language === 'fr' ? 'Apprend vos préférences et offre des conseils personnalisés adaptés à vous.' : 'Learns your preferences over time and offers personalized guidance tailored to you.'}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="text-center space-y-3 md:space-y-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-muted/50 mx-auto flex items-center justify-center">
                  <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-foreground" />
                </div>
                <h3 className="text-lg md:text-xl font-bold">
                  {language === 'ar' ? 'دائماً بجانبك' : language === 'fr' ? 'Toujours Disponible' : 'Always Available'}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {language === 'ar' ? 'رفيق متاح ٢٤ ساعة جاهز لمساعدتك.' : language === 'fr' ? 'Un compagnon attentionné disponible 24/7, prêt à vous aider quand vous en avez besoin.' : 'A thoughtful companion available 24/7, ready to help whenever you need support or clarity.'}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <div className="text-center space-y-3 md:space-y-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-muted/50 mx-auto flex items-center justify-center">
                  <Shield className="w-7 h-7 md:w-8 md:h-8 text-foreground" />
                </div>
                <h3 className="text-lg md:text-xl font-bold">
                  {language === 'ar' ? 'خصوصيتك محمية' : language === 'fr' ? 'Votre Vie Privée, Protégée' : 'Your Privacy, Protected'}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {language === 'ar' ? 'محادثاتك وبياناتك مشفرة بالكامل.' : language === 'fr' ? 'Vos conversations et données sont sécurisées avec un chiffrement de bout en bout.' : 'Your conversations and data are secured with end-to-end encryption.'}
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Services Section - Bento Grid */}
      <section id="services" className="py-16 md:py-32 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          {/* Section header */}
          <ScrollReveal>
            <div className="text-center mb-12 md:mb-16">
              <span className="text-sm font-mono text-muted-foreground tracking-wider uppercase mb-4 block">
                {language === 'ar' ? 'خدماتنا' : language === 'fr' ? 'Ce Que Nous Faisons' : 'What We Do'}
              </span>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif mb-4 md:mb-6">
                {language === 'ar' ? (
                  <>ثلاث طرق <span className="font-bold">لتبسيط حياتك</span></>
                ) : language === 'fr' ? (
                  <>Trois Façons de <span className="font-bold">Simplifier Votre Vie</span></>
                ) : (
                  <>Three Ways We Help <span className="font-bold">Simplify Your Life</span></>
                )}
              </h2>
            </div>
          </ScrollReveal>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Large Card - Left (Influencer Sites) */}
            <ScrollReveal>
              <Link to={`/services/${services[0].slug}`} className="block h-full">
                <motion.div 
                  className="bg-muted/50 rounded-3xl p-6 md:p-8 h-full min-h-[500px] lg:row-span-2 flex flex-col group cursor-pointer overflow-visible"
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                >
                  <div className="mb-4">
                    <span className="text-xs font-mono text-muted-foreground">{services[0].number}</span>
                    <h3 className="text-2xl md:text-3xl font-bold mt-2 group-hover:text-primary transition-colors">
                      {services[0].title}
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground mt-2">
                      {services[0].description}
                    </p>
                  </div>
                  <div className="flex-1 flex items-center justify-center overflow-visible">
                    {services[0].mockup}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors mt-4">
                    {language === 'ar' ? 'اكتشف المزيد' : language === 'fr' ? 'En Savoir Plus' : 'Learn More'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              </Link>
            </ScrollReveal>

            {/* Right Column - Two Stacked Cards */}
            <div className="flex flex-col gap-6">
              {/* Top Right Card (AI Agents) */}
              <ScrollReveal delay={0.1}>
                <Link to={`/services/${services[1].slug}`} className="block">
                  <motion.div 
                    className="bg-muted/50 rounded-3xl p-6 md:p-8 group cursor-pointer"
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  >
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      <div className="flex-1">
                        <span className="text-xs font-mono text-muted-foreground">{services[1].number}</span>
                        <h3 className="text-xl md:text-2xl font-bold mt-2 group-hover:text-primary transition-colors">
                          {services[1].title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          {services[1].description}
                        </p>
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors mt-4">
                          {language === 'ar' ? 'اكتشف المزيد' : language === 'fr' ? 'En Savoir Plus' : 'Learn More'}
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                      <div className="w-full md:w-[240px] flex-shrink-0">
                        {services[1].mockup}
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </ScrollReveal>

              {/* Bottom Right Card (Automation) */}
              <ScrollReveal delay={0.2}>
                <Link to={`/services/${services[2].slug}`} className="block">
                  <motion.div 
                    className="bg-muted/50 rounded-3xl p-6 md:p-8 group cursor-pointer"
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  >
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      <div className="flex-1">
                        <span className="text-xs font-mono text-muted-foreground">{services[2].number}</span>
                        <h3 className="text-xl md:text-2xl font-bold mt-2 group-hover:text-primary transition-colors">
                          {services[2].title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          {services[2].description}
                        </p>
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors mt-4">
                          {language === 'ar' ? 'اكتشف المزيد' : language === 'fr' ? 'En Savoir Plus' : 'Learn More'}
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                      <div className="w-full md:w-[240px] flex-shrink-0">
                        {services[2].mockup}
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Contact Section */}
      <section id="contact" className="py-16 md:py-32 px-4 md:px-6">
        <div className="container mx-auto max-w-3xl">
          <ScrollReveal>
            <div className="text-center mb-10 md:mb-16">
              <span className="text-sm font-mono text-muted-foreground tracking-wider uppercase mb-4 block">
                {language === 'ar' ? 'راسلنا' : language === 'fr' ? 'Contactez-Nous' : 'Get In Touch'}
              </span>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold mb-4 md:mb-6">
                {language === 'ar' ? 'دعنا نتحدث' : language === 'fr' ? 'Commençons une Conversation' : "Let's Start a Conversation"}
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
                {language === 'ar' ? 'شاركنا فكرتك، ودعنا نحوّلها إلى واقع' : language === 'fr' ? 'Parlez-nous de votre projet et nous vous aiderons à réaliser votre vision' : "Tell us about your project and we'll help transform your vision into reality"}
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
                  {language === 'ar' ? 'شكراً لك!' : language === 'fr' ? 'Merci!' : 'Thank You!'}
                </h3>
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'سنرد عليك خلال 24 ساعة' : language === 'fr' ? 'Nous vous contacterons dans 24 heures' : "We'll be in touch within 24 hours"}
                </p>
              </div> :
          // Contact form
          <form onSubmit={handleContactSubmit} className="space-y-6">
                {/* Name input */}
                <div className="space-y-2 group">
                  <label htmlFor="name" className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                    {language === 'ar' ? 'الاسم' : language === 'fr' ? 'Nom' : 'Name'}
                  </label>
                  <Input id="name" type="text" value={contactForm.name} onChange={e => setContactForm({
                ...contactForm,
                name: e.target.value
              })} placeholder={language === 'ar' ? 'الاسم الكامل' : language === 'fr' ? 'Votre nom complet' : 'Your full name'} className={cn("h-14 bg-transparent border-2 border-border rounded-none text-base transition-all duration-300", "focus:border-foreground focus:ring-0", "group-hover:border-muted-foreground", contactErrors.name && "border-destructive")} disabled={isSubmitting} />
                  {contactErrors.name && <p className="text-sm text-destructive animate-slide-down-fade">{contactErrors.name}</p>}
                </div>

                {/* Email input */}
                <div className="space-y-2 group">
                  <label htmlFor="email" className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                    {language === 'ar' ? 'البريد الإلكتروني' : language === 'fr' ? 'Email' : 'Email'}
                  </label>
                  <Input id="email" type="email" value={contactForm.email} onChange={e => setContactForm({
                ...contactForm,
                email: e.target.value
              })} placeholder={language === 'ar' ? 'بريدك الإلكتروني' : language === 'fr' ? 'votre@email.com' : 'your@email.com'} className={cn("h-14 bg-transparent border-2 border-border rounded-none text-base transition-all duration-300", "focus:border-foreground focus:ring-0", "group-hover:border-muted-foreground", contactErrors.email && "border-destructive")} disabled={isSubmitting} />
                  {contactErrors.email && <p className="text-sm text-destructive animate-slide-down-fade">{contactErrors.email}</p>}
                </div>

                {/* Message textarea */}
                <div className="space-y-2 group">
                  <label htmlFor="message" className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                    {language === 'ar' ? 'الرسالة' : language === 'fr' ? 'Message' : 'Message'}
                  </label>
                  <Textarea id="message" value={contactForm.message} onChange={e => setContactForm({
                ...contactForm,
                message: e.target.value
              })} placeholder={language === 'ar' ? 'كيف يمكننا مساعدتك؟' : language === 'fr' ? 'Parlez-nous de votre projet...' : 'Tell us about your project...'} rows={6} className={cn("bg-transparent border-2 border-border rounded-none text-base transition-all duration-300 resize-none", "focus:border-foreground focus:ring-0", "group-hover:border-muted-foreground", contactErrors.message && "border-destructive")} disabled={isSubmitting} />
                  {contactErrors.message && <p className="text-sm text-destructive animate-slide-down-fade">{contactErrors.message}</p>}
                </div>

                {/* Submit button */}
                <Button type="submit" size="lg" disabled={isSubmitting} className={cn("w-full h-14 rounded-none font-mono uppercase tracking-wider transition-all duration-300", "hover:shadow-2xl")}>
                  {isSubmitting ? <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {language === 'ar' ? 'جارٍ الإرسال...' : language === 'fr' ? 'Envoi...' : 'Sending...'}
                    </> : <>
                      {language === 'ar' ? 'أرسل' : language === 'fr' ? 'Envoyer' : 'Send Message'}
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