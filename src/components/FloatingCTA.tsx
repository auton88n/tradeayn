import { motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export const FloatingCTA = ({ onGetStarted }: { onGetStarted: () => void }) => {
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      onClick={onGetStarted}
      className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-6 py-3 rounded-full backdrop-blur-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-2xl hover:shadow-blue-500/50 hover:scale-105 transition-all group"
    >
      <span>{language === 'ar' ? 'ابدأ الآن' : 'Get Started'}</span>
      <ArrowUp className="w-4 h-4 group-hover:translate-y-[-2px] transition-transform" />
    </motion.button>
  );
};
