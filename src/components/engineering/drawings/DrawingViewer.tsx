import React, { useState, useRef, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Layers, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FloorPlanRenderer, type FloorPlanLayout } from './engine/FloorPlanRenderer';
import { DrawingSheet } from './engine/DrawingSheet';
import { cn } from '@/lib/utils';

interface DrawingViewerProps {
  layout: FloorPlanLayout;
  projectName?: string;
}

export const DrawingViewer: React.FC<DrawingViewerProps> = ({
  layout,
  projectName = 'Residential Design',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [showDimensions, setShowDimensions] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showFixtures, setShowFixtures] = useState(true);
  const [isPanning, setIsPanning] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const lastPos = useRef({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.25, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.25, 0.25));
  const handleZoomFit = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.25, Math.min(5, prev * delta)));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan(prev => ({
        x: prev.x + e.clientX - lastPos.current.x,
        y: prev.y + e.clientY - lastPos.current.y,
      }));
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  // SVG export
  const handleExportSVG = () => {
    const svgEl = containerRef.current?.querySelector('svg');
    if (!svgEl) return;
    const clone = svgEl.cloneNode(true) as SVGElement;
    const svgStr = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `floor-plan-${Date.now().toString(36)}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={handleZoomOut}><ZoomOut className="w-4 h-4" /></Button>
          <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}><ZoomIn className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={handleZoomFit}><Maximize2 className="w-4 h-4" /></Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant={showDimensions ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowDimensions(!showDimensions)}
            className="text-xs"
          >
            Dims
          </Button>
          <Button
            variant={showLabels ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowLabels(!showLabels)}
            className="text-xs"
          >
            Labels
          </Button>
          <Button
            variant={showFixtures ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFixtures(!showFixtures)}
            className="text-xs"
          >
            Fixtures
          </Button>
        </div>

        <Button variant="outline" size="sm" onClick={handleExportSVG} className="gap-1.5">
          <Download className="w-3.5 h-3.5" />
          SVG
        </Button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative bg-white border border-border rounded-xl overflow-hidden"
        style={{ height: '500px', cursor: isPanning ? 'grabbing' : 'grab' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            width: '100%',
            height: '100%',
          }}
        >
          <DrawingSheet
            projectName={projectName}
            drawingTitle={`Floor Plan — ${layout.building.style}`}
          >
            <FloorPlanRenderer
              layout={layout}
              showDimensions={showDimensions}
              showLabels={showLabels}
              showFixtures={showFixtures}
            />
          </DrawingSheet>
        </div>
      </div>
    </div>
  );
};

export default DrawingViewer;
