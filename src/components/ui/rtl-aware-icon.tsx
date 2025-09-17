import { LucideIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface RTLAwareIconProps {
  icon: LucideIcon;
  className?: string;
  flipInRTL?: boolean;
}

export const RTLAwareIcon = ({ 
  icon: Icon, 
  className,
  flipInRTL = false
}: RTLAwareIconProps) => {
  const { language } = useLanguage();
  
  return (
    <Icon 
      className={cn(
        className,
        flipInRTL && language === 'ar' && "scale-x-[-1]"
      )}
    />
  );
};