import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { AuthModal } from '@/components/auth/AuthModal';
import PageLayout from '@/components/PageLayout';
import { ScrollAnimation } from '@/components/ScrollAnimation';

const Contact = () => {
  const { language } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <PageLayout>
      <section className="py-24 bg-white text-black min-h-screen">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <ScrollAnimation variant="fadeUp">
            <h2 className="text-5xl font-bold mb-4 tracking-tight">
              {language === 'ar' ? 'ابدأ اليوم' : 'Start Today'}
            </h2>
            <p className="text-xl text-black/60 mb-12">
              {language === 'ar' ? 'انضم لآلاف الشركات التي تنمو مع AYN' : 'Join thousands of businesses growing with AYN'}
            </p>
          </ScrollAnimation>

          <ScrollAnimation variant="scaleIn" delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto mb-4">
              <input 
                type="email" 
                placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'} 
                className="flex-1 px-6 py-4 rounded-full border-2 border-black/20 focus:outline-none focus:border-black transition-colors bg-white text-black" 
              />
              <Button 
                onClick={() => setShowAuthModal(true)} 
                size="lg" 
                className="bg-black text-white hover:bg-black/90 hover:scale-105 rounded-full px-8 transition-all"
              >
                {language === 'ar' ? 'ابدأ مجاناً' : 'Get Started Free'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
            <p className="text-sm text-black/40">
              {language === 'ar' ? 'لا حاجة لبطاقة ائتمان' : 'No credit card required'}
            </p>
          </ScrollAnimation>
        </div>
      </section>

      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
      />
    </PageLayout>
  );
};

export default Contact;
