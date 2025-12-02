import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface Phrase {
  en: string;
  ar: string;
}

export const OrbitingCards = () => {
  const { language } = useLanguage();

  const phrases: Phrase[] = [
    { en: 'Let me take care of that.', ar: '\u062f\u0639\u0646\u064a \u0623\u062a\u0648\u0644\u0649 \u0630\u0644\u0643.' },
    { en: 'Working on it…', ar: '\u062c\u0627\u0631\u0650 \u0627\u0644\u0639\u0645\u0644...' },
    { en: 'Done. What\'s next?', ar: '\u062a\u0645. \u0645\u0627\u0630\u0627 \u0628\u0639\u062f\u061f' },
    { en: 'Optimizing your workflow.', ar: '\u0623\u062d\u0633\u0651\u0646 \u0633\u064a\u0631 \u0639\u0645\u0644\u0643.' },
    { en: 'I\'ve got you covered.', ar: '\u0623\u0646\u0627 \u0641\u064a \u062e\u062f\u0645\u062a\u0643.' },
    { en: 'Consider it done.', ar: '\u0627\u0639\u062a\u0628\u0631\u0647 \u0645\u0646\u062c\u0632\u0627\u064b.' },
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
