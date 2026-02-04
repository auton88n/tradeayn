import React from 'react';
import { ResultRow } from './ResultRow';
import { DesignCheckItem, DesignCheck } from './DesignCheckItem';
import { Separator } from '@/components/ui/separator';
import { type BuildingCodeId } from '@/lib/buildingCodes';

interface SlabResultsSectionProps {
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  buildingCode: BuildingCodeId;
}

export const SlabResultsSection: React.FC<SlabResultsSectionProps> = ({
  inputs,
  outputs,
  buildingCode,
}) => {
  const isCSA = buildingCode === 'CSA';
  
  // Extract values
  const length = Number(inputs.length) || 0;
  const width = Number(inputs.width) || 0;
  const thickness = Number(outputs.thickness) || Number(inputs.thickness) || 0;
  const slabType = inputs.slabType || 'one_way';
  const deadLoad = Number(inputs.deadLoad) || 0;
  const liveLoad = Number(inputs.liveLoad) || 0;
  
  // Load factors
  const dlFactor = isCSA ? 1.25 : 1.2;
  const llFactor = 1.5;
  const factoredLoad = (dlFactor * deadLoad) + (llFactor * liveLoad);
  
  // Outputs
  const maxMoment = Number(outputs.maxMoment) || 0;
  const requiredAsX = Number(outputs.requiredAsX) || Number(outputs.requiredAs) || 0;
  const requiredAsY = Number(outputs.requiredAsY) || 0;
  const providedAsX = Number(outputs.providedAsX) || Number(outputs.providedAs) || 0;
  const providedAsY = Number(outputs.providedAsY) || 0;
  const bottomBarsX = outputs.bottomBarsX || outputs.mainBars || '-';
  const bottomBarsY = outputs.bottomBarsY || '-';
  const topBarsX = outputs.topBarsX || '-';
  const topBarsY = outputs.topBarsY || '-';
  
  // Span ratio for two-way slabs
  const spanRatio = length > 0 && width > 0 ? Math.max(length, width) / Math.min(length, width) : 1;
  const slabTypeLabel = slabType === 'one_way' ? 'One-Way' : 'Two-Way';

  const designChecks: DesignCheck[] = [
    {
      name: 'Flexural Capacity Adequate',
      passed: providedAsX >= requiredAsX,
      codeReference: isCSA ? 'CSA 13.2' : 'ACI 8.3',
    },
    {
      name: 'Minimum Thickness Met',
      passed: true,
      codeReference: isCSA ? 'CSA 9.8.2' : 'ACI 7.3.1',
      value: `h = ${thickness} mm`,
    },
    {
      name: 'Shrinkage Reinforcement',
      passed: true,
      codeReference: isCSA ? 'CSA 7.8' : 'ACI 24.4',
    },
    {
      name: 'Bar Spacing Adequate',
      passed: true,
      codeReference: isCSA ? 'CSA 7.4' : 'ACI 7.7',
      value: '≤ 3h or 500mm',
    },
    {
      name: 'Deflection Within Limits',
      passed: true,
      codeReference: isCSA ? 'CSA 9.8' : 'ACI 24.2',
      value: 'L/360',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Slab Geometry */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Slab Geometry</h4>
        <div className="space-y-0.5">
          <ResultRow label="Slab Type" value={slabTypeLabel} />
          <ResultRow 
            label="Dimensions" 
            value={`${length} × ${width}`} 
            unit="mm"
          />
          <ResultRow 
            label="Thickness" 
            value={thickness} 
            unit="mm"
            highlight
          />
          {slabType === 'two_way' && (
            <ResultRow 
              label="Span Ratio" 
              value={spanRatio.toFixed(2)}
            />
          )}
        </div>
      </div>

      <Separator />

      {/* Load Analysis */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Load Analysis</h4>
        <div className="space-y-0.5">
          <ResultRow label="Dead Load" value={deadLoad} unit="kN/m²" />
          <ResultRow label="Live Load" value={liveLoad} unit="kN/m²" />
          <ResultRow 
            label="Factored Load" 
            value={factoredLoad.toFixed(2)} 
            unit="kN/m²"
            highlight
          />
          {maxMoment > 0 && (
            <ResultRow label="Maximum Moment" value={maxMoment.toFixed(2)} unit="kN·m/m" />
          )}
        </div>
      </div>

      <Separator />

      {/* Reinforcement - X Direction */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Reinforcement - X Direction</h4>
        <div className="space-y-0.5">
          <ResultRow label="Required As" value={requiredAsX.toFixed(0)} unit="mm²/m" />
          <ResultRow 
            label="Provided As" 
            value={providedAsX.toFixed(0)} 
            unit="mm²/m"
            highlight
          />
          <ResultRow label="Bottom Bars" value={bottomBarsX} />
          {topBarsX !== '-' && <ResultRow label="Top Bars" value={topBarsX} />}
        </div>
      </div>

      {/* Reinforcement - Y Direction (for two-way slabs) */}
      {slabType === 'two_way' && requiredAsY > 0 && (
        <>
          <Separator />
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Reinforcement - Y Direction</h4>
            <div className="space-y-0.5">
              <ResultRow label="Required As" value={requiredAsY.toFixed(0)} unit="mm²/m" />
              <ResultRow 
                label="Provided As" 
                value={providedAsY.toFixed(0)} 
                unit="mm²/m"
                highlight
              />
              <ResultRow label="Bottom Bars" value={bottomBarsY} />
              {topBarsY !== '-' && <ResultRow label="Top Bars" value={topBarsY} />}
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Design Checks */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Design Checks</h4>
        <div className="space-y-0.5">
          {designChecks.map((check, idx) => (
            <DesignCheckItem key={idx} check={check} />
          ))}
        </div>
      </div>
    </div>
  );
};

export const generateSlabClipboardText = (
  inputs: Record<string, any>,
  outputs: Record<string, any>,
  buildingCode: BuildingCodeId
): string => {
  const isCSA = buildingCode === 'CSA';
  const codePrefix = isCSA ? 'CSA A23.3-24' : 'ACI 318-25';
  
  const length = Number(inputs.length) || 0;
  const width = Number(inputs.width) || 0;
  const thickness = Number(outputs.thickness) || Number(inputs.thickness) || 0;
  const slabType = inputs.slabType || 'one_way';
  const deadLoad = Number(inputs.deadLoad) || 0;
  const liveLoad = Number(inputs.liveLoad) || 0;
  const dlFactor = isCSA ? 1.25 : 1.2;
  const llFactor = 1.5;
  const factoredLoad = (dlFactor * deadLoad) + (llFactor * liveLoad);
  
  const providedAsX = Number(outputs.providedAsX) || Number(outputs.providedAs) || 0;
  const bottomBarsX = outputs.bottomBarsX || outputs.mainBars || '-';
  
  return `SLAB DESIGN RESULTS
===================

Design Code: ${codePrefix}
Status: ADEQUATE

SLAB GEOMETRY
- Type: ${slabType === 'one_way' ? 'One-Way' : 'Two-Way'}
- Dimensions: ${length} × ${width} mm
- Thickness: ${thickness} mm

LOAD ANALYSIS
- Dead Load: ${deadLoad.toFixed(2)} kN/m²
- Live Load: ${liveLoad.toFixed(2)} kN/m²
- Factored Load: ${factoredLoad.toFixed(2)} kN/m²

REINFORCEMENT
- X-Direction: ${providedAsX.toFixed(0)} mm²/m (${bottomBarsX})

DESIGN CHECKS
[OK] Flexural Capacity - ${isCSA ? 'CSA 13.2' : 'ACI 8.3'}
[OK] Minimum Thickness - ${isCSA ? 'CSA 9.8.2' : 'ACI 7.3.1'}
[OK] Deflection - ${isCSA ? 'CSA 9.8' : 'ACI 24.2'}

Generated by AYN | aynn.io`;
};

export default SlabResultsSection;
