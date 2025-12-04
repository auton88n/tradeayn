import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, RotateCcw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { CanvasPanelProps, CanvasPanelPosition } from '@/types/dashboard.types';

// Position offsets from eye center for each zone
const POSITION_OFFSETS: Record<CanvasPanelPosition, { x: number; y: number }> = {
  'top-left': { x: -380, y: -180 },
  'top-right': { x: 380, y: -180 },
  'bottom-left': { x: -380, y: 180 },
  'bottom-right': { x: 380, y: 180 },
};

export const CanvasPanel = ({ 
  panel, 
  eyePosition, 
  onClose,
  isGenerating = false 
}: CanvasPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const offset = POSITION_OFFSETS[panel.position];
  const targetX = eyePosition.x + offset.x;
  const targetY = eyePosition.y + offset.y;

  const handleDownload = () => {
    if (!panel.content) return;
    
    const link = document.createElement('a');
    link.href = panel.content;
    link.download = `ayn-visual-${panel.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Image downloaded');
  };

  const handleCopy = async () => {
    if (!panel.content) return;
    
    try {
      // Fetch the image and copy to clipboard
      const response = await fetch(panel.content);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      toast.success('Image copied to clipboard');
    } catch {
      toast.error('Failed to copy image');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        initial={{ 
          scale: 0.3, 
          opacity: 0, 
          x: eyePosition.x - 160,
          y: eyePosition.y - 120,
          filter: 'blur(8px)'
        }}
        animate={{ 
          scale: 1, 
          opacity: 1, 
          x: targetX - 160, // Center panel (320px width / 2)
          y: targetY - 120, // Center panel (240px height / 2)
          filter: 'blur(0px)'
        }}
        exit={{ 
          scale: 0.2, 
          opacity: 0, 
          x: eyePosition.x - 160,
          y: eyePosition.y - 120,
          filter: 'blur(8px)'
        }}
        transition={{ 
          type: 'spring', 
          stiffness: 200, 
          damping: 25 
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "fixed z-50 w-80",
          "bg-white/95 dark:bg-gray-900/90",
          "backdrop-blur-xl",
          "rounded-2xl",
          "border border-gray-100/60 dark:border-gray-800/40",
          "shadow-[0_8px_30px_rgba(0,0,0,0.12)]",
          "overflow-hidden",
          "transition-shadow duration-300",
          isHovered && "shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100/60 dark:border-gray-800/40">
          <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
            {panel.title || 'Generated Image'}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onClose(panel.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content Area */}
        <div className="relative aspect-[4/3] bg-muted/30">
          {isGenerating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Generating...</span>
            </div>
          ) : panel.content ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              <img
                src={panel.content}
                alt={panel.title || 'Generated visual'}
                className={cn(
                  "w-full h-full object-cover",
                  "transition-opacity duration-300",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setImageLoaded(true)}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm text-muted-foreground">No content</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <motion.div 
          className="flex items-center justify-center gap-2 px-4 py-3 border-t border-gray-100/60 dark:border-gray-800/40"
          initial={{ opacity: 0.7 }}
          animate={{ opacity: isHovered ? 1 : 0.7 }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={handleDownload}
            disabled={!panel.content || isGenerating}
          >
            <Download className="h-3.5 w-3.5" />
            Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={handleCopy}
            disabled={!panel.content || isGenerating}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            disabled
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </motion.div>

        {/* Prompt tooltip on hover */}
        <AnimatePresence>
          {isHovered && panel.prompt && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute bottom-full left-0 right-0 mb-2 mx-4"
            >
              <div className="bg-foreground/90 text-background text-xs px-3 py-2 rounded-lg shadow-lg">
                <span className="text-muted line-clamp-2">{panel.prompt}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};
