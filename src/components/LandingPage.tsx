import { useState, useEffect } from 'react';
import { Brain, Send, Sparkles, Palette, MessageSquare, Cog, Zap, ArrowRight } from 'lucide-react';
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

  const placeholders = language === 'ar' ? [
    'كيف أزيد إيراداتي بنسبة 30%؟',
    'حلل منافسيني في السوق',
    'اقترح استراتيجية تسويق مبتكرة',
    'كيف أحسّن تجربة العملاء؟'
  ] : [
    'How do I increase revenue by 30%?',
    'Analyze my market competitors',
    'Suggest an innovative marketing strategy',
    'How do I improve customer experience?'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3500);
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

  const services = [
    {
      title: language === 'ar' ? 'مواقع المؤثرين' : 'Influencer Sites',
      desc: language === 'ar' ? 'Portfolio مذهل مع AI' : 'Stunning portfolio with AI',
      icon: Palette,
      color: 'from-purple-500 via-pink-500 to-purple-600',
      glow: 'shadow-purple-500/50'
    },
    {
      title: language === 'ar' ? 'وكلاء AI مخصصون' : 'Custom AI Agents',
      desc: language === 'ar' ? 'أتمتة ذكية 24/7' : 'Smart automation 24/7',
      icon: MessageSquare,
      color: 'from-cyan-500 via-blue-500 to-cyan-600',
      glow: 'shadow-cyan-500/50'
    },
    {
      title: language === 'ar' ? 'أتمتة العمليات' : 'Process Automation',
      desc: language === 'ar' ? 'وفر ساعات يومياً' : 'Save hours daily',
      icon: Cog,
      color: 'from-emerald-500 via-green-500 to-emerald-600',
      glow: 'shadow-emerald-500/50'
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      {/* Animated background gradient mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
      
      {/* Floating bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full mix-blend-screen animate-float"
            style={{
              width: `${Math.random() * 300 + 50}px`,
              height: `${Math.random() * 300 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `radial-gradient(circle, ${
                ['rgba(139, 92, 246, 0.1)', 'rgba(59, 130, 246, 0.1)', 'rgba(34, 211, 238, 0.1)'][i % 3]
              } 0%, transparent 70%)`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 20}s`,
              filter: 'blur(40px)'
            }}
          />
        ))}
      </div>

      {/* Glass Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-6 mt-6">
          <div className="container mx-auto px-6 h-20 flex items-center justify-between backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl blur-lg opacity-75" />
                <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold text-white bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                AYN
              </span>
            </div>

            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <ThemeToggle />
              <Button 
                onClick={() => setShowAuthModal(true)}
                className="relative overflow-hidden bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl px-8 h-11 shadow-lg shadow-cyan-500/25 border border-white/20"
              >
                <span className="relative z-10">
                  {language === 'ar' ? 'ابدأ الآن' : 'Get Started'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-32">
        
        {/* Floating Icon with Glow */}
        <div className="mb-12 animate-bounce-slow">
          <div className="relative">
            {/* Outer glow rings */}
            <div className="absolute inset-0 rounded-full">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 animate-ping opacity-20" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 blur-2xl opacity-50 animate-pulse" />
            </div>
            {/* Icon container */}
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 flex items-center justify-center shadow-2xl border-4 border-white/20">
              <Sparkles className="w-14 h-14 text-white animate-pulse" />
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl bg-white/5 border border-white/10 mb-6">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-cyan-300">
              {language === 'ar' ? 'مدعوم بأحدث تقنيات AI' : 'Powered by Advanced AI'}
            </span>
          </div>
          
          <h1 className="text-7xl md:text-8xl font-black text-white tracking-tight mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              {language === 'ar' ? 'كيف يمكنني' : 'How can I'}
            </span>
            <br />
            <span className="text-white">
              {language === 'ar' ? 'مساعدتك؟' : 'help you?'}
            </span>
          </h1>
        </div>

        {/* Glass Service Cards */}
        <div className="flex flex-wrap justify-center gap-6 mb-16 max-w-6xl">
          {services.map((service, i) => (
            <button
              key={i}
              onClick={() => setShowAuthModal(true)}
              className="group relative w-[340px] h-[200px] rounded-3xl transition-all duration-500 hover:scale-105"
            >
              {/* Glass card */}
              <div className="absolute inset-0 backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl" />
              
              {/* Gradient glow on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-20 rounded-3xl transition-opacity duration-500 blur-xl`} />
              
              {/* Content */}
              <div className="relative h-full p-8 flex flex-col">
                {/* Icon with glow */}
                <div className="relative mb-5">
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.color} rounded-2xl blur-lg opacity-0 group-hover:opacity-75 transition-opacity`} />
                  <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center shadow-2xl ${service.glow} border border-white/20`}>
                    <service.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                {/* Text */}
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                  {service.title}
                </h3>
                <p className="text-slate-300 group-hover:text-white transition-colors">
                  {service.desc}
                </p>

                {/* Arrow indicator */}
                <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-6 h-6 text-cyan-400" />
                </div>
              </div>

              {/* Shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 rounded-3xl" />
            </button>
          ))}
        </div>

        {/* Glass Input Container */}
        <div className="w-full max-w-4xl">
          {/* Mode selector */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl backdrop-blur-2xl bg-white/5 border border-white/10 shadow-lg">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-emerald-400 blur-sm" />
                <div className="relative w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-sm font-semibold text-slate-200">
                {language === 'ar' ? 'الوضع العام' : 'General Mode'}
              </span>
            </div>
          </div>

          {/* Input container with glass effect */}
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-[2px] bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-3xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500" />
            
            {/* Glass container */}
            <div className="relative backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-5 shadow-2xl">
              <div className="flex items-end gap-4">
                {/* Textarea */}
                <div className="relative flex-1">
                  <Textarea
                    value={demoInput}
                    onChange={(e) => setDemoInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder=""
                    rows={1}
                    className="w-full resize-none bg-transparent border-0 text-lg text-white placeholder-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[56px] max-h-[200px]"
                  />
                  
                  {/* Typewriter Placeholder */}
                  {showPlaceholder && !demoInput.trim() && (
                    <div className="absolute top-4 left-4 pointer-events-none">
                      <TypewriterText
                        key={`${placeholderIndex}-${language}`}
                        text={placeholders[placeholderIndex]}
                        speed={50}
                        className="text-slate-400 text-lg"
                        showCursor={true}
                      />
                    </div>
                  )}
                </div>

                {/* Send Button with neon glow */}
                <Button
                  onClick={handleDemoSend}
                  disabled={!demoInput.trim()}
                  className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-700 disabled:opacity-40 flex-shrink-0 shadow-2xl shadow-cyan-500/50 border border-white/20 group-hover:shadow-cyan-500/75 transition-all"
                >
                  <Send className="w-6 h-6" />
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 rounded-2xl" />
                </Button>
              </div>
            </div>
          </div>

          {/* Helper text */}
          <p className="text-center text-sm text-slate-400 mt-6">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              {language === 'ar' 
                ? 'جرّب مجاناً - بدون بطاقة ائتمان' 
                : 'Try for free - no credit card needed'}
            </span>
          </p>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        open={showAuthModal} 
        onOpenChange={() => setShowAuthModal(false)}
        prefilledMessage={demoInput}
      />

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
          }
          25% {
            transform: translateY(-20px) translateX(10px) scale(1.05);
          }
          50% {
            transform: translateY(-10px) translateX(-10px) scale(1);
          }
          75% {
            transform: translateY(-30px) translateX(5px) scale(0.95);
          }
        }
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-float {
          animation: float ease-in-out infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
