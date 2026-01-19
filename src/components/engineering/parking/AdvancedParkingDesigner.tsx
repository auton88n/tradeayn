import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Trash2, ChevronDown, ChevronRight, MapPin, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

import { ParkingSiteProvider, useParkingSite } from './context/ParkingSiteContext';
import { BoundaryPointsTable } from './boundary/BoundaryPointsTable';
import { BoundaryPreview } from './boundary/BoundaryPreview';
import { ParkingConfigPanel } from './boundary/ParkingConfigPanel';
import { calculateBoundaryMetrics, roundTo } from './utils/geometry';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Info, Box, Ruler } from 'lucide-react';

interface AdvancedParkingDesignerProps {
  onCalculate: (results: any) => void;
  isCalculating: boolean;
  setIsCalculating: (value: boolean) => void;
  userId?: string;
}

// Compact metrics bar for panel layout
function CompactMetrics() {
  const { boundaryPoints } = useParkingSite();
  const metrics = calculateBoundaryMetrics(boundaryPoints);

  const formatArea = (area: number): string => {
    if (area >= 10000) return `${roundTo(area / 10000, 2)} ha`;
    return `${roundTo(area, 1)} m²`;
  };

  const formatPerimeter = (perimeter: number): string => {
    if (perimeter >= 1000) return `${roundTo(perimeter / 1000, 2)} km`;
    return `${roundTo(perimeter, 1)} m`;
  };

  return (
    <div className="flex items-center justify-between gap-2 text-xs bg-muted/30 rounded-lg px-3 py-2">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-muted-foreground" />
          <strong>{metrics.pointCount}</strong> pts
        </span>
        <span className="flex items-center gap-1">
          <Box className="w-3 h-3 text-muted-foreground" />
          {metrics.pointCount >= 3 ? formatArea(metrics.area) : '—'}
        </span>
        <span className="flex items-center gap-1">
          <Ruler className="w-3 h-3 text-muted-foreground" />
          {metrics.pointCount >= 2 ? formatPerimeter(metrics.perimeter) : '—'}
        </span>
      </div>
      
      {metrics.pointCount < 3 ? (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          <Info className="w-2.5 h-2.5 mr-1" />
          3+ pts needed
        </Badge>
      ) : metrics.isValid ? (
        <Badge className="text-[10px] px-1.5 py-0 bg-green-600">
          <CheckCircle className="w-2.5 h-2.5 mr-1" />
          Valid
        </Badge>
      ) : (
        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
          <AlertTriangle className="w-2.5 h-2.5 mr-1" />
          Invalid
        </Badge>
      )}
    </div>
  );
}

function DesignerContent({ onCalculate, isCalculating, setIsCalculating }: AdvancedParkingDesignerProps) {
  const { boundaryPoints, config, setConfig, clearBoundary } = useParkingSite();
  const [pointsOpen, setPointsOpen] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);

  const generateLayout = useCallback(() => {
    const metrics = calculateBoundaryMetrics(boundaryPoints);
    
    if (!metrics.isValid) {
      toast({
        title: "Invalid Boundary",
        description: metrics.validationError || "Please fix the boundary polygon",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);

    try {
      const angle = config.parkingAngle;
      const angleRad = (angle * Math.PI) / 180;
      const effectiveWidth = angle === 90 
        ? config.spaceWidth 
        : config.spaceWidth / Math.sin(angleRad) + config.spaceLength * Math.cos(angleRad);
      const effectiveDepth = angle === 90 
        ? config.spaceLength 
        : config.spaceWidth * Math.cos(angleRad) + config.spaceLength * Math.sin(angleRad);

      const siteArea = metrics.area;
      const moduleWidth = effectiveDepth * 2 + config.aisleWidth;
      const spaceFootprint = effectiveWidth * moduleWidth / 2;
      const estimatedSpaces = Math.floor((siteArea * 0.65) / spaceFootprint);

      const accessibleSpaces = Math.max(1, Math.ceil(estimatedSpaces * config.accessiblePercent / 100));
      const evSpaces = Math.ceil(estimatedSpaces * config.evPercent / 100);
      const standardSpaces = estimatedSpaces - accessibleSpaces - evSpaces;

      const result = {
        type: 'parking',
        inputs: {
          boundaryPoints: boundaryPoints.map(p => ({ x: p.x, y: p.y })),
          siteArea: metrics.area,
          sitePerimeter: metrics.perimeter,
          parkingAngle: config.parkingAngle,
          spaceWidth: config.spaceWidth,
          spaceLength: config.spaceLength,
          aisleWidth: config.aisleWidth,
          accessiblePercent: config.accessiblePercent,
          evPercent: config.evPercent,
          parkingType: config.parkingType,
        },
        outputs: {
          totalSpaces: estimatedSpaces,
          accessibleSpaces,
          evSpaces,
          standardSpaces,
          siteArea: metrics.area,
          efficiency: 65,
          parkingArea: estimatedSpaces * config.spaceWidth * config.spaceLength,
          aisleArea: siteArea * 0.35,
          asphaltArea: siteArea,
          stripingLength: estimatedSpaces * (config.spaceWidth + config.spaceLength) * 2,
          curbingLength: metrics.perimeter,
          adaCompliant: accessibleSpaces >= Math.max(1, Math.ceil(estimatedSpaces * 0.02)),
          minAisleWidth: config.aisleWidth >= 6.0,
          fireAccess: true,
        },
        timestamp: new Date(),
      };

      onCalculate(result);

      toast({
        title: "Layout Generated",
        description: `Estimated ${estimatedSpaces} parking spaces for ${Math.round(siteArea)} m² site`,
      });
    } catch (err) {
      console.error('Layout generation error:', err);
      toast({
        title: "Generation Failed",
        description: "Could not generate parking layout",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  }, [boundaryPoints, config, onCalculate, setIsCalculating]);

  const handleClearAll = () => {
    clearBoundary();
    toast({
      title: "Cleared",
      description: "All boundary points removed",
    });
  };

  const metrics = calculateBoundaryMetrics(boundaryPoints);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Preview - Always visible, full width */}
      <div className="w-full aspect-[4/3] min-h-[200px] rounded-lg overflow-hidden border bg-card">
        <BoundaryPreview />
      </div>

      {/* Compact Metrics Bar */}
      <CompactMetrics />

      {/* Boundary Points - Collapsible */}
      <Collapsible open={pointsOpen} onOpenChange={setPointsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between h-9 px-3 bg-muted/30 hover:bg-muted/50"
          >
            <span className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4" />
              Boundary Points
              <Badge variant="secondary" className="text-[10px] px-1.5">
                {boundaryPoints.length}
              </Badge>
            </span>
            {pointsOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-2"
            >
              <div className="max-h-[250px]">
                <BoundaryPointsTable />
              </div>
            </motion.div>
          </AnimatePresence>
        </CollapsibleContent>
      </Collapsible>

      {/* Configuration - Collapsible */}
      <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between h-9 px-3 bg-muted/30 hover:bg-muted/50"
          >
            <span className="flex items-center gap-2 text-sm">
              <Settings className="w-4 h-4" />
              Parking Settings
            </span>
            {configOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-2"
            >
              <ParkingConfigPanel />
            </motion.div>
          </AnimatePresence>
        </CollapsibleContent>
      </Collapsible>

      {/* Action Buttons - Sticky bottom */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur pt-3 border-t flex gap-2">
        <Button
          onClick={generateLayout}
          disabled={isCalculating || !metrics.isValid}
          className="flex-1 gap-2"
        >
          <Wand2 className="w-4 h-4" />
          {isCalculating ? 'Generating...' : 'Generate Layout'}
        </Button>
        <Button
          variant="outline"
          onClick={handleClearAll}
          disabled={boundaryPoints.length === 0}
          size="icon"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

export function AdvancedParkingDesigner(props: AdvancedParkingDesignerProps) {
  return (
    <ParkingSiteProvider>
      <DesignerContent {...props} />
    </ParkingSiteProvider>
  );
}
