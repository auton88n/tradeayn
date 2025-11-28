import { useState } from 'react';
import { Brain, TrendingUp, Target, BarChart3, Zap, Users, ArrowRight, Sparkles, Palette, Cog, FileSpreadsheet, MessageSquare, Building2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AuthModal } from './auth/AuthModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './theme-toggle';
import { MobileMockup } from '@/components/MobileMockup';
import { MobileMockupPhotographer } from '@/components/MobileMockupPhotographer';

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

          {/* Service 1: Influencer Portfolios - WITH DUAL MOCKUPS */}
          <div className="space-y-12 mb-24">
            {/* Service Info - Centered */}
            <div className="text-center space-y-6 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold backdrop-blur-sm">
                <Palette className="w-5 h-5" />
                Featured Service
              </div>
              
              <h2 className="text-4xl md:text-5xl font-black">
                Professional Portfolio Websites
              </h2>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                We design stunning portfolio websites that showcase your brand professionally with an AI chatbot trained on your content
              </p>

              <ul className="grid md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                {[
                  'Custom design matching your brand',
                  'AI chatbot trained on your content',
                  'Automatic social media integration',
                  'Smart contact forms',
                  'Mobile & SEO optimized',
                  'Lightning-fast performance'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-600 dark:text-purple-400 text-sm">✓</span>
                    </div>
                    <span className="text-base">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  onClick={() => setShowAuthModal(true)}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl px-8 shadow-lg"
                >
                  Start Your Project
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                
                <Button 
                  variant="outline"
                  size="lg"
                  asChild
                  className="rounded-xl px-8"
                >
                  <a href="https://ghazi.today" target="_blank" rel="noopener noreferrer">
                    View Live Example
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Mockups Side by Side */}
            <div className="grid lg:grid-cols-2 gap-12 xl:gap-16 max-w-7xl mx-auto">
              {/* Influencer Mockup */}
              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#B76E79]/10 border border-[#B76E79]/20 mb-2">
                    <Users className="w-4 h-4 text-[#B76E79]" />
                    <span className="text-sm font-bold text-[#B76E79]">Influencer Portfolio</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Perfect for content creators & influencers</p>
                </div>
                <MobileMockup />
              </div>

              {/* Photographer Mockup */}
              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-2">
                    <Target className="w-4 h-4 text-cyan-500" />
                    <span className="text-sm font-bold text-cyan-500">Professional Portfolio</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Ideal for photographers & creatives</p>
                </div>
                <MobileMockupPhotographer />
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