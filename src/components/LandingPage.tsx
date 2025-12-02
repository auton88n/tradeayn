import { useState } from 'react';
import { Brain, ArrowRight, CheckCircle, Send, Loader2 } from 'lucide-react';
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
import { z } from 'zod';
const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [demoMessage, setDemoMessage] = useState('');
  const {
    t,
    language
  } = useLanguage();
  const {
    toast
  } = useToast();

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
            <Button onClick={() => setShowAuthModal(true)} size="sm" className="rounded-full">
              {t('nav.getStarted')}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Editorial Masterpiece */}
      <section className="min-h-screen flex flex-col justify-center items-center px-6 relative overflow-hidden">
        {/* Subtle noise texture */}
        <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
        
        {/* Animated Conversation Examples */}
        <ConversationExamples />
        
        {/* Interactive Chat Input */}
        <ScrollReveal>
          <div className="w-full max-w-3xl mx-auto">
            {/* Optional tagline above input */}
            <p className="text-center text-lg text-muted-foreground mb-8 opacity-0 animate-[fade-in_0.8s_ease-out_0.2s_forwards]">
              {language === 'ar' ? 'اسأل AYN أي شيء' : 'Ask AYN anything'}
            </p>
            
            {/* Chat Input Container */}
            <div className="relative bg-card/50 backdrop-blur-xl border-2 border-border rounded-2xl p-6 shadow-2xl opacity-0 animate-[fade-in_0.8s_ease-out_0.4s_forwards] hover-glow">
              <div className="relative">
                <Textarea value={demoMessage} onChange={e => setDemoMessage(e.target.value)} onKeyPress={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  setShowAuthModal(true);
                }
              }} placeholder="" rows={3} className="w-full resize-none bg-transparent border-0 outline-none focus:ring-0 text-base min-h-[80px] focus-visible:ring-0" />
                
                {/* Typewriter Placeholder */}
                {!demoMessage && <div className={cn("absolute top-2 pointer-events-none", language === 'ar' ? 'right-3' : 'left-3')}>
                    <TypewriterText key={`demo-${language}`} text={language === 'ar' ? 'كيف يمكنني زيادة إيراداتي؟' : 'How can I increase my revenue?'} speed={50} className="text-muted-foreground" showCursor={true} />
                  </div>}
              </div>
              
              {/* Send Button Row */}
              <div className="flex items-center justify-end mt-4 pt-4 border-t border-border/50">
                <Button onClick={() => setShowAuthModal(true)} disabled={!demoMessage.trim()} size="lg" className="h-12 px-8 rounded-full transition-all hover:scale-105 active:scale-95">
                  {language === 'ar' ? 'إرسال' : 'Send'}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </ScrollReveal>
        
        {/* Single elegant CTA below the input */}
        <ScrollReveal delay={0.8}>
          <div className="text-center mt-8">
            
          </div>
        </ScrollReveal>

        {/* Floating brain icon */}
        <ScrollReveal delay={1.2}>
          <div className="absolute bottom-32 animate-float opacity-0 animate-[fade-in_0.8s_ease-out_1.2s_forwards]">
            <Brain className="w-16 h-16 text-muted-foreground/20" />
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
            {services.map((service, index) => <ScrollReveal key={index} delay={index * 0.2}>
                <div className="group">
                  <div className={cn("grid md:grid-cols-2 gap-12 items-center", index % 2 === 1 && "md:grid-flow-dense")}>
                    {/* Text content */}
                    <div className={cn("space-y-6", index % 2 === 1 && "md:col-start-2")}>
                      <span className="text-sm font-mono text-muted-foreground">{service.number}</span>
                      <h3 className="text-4xl md:text-5xl font-bold leading-tight">{service.title}</h3>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        {service.description}
                      </p>
                      
                      {/* Features list */}
                      <ul className="space-y-3 pt-4">
                        {service.features.map((feature, i) => <li key={i} className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-foreground flex-shrink-0" />
                            <span className="text-foreground/80">{feature}</span>
                          </li>)}
                      </ul>

                      <div className="pt-6">
                        <Button onClick={() => setShowAuthModal(true)} variant="outline" className="group/btn">
                          {language === 'ar' ? 'اعرف المزيد' : 'Learn More'}
                          <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>

                    {/* Visual placeholder */}
                    <div className={cn("aspect-square rounded-3xl bg-muted/50 border border-border hover-glow transition-all duration-500", index % 2 === 1 && "md:col-start-1 md:row-start-1")}>
                      <div className="w-full h-full flex items-center justify-center">
                        <Brain className="w-16 h-16 text-muted-foreground/30" />
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>)}
          </div>
        </div>
      </section>

      {/* Premium Contact Section */}
      <section id="contact" className="py-32 px-6">
        <div className="container mx-auto max-w-3xl">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="text-sm font-mono text-muted-foreground tracking-wider uppercase mb-4 block">
                {language === 'ar' ? 'تواصل معنا' : 'Get In Touch'}
              </span>
              <h2 className="text-5xl md:text-6xl font-serif font-bold mb-6">
                {language === 'ar' ? 'لنبدأ المحادثة' : "Let's Start a Conversation"}
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
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
              <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
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
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>;
};
export default LandingPage;