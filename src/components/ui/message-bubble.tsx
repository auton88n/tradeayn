import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface MessageBubbleProps {
  children: ReactNode;
  sender: 'user' | 'ayn';
  className?: string;
}

export const MessageBubble = ({ 
  children, 
  sender, 
  className 
}: MessageBubbleProps) => {
  const { language } = useLanguage();
  
  return (
    <div 
      className={cn(
        "max-w-[80%] rounded-2xl p-4 shadow-sm relative group transition-all duration-200 hover:shadow-md",
        sender === 'user' 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted text-muted-foreground",
        sender === 'user' && language === 'ar' && "mr-auto",
        sender === 'user' && language === 'en' && "ml-auto",
        sender === 'ayn' && language === 'ar' && "ml-auto",
        sender === 'ayn' && language === 'en' && "mr-auto",
        language === 'ar' && "font-arabic text-right",
        className
      )}
      style={{
        direction: language === 'ar' ? 'rtl' : 'ltr'
      }}
    >
      {children}
    </div>
  );
};