import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, Plus, ChevronDown, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface LandingChatInputProps {
  onSendAttempt: (message: string) => void;
}

const placeholders = ["What's on your mind?", "Ask AYN anything...", "How can I help you today?"];

export const LandingChatInput: React.FC<LandingChatInputProps> = ({ onSendAttempt }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  }, []);

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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: 0.4,
        ease: [0.22, 1, 0.36, 1]
      }}
      className="w-full max-w-xl mx-auto mt-8 md:mt-12 px-4"
    >
      <div
        dir="ltr"
        className={cn(
          "relative rounded-2xl overflow-hidden",
          "bg-background/95 backdrop-blur-xl",
          "border border-border/50",
          "shadow-lg shadow-black/5",
          "transition-all duration-300",
          "hover:border-border hover:shadow-xl"
        )}
      >
        {/* Row 1: Input Area */}
        <div className="flex items-end gap-2 px-4 pt-3 pb-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder=""
              className={cn(
                "resize-none border-0 bg-transparent p-0 min-h-[44px] max-h-[120px]",
                "focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                "text-base placeholder:text-muted-foreground/60"
              )}
              rows={1}
            />
            
            {/* Animated placeholder */}
            {!inputMessage && (
              <div 
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 left-0 pointer-events-none text-muted-foreground/50",
                  "transition-opacity duration-200",
                  showPlaceholder ? "opacity-100" : "opacity-0"
                )}
              >
                {placeholders[currentPlaceholder]}
              </div>
            )}
          </div>

          {/* Send Button - Only shows when there's text */}
          <AnimatePresence>
            {inputMessage.trim() && (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={handleSend}
                className={cn(
                  "flex-shrink-0 w-9 h-9 rounded-xl",
                  "flex items-center justify-center",
                  "bg-foreground text-background",
                  "transition-all duration-200",
                  "hover:scale-105 hover:shadow-lg",
                  "active:scale-95"
                )}
              >
                <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Row 2: Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border/30 bg-muted/20">
          {/* Plus Button (visual only) */}
          <button
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              "text-muted-foreground/60 hover:text-muted-foreground",
              "hover:bg-muted/50 transition-colors cursor-default"
            )}
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Mode Selector (visual only) */}
          <div
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
              "text-sm text-muted-foreground",
              "hover:bg-muted/50 transition-colors cursor-default"
            )}
          >
            <Brain className="w-4 h-4" />
            <span>General</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
