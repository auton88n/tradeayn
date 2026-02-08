import { useDebugStore } from '@/stores/debugStore';

// Full store (use sparingly — prefer selectors)
export const useDebugMode = () => useDebugStore();

// Same as useDebugMode but semantically "optional" — always returns a value with Zustand
export const useDebugModeOptional = () => useDebugStore();

// Helper hook for components that want to log renders
// Note: This is called during render, so incrementRenderCount must NOT trigger re-renders
export const useDebugRender = (componentName: string) => {
  const isDebugMode = useDebugStore((s) => s.isDebugMode);

  if (isDebugMode) {
    useDebugStore.getState().incrementRenderCount(componentName);
  }
};
