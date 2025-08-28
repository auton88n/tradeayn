import { useState } from 'react';
import { Brain, TrendingUp, Target, BarChart3, Zap, Users, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AuthModal } from './auth/AuthModal';

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const features = [
    {
      icon: BarChart3,
      title: "Market Research",
      description: "Get strategic business insights with comprehensive market analysis and competitive intelligence."
    },
    {
      icon: Target,
      title: "Sales Optimization", 
      description: "Optimize your sales funnel and conversion rates with data-driven recommendations."
    },
    {
      icon: TrendingUp,
      title: "Trend Analysis",
      description: "Analyze market trends and identify emerging opportunities before your competitors."
    },
    {
      icon: Zap,
      title: "Strategic Planning",
      description: "Comprehensive business consulting and strategic planning powered by advanced AI."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "CEO, TechStart",
      quote: "AYN transformed our business strategy. The insights were game-changing.",
      avatar: "👩‍💼"
    },
    {
      name: "Marcus Rodriguez", 
      role: "Founder, GrowthCo",
      quote: "The market analysis capabilities are incredibly detailed and actionable.",
      avatar: "👨‍💼"
    },
    {
      name: "Emma Thompson",
      role: "CMO, InnovateX",
      quote: "AYN's trend predictions helped us pivot our strategy at the perfect time.",
      avatar: "👩‍🚀"
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
                Features
              </a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
                Testimonials  
              </a>
            </nav>
            
            <Button 
              onClick={() => setShowAuthModal(true)}
              variant="hero"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Particle Field Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/3 to-background" />
        
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {/* Large Particles */}
          <div className="absolute top-1/6 left-1/5 w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDuration: '3s', animationDelay: '0s' }} />
          <div className="absolute top-1/4 right-1/4 w-1.5 h-1.5 rounded-full bg-accent/50 animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
          <div className="absolute top-1/3 left-1/3 w-3 h-3 rounded-full bg-primary/30 animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          
          {/* Medium Particles */}
          <div className="absolute top-2/5 right-1/6 w-1 h-1 rounded-full bg-accent/60 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-1/4 w-1.5 h-1.5 rounded-full bg-primary/45 animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '2s' }} />
          <div className="absolute top-3/5 right-1/3 w-2 h-2 rounded-full bg-accent/35 animate-bounce" style={{ animationDuration: '3.8s', animationDelay: '2.5s' }} />
          
          {/* Small Particles */}
          <div className="absolute top-2/3 left-1/6 w-0.5 h-0.5 rounded-full bg-primary/70 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '3s' }} />
          <div className="absolute top-3/4 right-1/5 w-1 h-1 rounded-full bg-accent/55 animate-bounce" style={{ animationDuration: '3.2s', animationDelay: '3.5s' }} />
          <div className="absolute top-4/5 left-1/3 w-0.5 h-0.5 rounded-full bg-primary/80 animate-bounce" style={{ animationDuration: '2.8s', animationDelay: '4s' }} />
          
          {/* Horizontal Floating Particles */}
          <div className="absolute top-1/5 left-0 w-1 h-1 rounded-full bg-accent/40 animate-pulse" style={{ animation: 'float-horizontal 8s infinite linear' }} />
          <div className="absolute top-2/5 left-0 w-1.5 h-1.5 rounded-full bg-primary/35 animate-pulse" style={{ animation: 'float-horizontal 12s infinite linear', animationDelay: '2s' }} />
          <div className="absolute top-3/5 left-0 w-0.5 h-0.5 rounded-full bg-accent/60 animate-pulse" style={{ animation: 'float-horizontal 10s infinite linear', animationDelay: '4s' }} />
          
          {/* Additional scattered particles */}
          <div className="absolute top-1/8 right-1/8 w-1 h-1 rounded-full bg-primary/50 animate-ping" style={{ animationDuration: '4s' }} />
          <div className="absolute top-7/8 left-1/8 w-1.5 h-1.5 rounded-full bg-accent/40 animate-ping" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="absolute top-5/6 right-1/7 w-0.5 h-0.5 rounded-full bg-primary/75 animate-ping" style={{ animationDuration: '3s', animationDelay: '2s' }} />
        </div>
        
        {/* Particle Trails Effect */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-32 h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="absolute top-2/3 right-1/4 w-24 h-0.5 bg-gradient-to-l from-transparent via-accent/15 to-transparent animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="animate-fade-in-up">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                Your AI-Powered
                <span className="gradient-text-hero block mt-2">
                  Business Growth Partner
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Get strategic business insights, market research, sales optimization, and trend analysis 
                - all from one intelligent AI consultant.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  onClick={() => setShowAuthModal(true)}
                  variant="hero"
                  size="xl"
                  className="group"
                >
                  Start Consulting with AYN
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Join 10,000+ growing businesses</span>
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
                    <p className="text-sm text-muted-foreground">Ready to analyze your business</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  "I can help you with market research, competitive analysis, sales optimization, and strategic planning. What would you like to explore first?"
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
              Comprehensive Business Intelligence
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              One AI agent with multiple specialized capabilities to accelerate your business growth
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card border border-border glass-hover p-6 text-center group">
                <div className="w-16 h-16 rounded-full brain-container-lg mx-auto mb-4 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-b from-transparent to-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 gradient-text">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-muted-foreground">
              See how AYN is transforming businesses worldwide
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-card border border-border p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl">{testimonial.avatar}</div>
                  <div>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic leading-relaxed">
                  "{testimonial.quote}"
                </p>
              </Card>
            ))}
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
              © 2024 AYN AI Business Consulting. All rights reserved.
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