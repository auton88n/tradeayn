import { useState, useEffect } from 'react';
import { Brain, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AuthModal } from './auth/AuthModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './theme-toggle';
import { TypewriterText } from '@/components/TypewriterText';

export default function LandingPage() {
  const { language } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [demoInput, setDemoInput] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  // Placeholders
  const placeholders = language === 'ar' ? [
    'كيف أزيد إيراداتي؟',
    'حلل منافسيني',
    'اقترح استراتيجية تسويق'
  ] : [
    'How do I increase revenue?',
    'Analyze my competitors',
    'Suggest marketing strategy'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  useEffect(() => {
    setShowPlaceholder(!demoInput.trim());
  }, [demoInput]);

  const handleDemoSend = () => {
    if (!demoInput.trim()) return;
    sessionStorage.setItem('prefilledMessage', demoInput);
    setShowAuthModal(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleDemoSend();
    }
  };

  // Service cards data
  const services = [
    {
      title: language === 'ar' ? 'مواقع المؤثرين' : 'Influencer Portfolio',
      subtitle: language === 'ar' ? 'موقع احترافي مع AI' : 'Professional site with AI',
      gradient: 'from-purple-500/80 via-blue-500/80 to-purple-600/80',
      image: '🎨'
    },
    {
      title: language === 'ar' ? 'وكلاء AI مخصصون' : 'Custom AI Agents',
      subtitle: language === 'ar' ? 'أتمتة ذكية لعملك' : 'Smart automation for business',
      gradient: 'from-cyan-400/80 via-blue-400/80 to-purple-400/80',
      image: '🤖'
    },
    {
      title: language === 'ar' ? 'أتمتة العمليات' : 'Process Automation',
      subtitle: language === 'ar' ? 'وفر ساعات كل يوم' : 'Save hours every day',
      gradient: 'from-orange-400/80 via-pink-400/80 to-purple-500/80',
      image: '⚙️'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/50 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">AYN</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button 
              onClick={() => setShowAuthModal(true)}
              className="bg-white text-slate-900 hover:bg-white/90 font-semibold rounded-lg px-6"
            >
              {language === 'ar' ? 'ابدأ الآن' : 'Get Started'}
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content - Centered */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 pt-24 pb-16">
        {/* Top Badge with Icon */}
        <div className="mb-8 animate-in fade-in slide-in-from-top duration-700">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mb-6 mx-auto relative">
            <Sparkles className="w-10 h-10 text-white" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl blur-2xl opacity-50" />
          </div>
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top duration-700 delay-100">
          <p className="text-lg text-slate-400 mb-3">
            {language === 'ar' ? 'مرحباً بك في AYN AI' : 'Welcome to AYN AI'}
          </p>
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
            {language === 'ar' ? 'كيف يمكنني المساعدة؟' : 'How can I help?'}
          </h1>
        </div>

        {/* Service Cards */}
        <div className="flex flex-wrap justify-center gap-6 mb-12 max-w-5xl animate-in fade-in slide-in-from-bottom duration-700 delay-200">
          {services.map((service, i) => (
            <div
              key={i}
              onClick={() => setShowAuthModal(true)}
              className="group relative w-[280px] h-[160px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient}`} />
              
              {/* Content */}
              <div className="relative h-full p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-1 text-white">
                    {service.title}
                  </h3>
                  <p className="text-sm text-white/80">
                    {service.subtitle}
                  </p>
                </div>
                
                {/* Visual element */}
                <div className="text-5xl opacity-20 absolute bottom-4 right-4">
                  {service.image}
                </div>
              </div>

              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-white/10 to-transparent" />
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom duration-700 delay-300">
          {/* Mode selector */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-purple-600" />
              <span className="text-sm font-medium">
                {language === 'ar' ? 'نمط عام' : 'General Mode'}
              </span>
            </div>
          </div>

          {/* Input container */}
          <div className="relative group">
            {/* Subtle glow on hover */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-lg transition-opacity" />
            
            <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4 group-hover:border-slate-600/50 transition-colors">
              <div className="flex items-end gap-3">
                {/* Textarea */}
                <div className="relative flex-1">
                  <Textarea
                    value={demoInput}
                    onChange={(e) => setDemoInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder=""
                    rows={1}
                    className="w-full resize-none bg-transparent border-0 text-base text-white placeholder-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[44px] max-h-[200px]"
                  />
                  
                  {/* Typewriter placeholder */}
                  {showPlaceholder && !demoInput.trim() && (
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <TypewriterText
                        key={`${placeholderIndex}-${language}`}
                        text={placeholders[placeholderIndex]}
                        speed={50}
                        className="text-slate-400 text-base"
                        showCursor={true}
                      />
                    </div>
                  )}
                </div>

                {/* Send button */}
                <Button
                  onClick={handleDemoSend}
                  disabled={!demoInput.trim()}
                  size="icon"
                  className="h-11 w-11 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:hover:bg-slate-700 flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom stats/info */}
        <div className="mt-12 text-center animate-in fade-in slide-in-from-bottom duration-700 delay-400">
          <p className="text-sm text-slate-400">
            {language === 'ar' 
              ? '✨ جرّب مجاناً - لا حاجة لبطاقة ائتمان' 
              : '✨ Try free - no credit card required'}
          </p>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
        prefilledMessage={demoInput}
      />

      {/* CSS for animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in-from-top {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slide-in-from-bottom {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-in {
          animation-fill-mode: both;
        }
        .fade-in {
          animation-name: fade-in;
        }
        .slide-in-from-top {
          animation-name: slide-in-from-top;
        }
        .slide-in-from-bottom {
          animation-name: slide-in-from-bottom;
        }
        .duration-700 {
          animation-duration: 700ms;
        }
        .delay-100 {
          animation-delay: 100ms;
        }
        .delay-200 {
          animation-delay: 200ms;
        }
        .delay-300 {
          animation-delay: 300ms;
        }
        .delay-400 {
          animation-delay: 400ms;
        }
      `}</style>
    </div>
  );
}
