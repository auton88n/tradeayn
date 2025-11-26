import { useState, useEffect } from 'react';
import { Brain, Send, Sparkles, Palette, MessageSquare, Cog } from 'lucide-react';
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
    'اقترح استراتيجية تسويق',
    'كيف أحسّن تجربة العملاء؟'
  ] : [
    'How do I increase revenue by 30%?',
    'Analyze my market competitors',
    'Suggest a marketing strategy',
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
      title: language === 'ar' ? 'مواقع احترافية للمؤثرين' : 'Professional Influencer Sites',
      desc: language === 'ar' ? 'موقع portfolio مذهل مع AI' : 'Stunning portfolio with AI',
      icon: Palette,
      gradient: 'from-violet-600 to-purple-600',
      bgGradient: 'from-violet-500/20 to-purple-500/20'
    },
    {
      title: language === 'ar' ? 'وكلاء AI مخصصون' : 'Custom AI Agents',
      desc: language === 'ar' ? 'أتمتة ذكية 24/7' : 'Smart automation 24/7',
      icon: MessageSquare,
      gradient: 'from-blue-600 to-cyan-600',
      bgGradient: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      title: language === 'ar' ? 'أتمتة كاملة للعمليات' : 'Complete Process Automation',
      desc: language === 'ar' ? 'وفر ساعات كل يوم' : 'Save hours every day',
      icon: Cog,
      gradient: 'from-emerald-600 to-green-600',
      bgGradient: 'from-emerald-500/20 to-green-500/20'
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      
      {/* Gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">AYN</span>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button 
              onClick={() => setShowAuthModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl px-6 h-11 shadow-lg shadow-blue-500/25"
            >
              {language === 'ar' ? 'ابدأ الآن' : 'Get Started'}
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content - Centered */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-24">
        
        {/* Top Icon */}
        <div className="mb-10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl blur-2xl opacity-50" />
            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-6">
          <p className="text-slate-400 text-lg mb-3">
            {language === 'ar' ? 'مرحباً بك في AYN AI' : 'Welcome to AYN AI'}
          </p>
          <h1 className="text-7xl md:text-8xl font-black text-white tracking-tight">
            {language === 'ar' ? 'كيف يمكنني مساعدتك؟' : 'How can I help you?'}
          </h1>
        </div>

        {/* Service Cards */}
        <div className="flex flex-wrap justify-center gap-5 mb-16 max-w-5xl mt-12">
          {services.map((service, i) => (
            <button
              key={i}
              onClick={() => setShowAuthModal(true)}
              className="group relative w-[320px] h-[180px] rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${service.bgGradient} backdrop-blur-xl border border-white/10`} />
              
              {/* Content */}
              <div className="relative h-full p-7 flex flex-col">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                  <service.icon className="w-7 h-7 text-white" />
                </div>
                
                {/* Text */}
                <h3 className="text-xl font-bold text-white mb-2">
                  {service.title}
                </h3>
                <p className="text-sm text-slate-300">
                  {service.desc}
                </p>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>

        {/* Input Section */}
        <div className="w-full max-w-4xl">
          {/* Mode indicator */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-medium text-slate-300">
                {language === 'ar' ? 'الوضع العام' : 'General Mode'}
              </span>
            </div>
          </div>

          {/* Input Container */}
          <div className="relative">
            <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-4 shadow-2xl">
              <div className="flex items-end gap-4">
                {/* Textarea */}
                <div className="relative flex-1">
                  <Textarea
                    value={demoInput}
                    onChange={(e) => setDemoInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder=""
                    rows={1}
                    className="w-full resize-none bg-transparent border-0 text-lg text-white placeholder-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[52px] max-h-[200px] pr-4"
                  />
                  
                  {/* Typewriter Placeholder */}
                  {showPlaceholder && !demoInput.trim() && (
                    <div className="absolute top-4 left-4 pointer-events-none">
                      <TypewriterText
                        key={`${placeholderIndex}-${language}`}
                        text={placeholders[placeholderIndex]}
                        speed={50}
                        className="text-slate-500 text-lg"
                        showCursor={true}
                      />
                    </div>
                  )}
                </div>

                {/* Send Button */}
                <Button
                  onClick={handleDemoSend}
                  disabled={!demoInput.trim()}
                  className="h-[52px] w-[52px] rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-40 disabled:hover:from-blue-600 disabled:hover:to-purple-600 flex-shrink-0 shadow-lg shadow-blue-500/25"
                >
                  <Send className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </div>

          {/* Helper text */}
          <p className="text-center text-sm text-slate-500 mt-5">
            {language === 'ar' 
              ? 'جرّب مجاناً - بدون بطاقة ائتمان ✨' 
              : 'Try for free - no credit card needed ✨'}
          </p>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
        prefilledMessage={demoInput}
      />
    </div>
  );
}
