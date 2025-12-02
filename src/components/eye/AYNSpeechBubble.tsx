import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Brain, HelpCircle, Lightbulb, AlertCircle, MessageCircle } from 'lucide-react';
import type { BubbleType } from '@/utils/emotionMapping';

interface AYNSpeechBubbleProps {
  id: string;
  content: string;
  type: BubbleType;
  isVisible: boolean;
  onDismiss?: () => void;
  position?: { x: number; y: number };
}

const bubbleConfig: Record<BubbleType, { icon: typeof Brain; bgClass: string; iconClass: string }> = {
  thinking: {
    icon: Brain,
    bgClass: 'bg-blue-500/20 border-blue-400/30',
    iconClass: 'text-blue-400',
  },
  speaking: {
    icon: MessageCircle,
    bgClass: 'bg-background/80 border-border/50',
    iconClass: 'text-foreground/70',
  },
  question: {
    icon: HelpCircle,
    bgClass: 'bg-purple-500/20 border-purple-400/30',
    iconClass: 'text-purple-400',
  },
  excited: {
    icon: Lightbulb,
    bgClass: 'bg-orange-500/20 border-orange-400/30',
    iconClass: 'text-orange-400',
  },
  uncertain: {
    icon: AlertCircle,
    bgClass: 'bg-red-500/10 border-red-400/20',
    iconClass: 'text-red-400',
  },
};

export const AYNSpeechBubble = ({
  id,
  content,
  type,
  isVisible,
  position = { x: 0, y: 80 },
}: AYNSpeechBubbleProps) => {
  const config = bubbleConfig[type];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={id}
          className={cn(
            "absolute z-40 max-w-[320px] px-4 py-3 rounded-2xl",
            "backdrop-blur-md border shadow-lg",
            config.bgClass
          )}
          style={{
            left: '50%',
            top: '50%',
          }}
          initial={{
            x: '-50%',
            y: '-50%',
            scale: 0,
            opacity: 0,
          }}
          animate={{
            x: `calc(-50% + ${position.x}px)`,
            y: `calc(-50% + ${position.y}px)`,
            scale: 1,
            opacity: 1,
          }}
          exit={{
            scale: 0.8,
            opacity: 0,
            y: `calc(-50% + ${position.y + 20}px)`,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
          }}
        >
          <div className="flex items-start gap-2">
            <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", config.iconClass)} />
            <p className="text-sm text-foreground leading-relaxed">{content}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
