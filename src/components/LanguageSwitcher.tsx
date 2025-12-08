import { useLanguage, Language } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check } from 'lucide-react';

interface LanguageSwitcherProps {
  onOpenChange?: (open: boolean) => void;
}

const languages: { code: Language; symbol: string }[] = [
  { code: 'en', symbol: 'EN' },
  { code: 'ar', symbol: 'AR' },
  { code: 'fr', symbol: 'FR' },
];

export const LanguageSwitcher = ({ onOpenChange }: LanguageSwitcherProps) => {
  const { language, setLanguage } = useLanguage();

  const currentLang = languages.find(l => l.code === language);

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 px-2 font-medium text-sm"
        >
          {currentLang?.symbol}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[60px] bg-popover z-50">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <span className="font-medium">{lang.symbol}</span>
            {language === lang.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
