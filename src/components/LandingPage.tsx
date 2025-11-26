import { useState, useEffect } from 'react';
import { Brain, TrendingUp, Target, BarChart3, Zap, Users, ArrowRight, Sparkles, Palette, Cog, FileSpreadsheet, MessageSquare, Building2, Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AuthModal } from './auth/AuthModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { TypewriterText } from '@/components/TypewriterText';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(255),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoInput, setDemoInput] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const { t, language } = useLanguage();
  const { toast } = useToast();

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

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });

  const onSubmitContact = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Message sent successfully!",
        description: "We'll get back to you within 24 hours.",
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                Services
              </a>
              <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
                Contact
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

      {/* Hero Section - Interactive Demo */}
      <section id="home" className="relative min-h-screen overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(168,85,247,0.15),transparent_50%)]" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.15),transparent_50%)]" />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${10 + Math.random() * 20}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
          {/* Logo and Badge */}
          <div className="text-center mb-12 space-y-4 animate-in fade-in slide-in-from-top duration-700">
            {/* Brain Logo with Glow */}
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full" />
              <div className="relative w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-2xl">
                <Brain className="w-14 h-14 text-white" />
              </div>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/30 text-primary font-bold animate-pulse backdrop-blur-sm">
              <Sparkles className="w-5 h-5" />
              <span>{language === 'ar' ? 'جرّب AYN مجاناً الآن' : 'Try AYN Free Now'}</span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-7xl font-black leading-tight">
              <span className="block bg-gradient-to-r from-foreground via-primary to-purple-600 bg-clip-text text-transparent">
                {language === 'ar' ? 'مستشارك الذكي' : 'Your AI Business'}
              </span>
              <span className="block text-foreground/80 mt-2">
                {language === 'ar' ? 'في الأعمال' : 'Consultant'}
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              {language === 'ar'
                ? 'اسأل أي سؤال عن عملك واحصل على إجابات فورية مدعومة بالذكاء الاصطناعي'
                : 'Ask any question about your business and get instant AI-powered answers'}
            </p>
          </div>

          {/* Interactive Demo Input - Center Stage */}
          <div className="w-full max-w-4xl mb-12 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity" />
              
              {/* Input container */}
              <div className="relative bg-background/95 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-primary/20 p-3 group-hover:border-primary/40 transition-all">
                <div className="flex items-center gap-3">
                  {/* Mode indicator */}
                  <div className="flex-shrink-0 px-4 py-2 rounded-2xl bg-primary/10 text-primary text-sm font-semibold">
                    {language === 'ar' ? 'نمط عام' : 'General Mode'}
                  </div>

                  {/* Input area */}
                  <div className="relative flex-1">
                    <Textarea
                      value={demoInput}
                      onChange={(e) => setDemoInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder=""
                      rows={1}
                      className="w-full resize-none border-0 bg-transparent text-lg focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[56px] max-h-[200px]"
                    />
                    
                    {/* Typewriter placeholder */}
                    {showPlaceholder && !demoInput.trim() && (
                      <div className="absolute top-4 left-4 pointer-events-none">
                        <TypewriterText
                          key={`${placeholderIndex}-${language}`}
                          text={placeholders[placeholderIndex]}
                          speed={50}
                          className="text-muted-foreground text-lg"
                          showCursor={true}
                        />
                      </div>
                    )}
                  </div>

                  {/* Send button */}
                  <Button
                    onClick={handleDemoSend}
                    disabled={!demoInput.trim()}
                    size="lg"
                    className="flex-shrink-0 h-14 w-14 rounded-2xl bg-gradient-to-r from-primary to-purple-600 hover:scale-110 transition-all shadow-lg disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <Send className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Helper text */}
            <p className="text-center text-sm text-muted-foreground mt-4">
              {language === 'ar'
                ? '✨ جرّب الآن مجاناً - لا حاجة لبطاقة ائتمان'
                : '✨ Try now for free - no credit card needed'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-16 animate-in fade-in slide-in-from-bottom duration-700 delay-400">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setDemoInput(language === 'ar' ? 'كيف أزيد مبيعاتي؟' : 'How do I increase sales?')}
              className="rounded-full text-base"
            >
              💡 {language === 'ar' ? 'كيف أزيد مبيعاتي؟' : 'How do I increase sales?'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setDemoInput(language === 'ar' ? 'حلل منافسيني' : 'Analyze my competitors')}
              className="rounded-full text-base"
            >
              🎯 {language === 'ar' ? 'حلل منافسيني' : 'Analyze my competitors'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setDemoInput(language === 'ar' ? 'اقترح استراتيجية تسويق' : 'Suggest marketing strategy')}
              className="rounded-full text-base"
            >
              📊 {language === 'ar' ? 'استراتيجية تسويق' : 'Marketing strategy'}
            </Button>
          </div>

          {/* Scroll Indicator */}
          <div className="text-center animate-in fade-in slide-in-from-bottom duration-700 delay-600">
            <p className="text-muted-foreground mb-4">
              {language === 'ar' ? 'أو استكشف خدماتنا' : 'Or explore our services'}
            </p>
            <Button
              variant="ghost"
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-lg group"
            >
              <span>{language === 'ar' ? 'عرض جميع الخدمات' : 'View All Services'}</span>
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Service Icons - Floating Preview */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 px-8 py-4 rounded-full bg-background/80 backdrop-blur-xl border border-border shadow-2xl animate-in fade-in slide-in-from-bottom duration-700 delay-800">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            {language === 'ar' ? 'خدماتنا:' : 'Our Services:'}
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center transition-transform hover:scale-110" title={language === 'ar' ? 'مواقع المؤثرين' : 'Influencer Portfolios'}>
              <Palette className="w-5 h-5 text-purple-500" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center transition-transform hover:scale-110" title={language === 'ar' ? 'روبوتات ذكية' : 'Custom AI Agents'}>
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center transition-transform hover:scale-110" title={language === 'ar' ? 'أتمتة العمليات' : 'Process Automation'}>
              <Cog className="w-5 h-5 text-green-500" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center transition-transform hover:scale-110" title={language === 'ar' ? 'AYN Eng هندسة مدنية' : 'AYN Eng Civil Engineering'}>
              <FileSpreadsheet className="w-5 h-5 text-orange-500" />
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

        {/* Services Section - Premium Redesign */}
        <section id="services" className="py-24 px-4 relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
          <div className="absolute inset-0 bg-grid-pattern" />
          
          <div className="container mx-auto max-w-7xl relative z-10">
            {/* Section Header */}
            <div className="text-center mb-20 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 animate-pulse">
                <Sparkles className="w-4 h-4" />
                What We Do Best
              </div>
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                  Transform Your Business
                </span>
                <br />
                <span className="text-foreground/80">with AI Solutions</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                We don't just build tools—we create intelligent systems that grow with your business
              </p>
            </div>

            {/* Services Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              
              {/* Service 1: Influencer Portfolios - Dark themed with gradient */}
              <div className="group relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-105 hover:-translate-y-2">
                {/* Dark gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-900 to-black" />
                
                {/* Animated particles background */}
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-10 left-10 w-32 h-32 bg-purple-400 rounded-full blur-3xl animate-pulse" />
                  <div className="absolute bottom-10 right-10 w-40 h-40 bg-pink-400 rounded-full blur-3xl animate-pulse delay-700" />
                </div>
                
                {/* Content */}
                <div className="relative z-10 p-8 text-white">
                  {/* Icon with glow */}
                  <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/50">
                    <Palette className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-3xl font-bold mb-4">Influencer Portfolio Sites</h3>
                  <p className="text-white/80 mb-6 leading-relaxed">
                    Stand out from the crowd. We craft stunning, personal portfolio websites that showcase your brand and convert followers into clients—complete with AI-powered contact forms.
                  </p>
                  
                  {/* Features */}
                  <ul className="space-y-3 mb-6 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-300 mt-0.5">✓</span>
                      <span>Custom design that matches your aesthetic</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-300 mt-0.5">✓</span>
                      <span>AI chatbot trained on your content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-300 mt-0.5">✓</span>
                      <span>Automatic social media integration</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-300 mt-0.5">✓</span>
                      <span>Powered by AYN AI branding</span>
                    </li>
                  </ul>
                  
                  {/* CTA */}
                  <a 
                    href="https://ghazi.today" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-purple-900 font-semibold hover:bg-purple-100 transition-all shadow-lg hover:shadow-xl"
                  >
                    See Live Example
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Service 2: Custom AI Agents - Blue gradient */}
              <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-2 border-blue-200 dark:border-blue-800 transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20">
                {/* Animated gradient orb */}
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-400 rounded-full blur-3xl opacity-20 animate-pulse" />
                
                <div className="relative z-10 p-8">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-3xl font-bold mb-4 text-foreground">Custom AI Agents</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Your business is unique. Your AI should be too. We build intelligent agents tailored to your workflows—handling customer support, lead qualification, and more.
                  </p>
                  
                  <ul className="space-y-3 mb-6 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">✓</span>
                      <span>Trained on your company's knowledge base</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">✓</span>
                      <span>Integrates with your existing tools</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">✓</span>
                      <span>Handles customer inquiries 24/7</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">✓</span>
                      <span>Learns and improves over time</span>
                    </li>
                  </ul>
                  
                  <div className="px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      From lead generation to customer service—fully automated
                    </p>
                  </div>
                </div>
              </div>

              {/* Service 3: Process Automation - Green gradient */}
              <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-2 border-green-200 dark:border-green-800 transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-500/20">
                {/* Animated gradient orb */}
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-green-400 rounded-full blur-3xl opacity-20 animate-pulse delay-300" />
                
                <div className="relative z-10 p-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-180 transition-all duration-500 shadow-lg">
                    <Cog className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-3xl font-bold mb-4 text-foreground">Process Automation</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Stop wasting time on repetitive tasks. We analyze your operations, identify bottlenecks, and deploy smart automation that saves hours every day.
                  </p>
                  
                  <ul className="space-y-3 mb-6 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Automated email responses and follow-ups</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Smart data entry and document processing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Calendar management and scheduling</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Report generation on autopilot</span>
                    </li>
                  </ul>
                  
                  <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      Your team focuses on growth, not grunt work
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* AYN Eng - Full Width Premium Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-1 animate-gradient-x">
              {/* Inner card */}
              <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-950/90 dark:to-pink-950/90 backdrop-blur-xl">
                {/* Animated background */}
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-400 rounded-full blur-3xl animate-pulse" />
                  <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-400 rounded-full blur-3xl animate-pulse delay-500" />
                </div>
                
                <div className="relative z-10 p-12 text-center">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-bold mb-6 shadow-lg animate-bounce">
                    <FileSpreadsheet className="w-5 h-5" />
                    COMING SOON - Revolutionary Tech
                  </div>
                  
                  <h3 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-pink-600 dark:from-orange-400 dark:to-pink-400 bg-clip-text text-transparent">
                    AYN Eng: Civil Engineering AI
                  </h3>
                  <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
                    Revolutionary AI for civil engineers. Upload survey data, get instant cut/fill analysis, AutoCAD-ready DXF files, and engineering reports that follow Saudi and GCC standards—all in seconds, not hours.
                  </p>
                  
                  {/* Feature pills */}
                  <div className="flex flex-wrap justify-center gap-4">
                    <div className="px-6 py-3 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-sm border-2 border-orange-500/30 font-semibold text-foreground shadow-lg">
                      📐 Slope Analysis
                    </div>
                    <div className="px-6 py-3 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-sm border-2 border-orange-500/30 font-semibold text-foreground shadow-lg">
                      📊 Volume Calculations
                    </div>
                    <div className="px-6 py-3 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-sm border-2 border-orange-500/30 font-semibold text-foreground shadow-lg">
                      📁 DXF Export
                    </div>
                    <div className="px-6 py-3 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-sm border-2 border-orange-500/30 font-semibold text-foreground shadow-lg">
                      ✅ GCC Compliance
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-16">
              <p className="text-2xl font-medium text-muted-foreground mb-8">
                Ready to automate your business and scale faster?
              </p>
              <Button 
                size="lg" 
                className="text-lg px-10 py-7 rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                onClick={() => setShowAuthModal(true)}
              >
                <Building2 className="w-6 h-6 mr-3" />
                Let's Build Something Amazing
                <ArrowRight className="w-5 h-5 ml-3" />
              </Button>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-24 px-4 relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-primary/5" />
          <div className="absolute inset-0 bg-grid-pattern opacity-50" />
          
          <div className="container mx-auto max-w-4xl relative z-10">
            {/* Section Header */}
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 animate-pulse">
                <Mail className="w-4 h-4" />
                Get In Touch
              </div>
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                  Let's Talk
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Ready to transform your business with AI? Drop us a message and we'll get back to you within 24 hours.
              </p>
            </div>

            {/* Contact Form Card */}
            <div className="relative group">
              {/* Animated gradient border */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-primary rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition duration-1000 animate-gradient-x" />
              
              {/* Form Container */}
              <div className="relative bg-card/80 backdrop-blur-xl border border-border rounded-3xl p-8 md:p-12 shadow-2xl">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitContact)} className="space-y-8">
                    
                    {/* Name Field */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="relative group/field">
                          <FormLabel className="text-base font-semibold text-foreground/80 mb-2 block">
                            Full Name
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                {...field}
                                placeholder="John Doe"
                                className="h-14 text-base bg-background/50 border-2 border-border focus:border-primary transition-all duration-300 rounded-xl px-4 group-focus-within/field:shadow-lg group-focus-within/field:shadow-primary/20"
                                disabled={isSubmitting}
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-sm mt-2" />
                        </FormItem>
                      )}
                    />

                    {/* Email Field */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="relative group/field">
                          <FormLabel className="text-base font-semibold text-foreground/80 mb-2 block">
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                {...field}
                                type="email"
                                placeholder="john@example.com"
                                className="h-14 text-base bg-background/50 border-2 border-border focus:border-primary transition-all duration-300 rounded-xl px-4 group-focus-within/field:shadow-lg group-focus-within/field:shadow-primary/20"
                                disabled={isSubmitting}
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-sm mt-2" />
                        </FormItem>
                      )}
                    />

                    {/* Message Field */}
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem className="relative group/field">
                          <FormLabel className="text-base font-semibold text-foreground/80 mb-2 block">
                            Your Message
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Textarea 
                                {...field}
                                placeholder="Tell us about your project or ask us anything..."
                                className="min-h-[160px] text-base bg-background/50 border-2 border-border focus:border-primary transition-all duration-300 rounded-xl px-4 py-4 resize-none group-focus-within/field:shadow-lg group-focus-within/field:shadow-primary/20"
                                disabled={isSubmitting}
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-sm mt-2" />
                        </FormItem>
                      )}
                    />

                    {/* Submit Button */}
                    <div className="flex justify-center pt-4">
                      <Button
                        type="submit"
                        size="lg"
                        disabled={isSubmitting}
                        className="text-lg px-12 py-7 rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5 mr-3" />
                            Send Message
                            <ArrowRight className="w-5 h-5 ml-3" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>

            {/* Contact Info */}
            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-2">
                Or reach us directly at
              </p>
              <a 
                href="mailto:contact@ayn.ai" 
                className="text-lg font-semibold text-primary hover:underline"
              >
                contact@ayn.ai
              </a>
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
        message={demoInput.trim() ? (language === 'ar' 
          ? '✨ سجّل الدخول لتستمر في المحادثة مع AYN'
          : '✨ Sign in to continue your conversation with AYN'
        ) : undefined}
        prefilledMessage={demoInput.trim() || undefined}
      />
    </div>
  );
};

export default LandingPage;