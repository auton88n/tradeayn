import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

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
      <Languages className="h-4 w-4" />
      <span className="sr-only">
        {language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
      </span>
    </Button>
  );
};
