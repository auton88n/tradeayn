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

  const cardCount = 6;
  const radius = 180;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Single rotating container - much more performant */}
      <div 
        className="absolute animate-orbit-slow will-change-transform"
        style={{ 
          width: radius * 2, 
          height: radius * 2,
        }}
      >
        {phrases.slice(0, cardCount).map((phrase, index) => {
          const angle = (index / cardCount) * 360;
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;

          return (
            <div
              key={index}
              className="absolute animate-counter-orbit will-change-transform"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(${x - 100}px, ${y - 20}px)`,
              }}
            >
              <div className="orbit-card pointer-events-auto px-5 py-3 max-w-[200px]">
                <p className="text-sm text-foreground/80 text-center leading-relaxed">
                  {language === 'ar' ? phrase.ar : phrase.en}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
