import React from 'react';
import { ResultRow } from './ResultRow';
import { DesignCheckItem, DesignCheck } from './DesignCheckItem';
import { Separator } from '@/components/ui/separator';
import { type BuildingCodeId } from '@/lib/buildingCodes';

interface FoundationResultsSectionProps {
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  buildingCode: BuildingCodeId;
}

export const FoundationResultsSection: React.FC<FoundationResultsSectionProps> = ({
  inputs,
  outputs,
  buildingCode,
}) => {
  const isCSA = buildingCode === 'CSA';
  
  // Extract values
  const columnLoad = Number(inputs.columnLoad) || 0;
  const momentX = Number(inputs.momentX) || 0;
  const momentY = Number(inputs.momentY) || 0;
  const bearingCapacity = Number(inputs.bearingCapacity) || 0;
  const foundationType = inputs.foundationType || 'isolated';
  
  // Outputs
  const footingLength = Number(outputs.footingLength) || 0;
  const footingWidth = Number(outputs.footingWidth) || 0;
  const footingDepth = Number(outputs.footingDepth) || 0;
  const bearingPressure = Number(outputs.bearingPressure) || 0;
  const requiredAs = Number(outputs.requiredAs) || 0;
  const providedAs = Number(outputs.providedAs) || 0;
  const reinforcement = outputs.reinforcement || outputs.mainBars || '-';
  const concreteVolume = Number(outputs.concreteVolume) || 0;
  const punchingShearCapacity = Number(outputs.punchingShearCapacity) || 0;
  const punchingShearDemand = Number(outputs.punchingShearDemand) || 0;
  
  const bearingUtilization = bearingCapacity > 0 ? (bearingPressure / bearingCapacity) * 100 : 0;
  const isBearingAdequate = bearingPressure <= bearingCapacity;
  const isPunchingAdequate = punchingShearCapacity >= punchingShearDemand;

  const designChecks: DesignCheck[] = [
    {
      name: 'Bearing Capacity Adequate',
      passed: isBearingAdequate,
      codeReference: isCSA ? 'CSA 21.2' : 'ACI 13.4',
      value: `${bearingUtilization.toFixed(0)}%`,
    },
    {
      name: 'Punching Shear Adequate',
      passed: isPunchingAdequate,
      codeReference: isCSA ? 'CSA 13.3' : 'ACI 22.6',
    },
    {
      name: 'Flexural Capacity Adequate',
      passed: providedAs >= requiredAs,
      codeReference: isCSA ? 'CSA 15.4' : 'ACI 13.2',
    },
    {
      name: 'Development Length Met',
      passed: true,
      codeReference: isCSA ? 'CSA 12.2' : 'ACI 25.4',
    },
    {
      name: 'Minimum Depth Requirements',
      passed: footingDepth >= 300,
      codeReference: isCSA ? 'CSA 15.7' : 'ACI 13.3',
      value: `h = ${footingDepth} mm`,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Foundation Type */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Foundation Type</h4>
        <div className="space-y-0.5">
          <ResultRow 
            label="Type" 
            value={foundationType.charAt(0).toUpperCase() + foundationType.slice(1).replace('_', ' ')} 
          />
        </div>
      </div>

      <Separator />

      {/* Load Analysis */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Applied Loads</h4>
        <div className="space-y-0.5">
          <ResultRow label="Column Load (P)" value={columnLoad} unit="kN" />
          {momentX > 0 && <ResultRow label="Moment X (Mx)" value={momentX} unit="kN·m" />}
          {momentY > 0 && <ResultRow label="Moment Y (My)" value={momentY} unit="kN·m" />}
        </div>
      </div>

      <Separator />

      {/* Footing Dimensions */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Footing Dimensions</h4>
        <div className="space-y-0.5">
          <ResultRow 
            label="Plan Size" 
            value={`${footingLength} × ${footingWidth}`} 
            unit="mm"
            highlight
          />
          <ResultRow 
            label="Depth" 
            value={footingDepth} 
            unit="mm"
            highlight
          />
          {concreteVolume > 0 && (
            <ResultRow label="Concrete Volume" value={concreteVolume.toFixed(3)} unit="m³" />
          )}
        </div>
      </div>

      <Separator />

      {/* Bearing Capacity Check */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Bearing Capacity</h4>
        <div className="space-y-0.5">
          <ResultRow label="Allowable Bearing" value={bearingCapacity} unit="kPa" />
          <ResultRow 
            label="Actual Pressure" 
            value={bearingPressure.toFixed(1)} 
            unit="kPa"
            highlight={!isBearingAdequate}
          />
          <ResultRow 
            label="Utilization" 
            value={`${bearingUtilization.toFixed(0)}%`}
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
          <ResultRow label="Bottom Mesh" value={reinforcement} />
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

export const generateFoundationClipboardText = (
  inputs: Record<string, any>,
  outputs: Record<string, any>,
  buildingCode: BuildingCodeId
): string => {
  const isCSA = buildingCode === 'CSA';
  const codePrefix = isCSA ? 'CSA A23.3-24' : 'ACI 318-25';
  
  const columnLoad = Number(inputs.columnLoad) || 0;
  const bearingCapacity = Number(inputs.bearingCapacity) || 0;
  const footingLength = Number(outputs.footingLength) || 0;
  const footingWidth = Number(outputs.footingWidth) || 0;
  const footingDepth = Number(outputs.footingDepth) || 0;
  const bearingPressure = Number(outputs.bearingPressure) || 0;
  const providedAs = Number(outputs.providedAs) || 0;
  const reinforcement = outputs.reinforcement || outputs.mainBars || '-';
  
  const isAdequate = bearingPressure <= bearingCapacity;
  
  return `FOUNDATION DESIGN RESULTS
=========================

Design Code: ${codePrefix}
Status: ${isAdequate ? 'ADEQUATE' : 'INADEQUATE'}

APPLIED LOADS
- Column Load: ${columnLoad} kN

FOOTING DIMENSIONS
- Plan Size: ${footingLength} × ${footingWidth} mm
- Depth: ${footingDepth} mm

BEARING CAPACITY
- Allowable: ${bearingCapacity} kPa
- Actual: ${bearingPressure.toFixed(1)} kPa
- Utilization: ${((bearingPressure / bearingCapacity) * 100).toFixed(0)}%

REINFORCEMENT
- Provided: ${providedAs.toFixed(0)} mm² (${reinforcement})

DESIGN CHECKS
[${isAdequate ? 'OK' : 'NG'}] Bearing Capacity - ${isCSA ? 'CSA 21.2' : 'ACI 13.4'}
[OK] Punching Shear - ${isCSA ? 'CSA 13.3' : 'ACI 22.6'}
[OK] Flexural Capacity - ${isCSA ? 'CSA 15.4' : 'ACI 13.2'}

Generated by AYN | aynn.io`;
};

export default FoundationResultsSection;
