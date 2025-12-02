import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

interface LanguageSwitcherProps {
  onOpenChange?: (open: boolean) => void;
}

export const LanguageSwitcher = ({ onOpenChange }: LanguageSwitcherProps) => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-8 w-8 p-0"
      onClick={toggleLanguage}
    >
      <span className="text-base">{language === 'en' ? '🇺🇸' : '🇸🇦'}</span>
      <span className="sr-only">
        {language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
      </span>
    </Button>
  );
};
