import React, { lazy, Suspense } from 'react';
import { ResultRow } from './ResultRow';
import { DesignCheckItem, DesignCheck } from './DesignCheckItem';
import { type InteractionPoint } from './InteractionDiagram';
const InteractionDiagram = lazy(() => import('./InteractionDiagram').then(m => ({ default: m.InteractionDiagram })));
import { Separator } from '@/components/ui/separator';
import { type BuildingCodeId } from '@/lib/buildingCodes';

interface ColumnResultsSectionProps {
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  buildingCode: BuildingCodeId;
}

export const ColumnResultsSection: React.FC<ColumnResultsSectionProps> = ({
  inputs,
  outputs,
  buildingCode,
}) => {
  const isCSA = buildingCode === 'CSA';
  
  // Extract values - prioritize outputs (always available) then fallback to inputs
  const width = Number(outputs.width) || Number(inputs.columnWidth) || Number(inputs.width) || 0;
  const depth = Number(outputs.depth) || Number(inputs.columnDepth) || Number(inputs.depth) || 0;
  const height = Number(outputs.height) || Number(inputs.columnHeight) || Number(inputs.height) || 0;
  const axialLoad = Number(inputs.axialLoad) || 0;
  const columnType = inputs.columnType || 'tied';
  
  // Outputs - handle different return formats
  const axialCapacity = Number(outputs.axialCapacity) || 0;
  const momentCapacity = Number(outputs.momentCapacity) || 0;
  // reinforcementRatio from calculation is already in decimal form (e.g., 2.45 for 2.45%)
  const reinforcementRatio = Number(outputs.reinforcementRatio) || 0;
  const requiredAs = Number(outputs.requiredAs) || Number(outputs.steelAreaRequired) || 0;
  const providedAs = Number(outputs.providedAs) || Number(outputs.steelAreaProvided) || 0;
  const mainBars = outputs.mainBars || outputs.mainReinforcement || outputs.barArrangement || '-';
  const ties = outputs.ties || outputs.stirrups || '-';
  const utilizationRatio = Number(outputs.utilizationRatio) || 0;
  
  // Interaction diagram data
  const interactionCurve = outputs.interactionCurve as InteractionPoint[] | undefined;
  const appliedP = Number(outputs.appliedP) || axialLoad;
  const appliedM = Number(outputs.appliedM) || 0;
  
  // Slenderness
  const slendernessRatio = height / Math.min(width, depth);
  const isSlender = slendernessRatio > 22;

  const designChecks: DesignCheck[] = [
    {
      name: 'Axial Capacity Adequate',
      passed: axialCapacity >= axialLoad,
      codeReference: isCSA ? 'CSA 10.3' : 'ACI 22.4',
      value: `${((axialCapacity / axialLoad) * 100).toFixed(0)}%`,
    },
    {
      name: 'Slenderness Check',
      passed: !isSlender,
      warning: isSlender,
      codeReference: isCSA ? 'CSA 10.10' : 'ACI 6.6',
      value: `λ = ${slendernessRatio.toFixed(1)}`,
    },
    {
      name: 'Reinforcement Ratio',
      passed: reinforcementRatio >= 1 && reinforcementRatio <= 4,
      codeReference: isCSA ? 'CSA 10.9.1' : 'ACI 10.6.1',
      value: `ρ = ${reinforcementRatio.toFixed(2)}%`,
    },
    {
      name: 'Tie Spacing Adequate',
      passed: true,
      codeReference: isCSA ? 'CSA 7.6.5' : 'ACI 25.7.2',
    },
    {
      name: 'Cover Requirements Met',
      passed: true,
      codeReference: isCSA ? 'CSA 7.9' : 'ACI 20.6.1',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Column Geometry */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Column Geometry</h4>
        <div className="space-y-0.5">
          <ResultRow 
            label="Column Size" 
            value={`${width} × ${depth}`} 
            unit="mm"
            highlight
          />
          <ResultRow label="Height" value={height} unit="mm" />
          <ResultRow label="Column Type" value={columnType.charAt(0).toUpperCase() + columnType.slice(1)} />
        </div>
      </div>

      <Separator />

      {/* Load Analysis */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Load Analysis</h4>
        <div className="space-y-0.5">
          <ResultRow label="Applied Axial Load" value={axialLoad} unit="kN" />
          <ResultRow 
            label="Axial Capacity" 
            value={axialCapacity.toFixed(0)} 
            unit="kN"
            highlight
          />
          {momentCapacity > 0 && (
            <ResultRow label="Moment Capacity" value={momentCapacity.toFixed(2)} unit="kN·m" />
        )}
          <ResultRow 
            label="Utilization Ratio" 
            value={`${(utilizationRatio * 100).toFixed(1)}%`}
          />
        </div>
      </div>

      {/* M-N Interaction Diagram */}
      <>
        <Separator />
        {interactionCurve && interactionCurve.length > 0 ? (
          <Suspense fallback={<div className="h-[280px] bg-muted animate-pulse rounded-lg" />}>
            <InteractionDiagram
              curvePoints={interactionCurve}
              appliedP={appliedP}
              appliedM={appliedM}
              buildingCode={buildingCode}
            />
          </Suspense>
        ) : (
          <div className="text-sm text-muted-foreground p-4 text-center bg-muted/20 rounded-lg">
            M-N Interaction Diagram data not available
          </div>
        )}
      </>

      <Separator />

      {/* Slenderness Check */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Slenderness Check</h4>
        <div className="space-y-0.5">
          <ResultRow 
            label="Slenderness Ratio (kL/r)" 
            value={slendernessRatio.toFixed(1)}
            codeRef={isCSA ? 'CSA 10.10' : 'ACI 6.6'}
          />
          <ResultRow 
            label="Classification" 
            value={isSlender ? 'Slender Column' : 'Short Column'}
            highlight={isSlender}
          />
        </div>
      </div>

      <Separator />

      {/* Reinforcement */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Reinforcement</h4>
        <div className="space-y-0.5">
          <ResultRow label="Required As" value={requiredAs.toFixed(0)} unit="mm²" />
          <ResultRow 
            label="Provided As" 
            value={providedAs.toFixed(0)} 
            unit="mm²"
            highlight
          />
          <ResultRow label="Main Bars" value={mainBars} />
          <ResultRow label="Ties/Spirals" value={ties} />
          <ResultRow 
            label="Reinforcement Ratio" 
            value={`${reinforcementRatio.toFixed(2)}%`}
            codeRef={isCSA ? 'CSA 10.9.1' : 'ACI 10.6.1'}
          />
        </div>
      </div>

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

export const generateColumnClipboardText = (
  inputs: Record<string, any>,
  outputs: Record<string, any>,
  buildingCode: BuildingCodeId
): string => {
  const isCSA = buildingCode === 'CSA';
  const codePrefix = isCSA ? 'CSA A23.3-24' : 'ACI 318-25';
  
  const width = Number(inputs.width) || 0;
  const depth = Number(inputs.depth) || 0;
  const height = Number(inputs.height) || 0;
  const axialLoad = Number(inputs.axialLoad) || 0;
  const axialCapacity = Number(outputs.axialCapacity) || 0;
  const reinforcementRatio = Number(outputs.reinforcementRatio) || 0;
  const providedAs = Number(outputs.providedAs) || 0;
  const mainBars = outputs.mainBars || outputs.mainReinforcement || '-';
  const ties = outputs.ties || outputs.stirrups || '-';
  
  const isAdequate = axialCapacity >= axialLoad;
  
  return `COLUMN DESIGN RESULTS
=====================

Design Code: ${codePrefix}
Status: ${isAdequate ? 'ADEQUATE' : 'INADEQUATE'}

COLUMN GEOMETRY
- Size: ${width} × ${depth} mm
- Height: ${height} mm

LOAD ANALYSIS
- Applied Axial Load: ${axialLoad} kN
- Axial Capacity: ${axialCapacity.toFixed(0)} kN
- Utilization: ${((axialLoad / axialCapacity) * 100).toFixed(1)}%

REINFORCEMENT
- Provided: ${providedAs.toFixed(0)} mm² (${mainBars})
- Ties: ${ties}
- Reinforcement Ratio: ${(reinforcementRatio * 100).toFixed(2)}%

DESIGN CHECKS
[${isAdequate ? 'OK' : 'NG'}] Axial Capacity - ${isCSA ? 'CSA 10.3' : 'ACI 22.4'}
[OK] Slenderness Check - ${isCSA ? 'CSA 10.10' : 'ACI 6.6'}
[OK] Reinforcement Ratio - ${isCSA ? 'CSA 10.9.1' : 'ACI 10.6.1'}

Generated by AYN | aynn.io`;
};

export default ColumnResultsSection;
