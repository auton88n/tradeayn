import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Maximize2, 
  Minimize2, 
  Eye,
  Columns,
  Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { PreviewPlaceholder } from './PreviewPlaceholder';

type ViewMode = 'split' | 'form-only' | 'preview-only';

interface SplitViewLayoutProps {
  formContent: React.ReactNode;
  previewContent: React.ReactNode;
  hasPreview: boolean;
  calculatorType?: string;
}

export const SplitViewLayout: React.FC<SplitViewLayoutProps> = ({
  formContent,
  previewContent,
  hasPreview,
  calculatorType,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [previewWidth, setPreviewWidth] = useState(50);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex-1 flex flex-col min-h-0">
        {/* View Controls */}
        <div className="flex items-center justify-end gap-1 px-4 py-2 border-b border-border/30 bg-muted/20">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === 'split' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('split')}
                className="h-7 px-2"
              >
                <Columns className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Split View</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === 'form-only' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('form-only')}
                className="h-7 px-2"
              >
                <Square className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Form Only</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === 'preview-only' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('preview-only')}
                className="h-7 px-2"
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Preview Only</TooltipContent>
          </Tooltip>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Form Panel */}
          <motion.div
            initial={false}
            animate={{ 
              width: viewMode === 'preview-only' 
                ? '0%' 
                : viewMode === 'form-only' 
                  ? '100%' 
                  : `${100 - previewWidth}%`,
              opacity: viewMode === 'preview-only' ? 0 : 1,
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={cn(
              "h-full overflow-y-auto overflow-x-hidden",
              viewMode !== 'preview-only' && viewMode !== 'form-only' && "border-r border-border/30"
            )}
          >
            {viewMode !== 'preview-only' && (
              <div className="p-4">
                {formContent}
              </div>
            )}
          </motion.div>

          {/* Preview Panel - Always rendered for smooth transitions */}
          <motion.div
            initial={false}
            animate={{ 
              width: viewMode === 'form-only' 
                ? '0%' 
                : viewMode === 'preview-only' 
                  ? '100%' 
                  : `${previewWidth}%`,
              opacity: viewMode === 'form-only' ? 0 : 1,
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="h-full bg-muted/10 flex flex-col overflow-hidden"
          >
            {viewMode !== 'form-only' && (
              <>
                {/* Preview Header */}
                <div className="flex items-center justify-end px-4 py-2 border-b border-border/30 shrink-0">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewWidth(w => Math.max(30, w - 10))}
                      className="h-6 w-6 p-0"
                      disabled={viewMode === 'preview-only'}
                    >
                      <Minimize2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewWidth(w => Math.min(70, w + 10))}
                      className="h-6 w-6 p-0"
                      disabled={viewMode === 'preview-only'}
                    >
                      <Maximize2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Preview Content */}
                <div className="flex-1 min-h-0 p-4">
                  {hasPreview && previewContent ? (
                    previewContent
                  ) : (
                    <PreviewPlaceholder calculatorType={calculatorType} />
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  );
};
