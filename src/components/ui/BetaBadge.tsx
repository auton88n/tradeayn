import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BetaBadgeProps {
  className?: string;
}

export const BetaBadge = ({ className }: BetaBadgeProps) => {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', bounce: 0.5, delay: 0.3 }}
      className={cn(
        "absolute -top-1 -right-1 z-10",
        "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        "bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500",
        "text-white rounded-full shadow-lg",
        "ring-2 ring-background",
        className
      )}
    >
      <motion.span
        animate={{ opacity: [1, 0.7, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        BETA
      </motion.span>
    </motion.div>
  );
};
