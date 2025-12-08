import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface LandingChatInputProps {
  onSendAttempt: (message: string) => void;
}

const placeholdersEN = ["Ask AYN anything...", "What's on your mind?", "How can I help you today?"];
const placeholdersAR = ["اسأل AYN أي شيء...", "ما الذي يشغل بالك؟", "كيف يمكنني مساعدتك؟"];

export const LandingChatInput: React.FC<LandingChatInputProps> = ({ onSendAttempt }) => {
  const { language } = useLanguage();
  const [inputMessage, setInputMessage] = useState('');
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const placeholders = language === 'ar' ? placeholdersAR : placeholdersEN;

  // Rotate placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
        setShowPlaceholder(true);
      }, 200);
    }, 4000);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputMessage]);

  const handleSend = () => {
    const trimmed = inputMessage.trim();
    if (trimmed) {
      onSendAttempt(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.4, ease: [0.32, 0.72, 0, 1] }}
      className="w-full max-w-xl mx-auto mt-8 md:mt-12 px-4"
    >
      <div
        className={cn(
          "relative flex items-end gap-2 p-3 rounded-2xl",
          "bg-background/80 backdrop-blur-xl",
          "border border-border/50",
          "shadow-lg shadow-black/5",
          "transition-all duration-300",
          "hover:border-border hover:shadow-xl"
        )}
      >
        {/* Textarea */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder=""
            className={cn(
              "resize-none border-0 bg-transparent p-2 min-h-[44px] max-h-[120px]",
              "focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
              "text-base placeholder:text-muted-foreground/60",
              language === 'ar' && "text-right"
            )}
            rows={1}
          />
          
          {/* Animated placeholder */}
          {!inputMessage && (
            <div 
              className={cn(
                "absolute top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/60",
                "transition-opacity duration-200",
                showPlaceholder ? "opacity-100" : "opacity-0",
                language === 'ar' ? "right-2" : "left-2"
              )}
            >
              {placeholders[currentPlaceholder]}
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-xl",
            "flex items-center justify-center",
            "bg-foreground text-background",
            "transition-all duration-200",
            "hover:scale-105 hover:shadow-lg",
            "active:scale-95",
            inputMessage.trim() ? "opacity-100" : "opacity-50"
          )}
        >
          <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>
      
      {/* Hint text */}
      <p className="text-center text-sm text-muted-foreground/60 mt-3">
        {language === 'ar' ? 'اضغط Enter للبدء' : 'Press Enter to get started'}
      </p>
    </motion.div>
  );
};
