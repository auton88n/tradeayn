import { AnimatePresence } from 'framer-motion';
import { CanvasPanel } from './CanvasPanel';
import type { VisualCanvasProps } from '@/types/dashboard.types';

export const VisualCanvas = ({ 
  panels, 
  eyePosition, 
  onClosePanel,
  isGenerating = false 
}: VisualCanvasProps) => {
  // Only render on desktop (handled by parent, but double-check)
  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      <AnimatePresence mode="popLayout">
        {panels.map((panel, index) => (
          <div key={panel.id} className="pointer-events-auto">
            <CanvasPanel
              panel={panel}
              eyePosition={eyePosition}
              onClose={onClosePanel}
              isGenerating={isGenerating && index === panels.length - 1}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};
