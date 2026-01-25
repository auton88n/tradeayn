import { useEffect, useRef } from 'react';
import { useDebugContextOptional } from '@/contexts/DebugContext';

interface UseRenderLoggerOptions {
  componentName: string;
  props?: Record<string, any>;
  logProps?: boolean;
}

export const useRenderLogger = ({ 
  componentName, 
  props, 
  logProps = false 
}: UseRenderLoggerOptions) => {
  const debug = useDebugContextOptional();
  const renderCountRef = useRef(0);
  const prevPropsRef = useRef<Record<string, any> | undefined>(props);
  
  useEffect(() => {
    if (!debug?.isDebugMode) return;
    
    renderCountRef.current += 1;
    debug.incrementRenderCount(componentName);
    
    // Log render (only in debug mode which is already gated)
    if (import.meta.env.DEV) {
      console.log(`[Render] ${componentName}`, {
        count: renderCountRef.current,
        timestamp: new Date().toISOString().split('T')[1].slice(0, 12)
      });
    }
    
    // Log changed props if enabled
    if (logProps && props && prevPropsRef.current) {
      const changedProps: Record<string, { from: any; to: any }> = {};
      
      Object.keys({ ...prevPropsRef.current, ...props }).forEach(key => {
        if (prevPropsRef.current?.[key] !== props[key]) {
          changedProps[key] = {
            from: prevPropsRef.current?.[key],
            to: props[key]
          };
        }
      });
      
      if (Object.keys(changedProps).length > 0 && import.meta.env.DEV) {
        console.log(`[Props Changed] ${componentName}`, changedProps);
      }
    }
    
    prevPropsRef.current = props;
  });
  
  return {
    renderCount: renderCountRef.current,
    isDebugMode: debug?.isDebugMode ?? false
  };
};
