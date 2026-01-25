import { useState, useEffect, useRef, ReactNode } from 'react';
import { useDebugContextOptional } from '@/contexts/DebugContext';

interface LazyLoadProps {
  children: ReactNode;
  placeholder?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  debugLabel?: string;
}

export const LazyLoad = ({ 
  children, 
  placeholder = <div className="h-[160px]" />,
  rootMargin = '100px',
  threshold = 0.1,
  debugLabel = 'LazyLoad'
}: LazyLoadProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debug = useDebugContextOptional();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
          
          // Debug logging
          if (debug?.isDebugMode) {
            debug.addIntersectionTrigger(debugLabel);
            console.log(`[LazyLoad] ${debugLabel} became visible`);
          }
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, threshold, debug?.isDebugMode, debugLabel, debug]);

  // Debug border styles
  const debugStyles = debug?.isDebugMode && !isVisible ? {
    outline: '2px dashed hsl(210, 100%, 50%)',
    outlineOffset: '-2px'
  } : {};

  return (
    <div 
      ref={ref}
      style={{ 
        contain: 'layout paint',
        willChange: isVisible ? 'auto' : 'contents',
        ...debugStyles
      }}
    >
      {isVisible ? children : placeholder}
    </div>
  );
};
