import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Ruler, Home, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DrawingRequestForm } from './DrawingRequestForm';
import { DrawingViewer } from './DrawingViewer';
import { DrawingRefinement } from './DrawingRefinement';
import { useDrawingGeneration } from './hooks/useDrawingGeneration';
import { PropertySection } from './configure/PropertySection';
import type { PropertyData } from './configure/types';

type ViewState = 'input' | 'generating' | 'viewing';

const DrawingGenerator: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('input');
  const [propertyData, setPropertyData] = useState<PropertyData>({ has_specific_lot: false });
  const {
    layout,
    isGenerating,
    error,
    conversationHistory,
    generate,
    refine,
    reset,
  } = useDrawingGeneration();

  const handleGenerate = async (params: any) => {
    setViewState('generating');
    await generate(params);
    setViewState('viewing');
  };

  const handleNewDesign = () => {
    reset();
    setViewState('input');
  };

  if (viewState === 'input' || (!layout && !isGenerating)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-600 to-gray-800 text-white">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Architectural Drawings</h2>
            <p className="text-sm text-muted-foreground">
              AI-generated permit-quality floor plans with proper architectural symbols
            </p>
          </div>
        </div>
        <DrawingRequestForm onGenerate={handleGenerate} isGenerating={isGenerating} />

        {/* Property Section */}
        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-semibold mb-4">Your Property</h3>
          <PropertySection data={propertyData} onChange={setPropertyData} />
        </div>
      </div>
    );
  }

  if (viewState === 'generating' || isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Home className="w-12 h-12 text-primary" />
        </motion.div>
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">AYN is designing your floor plan...</h3>
          <p className="text-sm text-muted-foreground">
            Generating room layout, walls, doors, and windows with proper architectural conventions
          </p>
        </div>
        <motion.div
          className="flex items-center gap-2 text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
        >
          <Sparkles className="w-3 h-3" />
          This typically takes 10-20 seconds
        </motion.div>
      </div>
    );
  }

  if (layout) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-600 to-gray-800 text-white">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Floor Plan</h2>
              <p className="text-sm text-muted-foreground">
                {layout.building.style} · {layout.building.total_width_ft}' × {layout.building.total_depth_ft}'
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleNewDesign} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            New Design
          </Button>
        </div>

        {/* Drawing viewer */}
        <DrawingViewer layout={layout} />

        {/* Refinement chat */}
        <DrawingRefinement
          onRefine={refine}
          isRefining={isGenerating}
          history={conversationHistory}
        />
      </div>
    );
  }

  return null;
};

export default DrawingGenerator;
