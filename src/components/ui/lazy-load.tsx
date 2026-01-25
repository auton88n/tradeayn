import { useState, useEffect, useRef, ReactNode, memo } from 'react';
import { useDebugContextOptional } from '@/contexts/DebugContext';

interface LazyLoadProps {
  children: ReactNode;
  placeholder?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  debugLabel?: string;
  /** Minimum height to prevent layout shift - defaults to 200px */
  minHeight?: string;
}

// Default skeleton placeholder with shimmer animation
const DefaultPlaceholder = ({ minHeight }: { minHeight: string }) => (
  <div 
    className="w-full rounded-xl bg-muted/50 animate-pulse flex items-center justify-center"
    style={{ minHeight }}
  >
    <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
      <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
      <div className="w-24 h-2 rounded bg-muted" />
    </div>
  </div>
);

export const LazyLoad = memo(({ 
  children, 
  placeholder,
  rootMargin = '200px', // Increased margin for earlier loading
  threshold = 0.01, // Lower threshold for earlier trigger
  debugLabel = 'LazyLoad',
  minHeight = '200px'
}: LazyLoadProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
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
          // Small delay to ensure smooth transition
          requestAnimationFrame(() => {
            setHasLoaded(true);
          });
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
  }, [rootMargin, threshold, debugLabel]);

  // Use provided placeholder or default skeleton
  const placeholderContent = placeholder || <DefaultPlaceholder minHeight={minHeight} />;

  return (
    <div 
      ref={ref}
      style={{ 
        contain: 'layout style',
        minHeight: hasLoaded ? 'auto' : minHeight,
      }}
      className="transition-opacity duration-300"
    >
      {isVisible ? (
        <div className={hasLoaded ? 'opacity-100' : 'opacity-0'} style={{ transition: 'opacity 0.3s ease-out' }}>
          {children}
        </div>
      ) : (
        placeholderContent
      )}
    </div>
  );
});
