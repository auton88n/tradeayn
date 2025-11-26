import { Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './theme-toggle';
import { useState } from 'react';
import { AuthModal } from './auth/AuthModal';
import { Link } from 'react-router-dom';

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout = ({ children }: PageLayoutProps) => {
  const { language } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <Brain className="w-5 h-5 text-black" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">AYN</span>
            </Link>
            
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

      {/* Page Content */}
      <main className="pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-black text-white border-t border-white/10 py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <Brain className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-bold">AYN</span>
            </Link>
            <div className="text-white/60">
              © 2024 AYN AI. {language === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
            </div>
            <div className="flex items-center gap-6">
              <Link to="/contact" className="text-white/60 hover:text-white transition-colors">
                {language === 'ar' ? 'الخصوصية' : 'Privacy'}
              </Link>
              <Link to="/contact" className="text-white/60 hover:text-white transition-colors">
                {language === 'ar' ? 'الشروط' : 'Terms'}
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
      />
    </div>
  );
};

export default PageLayout;
