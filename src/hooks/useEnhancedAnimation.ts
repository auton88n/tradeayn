import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export const useEnhancedAnimation = (dependency: any, delay: number = 100) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldAnimate(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [dependency, delay]);

  const getAnimationClass = (baseClass: string) => {
    if (!shouldAnimate) return '';
    
    // RTL-aware animation classes
    if (language === 'ar') {
      switch (baseClass) {
        case 'animate-slide-in-right':
          return 'animate-slide-in-left';
        case 'animate-slide-in-left':
          return 'animate-slide-in-right';
        default:
          return baseClass;
      }
    }
    
    return baseClass;
  };

  return {
    shouldAnimate,
    getAnimationClass,
    animationDelay: delay
  };
};