import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TutorialWelcomeProps {
  isOpen: boolean;
  onStart: () => void;
  onSkip: () => void;
}

export const TutorialWelcome = ({ isOpen, onStart, onSkip }: TutorialWelcomeProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onSkip}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 flex items-center justify-center z-[101] p-4"
          >
            <div 
              dir="ltr"
              className={cn(
                "relative w-full max-w-md p-8 rounded-3xl",
                "bg-background/95 backdrop-blur-xl",
                "border border-border/50",
                "shadow-2xl"
              )}
            >
              {/* Decorative gradient */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              
              {/* Content */}
              <div className="relative flex flex-col items-center text-center">
                {/* Eye Icon */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative mb-6"
                >
                  <div className="w-20 h-20 rounded-2xl bg-foreground flex items-center justify-center">
                    <Brain className="w-10 h-10 text-background" />
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute -inset-2"
                  >
                    <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-primary" />
                    <Sparkles className="absolute -bottom-1 -left-1 w-3 h-3 text-primary/60" />
                  </motion.div>
                </motion.div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Welcome to AYN
                </h2>
                
                {/* Subtitle */}
                <p className="text-muted-foreground mb-8 max-w-xs">
                  Let me show you around! Take a quick tour to discover how I can help you.
                </p>

                {/* Buttons */}
                <div className="flex flex-col gap-3 w-full">
                  <Button
                    onClick={onStart}
                    className={cn(
                      "w-full h-12 rounded-xl text-base font-medium",
                      "bg-foreground text-background",
                      "hover:bg-foreground/90",
                      "transition-all duration-300"
                    )}
                  >
                    Start Tour
                  </Button>
                  
                  <Button
                    onClick={onSkip}
                    variant="ghost"
                    className="w-full h-10 rounded-xl text-muted-foreground hover:text-foreground"
                  >
                    Skip for now
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
