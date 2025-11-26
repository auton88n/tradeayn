import { useState, useEffect } from 'react';
import { Brain, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AuthModal } from './auth/AuthModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './theme-toggle';
import { TypewriterText } from '@/components/TypewriterText';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [demoInput, setDemoInput] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const { language } = useLanguage();

  // Demo placeholder suggestions
  const placeholders = language === 'ar' 
    ? ['زيادة الإيرادات؟', 'تحليل المنافسين', 'استراتيجية تسويق', 'تحسين المبيعات؟']
    : ['Increase revenue?', 'Analyze competitors', 'Marketing strategy', 'Boost sales?'];

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

  return (
    <div className="min-h-screen">
      {/* Navigation Header - Transparent */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <Brain className="w-5 h-5 text-black" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">AYN</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/features" className="text-white/60 hover:text-white transition-colors">
                {language === 'ar' ? 'المميزات' : 'Features'}
              </Link>
              <Link to="/services" className="text-white/60 hover:text-white transition-colors">
                {language === 'ar' ? 'الخدمات' : 'Services'}
              </Link>
              <Link to="/contact" className="text-white/60 hover:text-white transition-colors">
                {language === 'ar' ? 'اتصل بنا' : 'Contact'}
              </Link>
            </nav>
            
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <ThemeToggle />
              <Button 
                onClick={() => setShowAuthModal(true)} 
                className="backdrop-blur-xl bg-white/10 text-white border border-white/20 hover:bg-white/20"
              >
                {language === 'ar' ? 'ابدأ الآن' : 'Get Started'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Interactive Demo - Black Background */}
      <section id="home" className="relative min-h-screen bg-black text-white pt-20 overflow-hidden">
        {/* Subtle blur orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-black leading-tight text-center mb-6 tracking-tight">
            <span className="block bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
              {language === 'ar' ? 'مستشارك الذكي' : 'Your AI Business'}
            </span>
            <span className="block text-white/80 mt-2">
              {language === 'ar' ? 'في الأعمال' : 'Consultant'}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/60 max-w-3xl mx-auto text-center mb-12">
            {language === 'ar' 
              ? 'اسأل أي سؤال عن عملك واحصل على إجابات فورية مدعومة بالذكاء الاصطناعي'
              : 'Ask any question about your business and get instant AI-powered answers'
            }
          </p>

          {/* Interactive Demo Input */}
          <div className="w-full max-w-4xl mb-8">
            <div className="relative group">
              <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-3 hover:border-white/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 px-4 py-2 rounded-2xl bg-white/10 text-white text-sm font-semibold">
                    {language === 'ar' ? 'عام' : 'General'}
                  </div>

                  <div className="relative flex-1">
                    <Textarea
                      value={demoInput}
                      onChange={(e) => setDemoInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder=""
                      rows={1}
                      className="w-full resize-none border-0 bg-transparent text-lg focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[56px] max-h-[200px] text-white"
                      unstyled
                    />
                    
                    {showPlaceholder && !demoInput.trim() && (
                      <div className="absolute top-4 left-4 pointer-events-none">
                        <TypewriterText
                          key={`${placeholderIndex}-${language}`}
                          text={placeholders[placeholderIndex]}
                          speed={50}
                          className="text-white/40 text-lg"
                          showCursor={true}
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleDemoSend}
                    disabled={!demoInput.trim()}
                    size="lg"
                    className="flex-shrink-0 h-14 w-14 rounded-2xl bg-white text-black hover:bg-white/90 disabled:opacity-50"
                  >
                    <Send className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setDemoInput(language === 'ar' ? 'زيادة المبيعات' : 'Increase sales')}
              className="rounded-full bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              💡 {language === 'ar' ? 'زيادة المبيعات' : 'Increase sales'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setDemoInput(language === 'ar' ? 'تحليل المنافسين' : 'Analyze competitors')}
              className="rounded-full bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              🎯 {language === 'ar' ? 'تحليل المنافسين' : 'Analyze competitors'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setDemoInput(language === 'ar' ? 'استراتيجية تسويق' : 'Marketing strategy')}
              className="rounded-full bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              📊 {language === 'ar' ? 'استراتيجية تسويق' : 'Marketing strategy'}
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">10,000+</div>
              <div className="text-white/60">
                {language === 'ar' ? 'شركة تستخدم AYN' : 'Businesses Using AYN'}
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">98%</div>
              <div className="text-white/60">
                {language === 'ar' ? 'نسبة الرضا' : 'Satisfaction Rate'}
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-white/60">
                {language === 'ar' ? 'دعم متاح' : 'Support Available'}
              </div>
            </div>
          </div>
        </div>
      </section>

      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
        prefilledMessage={demoInput}
        message={language === 'ar' 
          ? 'سجّل الدخول لمتابعة محادثتك مع AYN'
          : 'Sign in to continue your conversation with AYN'
        }
      />
    </div>
  );
};

export default LandingPage;
