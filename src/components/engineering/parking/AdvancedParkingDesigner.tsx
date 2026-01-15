import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

import { ParkingSiteProvider, useParkingSite } from './context/ParkingSiteContext';
import { BoundaryPointsTable } from './boundary/BoundaryPointsTable';
import { BoundaryPreview } from './boundary/BoundaryPreview';
import { BoundaryMetrics } from './boundary/BoundaryMetrics';
import { ParkingConfigPanel } from './boundary/ParkingConfigPanel';
import { AICalculatorAssistant } from '../AICalculatorAssistant';
import { calculateBoundaryMetrics } from './utils/geometry';

interface AdvancedParkingDesignerProps {
  onCalculate: (results: any) => void;
  isCalculating: boolean;
  setIsCalculating: (value: boolean) => void;
  userId?: string;
}

function DesignerContent({ onCalculate, isCalculating, setIsCalculating, userId }: AdvancedParkingDesignerProps) {
  const { boundaryPoints, config, clearBoundary, setLayout } = useParkingSite();

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
      // Calculate effective space dimensions based on angle
      const angle = config.parkingAngle;
      const angleRad = (angle * Math.PI) / 180;
      const effectiveWidth = angle === 90 
        ? config.spaceWidth 
        : config.spaceWidth / Math.sin(angleRad) + config.spaceLength * Math.cos(angleRad);
      const effectiveDepth = angle === 90 
        ? config.spaceLength 
        : config.spaceWidth * Math.cos(angleRad) + config.spaceLength * Math.sin(angleRad);

      // Estimate spaces based on area (simplified - real algorithm would be more complex)
      const siteArea = metrics.area;
      const moduleWidth = effectiveDepth * 2 + config.aisleWidth;
      const spaceFootprint = effectiveWidth * moduleWidth / 2;
      const estimatedSpaces = Math.floor((siteArea * 0.65) / spaceFootprint); // 65% efficiency

      const accessibleSpaces = Math.max(1, Math.ceil(estimatedSpaces * config.accessiblePercent / 100));
      const evSpaces = Math.ceil(estimatedSpaces * config.evPercent / 100);
      const standardSpaces = estimatedSpaces - accessibleSpaces - evSpaces;

      // Calculate results
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
          efficiency: 65, // Placeholder
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Boundary Definition */}
        <div className="lg:col-span-2 space-y-4">
          {/* Points Table + Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px]">
            <BoundaryPointsTable />
            <BoundaryPreview />
          </div>

          {/* Metrics Bar */}
          <BoundaryMetrics />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={generateLayout}
              disabled={isCalculating || !metrics.isValid}
              className="flex-1 gap-2"
              size="lg"
            >
              <Wand2 className="w-4 h-4" />
              {isCalculating ? 'Generating...' : 'Generate Layout'}
            </Button>
            <Button
              variant="outline"
              onClick={handleClearAll}
              disabled={boundaryPoints.length === 0}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
          </div>
        </div>

        {/* Right Column - Configuration + AI */}
        <div className="lg:col-span-1 space-y-4">
          <ParkingConfigPanel />
          
          <AICalculatorAssistant
            calculatorType="parking"
          />
        </div>
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
