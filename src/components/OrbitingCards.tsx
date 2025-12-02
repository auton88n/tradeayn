import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface Phrase {
  en: string;
  ar: string;
}

export const OrbitingCards = () => {
  const { language } = useLanguage();

  const phrases: Phrase[] = [
    { en: 'Let me take care of that.', ar: 'اترك الأمر لي.' },
    { en: 'Working on it…', ar: 'جارٍ العمل...' },
    { en: 'Done. What\'s next?', ar: 'تمّ. ماذا بعد؟' },
    { en: 'Optimizing your workflow.', ar: 'أُحسّن سير عملك.' },
    { en: 'I\'ve got you covered.', ar: 'معك في كل خطوة.' },
    { en: 'Consider it done.', ar: 'اعتبرها منجزة.' },
  ];

  // Orbit settings
  const radius = 180; // Distance from center
  const cardCount = 6;
  const rotationDuration = 40; // Smooth, slow rotation

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {phrases.slice(0, cardCount).map((phrase, index) => {
        const angle = (index / cardCount) * 360;

        return (
          <motion.div
            key={index}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
            }}
            animate={{
              rotate: [angle, angle + 360],
            }}
            transition={{
              duration: rotationDuration,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {/* Position card at orbit radius */}
            <motion.div
              style={{
                x: Math.cos((angle * Math.PI) / 180) * radius,
                y: Math.sin((angle * Math.PI) / 180) * radius,
              }}
              animate={{
                rotate: [-angle, -angle - 360],
              }}
              transition={{
                duration: rotationDuration,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              {/* Card with premium glassmorphism */}
              <div className="orbit-card pointer-events-auto px-5 py-3 max-w-[200px]">
                <p className="text-sm text-foreground/80 text-center leading-relaxed">
                  {language === 'ar' ? phrase.ar : phrase.en}
                </p>
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
};
