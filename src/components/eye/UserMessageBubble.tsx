import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FileText } from 'lucide-react';

interface UserMessageBubbleProps {
  content: string;
  attachment?: { name: string; type: string; url: string };
  status: 'flying' | 'absorbing' | 'done';
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  onComplete?: () => void;
}

export const UserMessageBubble = ({
  content,
  attachment,
  status,
  startPosition,
  endPosition,
  onComplete,
}: UserMessageBubbleProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (ref.current) {
      setOffset({
        w: ref.current.offsetWidth / 2,
        h: ref.current.offsetHeight / 2,
      });
    }
  }, [content]);

  if (status === 'done') return null;

  const flyingAnimation = {
    x: endPosition.x - offset.w,
    y: endPosition.y - offset.h,
    scale: 0.25,
    opacity: 0.85,
  };

  const absorbingAnimation = {
    x: endPosition.x - offset.w,
    y: endPosition.y - offset.h,
    scale: 0,
    opacity: 0,
  };

  return (
    <motion.div
      ref={ref}
      className={cn(
        "fixed z-50 max-w-[300px] px-4 py-3 rounded-2xl",
        "bg-primary text-primary-foreground",
        "shadow-lg border border-primary/20",
        "pointer-events-none"
      )}
      style={{
        left: 0,
        top: 0,
        willChange: 'transform, opacity',
      }}
      initial={{
        x: startPosition.x - offset.w,
        y: startPosition.y - offset.h,
        scale: 1,
        opacity: 1,
      }}
      animate={status === 'flying' ? flyingAnimation : absorbingAnimation}
      transition={{
        duration: status === 'flying' ? 0.3 : 0.2,
        ease: [0.32, 0.72, 0, 1],
      }}
      onAnimationComplete={() => {
        if (status === 'absorbing' && onComplete) {
          onComplete();
        }
      }}
    >
      <p className="text-sm font-medium line-clamp-3">{content}</p>
      {attachment && (
        attachment.type.startsWith('image/') ? (
          <img src={attachment.url} alt={attachment.name} className="mt-1 rounded max-h-12 max-w-20 object-cover" />
        ) : (
          <div className="mt-1 flex items-center gap-1 text-xs opacity-80">
            <FileText className="w-3 h-3" />
            <span className="truncate max-w-[120px]">{attachment.name}</span>
          </div>
        )
      )}
    </motion.div>
  );
};
