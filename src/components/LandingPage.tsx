import { useState } from 'react';
import { Brain, TrendingUp, Target, BarChart3, Zap, Users, ArrowRight, Sparkles, Palette, Cog, FileSpreadsheet, MessageSquare, Building2, ExternalLink, MessageCircle } from 'lucide-react';
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
                      <span className="text-sm text-slate-300 font-medium">sarah.aynn.io</span>
                    </div>
                  </div>

                  {/* Live Website iframe */}
                  <div className="relative w-full bg-white rounded-lg overflow-hidden shadow-2xl" style={{ height: '600px' }}>
                    <iframe
                      src="https://sarah.aynn.io"
                      className="w-full h-full border-0"
                      title="Sarah.Aynn.io Portfolio"
                      loading="lazy"
                    />
                    
                    {/* Overlay on hover with "View Live" */}
                    <a
                      href="https://sarah.aynn.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-purple-900/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                    >
                      <div className="text-center space-y-4">
                        <div className="text-6xl">🚀</div>
                        <div className="text-3xl font-black text-white">
                          View Live Website
                        </div>
                        <div className="px-6 py-3 bg-white text-purple-900 rounded-xl font-bold inline-flex items-center gap-2 shadow-xl">
                          <MessageCircle className="w-5 h-5" />
                          sarah.aynn.io
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
                <a href="https://sarah.aynn.io" target="_blank" rel="noopener noreferrer">
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

          {/* Services Grid - Remaining Services */}
          <div className="grid md:grid-cols-2 gap-8">

            {/* Service 2: Custom AI Agents */}
            <div className="group relative p-8 rounded-2xl bg-card border border-border hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-7 h-7 text-blue-500" />
                </div>
                
                <h3 className="text-2xl font-bold mb-3">Custom AI Agents</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Your business is unique. Your AI should be too. We build intelligent agents tailored to your workflows—handling customer support, lead qualification, appointment booking, and more while you focus on what matters.
                </p>
                
                <ul className="space-y-2 mb-6 text-sm">
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
                
                <p className="text-sm font-medium text-blue-500">
                  From lead generation to customer service—fully automated
                </p>
              </div>
            </div>

            {/* Service 3: Business Automation */}
            <div className="group relative p-8 rounded-2xl bg-card border border-border hover:border-green-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/10 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Cog className="w-7 h-7 text-green-500" />
                </div>
                
                <h3 className="text-2xl font-bold mb-3">Process Automation</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Stop wasting time on repetitive tasks. We analyze your operations, identify bottlenecks, and deploy smart automation that saves hours every day—no coding required from your team.
                </p>
                
                <ul className="space-y-2 mb-6 text-sm">
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
                
                <p className="text-sm font-medium text-green-500">
                  Your team focuses on growth, not grunt work
                </p>
              </div>
            </div>

            {/* Service 4: AYN Eng (Teaser) */}
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-500/30 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-1 md:col-span-2 lg:col-span-3">
              <div className="relative z-10 text-center max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 text-sm font-bold mb-4">
                  <FileSpreadsheet className="w-4 h-4" />
                  COMING SOON
                </div>
                
                <h3 className="text-3xl font-bold mb-4">AYN Eng: Civil Engineering AI</h3>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed max-w-2xl mx-auto">
                  Revolutionary AI for civil engineers. Upload survey data, get instant cut/fill analysis, AutoCAD-ready DXF files, and engineering reports that follow Saudi and GCC standards—all in seconds, not hours.
                </p>
                
                <div className="flex flex-wrap justify-center gap-3 text-sm">
                  <span className="px-4 py-2 rounded-full bg-background/50 border border-orange-500/30">
                    Slope Analysis
                  </span>
                  <span className="px-4 py-2 rounded-full bg-background/50 border border-orange-500/30">
                    Volume Calculations
                  </span>
                  <span className="px-4 py-2 rounded-full bg-background/50 border border-orange-500/30">
                    DXF Export
                  </span>
                  <span className="px-4 py-2 rounded-full bg-background/50 border border-orange-500/30">
                    GCC Compliance
                  </span>
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
    </div>
  );
};

export default LandingPage;