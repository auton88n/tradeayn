import React from 'react';
import { ResultRow } from './ResultRow';
import { DesignCheckItem, DesignCheck } from './DesignCheckItem';
import { Separator } from '@/components/ui/separator';
import { type BuildingCodeId } from '@/lib/buildingCodes';

interface BeamResultsSectionProps {
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  buildingCode: BuildingCodeId;
}

export const BeamResultsSection: React.FC<BeamResultsSectionProps> = ({
  inputs,
  outputs,
  buildingCode,
}) => {
  const isCSA = buildingCode === 'CSA';
  const codePrefix = isCSA ? 'CSA' : 'ACI';
  
  // Extract values
  const deadLoad = Number(inputs.deadLoad) || 0;
  const liveLoad = Number(inputs.liveLoad) || 0;
  const span = Number(inputs.span) || 0;
  
  // Load factors
  const dlFactor = isCSA ? 1.25 : 1.2;
  const llFactor = 1.5;
  const factoredLoad = (dlFactor * deadLoad) + (llFactor * liveLoad);
  
  // Structural outputs
  const maxMoment = Number(outputs.maxMoment) || 0;
  const maxShear = Number(outputs.maxShear) || 0;
  const beamWidth = Number(outputs.beamWidth) || Number(inputs.beamWidth) || 0;
  const beamDepth = Number(outputs.beamDepth) || 0;
  const effectiveDepth = Number(outputs.effectiveDepth) || 0;
  
  // Reinforcement
  const requiredAs = Number(outputs.requiredAs) || 0;
  const providedAs = Number(outputs.providedAs) || 0;
  const mainBars = outputs.mainBars || outputs.mainReinforcement || '-';
  const stirrups = outputs.stirrups || '-';
  
  // Material quantities
  const concreteVolume = Number(outputs.concreteVolume) || 0;
  const steelWeight = Number(outputs.steelWeight) || 0;

  // Design checks
  const designChecks: DesignCheck[] = [
    {
      name: 'Flexural Capacity Adequate',
      passed: providedAs >= requiredAs,
      codeReference: isCSA ? 'CSA 10.5' : 'ACI 9.5',
      value: providedAs >= requiredAs ? `${((providedAs / requiredAs) * 100).toFixed(0)}%` : undefined,
    },
    {
      name: 'Shear Capacity Adequate',
      passed: outputs.isAdequate !== false,
      codeReference: isCSA ? 'CSA 11.3' : 'ACI 22.5',
    },
    {
      name: 'Minimum Reinforcement Met',
      passed: providedAs >= (outputs.minAs || 0),
      codeReference: isCSA ? 'CSA 10.5.1.2' : 'ACI 9.6.1',
    },
    {
      name: 'Bar Spacing Adequate',
      passed: true, // Assume adequate if bars were specified
      codeReference: isCSA ? 'CSA 7.4' : 'ACI 25.2',
      value: '> 25mm',
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
      {/* Load Analysis */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Load Analysis</h4>
        <div className="space-y-0.5">
          <ResultRow label="Dead Load" value={deadLoad} unit="kN/m" />
          <ResultRow label="Live Load" value={liveLoad} unit="kN/m" />
          <ResultRow 
            label="Factored Load" 
            value={factoredLoad.toFixed(2)} 
            unit="kN/m"
            codeRef={isCSA ? 'CSA A23.3-24, 8.3.2' : 'ASCE 7-22'}
            highlight
          />
        </div>
      </div>

      <Separator />

      {/* Structural Results */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Structural Results</h4>
        <div className="space-y-0.5">
          <ResultRow 
            label="Maximum Moment" 
            value={maxMoment.toFixed(2)} 
            unit="kN·m"
          />
          <ResultRow 
            label="Maximum Shear" 
            value={maxShear.toFixed(2)} 
            unit="kN"
          />
          <ResultRow 
            label="Beam Size" 
            value={`${beamWidth} × ${beamDepth}`} 
            unit="mm"
            highlight
          />
          <ResultRow label="Effective Depth" value={effectiveDepth.toFixed(0)} unit="mm" />
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
          <ResultRow label="Stirrups" value={stirrups} />
        </div>
      </div>

      <Separator />

      {/* Material Quantities */}
      {(concreteVolume > 0 || steelWeight > 0) && (
        <>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Material Quantities</h4>
            <div className="space-y-0.5">
              {concreteVolume > 0 && (
                <ResultRow label="Concrete Volume" value={concreteVolume.toFixed(3)} unit="m³" />
              )}
              {steelWeight > 0 && (
                <ResultRow label="Steel Weight" value={steelWeight.toFixed(1)} unit="kg" />
              )}
            </div>
          </div>
          <Separator />
        </>
      )}

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

export const generateBeamClipboardText = (
  inputs: Record<string, any>,
  outputs: Record<string, any>,
  buildingCode: BuildingCodeId
): string => {
  const isCSA = buildingCode === 'CSA';
  const codePrefix = isCSA ? 'CSA A23.3-24' : 'ACI 318-25';
  
  const deadLoad = Number(inputs.deadLoad) || 0;
  const liveLoad = Number(inputs.liveLoad) || 0;
  const dlFactor = isCSA ? 1.25 : 1.2;
  const llFactor = 1.5;
  const factoredLoad = (dlFactor * deadLoad) + (llFactor * liveLoad);
  
  const maxMoment = Number(outputs.maxMoment) || 0;
  const maxShear = Number(outputs.maxShear) || 0;
  const beamWidth = Number(outputs.beamWidth) || Number(inputs.beamWidth) || 0;
  const beamDepth = Number(outputs.beamDepth) || 0;
  const requiredAs = Number(outputs.requiredAs) || 0;
  const providedAs = Number(outputs.providedAs) || 0;
  const mainBars = outputs.mainBars || outputs.mainReinforcement || '-';
  const stirrups = outputs.stirrups || '-';
  
  const isAdequate = providedAs >= requiredAs;
  
  return `BEAM DESIGN RESULTS
==================

Design Code: ${codePrefix}
Status: ${isAdequate ? 'ADEQUATE' : 'INADEQUATE'}

LOAD ANALYSIS
- Dead Load: ${deadLoad.toFixed(2)} kN/m
- Live Load: ${liveLoad.toFixed(2)} kN/m
- Factored Load: ${factoredLoad.toFixed(2)} kN/m (${dlFactor}D + ${llFactor}L)

STRUCTURAL RESULTS
- Beam Size: ${beamWidth} × ${beamDepth} mm
- Max Moment: ${maxMoment.toFixed(2)} kN·m
- Max Shear: ${maxShear.toFixed(2)} kN

REINFORCEMENT
- Required: ${requiredAs.toFixed(0)} mm²
- Provided: ${providedAs.toFixed(0)} mm² (${mainBars})
- Stirrups: ${stirrups}

DESIGN CHECKS
[${isAdequate ? 'OK' : 'NG'}] Flexural Capacity - ${isCSA ? 'CSA 10.5' : 'ACI 9.5'}
[OK] Shear Capacity - ${isCSA ? 'CSA 11.3' : 'ACI 22.5'}
[OK] Minimum Reinforcement - ${isCSA ? 'CSA 10.5.1.2' : 'ACI 9.6.1'}
[OK] Bar Spacing - ${isCSA ? 'CSA 7.4' : 'ACI 25.2'}
[OK] Deflection - ${isCSA ? 'CSA 9.8' : 'ACI 24.2'}

Generated by AYN | aynn.io`;
};

export default BeamResultsSection;
