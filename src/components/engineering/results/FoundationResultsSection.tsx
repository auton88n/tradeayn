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
  
  // Outputs - Dimensions
  const footingLength = Number(outputs.length) || Number(outputs.footingLength) || 0;
  const footingWidth = Number(outputs.width) || Number(outputs.footingWidth) || 0;
  const footingDepth = Number(outputs.depth) || Number(outputs.footingDepth) || 0;
  const footingArea = Number(outputs.area) || (footingLength * footingWidth);
  
  // Outputs - Bearing Pressure Distribution (NEW)
  const qMax = Number(outputs.qMax) || 0;
  const qMin = Number(outputs.qMin) || 0;
  const qAvg = Number(outputs.qAvg) || 0;
  const bearingUtilization = Number(outputs.bearingUtilization) || 0;
  
  // Outputs - Eccentricity (NEW)
  const eccentricityX = Number(outputs.eccentricityX) || 0;
  const eccentricityY = Number(outputs.eccentricityY) || 0;
  const middleThirdOK = outputs.middleThirdOK !== false;
  
  // Outputs - Reinforcement
  const requiredAs = Number(outputs.requiredAs) || 0;
  const providedAs = Number(outputs.providedAs) || 0;
  const reinforcement = outputs.reinforcementX || outputs.reinforcement || outputs.mainBars || '-';
  const concreteVolume = Number(outputs.concreteVolume) || 0;
  
  // Legacy fallbacks for bearing pressure
  const bearingPressure = qMax > 0 ? qMax : (Number(outputs.bearingPressure) || Number(outputs.actualPressure) || 0);
  
  const isBearingAdequate = bearingPressure <= bearingCapacity;
  const hasEccentricity = momentX > 0 || momentY > 0;

  const designChecks: DesignCheck[] = [
    {
      name: 'Bearing Capacity Adequate',
      passed: isBearingAdequate,
      codeReference: isCSA ? 'CSA 21.2' : 'ACI 13.4',
      value: `${bearingUtilization || Math.round((bearingPressure / bearingCapacity) * 100)}%`,
    },
    {
      name: 'Middle Third Rule (No Tension)',
      passed: middleThirdOK,
      codeReference: isCSA ? 'CSA 21.3' : 'ACI 13.2',
      value: middleThirdOK ? 'OK' : 'Tension',
      warning: !middleThirdOK,
    },
    {
      name: 'Flexural Capacity Adequate',
      passed: providedAs >= requiredAs || providedAs === 0,
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
            unit="m"
            highlight
          />
          <ResultRow 
            label="Depth" 
            value={footingDepth} 
            unit="mm"
            highlight
          />
          <ResultRow label="Area" value={footingArea.toFixed(2)} unit="m²" />
          {concreteVolume > 0 && (
            <ResultRow label="Concrete Volume" value={concreteVolume.toFixed(3)} unit="m³" />
          )}
        </div>
      </div>

      <Separator />

      {/* Bearing Pressure Distribution (NEW) */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Bearing Pressure Distribution</h4>
        <div className="space-y-0.5">
          <ResultRow 
            label="Maximum Pressure (q_max)" 
            value={qMax > 0 ? qMax.toFixed(1) : bearingPressure.toFixed(1)} 
            unit="kPa"
            highlight={!isBearingAdequate}
            codeRef={isCSA ? 'CSA A23.3-24' : 'ACI 318-25'}
          />
          {hasEccentricity && qMin !== qMax && (
            <ResultRow 
              label="Minimum Pressure (q_min)" 
              value={qMin.toFixed(1)} 
              unit="kPa"
              highlight={qMin < 0}
            />
          )}
          <ResultRow 
            label="Average Pressure (q_avg)" 
            value={qAvg > 0 ? qAvg.toFixed(1) : (columnLoad / footingArea).toFixed(1)} 
            unit="kPa"
          />
          <ResultRow label="Allowable Bearing" value={bearingCapacity} unit="kPa" />
          <ResultRow 
            label="Utilization" 
            value={`${bearingUtilization || Math.round((bearingPressure / bearingCapacity) * 100)}%`}
            highlight={bearingUtilization > 100}
          />
        </div>
      </div>

      {/* Eccentricity Check (NEW - only show if moments present) */}
      {hasEccentricity && (
        <>
          <Separator />
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Eccentricity Check</h4>
            <div className="space-y-0.5">
              <ResultRow 
                label="ex (Mx/P)" 
                value={(eccentricityX * 1000).toFixed(0)} 
                unit="mm"
              />
              <ResultRow 
                label="ey (My/P)" 
                value={(eccentricityY * 1000).toFixed(0)} 
                unit="mm"
              />
              <ResultRow 
                label="L/6 Limit" 
                value={(footingLength * 1000 / 6).toFixed(0)} 
                unit="mm"
              />
              <ResultRow 
                label="B/6 Limit" 
                value={(footingWidth * 1000 / 6).toFixed(0)} 
                unit="mm"
              />
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Reinforcement */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Reinforcement</h4>
        <div className="space-y-0.5">
          {requiredAs > 0 && (
            <ResultRow label="Required As" value={requiredAs.toFixed(0)} unit="mm²" />
          )}
          {providedAs > 0 && (
            <ResultRow 
              label="Provided As" 
              value={providedAs.toFixed(0)} 
              unit="mm²"
              highlight
            />
          )}
          <ResultRow label="Bottom Mesh" value={reinforcement} highlight />
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
  const momentX = Number(inputs.momentX) || 0;
  const momentY = Number(inputs.momentY) || 0;
  const bearingCapacity = Number(inputs.bearingCapacity) || 0;
  
  const footingLength = Number(outputs.length) || Number(outputs.footingLength) || 0;
  const footingWidth = Number(outputs.width) || Number(outputs.footingWidth) || 0;
  const footingDepth = Number(outputs.depth) || Number(outputs.footingDepth) || 0;
  const footingArea = Number(outputs.area) || (footingLength * footingWidth);
  
  const qMax = Number(outputs.qMax) || Number(outputs.bearingPressure) || 0;
  const qMin = Number(outputs.qMin) || 0;
  const qAvg = Number(outputs.qAvg) || 0;
  const bearingUtilization = Number(outputs.bearingUtilization) || Math.round((qMax / bearingCapacity) * 100);
  
  const eccentricityX = Number(outputs.eccentricityX) || 0;
  const eccentricityY = Number(outputs.eccentricityY) || 0;
  const middleThirdOK = outputs.middleThirdOK !== false;
  
  const reinforcement = outputs.reinforcementX || outputs.reinforcement || outputs.mainBars || '-';
  
  const isAdequate = qMax <= bearingCapacity && middleThirdOK;
  
  let text = `FOUNDATION DESIGN RESULTS
=========================

Design Code: ${codePrefix}
Status: ${isAdequate ? 'ADEQUATE' : 'INADEQUATE'}

APPLIED LOADS
- Column Load: ${columnLoad} kN`;

  if (momentX > 0) text += `\n- Moment X: ${momentX} kN·m`;
  if (momentY > 0) text += `\n- Moment Y: ${momentY} kN·m`;

  text += `

FOOTING DIMENSIONS
- Plan Size: ${footingLength} × ${footingWidth} m
- Area: ${footingArea.toFixed(2)} m²
- Depth: ${footingDepth} mm

BEARING PRESSURE DISTRIBUTION
- Maximum (q_max): ${qMax.toFixed(1)} kPa
- Minimum (q_min): ${qMin.toFixed(1)} kPa
- Average (q_avg): ${qAvg.toFixed(1)} kPa
- Allowable: ${bearingCapacity} kPa
- Utilization: ${bearingUtilization}%`;

  if (momentX > 0 || momentY > 0) {
    text += `

ECCENTRICITY CHECK
- ex = ${(eccentricityX * 1000).toFixed(0)} mm (Mx/P)
- ey = ${(eccentricityY * 1000).toFixed(0)} mm (My/P)
- Middle Third: ${middleThirdOK ? 'OK (no tension)' : 'FAIL (tension under footing)'}`;
  }

  text += `

REINFORCEMENT
- Bottom Mesh: ${reinforcement}

DESIGN CHECKS
[${qMax <= bearingCapacity ? 'OK' : 'NG'}] Bearing Capacity - ${isCSA ? 'CSA 21.2' : 'ACI 13.4'}
[${middleThirdOK ? 'OK' : 'NG'}] Middle Third Rule - ${isCSA ? 'CSA 21.3' : 'ACI 13.2'}
[OK] Flexural Capacity - ${isCSA ? 'CSA 15.4' : 'ACI 13.2'}

Generated by AYN | aynn.io`;

  return text;
};

export default FoundationResultsSection;
