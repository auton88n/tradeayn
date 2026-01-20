// Types for Engineering calculators and workspace

export type CalculatorType = 
  | 'beam' 
  | 'foundation' 
  | 'column' 
  | 'slab' 
  | 'retaining_wall' 
  | 'parking' 
  | 'grading'
  | null;

export interface CalculationResult {
  type: CalculatorType;
  inputs: CalculatorInputs;
  outputs: CalculatorOutputs;
  timestamp: Date;
}

export interface CalculatorInputs {
  // Common
  [key: string]: number | string | boolean | undefined;
  
  // Beam
  span?: number;
  deadLoad?: number;
  liveLoad?: number;
  beamWidth?: number;
  concreteGrade?: string;
  steelGrade?: string;
  supportType?: string;
  
  // Foundation
  columnLoad?: number;
  momentX?: number;
  momentY?: number;
  columnWidth?: number;
  columnDepth?: number;
  bearingCapacity?: number;
  soilType?: string;
  foundationType?: string;
  
  // Column
  width?: number;
  depth?: number;
  height?: number;
  cover?: number;
  columnType?: string;
  axialLoad?: number;
  
  // Slab
  length?: number;
  thickness?: number;
  slabType?: string;
  
  // Retaining Wall
  wallHeight?: number;
  stemThicknessTop?: number;
  stemThicknessBottom?: number;
  baseWidth?: number;
  baseThickness?: number;
  toeWidth?: number;
  
  // Parking
  siteLength?: number;
  siteWidth?: number;
  parkingType?: string;
  floors?: number;
  parkingAngle?: number;
  spaceWidth?: number;
  spaceLength?: number;
  aisleWidth?: number;
}

export interface CalculatorOutputs {
  [key: string]: number | string | boolean | object | undefined;
  
  // Common
  isAdequate?: boolean;
  utilizationRatio?: number;
  
  // Beam outputs
  beamDepth?: number;
  effectiveDepth?: number;
  maxMoment?: number;
  maxShear?: number;
  requiredAs?: number;
  providedAs?: number;
  mainBars?: string;
  stirrups?: string;
  
  // Foundation outputs
  footingLength?: number;
  footingWidth?: number;
  footingDepth?: number;
  bearingPressure?: number;
  reinforcement?: string;
  
  // Column outputs
  axialCapacity?: number;
  momentCapacity?: number;
  reinforcementRatio?: number;
  
  // Parking outputs
  layout?: ParkingLayout;
  totalSpaces?: number;
  accessibleSpaces?: number;
  evSpaces?: number;
  efficiency?: number;
}

export interface ParkingSpace {
  id: string;
  x: number;
  y: number;
  width: number;
  length: number;
  angle: number;
  type: 'standard' | 'accessible' | 'compact' | 'ev';
}

export interface ParkingLayout {
  spaces: ParkingSpace[];
  aisles: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  entries: Array<{ x: number; y: number }>;
  exits: Array<{ x: number; y: number }>;
  totalSpaces: number;
  accessibleSpaces: number;
  evSpaces: number;
  compactSpaces: number;
}

export interface CalculatorConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  available: boolean;
  isPage?: boolean;
  path?: string;
  badge?: string;
}

// Window extension for AI agent integration
declare global {
  interface Window {
    __engineeringSessionContext?: () => {
      activeCalculator: CalculatorType;
      currentInputs: CalculatorInputs;
      currentOutputs: CalculatorOutputs | null;
      calculatorsUsed: CalculatorType[];
      calculationsRun: number;
      sessionDuration: number;
    };
  }
}
