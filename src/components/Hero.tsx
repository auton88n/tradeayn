import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { AIEye } from './AIEye';
import { OrbitingCards } from './OrbitingCards';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

interface HeroProps {
  onGetStarted: () => void;
}

export const Hero = ({ onGetStarted }: HeroProps) => {
  const { language } = useLanguage();

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 overflow-hidden">
      {/* Clean background - no heavy orbs */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/10" />
      
      {/* Single subtle glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-foreground/[0.02] blur-[120px] pointer-events-none" />

      {/* Content container - vertically centered */}
      <div className="relative z-10 flex flex-col items-center gap-16 max-w-7xl mx-auto w-full">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          className="text-center space-y-4"
        >
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tight text-foreground">
            {language === 'ar' ? (
              <>تعرّف على <span className="text-neutral-500 dark:text-neutral-400">AYN</span></>
            ) : (
              <>Meet <span className="text-neutral-500 dark:text-neutral-400">AYN</span></>
            )}
          </h1>
          <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-300 max-w-lg mx-auto font-light">
            {language === 'ar'
              ? 'الذكاء الاصطناعي الذي يرى، يسمع، ويفهم عالمك'
              : 'The AI that sees, listens, and understands your world.'}
          </p>
        </motion.div>

        {/* AI Eye + Orbiting Cards Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
          className="relative w-full max-w-2xl h-[500px] md:h-[600px] flex items-center justify-center"
        >
          <OrbitingCards />
          <AIEye />
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.32, 0.72, 0, 1] }}
        >
          <Button
            onClick={onGetStarted}
            size="lg"
            className="h-14 px-10 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            {language === 'ar' ? 'جرّب AYN الآن' : 'Experience AYN'}
            <ArrowRight className={language === 'ar' ? 'mr-3 w-5 h-5' : 'ml-3 w-5 h-5'} />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
