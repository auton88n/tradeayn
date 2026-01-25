import { useState, useEffect, useRef, ReactNode, memo } from 'react';
import { useDebugContextOptional } from '@/contexts/DebugContext';

interface LazyLoadProps {
  children: ReactNode;
  placeholder?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  debugLabel?: string;
}

export const LazyLoad = memo(({ 
  children, 
  placeholder = <div className="h-[160px]" />,
  rootMargin = '100px',
  threshold = 0.1,
  debugLabel = 'LazyLoad'
}: LazyLoadProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // Store debug ref to avoid re-renders from context changes
  const debugRef = useRef(useDebugContextOptional());

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
          
          // Debug logging (read current value)
          const debug = debugRef.current;
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
  }, [rootMargin, threshold, debugLabel]); // Removed debug from deps

  return (
    <div 
      ref={ref}
      style={{ 
        contain: 'layout paint',
        willChange: isVisible ? 'auto' : 'contents'
      }}
    >
      {isVisible ? children : placeholder}
    </div>
  );
});
