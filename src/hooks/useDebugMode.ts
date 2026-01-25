import { useDebugContext, useDebugContextOptional } from '@/contexts/DebugContext';

// Re-export for convenience
export const useDebugMode = useDebugContext;
export const useDebugModeOptional = useDebugContextOptional;

// Helper hook for components that want to log renders
export const useDebugRender = (componentName: string) => {
  const debug = useDebugContextOptional();
  
  if (debug?.isDebugMode) {
    debug.incrementRenderCount(componentName);
    console.log(`[Render] ${componentName} - Count: ${(debug.reRenderCounts.get(componentName) || 0) + 1}`);
  }
};
