import { useState, useEffect, useRef, ReactNode } from 'react';

interface LazyLoadProps {
  children: ReactNode;
  placeholder?: ReactNode;
  rootMargin?: string;
  threshold?: number;
}

export const LazyLoad = ({ 
  children, 
  placeholder = <div className="h-[160px]" />,
  rootMargin = '100px',
  threshold = 0.1
}: LazyLoadProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

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
};
