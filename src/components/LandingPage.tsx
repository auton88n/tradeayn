import { useState, useEffect } from 'react';
import { Brain, TrendingUp, Target, BarChart3, Zap, Users, ArrowRight, Sparkles, Palette, Cog, FileSpreadsheet, MessageSquare, Building2, ExternalLink, Mail, Bot, Database, Calendar, FileText, BarChart, Clock, TrendingDown, CheckCircle2, Box, Upload, Download, Loader2, Wrench, Home, ShoppingCart, Truck, DollarSign, Phone, Briefcase, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AuthModal } from './auth/AuthModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './theme-toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { t, language } = useLanguage();

  // Demo chat state for Custom AI Agents showcase
  const [demoMessages] = useState([
    { sender: 'bot', text: language === 'ar' ? 'مرحباً بك في TechCorp! كيف يمكنني مساعدتك اليوم؟' : 'Welcome to TechCorp! How can I help you today?', time: '9:41' },
    { sender: 'user', text: language === 'ar' ? 'أريد تتبع طلبي رقم #12345' : 'I need help tracking my order #12345', time: '9:42' },
    { sender: 'bot', text: language === 'ar' ? 'وجدت طلبك! تم شحنه أمس عبر FedEx وسيصل غداً بحلول الساعة 5 مساءً. هل تريد رابط التتبع؟' : 'I found your order! It was shipped yesterday via FedEx and will arrive tomorrow by 5pm. Would you like the tracking link?', time: '9:42', hasButton: true },
    { sender: 'user', text: language === 'ar' ? 'هل يمكنني تغيير عنوان التسليم؟' : 'Can I change the delivery address?', time: '9:43' },
  ]);
  const [isTyping] = useState(true);
  const [demoInput, setDemoInput] = useState('');
  const [activeNode, setActiveNode] = useState(0);
  const [showCaseStudyModal, setShowCaseStudyModal] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState('ecommerce');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Auto-cycle through workflow nodes for Process Automation demo
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNode((prev) => (prev + 1) % 6);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Workflow node tooltips data
  const workflowNodes = [
    {
      id: 'email',
      icon: Mail,
      label: { en: 'Email', ar: 'البريد' },
      tooltip: {
        en: { title: 'Incoming Emails', desc: 'AI reads and categorizes customer emails automatically' },
        ar: { title: 'البريد الوارد', desc: 'يقرأ AI ويصنف رسائل العملاء تلقائياً' }
      }
    },
    {
      id: 'ai',
      icon: Bot,
      label: { en: 'AI Process', ar: 'معالجة AI' },
      tooltip: {
        en: { title: 'AI Processing', desc: 'Natural language understanding extracts intent, sentiment, and key data' },
        ar: { title: 'معالجة AI', desc: 'فهم اللغة الطبيعية يستخرج النية والمشاعر والبيانات' }
      }
    },
    {
      id: 'crm',
      icon: Database,
      label: { en: 'CRM Update', ar: 'تحديث CRM' },
      tooltip: {
        en: { title: 'CRM Update', desc: 'Automatically creates tickets, updates contacts, and logs interactions' },
        ar: { title: 'تحديث CRM', desc: 'إنشاء التذاكر وتحديث جهات الاتصال تلقائياً' }
      }
    },
    {
      id: 'calendar',
      icon: Calendar,
      label: { en: 'Calendar', ar: 'التقويم' },
      tooltip: {
        en: { title: 'Calendar Sync', desc: 'Schedules meetings and sends reminders automatically' },
        ar: { title: 'مزامنة التقويم', desc: 'جدولة الاجتماعات وإرسال التذكيرات تلقائياً' }
      }
    },
    {
      id: 'document',
      icon: FileText,
      label: { en: 'Document', ar: 'المستند' },
      tooltip: {
        en: { title: 'Document Generation', desc: 'Creates reports, invoices, and contracts automatically' },
        ar: { title: 'إنشاء المستندات', desc: 'إنشاء التقارير والفواتير والعقود تلقائياً' }
      }
    },
    {
      id: 'report',
      icon: BarChart,
      label: { en: 'Report', ar: 'التقرير' },
      tooltip: {
        en: { title: 'Analytics Report', desc: 'Generates insights and performance dashboards' },
        ar: { title: 'تقارير التحليلات', desc: 'توليد الرؤى ولوحات الأداء' }
      }
    }
  ];

  // Case studies data
  const caseStudies = {
    ecommerce: {
      icon: ShoppingCart,
      title: { en: 'E-Commerce Automation', ar: 'أتمتة التجارة الإلكترونية' },
      problem: { en: 'Spending 4 hours/day on order confirmations and inventory updates', ar: 'قضاء 4 ساعات/يوم في تأكيدات الطلبات وتحديثات المخزون' },
      workflow: [
        { icon: Mail, label: { en: 'New Order', ar: 'طلب جديد' } },
        { icon: Bot, label: { en: 'AI Validation', ar: 'التحقق بالذكاء الاصطناعي' } },
        { icon: Box, label: { en: 'Inventory Check', ar: 'فحص المخزون' } },
        { icon: Phone, label: { en: 'Customer SMS', ar: 'رسالة نصية للعميل' } },
        { icon: FileText, label: { en: 'Invoice', ar: 'فاتورة' } },
        { icon: Truck, label: { en: 'Shipping Label', ar: 'ملصق الشحن' } }
      ],
      results: {
        en: ['95% reduction in manual processing', '30 min → 2 min order handling', 'Zero data entry errors'],
        ar: ['تخفيض 95٪ في المعالجة اليدوية', '30 دقيقة ← 2 دقيقة معالجة الطلب', 'صفر أخطاء إدخال البيانات']
      },
      testimonial: {
        en: { text: 'Saved us 20 hours per week', author: 'Ahmed, Store Owner' },
        ar: { text: 'وفر علينا 20 ساعة أسبوعياً', author: 'أحمد، صاحب متجر' }
      }
    },
    realestate: {
      icon: Home,
      title: { en: 'Real Estate Automation', ar: 'أتمتة العقارات' },
      problem: { en: 'Manual lead qualification taking 2 hours daily', ar: 'تأهيل العملاء المحتملين يدويًا يستغرق ساعتين يوميًا' },
      workflow: [
        { icon: Mail, label: { en: 'Lead Inquiry', ar: 'استفسار عميل' } },
        { icon: Bot, label: { en: 'AI Qualification', ar: 'تأهيل AI' } },
        { icon: Database, label: { en: 'Property Match', ar: 'مطابقة عقار' } },
        { icon: Phone, label: { en: 'Auto Response', ar: 'رد تلقائي' } },
        { icon: Calendar, label: { en: 'Schedule Tour', ar: 'جدولة جولة' } },
        { icon: FileText, label: { en: 'Contract Prep', ar: 'تحضير عقد' } }
      ],
      results: {
        en: ['80% faster lead response', '3x more qualified leads', '60% time savings on admin'],
        ar: ['80٪ أسرع في الرد على العملاء', '3 أضعاف العملاء المؤهلين', '60٪ توفير في الوقت الإداري']
      },
      testimonial: {
        en: { text: 'Closed 40% more deals this quarter', author: 'Sara, Real Estate Agent' },
        ar: { text: 'أغلقت 40٪ صفقات أكثر هذا الربع', author: 'سارة، وكيلة عقارات' }
      }
    },
    finance: {
      icon: DollarSign,
      title: { en: 'Finance Automation', ar: 'أتمتة المالية' },
      problem: { en: 'Invoice processing taking 3 days per month', ar: 'معالجة الفواتير تستغرق 3 أيام شهرياً' },
      workflow: [
        { icon: Mail, label: { en: 'Invoice Received', ar: 'استلام فاتورة' } },
        { icon: Bot, label: { en: 'Data Extract', ar: 'استخراج بيانات' } },
        { icon: Database, label: { en: 'Categorize', ar: 'تصنيف' } },
        { icon: CheckCircle2, label: { en: 'Auto Approve', ar: 'موافقة تلقائية' } },
        { icon: DollarSign, label: { en: 'Payment', ar: 'دفع' } },
        { icon: BarChart, label: { en: 'Report', ar: 'تقرير' } }
      ],
      results: {
        en: ['90% faster invoice processing', '100% accuracy in data entry', '$5K saved monthly on admin'],
        ar: ['90٪ أسرع في معالجة الفواتير', '100٪ دقة في إدخال البيانات', '5000$ توفير شهري في الإدارة']
      },
      testimonial: {
        en: { text: 'Cut our month-end close from 5 days to 1 day', author: 'Khaled, CFO' },
        ar: { text: 'قللنا إغلاق نهاية الشهر من 5 أيام إلى يوم واحد', author: 'خالد، مدير مالي' }
      }
    },
    marketing: {
      icon: TrendingUp,
      title: { en: 'Marketing Automation', ar: 'أتمتة التسويق' },
      problem: { en: 'Manual campaign management consuming 15 hours weekly', ar: 'إدارة الحملات يدوياً تستهلك 15 ساعة أسبوعياً' },
      workflow: [
        { icon: Mail, label: { en: 'Lead Capture', ar: 'التقاط عميل' } },
        { icon: Bot, label: { en: 'Segment', ar: 'تقسيم' } },
        { icon: Mail, label: { en: 'Nurture Email', ar: 'بريد رعاية' } },
        { icon: Phone, label: { en: 'SMS Follow-up', ar: 'متابعة نصية' } },
        { icon: Calendar, label: { en: 'Schedule Post', ar: 'جدولة منشور' } },
        { icon: BarChart, label: { en: 'Analytics', ar: 'تحليلات' } }
      ],
      results: {
        en: ['4x increase in lead engagement', '50% higher conversion rate', '15 hours saved weekly'],
        ar: ['4 أضعاف زيادة في تفاعل العملاء', '50٪ زيادة في معدل التحويل', '15 ساعة توفير أسبوعياً']
      },
      testimonial: {
        en: { text: 'Our campaigns run themselves now', author: 'Layla, Marketing Director' },
        ar: { text: 'حملاتنا تعمل بنفسها الآن', author: 'ليلى، مديرة تسويق' }
      }
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
      {/* Static White Glossy Blur Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Main white glossy overlay */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl" />
        
        {/* Subtle gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-white/10" />
        
        {/* Top gradient glow */}
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/15 to-transparent blur-3xl" />
        
        {/* Bottom gradient glow */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white/15 to-transparent blur-3xl" />
        
        {/* Side glows for depth */}
        <div className="absolute top-0 bottom-0 left-0 w-1/4 bg-gradient-to-r from-white/12 to-transparent blur-2xl" />
        <div className="absolute top-0 bottom-0 right-0 w-1/4 bg-gradient-to-l from-white/12 to-transparent blur-2xl" />
        
        {/* Center subtle highlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-white/8 rounded-full blur-[100px]" />
      </div>

      {/* Content with higher z-index */}
      <div className="relative z-10">
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
        
        {/* Glassmorphism Geometric Shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Large glass circle - top right */}
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-transparent backdrop-blur-3xl border border-white/20 animate-float-slow" />
          
          {/* Hexagon - left side */}
          <div 
            className="absolute top-1/3 -left-10 w-48 h-48 bg-gradient-to-tr from-cyan-500/10 to-transparent backdrop-blur-xl border border-white/15 rotate-12 animate-spin-slow"
            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
          />
          
          {/* Small glossy circles */}
          <div className="absolute top-20 left-1/4 w-24 h-24 rounded-full bg-gradient-to-br from-white/30 to-white/5 shadow-lg animate-pulse-slow" />
          <div className="absolute top-40 right-1/3 w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/15 to-white/5 shadow-md animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/3 left-1/3 w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/15 to-white/5 shadow-md animate-pulse-slow" style={{ animationDelay: '2s' }} />
          
          {/* Diamond shape - right center */}
          <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-gradient-to-r from-pink-500/10 to-purple-500/10 backdrop-blur-lg border border-white/20 rotate-45 animate-float" />
          
          {/* Dot grid */}
          <div className="absolute top-1/2 right-10 grid grid-cols-3 gap-3">
            {[...Array(9)].map((_, i) => (
              <div 
                key={i} 
                className="w-2 h-2 rounded-full bg-primary/20 animate-pulse" 
                style={{ animationDelay: `${i * 0.2}s` }} 
              />
            ))}
          </div>
          
          {/* Bottom glass rectangle */}
          <div className="absolute -bottom-10 left-1/4 w-80 h-40 rounded-3xl bg-gradient-to-tr from-pink-500/8 via-white/10 to-transparent backdrop-blur-2xl border border-white/15 -rotate-6 animate-float-slow" style={{ animationDelay: '0.5s' }} />
          
          {/* Small accent shapes */}
          <div className="absolute top-2/3 right-1/3 w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/10 to-transparent backdrop-blur-lg border border-white/15 rotate-12 animate-float" style={{ animationDelay: '1.5s' }} />
        </div>
        
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

      {/* Services Section */}
      <section id="services" className="py-24 px-4 bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="container mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              What We Do Best
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Transform Your Business with AI
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We don't just build tools—we create intelligent systems that grow with your business
            </p>
          </div>

          {/* Service 1: Influencer Portfolios - REAL WEBSITE SHOWCASE */}
          <div className="lg:col-span-3 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-1 mb-24">
            {/* Gradient border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 opacity-50 blur-xl" />
            
            <div className="relative bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 rounded-3xl p-12 backdrop-blur-xl">
              {/* Header Section */}
              <div className="text-center mb-12 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 backdrop-blur-sm">
                  <Palette className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-bold text-purple-300">
                    {language === 'ar' ? 'خدمة مميزة' : 'Featured Service'}
                  </span>
                </div>

                <h3 className="text-5xl md:text-6xl font-black text-white">
                  {language === 'ar' ? 'مواقع المؤثرين الاحترافية' : 'Professional Influencer Portfolios'}
                </h3>
                
                <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                  {language === 'ar'
                    ? 'نصمم مواقع portfolio فريدة تعرض محتواك وإنجازاتك بشكل احترافي. مع تكامل AI ذكي وتحليلات متقدمة'
                    : 'We design unique portfolio sites that showcase your content and achievements professionally. With smart AI integration and advanced analytics'}
                </p>

                {/* Feature Pills */}
                <div className="flex flex-wrap justify-center gap-3 pt-4">
                  {[
                    { icon: '✨', text: language === 'ar' ? 'تصميم مخصص' : 'Custom Design' },
                    { icon: '🤖', text: language === 'ar' ? 'AI Chatbot' : 'AI Chatbot' },
                    { icon: '📊', text: language === 'ar' ? 'تحليلات متقدمة' : 'Analytics' },
                    { icon: '📱', text: language === 'ar' ? 'متجاوب 100%' : 'Fully Responsive' },
                    { icon: '⚡', text: language === 'ar' ? 'سرعة فائقة' : 'Lightning Fast' }
                  ].map((feature, i) => (
                    <div 
                      key={i}
                      className="px-4 py-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white font-medium hover:bg-white/10 hover:scale-105 transition-all"
                    >
                      <span className="mr-2">{feature.icon}</span>
                      {feature.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* REAL Website Preview - Using iframe */}
              <div className="relative mb-12 group">
                {/* Browser Chrome */}
                <div className="relative bg-slate-800 rounded-t-xl p-3 shadow-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 ml-4 h-8 bg-slate-700 rounded-lg flex items-center px-4 gap-2">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-sm text-slate-300 font-medium">ghazi.today</span>
                    </div>
                  </div>

                  {/* Live Website iframe */}
                  <div className="relative w-full bg-white rounded-lg overflow-hidden shadow-2xl" style={{ height: '600px' }}>
                    <iframe
                      src="https://ghazi.today"
                      className="w-full h-full border-0"
                      title="Ghazi.Today Portfolio"
                      loading="lazy"
                    />
                    
                    {/* Overlay on hover with "View Live" */}
                    <a
                      href="https://ghazi.today"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-purple-900/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                    >
                      <div className="text-center space-y-4">
                        <div className="text-6xl">🚀</div>
                        <div className="text-3xl font-black text-white">
                          {language === 'ar' ? 'شاهد الموقع الحي' : 'View Live Website'}
                        </div>
                        <div className="px-6 py-3 bg-white text-purple-900 rounded-xl font-bold inline-flex items-center gap-2 shadow-xl">
                          {language === 'ar' ? 'افتح ghazi.today' : 'Open ghazi.today'}
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>

              {/* Key Features Grid */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {[
                  {
                    icon: '🎨',
                    title: language === 'ar' ? 'تصميم فريد' : 'Unique Design',
                    desc: language === 'ar' ? 'تصميم يعكس شخصيتك وعلامتك' : 'Design that reflects your personality'
                  },
                  {
                    icon: '🤖',
                    title: language === 'ar' ? 'AI مدرّب' : 'Trained AI',
                    desc: language === 'ar' ? 'روبوت محادثة يفهم محتواك' : 'Chatbot that understands your content'
                  },
                  {
                    icon: '📊',
                    title: language === 'ar' ? 'تحليلات' : 'Analytics',
                    desc: language === 'ar' ? 'تتبع الزوار والتفاعل' : 'Track visitors and engagement'
                  }
                ].map((item, i) => (
                  <div 
                    key={i}
                    className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-purple-500/50 transition-all group"
                  >
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                    <p className="text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button 
                  onClick={() => setShowAuthModal(true)}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-12 py-7 rounded-xl shadow-2xl text-lg hover:scale-105 transition-all"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  {language === 'ar' ? 'ابدأ مشروعك' : 'Start Your Project'}
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  asChild
                  className="border-2 border-purple-500/50 text-white hover:bg-purple-500/20 px-12 py-7 rounded-xl text-lg font-bold backdrop-blur-sm"
                >
                  <a href="https://ghazi.today" target="_blank" rel="noopener noreferrer">
                    {language === 'ar' ? 'شاهد المثال الحي' : 'View Live Example'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </a>
                </Button>
              </div>

              {/* Social Proof */}
              <div className="mt-12 text-center">
                <div className="inline-flex items-center gap-6 px-6 py-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 border-2 border-slate-900 flex items-center justify-center text-white font-bold">
                        {i}
                      </div>
                    ))}
                  </div>
                  <div className="text-left">
                    <div className="text-white font-bold">
                      {language === 'ar' ? '50+ مؤثر راضٍ' : '50+ Happy Influencers'}
                    </div>
                    <div className="text-sm text-slate-400">
                      {language === 'ar' ? 'انضم إليهم اليوم' : 'Join them today'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Service 2: Custom AI Agents - INTERACTIVE DEMO SHOWCASE */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-1 mb-24">
            {/* Gradient border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 opacity-50 blur-xl" />
            
            <div className="relative bg-gradient-to-br from-slate-900 via-blue-900/50 to-slate-900 rounded-3xl p-12 backdrop-blur-xl">
              {/* Header Section */}
              <div className="text-center mb-12 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur-sm">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-bold text-blue-300">
                    {language === 'ar' ? 'تجربة تفاعلية' : 'Interactive Demo'}
                  </span>
                </div>

                <h3 className="text-5xl md:text-6xl font-black text-white">
                  {language === 'ar' ? 'وكلاء AI مخصصون لأعمالك' : 'Custom AI Agents For Your Business'}
                </h3>
                
                <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                  {language === 'ar'
                    ? 'أتمتة خدمة العملاء، المبيعات، والدعم مع وكلاء AI مدربين على بياناتك. متاح 24/7 بلغات متعددة'
                    : 'Automate customer service, sales, and support with AI agents trained on your data. Available 24/7 in multiple languages'}
                </p>

                {/* Feature Pills */}
                <div className="flex flex-wrap justify-center gap-3 pt-4">
                  {[
                    { icon: '🕒', text: language === 'ar' ? 'دعم 24/7' : '24/7 Support' },
                    { icon: '🌍', text: language === 'ar' ? 'متعدد اللغات' : 'Multi-Language' },
                    { icon: '🧠', text: language === 'ar' ? 'مدرّب على بياناتك' : 'Trained on Your Data' },
                    { icon: '🔗', text: language === 'ar' ? 'تكامل CRM' : 'CRM Integration' },
                    { icon: '📈', text: language === 'ar' ? 'يتعلم باستمرار' : 'Learns Over Time' }
                  ].map((feature, i) => (
                    <div 
                      key={i}
                      className="px-4 py-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white font-medium hover:bg-white/10 hover:scale-105 transition-all"
                    >
                      <span className="mr-2">{feature.icon}</span>
                      {feature.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* INTERACTIVE CHAT DEMO */}
              <div className="relative mb-12">
                {/* Chat Container */}
                <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-6 max-w-3xl mx-auto">
                  {/* Chat Header */}
                  <div className="flex items-center gap-3 pb-4 mb-6 border-b border-white/10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-bold">TechCorp Support AI</div>
                      <div className="flex items-center gap-2 text-xs text-green-400">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        {language === 'ar' ? 'متصل' : 'Online'}
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                    {demoMessages.map((msg, i) => (
                      <div key={i} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                        {msg.sender === 'bot' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-4 h-4 text-white" />
                          </div>
                        )}
                        {msg.sender === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                            U
                          </div>
                        )}
                        <div className={`flex-1 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                          <div className={`inline-block max-w-[80%] p-4 rounded-2xl ${
                            msg.sender === 'user' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white/10 text-white backdrop-blur-sm'
                          }`}>
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                            {msg.hasButton && (
                              <button className="mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors">
                                {language === 'ar' ? '📦 رابط التتبع' : '📦 View Tracking'}
                              </button>
                            )}
                          </div>
                          <div className={`text-xs text-slate-400 mt-1 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                            {msg.time}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-4 h-4 text-white" />
                        </div>
                        <div className="inline-block p-4 rounded-2xl bg-white/10 backdrop-blur-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" />
                            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse [animation-delay:0.2s]" />
                            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse [animation-delay:0.4s]" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={demoInput}
                      onChange={(e) => setDemoInput(e.target.value)}
                      placeholder={language === 'ar' ? 'جرّب كتابة سؤال...' : 'Try asking something...'}
                      className="w-full px-4 py-3 pr-12 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 transition-colors"
                      onClick={() => setShowAuthModal(true)}
                    />
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <ArrowRight className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  {/* Try It Notice */}
                  <p className="text-center text-xs text-slate-400 mt-3">
                    {language === 'ar' ? '💡 سجّل دخول لتجربة الوكيل بالكامل' : '💡 Sign in to try the full agent experience'}
                  </p>
                </div>
              </div>

              {/* Key Features Grid */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {[
                  {
                    icon: '🎯',
                    title: language === 'ar' ? 'توليد العملاء' : 'Lead Generation',
                    desc: language === 'ar' ? 'اجذب واحتفظ بالعملاء تلقائياً' : 'Qualify and capture leads automatically'
                  },
                  {
                    icon: '💬',
                    title: language === 'ar' ? 'دعم العملاء' : 'Customer Support',
                    desc: language === 'ar' ? 'أجب على الأسئلة 24/7' : 'Answer FAQs 24/7 instantly'
                  },
                  {
                    icon: '📅',
                    title: language === 'ar' ? 'الحجوزات' : 'Booking & Scheduling',
                    desc: language === 'ar' ? 'جدولة الاجتماعات تلقائياً' : 'Schedule meetings automatically'
                  }
                ].map((item, i) => (
                  <div 
                    key={i}
                    className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-blue-500/50 transition-all group"
                  >
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                    <p className="text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button 
                  onClick={() => setShowAuthModal(true)}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold px-12 py-7 rounded-xl shadow-2xl text-lg hover:scale-105 transition-all"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  {language === 'ar' ? 'احصل على وكيلك AI' : 'Get Your AI Agent'}
                </Button>
                <Button 
                  onClick={() => setShowAuthModal(true)}
                  variant="outline"
                  size="lg"
                  className="border-2 border-blue-500/50 text-white hover:bg-blue-500/20 px-12 py-7 rounded-xl text-lg font-bold backdrop-blur-sm"
                >
                  {language === 'ar' ? 'جرّب التجربة' : 'See Full Demo'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              {/* Social Proof */}
              <div className="mt-12 text-center">
                <div className="inline-flex items-center gap-6 px-6 py-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                  <div className="flex -space-x-3">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 border-2 border-slate-900 flex items-center justify-center text-white font-bold text-sm">
                        {i}
                      </div>
                    ))}
                  </div>
                  <div className="text-left">
                    <div className="text-white font-bold">
                      {language === 'ar' ? '100+ شركة أتمتت أعمالها' : '100+ Businesses Automated'}
                    </div>
                    <div className="text-sm text-slate-400">
                      {language === 'ar' ? 'وفّر الوقت والتكاليف اليوم' : 'Save time and costs today'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Service 3: Process Automation - Full Width Showcase */}
          <div className="w-full max-w-7xl mx-auto mb-24">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 border border-green-500/20 p-8 md:p-12">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-green-500/5" />
              
              {/* Content */}
              <div className="relative z-10">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-6">
                  <Cog className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-semibold text-green-400">
                    {language === 'ar' ? 'الخدمة المميزة' : 'Featured Service'}
                  </span>
                </div>

                {/* Heading */}
                <h3 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  {language === 'ar' ? 'أتمتة العمليات التي تعمل' : 'Process Automation That Works'}
                </h3>
                
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl">
                  {language === 'ar'
                    ? 'توقف عن إضاعة الوقت على المهام المتكررة. أتمتة سير العمل لديك بالذكاء الاصطناعي ووفر 20+ ساعة أسبوعياً.'
                    : 'Stop wasting time on repetitive tasks. Automate your workflows with AI and save 20+ hours per week.'}
                </p>

                {/* Feature Pills */}
                <div className="flex flex-wrap gap-3 mb-12">
                  {[
                    language === 'ar' ? 'الرد التلقائي على البريد' : 'Email Auto-Response',
                    language === 'ar' ? 'معالجة البيانات' : 'Data Processing',
                    language === 'ar' ? 'مزامنة التقويم' : 'Calendar Sync',
                    language === 'ar' ? 'توليد التقارير' : 'Report Generation',
                    language === 'ar' ? 'بدون كود مطلوب' : 'No-Code Required',
                  ].map((pill, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-colors duration-300"
                    >
                      {pill}
                    </div>
                  ))}
                </div>

                {/* Animated Workflow Diagram with Tooltips */}
                <TooltipProvider delayDuration={100}>
                  <div className="bg-background/50 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8 mb-8">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
                      {/* Row 1: Email -> AI Process -> CRM */}
                      <div className="flex items-center gap-4">
                        {workflowNodes.slice(0, 3).map((node, idx) => (
                          <div key={node.id} className="flex items-center gap-4">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div 
                                  className={`relative w-20 h-20 rounded-xl bg-gradient-to-br ${
                                    activeNode === idx 
                                      ? 'from-green-500 to-emerald-500 shadow-lg shadow-green-500/50 scale-110' 
                                      : 'from-green-500/20 to-emerald-500/20 hover:scale-105'
                                  } flex items-center justify-center transition-all duration-500 cursor-pointer group`}
                                  onMouseEnter={() => setHoveredNode(node.id)}
                                  onMouseLeave={() => setHoveredNode(null)}
                                >
                                  <node.icon className="w-8 h-8 text-white" />
                                  {activeNode === idx && (
                                    <div className="absolute inset-0 rounded-xl bg-green-500/30 animate-ping" />
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent 
                                side="bottom" 
                                className="max-w-xs bg-gradient-to-br from-slate-900 to-emerald-900/50 border-emerald-500/30 backdrop-blur-xl"
                              >
                                <div className="flex items-start gap-3">
                                  <node.icon className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-semibold text-white mb-1">
                                      {language === 'ar' ? node.tooltip.ar.title : node.tooltip.en.title}
                                    </p>
                                    <p className="text-sm text-gray-300">
                                      {language === 'ar' ? node.tooltip.ar.desc : node.tooltip.en.desc}
                                    </p>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                            {idx < 2 && (
                              <div className="relative">
                                <ArrowRight className={`w-6 h-6 ${activeNode === idx || activeNode === idx + 1 ? 'text-green-400' : 'text-muted-foreground'} transition-colors duration-500`} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Row 2: Secondary outputs */}
                    <div className="flex items-center justify-center gap-8 mt-8">
                      {workflowNodes.slice(3, 6).map((node, idx) => (
                        <Tooltip key={node.id}>
                          <TooltipTrigger asChild>
                            <div 
                              className={`relative w-16 h-16 rounded-lg bg-gradient-to-br ${
                                activeNode === idx + 3 
                                  ? 'from-green-500 to-emerald-500 shadow-lg shadow-green-500/50 scale-110' 
                                  : 'from-green-500/20 to-emerald-500/20 hover:scale-105'
                              } flex items-center justify-center transition-all duration-500 cursor-pointer group`}
                              onMouseEnter={() => setHoveredNode(node.id)}
                              onMouseLeave={() => setHoveredNode(null)}
                            >
                              <node.icon className="w-6 h-6 text-white" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="top" 
                            className="max-w-xs bg-gradient-to-br from-slate-900 to-green-900/50 border-green-500/30 backdrop-blur-xl"
                          >
                            <div className="flex items-start gap-3">
                              <node.icon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-semibold text-white mb-1">
                                  {language === 'ar' ? node.tooltip.ar.title : node.tooltip.en.title}
                                </p>
                                <p className="text-sm text-gray-300">
                                  {language === 'ar' ? node.tooltip.ar.desc : node.tooltip.en.desc}
                                </p>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                </TooltipProvider>

                {/* Stats Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  {[
                    { label: language === 'ar' ? 'وفر 20+ ساعة أسبوعياً' : 'Save 20+ hours/week', icon: Clock },
                    { label: language === 'ar' ? 'تخفيض 50٪ من التكاليف' : '50% cost reduction', icon: TrendingDown },
                    { label: language === 'ar' ? 'صفر أخطاء' : 'Zero errors', icon: CheckCircle2 },
                  ].map((stat, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-green-500/5 border border-green-500/20 rounded-xl px-4 py-3">
                      <stat.icon className="w-5 h-5 text-green-400" />
                      <span className="text-sm font-semibold text-foreground">{stat.label}</span>
                    </div>
                  ))}
                </div>

                {/* Feature Grid */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  {[
                    {
                      icon: Mail,
                      title: language === 'ar' ? 'البريد الإلكتروني' : 'Email',
                      desc: language === 'ar' ? 'رد تلقائي ذكي' : 'Auto-respond intelligently',
                    },
                    {
                      icon: Database,
                      title: language === 'ar' ? 'معالجة البيانات' : 'Data Processing',
                      desc: language === 'ar' ? 'أتمتة إدخال البيانات' : 'Automate data entry',
                    },
                    {
                      icon: Calendar,
                      title: language === 'ar' ? 'إدارة التقويم' : 'Calendar Management',
                      desc: language === 'ar' ? 'مزامنة الجداول تلقائياً' : 'Sync schedules automatically',
                    },
                  ].map((feature, idx) => (
                    <div key={idx} className="bg-background/50 backdrop-blur-sm border border-green-500/20 rounded-xl p-6 hover:bg-green-500/5 transition-colors duration-300">
                      <feature.icon className="w-8 h-8 text-green-400 mb-3" />
                      <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.desc}</p>
                    </div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-4 justify-center mb-6">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-green-500/50 transition-all duration-300"
                    onClick={() => setShowAuthModal(true)}
                  >
                    {language === 'ar' ? 'أتمتة عملك' : 'Automate Your Business'}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-green-500/30 hover:bg-green-500/10"
                    onClick={() => setShowCaseStudyModal(true)}
                  >
                    {language === 'ar' ? 'شاهد سير العمل' : 'See Workflows'}
                  </Button>
                </div>

                {/* Social Proof */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    <span className="text-green-400 font-semibold">200+</span>{' '}
                    {language === 'ar' ? 'عملية مؤتمتة' : 'Processes Automated'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Service 4: AYN Eng - Full Width Showcase */}
          <div className="w-full max-w-7xl mx-auto mb-24">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 border border-orange-500/20 p-8 md:p-12">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-red-500/5 to-orange-500/5" />
              
              {/* Content */}
              <div className="relative z-10">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6">
                  <Wrench className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-semibold text-orange-400">
                    {language === 'ar' ? 'قريباً' : 'COMING SOON'}
                  </span>
                </div>

                {/* Heading */}
                <h3 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                  {language === 'ar' ? 'AYN Eng: ذكاء الهندسة المدنية' : 'AYN Eng: Civil Engineering AI'}
                </h3>
                
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl">
                  {language === 'ar'
                    ? 'ذكاء اصطناعي ثوري لمهندسي البناء. أتمتة القطع والردم، تصدير DXF، وحسابات الحجم التي تتبع معايير GCC.'
                    : 'Revolutionary AI for civil engineers. Automate cut/fill analysis, DXF export, and volume calculations that follow GCC standards.'}
                </p>

                {/* Feature Pills */}
                <div className="flex flex-wrap gap-3 mb-12">
                  {[
                    language === 'ar' ? 'تحليل القطع والردم' : 'Cut/Fill Analysis',
                    language === 'ar' ? 'تصدير DXF' : 'DXF Export',
                    language === 'ar' ? 'حسابات الحجم' : 'Volume Calculations',
                    language === 'ar' ? 'معايير GCC' : 'GCC Standards',
                    language === 'ar' ? 'جاهز لـ AutoCAD' : 'AutoCAD Ready',
                  ].map((pill, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium hover:bg-orange-500/20 transition-colors duration-300"
                    >
                      {pill}
                    </div>
                  ))}
                </div>

                {/* Engineering Dashboard Preview */}
                <div className="bg-background/50 backdrop-blur-xl rounded-2xl border border-orange-500/20 p-8 mb-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Left: Terrain Analysis */}
                    <div>
                      <h4 className="text-lg font-semibold mb-4 text-orange-400">
                        {language === 'ar' ? 'تحليل التضاريس' : 'TERRAIN ANALYSIS'}
                      </h4>
                      <div className="bg-slate-950/50 rounded-lg p-6 border border-orange-500/20 h-48 flex items-end justify-center overflow-hidden relative">
                        {/* Animated terrain visualization */}
                        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-1">
                          {[...Array(20)].map((_, i) => (
                            <div
                              key={i}
                              className="w-4 bg-gradient-to-t from-orange-500 to-red-500 transition-all duration-1000"
                              style={{
                                height: `${Math.sin(i * 0.5) * 30 + 50}px`,
                                animation: 'float 3s ease-in-out infinite',
                                animationDelay: `${i * 0.1}s`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Calculation Results */}
                    <div>
                      <h4 className="text-lg font-semibold mb-4 text-orange-400">
                        {language === 'ar' ? 'نتائج الحسابات' : 'CALCULATION RESULTS'}
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-slate-950/50 rounded-lg p-4 border border-orange-500/20">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-muted-foreground">
                              {language === 'ar' ? 'حجم القطع' : 'Cut Volume'}
                            </span>
                            <span className="text-xl font-bold text-orange-400">2,450 m³</span>
                          </div>
                        </div>
                        <div className="bg-slate-950/50 rounded-lg p-4 border border-orange-500/20">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-muted-foreground">
                              {language === 'ar' ? 'حجم الردم' : 'Fill Volume'}
                            </span>
                            <span className="text-xl font-bold text-red-400">1,890 m³</span>
                          </div>
                        </div>
                        <div className="bg-slate-950/50 rounded-lg p-4 border border-orange-500/20">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-muted-foreground">
                              {language === 'ar' ? 'الصافي' : 'Net'}
                            </span>
                            <span className="text-xl font-bold text-green-400">+560 m³ (cut)</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="text-muted-foreground">
                            {language === 'ar' ? 'متوافق مع معايير GCC' : 'GCC Compliant'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Processing Pipeline */}
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                    <div className="flex items-center gap-3 bg-orange-500/5 border border-orange-500/20 rounded-xl px-4 py-3">
                      <Upload className="w-5 h-5 text-orange-400" />
                      <span className="text-sm font-medium">
                        {language === 'ar' ? 'رفع Survey.csv' : 'Upload Survey.csv'}
                      </span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-orange-400" />
                    <div className="flex items-center gap-3 bg-orange-500/5 border border-orange-500/20 rounded-xl px-4 py-3">
                      <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                      <span className="text-sm font-medium">
                        {language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                      </span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-orange-400" />
                    <div className="flex items-center gap-3 bg-orange-500/5 border border-orange-500/20 rounded-xl px-4 py-3">
                      <Download className="w-5 h-5 text-orange-400" />
                      <span className="text-sm font-medium">
                        {language === 'ar' ? 'تحميل DXF' : 'Download DXF'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  {[
                    {
                      icon: TrendingDown,
                      title: language === 'ar' ? 'تحليل المنحدرات' : 'Slope Analysis',
                    },
                    {
                      icon: Box,
                      title: language === 'ar' ? 'حساب الحجم' : 'Volume Calc',
                    },
                    {
                      icon: FileText,
                      title: language === 'ar' ? 'تصدير DXF' : 'DXF Export',
                    },
                    {
                      icon: CheckCircle2,
                      title: language === 'ar' ? 'متوافق مع GCC' : 'GCC Compliant',
                    },
                  ].map((feature, idx) => (
                    <div key={idx} className="bg-background/50 backdrop-blur-sm border border-orange-500/20 rounded-xl p-6 hover:bg-orange-500/5 transition-colors duration-300 text-center">
                      <feature.icon className="w-8 h-8 text-orange-400 mb-3 mx-auto" />
                      <h4 className="text-sm font-semibold">{feature.title}</h4>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <div className="flex justify-center mb-6">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-orange-500/50 transition-all duration-300"
                    onClick={() => setShowAuthModal(true)}
                  >
                    {language === 'ar' ? 'انضم إلى قائمة الانتظار' : 'Join Waitlist'}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>

                {/* Waitlist Counter */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    <span className="text-orange-400 font-semibold">500+</span>{' '}
                    {language === 'ar' ? 'مهندس في قائمة الانتظار' : 'Engineers on Waitlist'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <p className="text-lg text-muted-foreground mb-6">
              Ready to automate your business and scale faster?
            </p>
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              onClick={() => setShowAuthModal(true)}
            >
              <Building2 className="w-5 h-5 mr-2" />
              Let's Build Something Amazing
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

      {/* Case Studies Modal */}
      <Dialog open={showCaseStudyModal} onOpenChange={setShowCaseStudyModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-emerald-500/20">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-emerald-400" />
              {language === 'ar' ? 'دراسات حالة الأتمتة' : 'Automation Case Studies'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {language === 'ar' ? 'أمثلة حقيقية من عملائنا' : 'Real examples from our clients'}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={selectedIndustry} onValueChange={setSelectedIndustry} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-900/50">
              <TabsTrigger value="ecommerce" className="data-[state=active]:bg-emerald-600">
                <ShoppingCart className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'تجارة' : 'E-Commerce'}
              </TabsTrigger>
              <TabsTrigger value="realestate" className="data-[state=active]:bg-emerald-600">
                <Home className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'عقارات' : 'Real Estate'}
              </TabsTrigger>
              <TabsTrigger value="finance" className="data-[state=active]:bg-emerald-600">
                <DollarSign className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'مالية' : 'Finance'}
              </TabsTrigger>
              <TabsTrigger value="marketing" className="data-[state=active]:bg-emerald-600">
                <TrendingUp className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'تسويق' : 'Marketing'}
              </TabsTrigger>
            </TabsList>

            {Object.entries(caseStudies).map(([key, study]) => (
              <TabsContent key={key} value={key} className="mt-6">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0">
                      <study.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {language === 'ar' ? study.title.ar : study.title.en}
                      </h3>
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <p className="text-sm font-medium text-red-400 mb-1">
                          {language === 'ar' ? '❌ المشكلة:' : '❌ Problem:'}
                        </p>
                        <p className="text-gray-300">
                          {language === 'ar' ? study.problem.ar : study.problem.en}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Workflow Visualization */}
                  <div className="bg-gradient-to-br from-slate-900/50 to-emerald-900/20 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/20">
                    <h4 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                      <Cog className="w-5 h-5" />
                      {language === 'ar' ? 'الحل - سير العمل:' : 'Solution Workflow:'}
                    </h4>
                    <div className="grid grid-cols-6 gap-4">
                      {study.workflow.map((step, index) => (
                        <div key={index} className="flex flex-col items-center gap-2">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                            <step.icon className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-xs text-center text-gray-300">
                            {language === 'ar' ? step.label.ar : step.label.en}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Results */}
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      {language === 'ar' ? '✅ النتائج:' : '✅ Results:'}
                    </h4>
                    <ul className="space-y-2">
                      {(language === 'ar' ? study.results.ar : study.results.en).map((result, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-300">
                          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>{result}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Testimonial */}
                  <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white italic mb-2">
                          "{language === 'ar' ? study.testimonial.ar.text : study.testimonial.en.text}"
                        </p>
                        <p className="text-sm text-gray-400">
                          — {language === 'ar' ? study.testimonial.ar.author : study.testimonial.en.author}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="text-center pt-4">
                    <Button 
                      size="lg"
                      onClick={() => {
                        setShowCaseStudyModal(false);
                        setShowAuthModal(true);
                      }}
                      className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 shadow-lg hover:shadow-emerald-500/30 transition-all"
                    >
                      {language === 'ar' ? 'احصل على أتمتة مماثلة' : 'Get Similar Automation'}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>
      </div> {/* Close content wrapper */}
    </div>
  );
};

export default LandingPage;