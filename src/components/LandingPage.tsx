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
  const { t } = useLanguage();

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