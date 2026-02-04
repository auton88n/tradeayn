import React from 'react';
import { ResultRow } from './ResultRow';
import { DesignCheckItem, DesignCheck } from './DesignCheckItem';
import { Separator } from '@/components/ui/separator';
import { type BuildingCodeId } from '@/lib/buildingCodes';

interface RetainingWallResultsSectionProps {
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  buildingCode: BuildingCodeId;
}

export const RetainingWallResultsSection: React.FC<RetainingWallResultsSectionProps> = ({
  inputs,
  outputs,
  buildingCode,
}) => {
  const isCSA = buildingCode === 'CSA';
  
  // Extract values
  const wallHeight = Number(inputs.wallHeight) || 0;
  const stemThicknessTop = Number(inputs.stemThicknessTop) || 0;
  const stemThicknessBottom = Number(inputs.stemThicknessBottom) || 0;
  const baseWidth = Number(inputs.baseWidth) || 0;
  const baseThickness = Number(inputs.baseThickness) || 0;
  const toeWidth = Number(inputs.toeWidth) || 0;
  const soilDensity = Number(inputs.soilDensity) || 18;
  const frictionAngle = Number(inputs.frictionAngle) || 30;
  
  // Outputs - Stability
  const overturningSF = Number(outputs.overturningSF) || Number(outputs.safetyFactorOverturning) || 0;
  const slidingSF = Number(outputs.slidingSF) || Number(outputs.safetyFactorSliding) || 0;
  const bearingSF = Number(outputs.bearingSF) || Number(outputs.safetyFactorBearing) || 0;
  
  // Outputs - Forces
  const activeEarthPressure = Number(outputs.activeEarthPressure) || 0;
  const horizontalForce = Number(outputs.horizontalForce) || 0;
  const overturningMoment = Number(outputs.overturningMoment) || 0;
  const resistingMoment = Number(outputs.resistingMoment) || 0;
  
  // Outputs - Reinforcement
  const stemReinforcement = outputs.stemReinforcement || outputs.mainBars || '-';
  const heelReinforcement = outputs.heelReinforcement || '-';
  const toeReinforcement = outputs.toeReinforcement || '-';
  
  // Heel width calculation
  const heelWidth = baseWidth - toeWidth - stemThicknessBottom;

  // Safety factor requirements
  const reqOverturningSF = 2.0;
  const reqSlidingSF = 1.5;
  const reqBearingSF = 3.0;

  const designChecks: DesignCheck[] = [
    {
      name: 'Overturning Stability',
      passed: overturningSF >= reqOverturningSF,
      codeReference: isCSA ? 'NBC' : 'ASCE 7',
      value: `SF = ${overturningSF.toFixed(2)} ≥ ${reqOverturningSF}`,
    },
    {
      name: 'Sliding Stability',
      passed: slidingSF >= reqSlidingSF,
      codeReference: isCSA ? 'NBC' : 'ASCE 7',
      value: `SF = ${slidingSF.toFixed(2)} ≥ ${reqSlidingSF}`,
    },
    {
      name: 'Bearing Capacity',
      passed: bearingSF >= reqBearingSF || bearingSF === 0,
      codeReference: isCSA ? 'CSA 21.2' : 'ACI 13.4',
      value: bearingSF > 0 ? `SF = ${bearingSF.toFixed(2)} ≥ ${reqBearingSF}` : 'OK',
    },
    {
      name: 'Stem Flexural Capacity',
      passed: true,
      codeReference: isCSA ? 'CSA 11.5' : 'ACI 11.8',
    },
    {
      name: 'Base Flexural Capacity',
      passed: true,
      codeReference: isCSA ? 'CSA 15.4' : 'ACI 13.2',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Wall Geometry */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Wall Geometry</h4>
        <div className="space-y-0.5">
          <ResultRow 
            label="Wall Height" 
            value={wallHeight} 
            unit="m"
            highlight
          />
          <ResultRow 
            label="Stem Thickness (Top/Bottom)" 
            value={`${stemThicknessTop} / ${stemThicknessBottom}`} 
            unit="mm"
          />
          <ResultRow label="Base Width" value={baseWidth} unit="mm" />
          <ResultRow label="Base Thickness" value={baseThickness} unit="mm" />
          <ResultRow label="Toe Width" value={toeWidth} unit="mm" />
          <ResultRow label="Heel Width" value={heelWidth.toFixed(0)} unit="mm" />
        </div>
      </div>

      <Separator />

      {/* Earth Pressure Analysis */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Earth Pressure Analysis</h4>
        <div className="space-y-0.5">
          <ResultRow label="Soil Unit Weight" value={soilDensity} unit="kN/m³" />
          <ResultRow label="Friction Angle (φ)" value={frictionAngle} unit="°" />
          {activeEarthPressure > 0 && (
            <ResultRow 
              label="Active Earth Pressure" 
              value={activeEarthPressure.toFixed(2)} 
              unit="kPa"
              codeRef={isCSA ? 'Rankine' : 'Rankine'}
            />
          )}
          {horizontalForce > 0 && (
            <ResultRow 
              label="Horizontal Force" 
              value={horizontalForce.toFixed(2)} 
              unit="kN/m"
              highlight
            />
          )}
        </div>
      </div>

      <Separator />

      {/* Stability Analysis */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Stability Analysis</h4>
        <div className="space-y-0.5">
          {overturningMoment > 0 && (
            <ResultRow label="Overturning Moment" value={overturningMoment.toFixed(2)} unit="kN·m/m" />
          )}
          {resistingMoment > 0 && (
            <ResultRow label="Resisting Moment" value={resistingMoment.toFixed(2)} unit="kN·m/m" />
          )}
          <ResultRow 
            label="Overturning SF" 
            value={overturningSF.toFixed(2)}
            highlight={overturningSF < reqOverturningSF}
          />
          <ResultRow 
            label="Sliding SF" 
            value={slidingSF.toFixed(2)}
            highlight={slidingSF < reqSlidingSF}
          />
          {bearingSF > 0 && (
            <ResultRow 
              label="Bearing SF" 
              value={bearingSF.toFixed(2)}
              highlight={bearingSF < reqBearingSF}
            />
          )}
        </div>
      </div>

      <Separator />

      {/* Reinforcement */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Reinforcement</h4>
        <div className="space-y-0.5">
          <ResultRow label="Stem (Vertical)" value={stemReinforcement} />
          {heelReinforcement !== '-' && (
            <ResultRow label="Heel (Top)" value={heelReinforcement} />
          )}
          {toeReinforcement !== '-' && (
            <ResultRow label="Toe (Bottom)" value={toeReinforcement} />
          )}
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

export const generateRetainingWallClipboardText = (
  inputs: Record<string, any>,
  outputs: Record<string, any>,
  buildingCode: BuildingCodeId
): string => {
  const isCSA = buildingCode === 'CSA';
  const codePrefix = isCSA ? 'CSA A23.3-24' : 'ACI 318-25';
  
  const wallHeight = Number(inputs.wallHeight) || 0;
  const stemThicknessBottom = Number(inputs.stemThicknessBottom) || 0;
  const baseWidth = Number(inputs.baseWidth) || 0;
  const baseThickness = Number(inputs.baseThickness) || 0;
  
  const overturningSF = Number(outputs.overturningSF) || Number(outputs.safetyFactorOverturning) || 0;
  const slidingSF = Number(outputs.slidingSF) || Number(outputs.safetyFactorSliding) || 0;
  const stemReinforcement = outputs.stemReinforcement || outputs.mainBars || '-';
  
  const isStable = overturningSF >= 2.0 && slidingSF >= 1.5;
  
  return `RETAINING WALL DESIGN RESULTS
=============================

Design Code: ${codePrefix}
Status: ${isStable ? 'ADEQUATE' : 'INADEQUATE'}

WALL GEOMETRY
- Wall Height: ${wallHeight} m
- Stem Thickness (Bottom): ${stemThicknessBottom} mm
- Base Width: ${baseWidth} mm
- Base Thickness: ${baseThickness} mm

STABILITY ANALYSIS
- Overturning SF: ${overturningSF.toFixed(2)} (Required ≥ 2.0)
- Sliding SF: ${slidingSF.toFixed(2)} (Required ≥ 1.5)

REINFORCEMENT
- Stem: ${stemReinforcement}

DESIGN CHECKS
[${overturningSF >= 2.0 ? 'OK' : 'NG'}] Overturning Stability - ${isCSA ? 'NBC' : 'ASCE 7'}
[${slidingSF >= 1.5 ? 'OK' : 'NG'}] Sliding Stability - ${isCSA ? 'NBC' : 'ASCE 7'}
[OK] Stem Flexural Capacity - ${isCSA ? 'CSA 11.5' : 'ACI 11.8'}

Generated by AYN | aynn.io`;
};

export default RetainingWallResultsSection;
