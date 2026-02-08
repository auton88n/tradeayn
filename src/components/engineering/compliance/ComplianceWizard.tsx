import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Play, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useComplianceProject } from './hooks/useComplianceProject';
import { useComplianceCheck } from './hooks/useComplianceCheck';
import { ProjectSetupStep } from './steps/ProjectSetupStep';
import { RoomEntryStep } from './steps/RoomEntryStep';
import { WindowEntryStep } from './steps/WindowEntryStep';
import { StairEntryStep } from './steps/StairEntryStep';
import { DoorsHallwaysStep } from './steps/DoorsHallwaysStep';
import { FireSafetyStep } from './steps/FireSafetyStep';
import { ReviewStep } from './steps/ReviewStep';
import { ResultsStep } from './steps/ResultsStep';
import type { ComplianceInput } from './utils/complianceEngine';

interface Props {
  userId: string;
}

const ComplianceWizard: React.FC<Props> = ({ userId }) => {
  const { project, updateProject } = useComplianceProject(userId);
  const { results, loading, runCheck, passed, failed, warnings } = useComplianceCheck();
  
  const [step, setStep] = useState(0);
  const [rooms, setRooms] = useState<ComplianceInput[]>([]);
  const [windows, setWindows] = useState<ComplianceInput[]>([]);
  const [stair, setStair] = useState<ComplianceInput>({ input_type: 'stair', unit_system: 'imperial' });
  const [doors, setDoors] = useState<ComplianceInput[]>([]);
  const [fireSafety, setFireSafety] = useState({
    garageWallSeparation: false, garageCeilingSeparation: false, garageClosingDoor: false,
    smokeAlarmBedrooms: false, smokeAlarmHallway: false, smokeAlarmEveryStorey: false, smokeAlarmHardwired: false,
    coAlarmSleeping: false, coAlarmEveryStorey: false, radonStack: false,
  });

  const unitSystem = project.location_country === 'CA' ? 'metric' as const : 'imperial' as const;
  const hasStairs = project.num_storeys > 1 || project.has_basement;
  const isCanada = project.location_country === 'CA';

  // Build step list (stairs conditional)
  const steps = [
    'Project Setup', 'Rooms', 'Windows',
    ...(hasStairs ? ['Stairs'] : []),
    'Doors & Hallways', 'Fire Safety', 'Review', 'Results',
  ];

  const handleRunCheck = async () => {
    const allInputs: ComplianceInput[] = [
      ...rooms,
      ...windows,
      ...(hasStairs ? [stair] : []),
      ...doors,
      // Convert fire safety booleans to alarm inputs
      { input_type: 'alarm' as const, unit_system: unitSystem, room_name: 'Building' },
    ];

    await runCheck(project.code_system, allInputs, {
      has_basement: project.has_basement,
      has_garage: project.has_garage,
      garage_attached: project.garage_attached,
      has_fuel_burning_appliance: project.has_fuel_burning_appliance,
      num_storeys: project.num_storeys,
      building_type: project.building_type,
    });

    setStep(steps.length - 1); // Go to results
  };

  const renderStep = () => {
    const stepName = steps[step];
    switch (stepName) {
      case 'Project Setup':
        return <ProjectSetupStep project={project} onUpdate={updateProject} />;
      case 'Rooms':
        return <RoomEntryStep rooms={rooms} onUpdate={setRooms} unitSystem={unitSystem} />;
      case 'Windows':
        return <WindowEntryStep windows={windows} rooms={rooms} onUpdate={setWindows} unitSystem={unitSystem} />;
      case 'Stairs':
        return <StairEntryStep stair={stair} onUpdate={setStair} unitSystem={unitSystem} />;
      case 'Doors & Hallways':
        return <DoorsHallwaysStep doors={doors} onUpdate={setDoors} unitSystem={unitSystem} />;
      case 'Fire Safety':
        return <FireSafetyStep data={fireSafety} onUpdate={setFireSafety} hasGarage={project.has_garage} hasFuelBurning={project.has_fuel_burning_appliance} isCanada={isCanada} />;
      case 'Review':
        return <ReviewStep project={project} rooms={rooms} windows={windows} stair={stair} doors={doors} hasStairs={hasStairs} />;
      case 'Results':
        return <ResultsStep results={results} passed={passed} failed={failed} warnings={warnings} codeSystem={project.code_system} onStartNew={() => setStep(0)} />;
      default:
        return null;
    }
  };

  const isLastInputStep = steps[step] === 'Review';
  const isResults = steps[step] === 'Results';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20">
          <ClipboardCheck className="w-5 h-5 text-teal-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Building Code Compliance</h2>
          <p className="text-sm text-muted-foreground">
            {isCanada ? 'NBC 2025' : 'IRC 2024'} • {unitSystem === 'imperial' ? 'Imperial' : 'Metric'}
          </p>
        </div>
      </div>

      {/* Step Indicators */}
      {!isResults && (
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {steps.filter(s => s !== 'Results').map((s, i) => (
            <button
              key={s}
              onClick={() => i <= step && setStep(i)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                i === step ? "bg-primary text-primary-foreground" :
                i < step ? "bg-primary/10 text-primary cursor-pointer" :
                "bg-muted text-muted-foreground"
              )}
            >
              {i + 1}. {s}
            </button>
          ))}
        </div>
      )}

      {/* Step Content */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        {renderStep()}
      </motion.div>

      {/* Navigation */}
      {!isResults && (
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <Button
            variant="outline"
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>

          {isLastInputStep ? (
            <Button
              onClick={handleRunCheck}
              disabled={loading}
              className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
            >
              <Play className="w-4 h-4" />
              {loading ? 'Checking...' : 'Run Compliance Check'}
            </Button>
          ) : (
            <Button
              onClick={() => setStep(s => Math.min(steps.length - 2, s + 1))}
              className="gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ComplianceWizard;
