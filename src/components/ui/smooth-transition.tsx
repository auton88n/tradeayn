import { ReactNode, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SmoothTransitionProps {
  children: ReactNode;
  show: boolean;
  className?: string;
  duration?: number;
}

export const SmoothTransition = ({ 
  children, 
  show, 
  className,
  duration = 300 
}: SmoothTransitionProps) => {
  const [shouldRender, setShouldRender] = useState(show);
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      // Small delay to ensure the element is rendered before animation
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        'transition-all ease-in-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        className
      )}
      style={{ 
        transitionDuration: `${duration}ms`,
        transitionProperty: 'opacity, transform'
      }}
    >
      {children}
    </div>
  );
};