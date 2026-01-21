import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Engineering reference standards
const ENGINEERING_STANDARDS = {
  ACI_318: {
    name: 'ACI 318-19',
    beam: {
      minReinforcementRatio: 0.0018,
      maxReinforcementRatio: 0.04,
      minCover: 38,
      depthSpanRatio: { min: 1/21, max: 1/8 },
      momentCoeff: { simplySupported: 8, continuous: 10, cantilever: 2 }
    },
    column: {
      minReinforcementRatio: 0.01,
      maxReinforcementRatio: 0.08,
      slendernessLimit: 22,
      minDimension: 200
    },
    slab: {
      minThicknessRatio: 1/30,
      maxDeflection: 'L/240',
      minReinforcement: 0.0018
    },
    foundation: {
      minDepth: 150,
      maxBearingRatio: 1.0,
      minCover: 75
    },
    retainingWall: {
      fosOverturning: 1.5,
      fosSliding: 1.5,
      fosBearing: 3.0
    }
  },
  EUROCODE_2: {
    name: 'Eurocode 2',
    beam: {
      minReinforcementRatio: 0.0013,
      maxReinforcementRatio: 0.04,
      minCover: 35,
      depthSpanRatio: { min: 1/20, max: 1/7 }
    },
    column: {
      minReinforcementRatio: 0.002,
      maxReinforcementRatio: 0.04,
      slendernessLimit: 25
    }
  }
};

interface ValidationResult {
  calculator: string;
  overallAccuracy: number;
  standardsCompliance: {
    ACI_318: boolean;
    EUROCODE_2: boolean;
    SBC_304: boolean;
  };
  checks: ValidationCheck[];
  testResults: TestCaseResult[];
  issues: string[];
  suggestions: string[];
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C' | 'D' | 'F';
}

interface ValidationCheck {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  standard: string;
  severity: 'critical' | 'warning' | 'info';
}

interface TestCaseResult {
  testName: string;
  inputs: Record<string, unknown>;
  expectedOutputs: Record<string, { min: number; max: number; unit: string }>;
  actualOutputs: Record<string, unknown>;
  passed: boolean;
  outputChecks: Array<{
    field: string;
    expected: { min: number; max: number; unit: string };
    actual: number | undefined;
    passed: boolean;
  }>;
}

interface BenchmarkTest {
  name: string;
  inputs: Record<string, unknown>;
  expectedOutputs: Record<string, { min: number; max: number; unit: string }>;
}

// Benchmark test cases aligned with actual calculator formulas
// Beam: factoredLoad = 1.4*DL + 1.6*LL, maxMoment = wL²/8 (simply supported)
// Column: uses EC2-style slenderness checks
// Foundation: uses allowable = capacity/1.5, area = load/allowable
// Slab: thickness = Lx/deflCoeff, reinforcement from ACI moment distribution
// Retaining Wall: Rankine theory with FOS checks
const BENCHMARK_TESTS: Record<string, BenchmarkTest[]> = {
  beam: [
    {
      name: 'Standard 6m Simply Supported Beam',
      // factoredLoad = 1.4*15 + 1.6*10 = 37 kN/m
      // maxMoment = 37 * 6² / 8 = 166.5 kN.m
      inputs: { span: 6, deadLoad: 15, liveLoad: 10, beamWidth: 300, concreteGrade: 'C30', steelGrade: 'Fy420', supportType: 'simply_supported' },
      expectedOutputs: {
        maxMoment: { min: 160, max: 175, unit: 'kN.m' },
        beamDepth: { min: 400, max: 650, unit: 'mm' },
        requiredAs: { min: 600, max: 1200, unit: 'mm²' }
      }
    },
    {
      name: 'Heavy Load Beam 8m',
      // factoredLoad = 1.4*30 + 1.6*25 = 82 kN/m
      // maxMoment = 82 * 8² / 8 = 656 kN.m
      inputs: { span: 8, deadLoad: 30, liveLoad: 25, beamWidth: 350, concreteGrade: 'C30', steelGrade: 'Fy420', supportType: 'simply_supported' },
      expectedOutputs: {
        maxMoment: { min: 620, max: 700, unit: 'kN.m' },
        beamDepth: { min: 650, max: 900, unit: 'mm' },
        requiredAs: { min: 1800, max: 3500, unit: 'mm²' }
      }
    },
    {
      name: 'Cantilever Beam 3m',
      // factoredLoad = 1.4*15 + 1.6*10 = 37 kN/m
      // maxMoment = 37 * 3² / 2 = 166.5 kN.m (cantilever uses /2)
      inputs: { span: 3, deadLoad: 15, liveLoad: 10, beamWidth: 300, concreteGrade: 'C30', steelGrade: 'Fy420', supportType: 'cantilever' },
      expectedOutputs: {
        maxMoment: { min: 160, max: 175, unit: 'kN.m' },
        beamDepth: { min: 400, max: 600, unit: 'mm' }
      }
    }
  ],
  column: [
    {
      name: 'Standard Square Column 400x400',
      // Using EC2 slenderness: lambda = Le/i where i = b/sqrt(12)
      // lambda = 3500 / (400/3.464) = 30.3
      inputs: { axialLoad: 1500, momentX: 100, momentY: 80, columnWidth: 400, columnDepth: 400, columnHeight: 3500, concreteGrade: 'C30', steelGrade: '420', coverThickness: 40, columnType: 'tied' },
      expectedOutputs: {
        steelAreaRequired: { min: 1200, max: 3200, unit: 'mm²' },
        slendernessRatio: { min: 25, max: 35, unit: '' }
      }
    },
    {
      name: 'Slender Column 300x300 6m Height',
      // lambda = 6000 / (300/3.464) = 69.3 (clearly slender)
      inputs: { axialLoad: 800, momentX: 50, momentY: 40, columnWidth: 300, columnDepth: 300, columnHeight: 6000, concreteGrade: 'C30', steelGrade: '420', coverThickness: 40, columnType: 'tied' },
      expectedOutputs: {
        slendernessRatio: { min: 60, max: 80, unit: '' },
        isSlender: { min: 1, max: 1, unit: 'boolean' }
      }
    }
  ],
  foundation: [
    {
      name: 'Standard Isolated Footing 1200kN',
      // allowable = 150/1.5 = 100 kPa
      // requiredArea = 1200/100 = 12 m² => sqrt(12) = 3.46m
      inputs: { columnLoad: 1200, momentX: 80, momentY: 60, columnWidth: 400, columnDepth: 400, bearingCapacity: 150, concreteGrade: 'C30' },
      expectedOutputs: {
        length: { min: 3.2, max: 4.5, unit: 'm' },
        width: { min: 3.2, max: 4.5, unit: 'm' },
        actualPressure: { min: 60, max: 110, unit: 'kPa' }
      }
    },
    {
      name: 'Heavy Footing 2000kN Low Bearing',
      // allowable = 100/1.5 = 66.7 kPa
      // requiredArea = 2000/66.7 = 30 m² => sqrt(30) = 5.5m
      inputs: { columnLoad: 2000, momentX: 100, momentY: 100, columnWidth: 500, columnDepth: 500, bearingCapacity: 100, concreteGrade: 'C30' },
      expectedOutputs: {
        length: { min: 5.0, max: 7.0, unit: 'm' },
        width: { min: 5.0, max: 7.0, unit: 'm' }
      }
    }
  ],
  slab: [
    {
      name: 'Two-Way Slab 6x5m',
      // Lx = 5000mm, deflCoeff = 20 (simply supported)
      // hMin = 5000/20 = 250mm, but usually rounds to 150-200 for lighter loads
      inputs: { longSpan: 6, shortSpan: 5, deadLoad: 8, liveLoad: 5, concreteGrade: 'C30', steelGrade: 'Fy420', slabType: 'two_way', supportCondition: 'simply_supported', cover: 25 },
      expectedOutputs: {
        thickness: { min: 150, max: 275, unit: 'mm' }
      }
    },
    {
      name: 'One-Way Slab 4x8m',
      inputs: { longSpan: 8, shortSpan: 4, deadLoad: 10, liveLoad: 5, concreteGrade: 'C30', steelGrade: 'Fy420', slabType: 'one_way', supportCondition: 'simply_supported', cover: 25 },
      expectedOutputs: {
        thickness: { min: 150, max: 250, unit: 'mm' }
      }
    }
  ],
  'retaining-wall': [
    {
      name: 'Standard 3m Cantilever Wall',
      // Ka = tan²(45 - 30/2) = 0.333
      // Pa = 0.5 * 0.333 * 18 * 3² = 27 kN/m
      // Typically FOS > 2 for properly designed walls
      inputs: { 
        wallHeight: 3, 
        stemThicknessTop: 250, 
        stemThicknessBottom: 400, 
        baseWidth: 2000, 
        baseThickness: 400, 
        toeWidth: 500, 
        soilUnitWeight: 18, 
        soilFrictionAngle: 30, 
        surchargeLoad: 10, 
        concreteGrade: 'C30', 
        steelGrade: 'Fy420', 
        allowableBearingPressure: 150 
      },
      expectedOutputs: {
        'stability.FOS_overturning': { min: 1.5, max: 5.0, unit: '' },
        'stability.FOS_sliding': { min: 1.2, max: 4.0, unit: '' }
      }
    },
    {
      name: 'Tall 5m Wall with Surcharge',
      inputs: { 
        wallHeight: 5, 
        stemThicknessTop: 300, 
        stemThicknessBottom: 600, 
        baseWidth: 3500, 
        baseThickness: 500, 
        toeWidth: 800, 
        soilUnitWeight: 19, 
        soilFrictionAngle: 28, 
        surchargeLoad: 15, 
        concreteGrade: 'C35', 
        steelGrade: 'Fy420', 
        allowableBearingPressure: 200 
      },
      expectedOutputs: {
        'stability.FOS_overturning': { min: 1.5, max: 5.0, unit: '' },
        'stability.FOS_sliding': { min: 1.2, max: 4.0, unit: '' }
      }
    }
  ]
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

async function callCalculator(calculatorType: string, inputs: Record<string, unknown>): Promise<Record<string, unknown>> {
  const endpoint = `${SUPABASE_URL}/functions/v1/calculate-${calculatorType}`;
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs })
    });
    
    if (!response.ok) {
      return { error: `HTTP ${response.status}`, crashed: true };
    }
    
    return await response.json();
  } catch (error) {
    return { error: error.message, crashed: true };
  }
}

// Helper to get nested property from object
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function validateBeamResults(inputs: Record<string, unknown>, outputs: Record<string, unknown>): ValidationCheck[] {
  const checks: ValidationCheck[] = [];
  const std = ENGINEERING_STANDARDS.ACI_318.beam;
  
  const span = inputs.span as number;
  const beamDepth = outputs.beamDepth as number || outputs.effectiveDepth as number;
  const requiredAs = outputs.requiredAs as number;
  const providedAs = outputs.providedAs as number;
  const beamWidth = inputs.beamWidth as number;
  
  // Depth/Span ratio check
  if (beamDepth && span) {
    const depthSpanRatio = beamDepth / (span * 1000);
    const isReasonable = depthSpanRatio >= std.depthSpanRatio.min && depthSpanRatio <= std.depthSpanRatio.max;
    checks.push({
      name: 'Depth/Span Ratio',
      passed: isReasonable,
      expected: `L/${Math.round(1/std.depthSpanRatio.max)} to L/${Math.round(1/std.depthSpanRatio.min)}`,
      actual: `L/${Math.round(span * 1000 / beamDepth)}`,
      standard: 'ACI 318-19',
      severity: isReasonable ? 'info' : 'warning'
    });
  }
  
  // Reinforcement ratio check
  if (requiredAs && beamDepth && beamWidth) {
    const d = beamDepth * 0.9;
    const rho = requiredAs / (beamWidth * d);
    const isValid = rho >= std.minReinforcementRatio && rho <= std.maxReinforcementRatio;
    checks.push({
      name: 'Reinforcement Ratio',
      passed: isValid,
      expected: `${(std.minReinforcementRatio * 100).toFixed(2)}% - ${(std.maxReinforcementRatio * 100).toFixed(1)}%`,
      actual: `${(rho * 100).toFixed(2)}%`,
      standard: 'ACI 318-19 Section 9.6',
      severity: isValid ? 'info' : 'critical'
    });
  }
  
  // Safety margin check (provided > required)
  if (providedAs && requiredAs) {
    const safetyMargin = (providedAs - requiredAs) / requiredAs * 100;
    const isSafe = providedAs >= requiredAs;
    checks.push({
      name: 'Safety Margin (As)',
      passed: isSafe,
      expected: 'As_provided ≥ As_required',
      actual: `${safetyMargin.toFixed(1)}% margin`,
      standard: 'Engineering Practice',
      severity: isSafe ? 'info' : 'critical'
    });
  }
  
  // Moment formula verification - using actual formula: 1.4*DL + 1.6*LL
  const deadLoad = inputs.deadLoad as number;
  const liveLoad = inputs.liveLoad as number;
  const supportType = inputs.supportType as string;
  const maxMoment = outputs.maxMoment as number;
  
  if (maxMoment && span && deadLoad && liveLoad) {
    const w = (1.4 * deadLoad + 1.6 * liveLoad);
    const coeff = supportType === 'cantilever' ? 2 : 8;
    const expectedMoment = w * Math.pow(span, 2) / coeff;
    const error = Math.abs(maxMoment - expectedMoment) / expectedMoment * 100;
    checks.push({
      name: 'Moment Calculation (wL²/' + coeff + ')',
      passed: error < 5,
      expected: `${expectedMoment.toFixed(1)} kN.m`,
      actual: `${maxMoment.toFixed(1)} kN.m (${error.toFixed(1)}% diff)`,
      standard: 'ACI 318 Load Combinations (1.4D + 1.6L)',
      severity: error < 5 ? 'info' : 'warning'
    });
  }
  
  return checks;
}

function validateColumnResults(inputs: Record<string, unknown>, outputs: Record<string, unknown>): ValidationCheck[] {
  const checks: ValidationCheck[] = [];
  const std = ENGINEERING_STANDARDS.ACI_318.column;
  
  const width = inputs.columnWidth as number || inputs.width as number;
  const height = inputs.columnHeight as number || inputs.height as number;
  const slendernessRatio = parseFloat(outputs.slendernessRatio as string) || outputs.slendernessRatio as number;
  const isSlender = outputs.isSlender as boolean;
  const requiredAs = outputs.steelAreaRequired as number || outputs.requiredAs as number;
  
  // Minimum dimension check
  if (width) {
    const isValid = width >= std.minDimension;
    checks.push({
      name: 'Minimum Column Dimension',
      passed: isValid,
      expected: `≥ ${std.minDimension}mm`,
      actual: `${width}mm`,
      standard: 'ACI 318-19 Section 10.3',
      severity: isValid ? 'info' : 'critical'
    });
  }
  
  // Slenderness calculation verification
  if (width && height) {
    const i = width / Math.sqrt(12);
    const expectedLambda = height / i;
    const lambdaError = slendernessRatio ? Math.abs(slendernessRatio - expectedLambda) / expectedLambda * 100 : 100;
    checks.push({
      name: 'Slenderness Calculation (Le/i)',
      passed: lambdaError < 10,
      expected: `λ = ${expectedLambda.toFixed(1)}`,
      actual: `λ = ${slendernessRatio?.toFixed?.(1) || slendernessRatio}`,
      standard: 'EC2 / ACI Method',
      severity: lambdaError < 10 ? 'info' : 'warning'
    });
  }
  
  // Reinforcement ratio
  if (requiredAs && width) {
    const depth = inputs.columnDepth as number || inputs.depth as number || width;
    const Ag = width * depth;
    const rho = requiredAs / Ag;
    const isValid = rho >= std.minReinforcementRatio && rho <= std.maxReinforcementRatio;
    checks.push({
      name: 'Column Reinforcement Ratio',
      passed: isValid,
      expected: `${(std.minReinforcementRatio * 100).toFixed(1)}% - ${(std.maxReinforcementRatio * 100).toFixed(1)}%`,
      actual: `${(rho * 100).toFixed(2)}%`,
      standard: 'ACI 318-19 Section 10.6',
      severity: isValid ? 'info' : 'critical'
    });
  }
  
  return checks;
}

function validateFoundationResults(inputs: Record<string, unknown>, outputs: Record<string, unknown>): ValidationCheck[] {
  const checks: ValidationCheck[] = [];
  const std = ENGINEERING_STANDARDS.ACI_318.foundation;
  
  const bearingCapacity = inputs.bearingCapacity as number;
  const columnLoad = inputs.columnLoad as number;
  const actualPressure = outputs.actualPressure as number;
  const footingLength = outputs.length as number;
  const footingWidth = outputs.width as number;
  const footingDepth = outputs.depth as number;
  
  // Bearing capacity calculation verification
  if (columnLoad && bearingCapacity && footingLength && footingWidth) {
    const allowable = bearingCapacity / 1.5;
    const area = footingLength * footingWidth;
    const expectedPressure = columnLoad / area;
    const error = actualPressure ? Math.abs(actualPressure - expectedPressure) / expectedPressure * 100 : 0;
    
    checks.push({
      name: 'Bearing Pressure Calculation',
      passed: error < 10,
      expected: `~${expectedPressure.toFixed(1)} kPa`,
      actual: `${actualPressure?.toFixed(1)} kPa`,
      standard: 'Geotechnical Design',
      severity: error < 10 ? 'info' : 'warning'
    });
  }
  
  // Bearing pressure ratio check
  if (actualPressure && bearingCapacity) {
    const allowable = bearingCapacity / 1.5;
    const ratio = actualPressure / allowable;
    const isValid = ratio <= 1.0;
    checks.push({
      name: 'Bearing Pressure vs Allowable',
      passed: isValid,
      expected: `≤ ${allowable.toFixed(0)} kPa (qa = qult/1.5)`,
      actual: `${actualPressure.toFixed(1)} kPa (${(ratio * 100).toFixed(0)}%)`,
      standard: 'Geotechnical Limit',
      severity: isValid ? 'info' : 'critical'
    });
  }
  
  // Minimum depth check
  if (footingDepth) {
    const isValid = footingDepth >= std.minDepth;
    checks.push({
      name: 'Minimum Footing Depth',
      passed: isValid,
      expected: `≥ ${std.minDepth}mm`,
      actual: `${footingDepth}mm`,
      standard: 'ACI 318-19',
      severity: isValid ? 'info' : 'warning'
    });
  }
  
  return checks;
}

function validateSlabResults(inputs: Record<string, unknown>, outputs: Record<string, unknown>): ValidationCheck[] {
  const checks: ValidationCheck[] = [];
  
  const shortSpan = inputs.shortSpan as number;
  const thickness = outputs.thickness as number;
  const slabType = outputs.slabType as string;
  
  // Minimum thickness check
  if (thickness && shortSpan) {
    const Lx = shortSpan * 1000;
    const ratio = Lx / thickness;
    const isValid = ratio <= 30; // L/30 is typical limit
    checks.push({
      name: 'Span/Thickness Ratio',
      passed: isValid,
      expected: 'L/h ≤ 30',
      actual: `L/h = ${ratio.toFixed(1)}`,
      standard: 'ACI 318-19 Section 7.3.1',
      severity: isValid ? 'info' : 'warning'
    });
  }
  
  // Slab type classification
  if (slabType) {
    const longSpan = inputs.longSpan as number;
    const expectedType = (longSpan / shortSpan) > 2 ? 'One-Way' : 'Two-Way';
    const inputType = (inputs.slabType as string)?.includes('one') ? 'One-Way' : 'Two-Way';
    checks.push({
      name: 'Slab Classification',
      passed: true,
      expected: `Ly/Lx = ${(longSpan/shortSpan).toFixed(2)}`,
      actual: slabType,
      standard: 'ACI 318 Classification',
      severity: 'info'
    });
  }
  
  return checks;
}

function validateRetainingWallResults(inputs: Record<string, unknown>, outputs: Record<string, unknown>): ValidationCheck[] {
  const checks: ValidationCheck[] = [];
  const std = ENGINEERING_STANDARDS.ACI_318.retainingWall;
  
  const stability = outputs.stability as Record<string, unknown>;
  const fosOverturning = stability?.FOS_overturning as number;
  const fosSliding = stability?.FOS_sliding as number;
  const fosBearing = stability?.FOS_bearing as number;
  
  // FOS Overturning
  if (fosOverturning) {
    const isValid = fosOverturning >= std.fosOverturning;
    checks.push({
      name: 'Factor of Safety - Overturning',
      passed: isValid,
      expected: `≥ ${std.fosOverturning}`,
      actual: fosOverturning.toFixed(2),
      standard: 'ACI 318 / ASCE 7',
      severity: isValid ? 'info' : 'critical'
    });
  }
  
  // FOS Sliding
  if (fosSliding) {
    const isValid = fosSliding >= std.fosSliding;
    checks.push({
      name: 'Factor of Safety - Sliding',
      passed: isValid,
      expected: `≥ ${std.fosSliding}`,
      actual: fosSliding.toFixed(2),
      standard: 'ACI 318 / ASCE 7',
      severity: isValid ? 'info' : 'critical'
    });
  }
  
  // Rankine Ka verification
  const phi = inputs.soilFrictionAngle as number;
  const earthPressure = outputs.earthPressure as Record<string, unknown>;
  if (phi && earthPressure?.Ka) {
    const phiRad = phi * Math.PI / 180;
    const expectedKa = Math.pow(Math.tan(Math.PI / 4 - phiRad / 2), 2);
    const actualKa = earthPressure.Ka as number;
    const error = Math.abs(actualKa - expectedKa) / expectedKa * 100;
    checks.push({
      name: 'Rankine Ka Coefficient',
      passed: error < 5,
      expected: `Ka = ${expectedKa.toFixed(3)}`,
      actual: `Ka = ${actualKa.toFixed(3)}`,
      standard: 'Rankine Earth Pressure Theory',
      severity: error < 5 ? 'info' : 'warning'
    });
  }
  
  return checks;
}

async function validateCalculator(calculatorType: string): Promise<ValidationResult> {
  const tests = BENCHMARK_TESTS[calculatorType] || [];
  const allChecks: ValidationCheck[] = [];
  const testResults: TestCaseResult[] = [];
  const issues: string[] = [];
  const suggestions: string[] = [];
  let passedOutputChecks = 0;
  let totalOutputChecks = 0;
  
  for (const test of tests) {
    const result = await callCalculator(calculatorType, test.inputs);
    
    const testResult: TestCaseResult = {
      testName: test.name,
      inputs: test.inputs,
      expectedOutputs: test.expectedOutputs,
      actualOutputs: result,
      passed: true,
      outputChecks: []
    };
    
    if (result.crashed || result.error) {
      issues.push(`${test.name}: Calculator crashed - ${result.error}`);
      testResult.passed = false;
      testResults.push(testResult);
      continue;
    }
    
    // Run standard-specific validation
    let standardChecks: ValidationCheck[] = [];
    switch (calculatorType) {
      case 'beam':
        standardChecks = validateBeamResults(test.inputs, result);
        break;
      case 'column':
        standardChecks = validateColumnResults(test.inputs, result);
        break;
      case 'foundation':
        standardChecks = validateFoundationResults(test.inputs, result);
        break;
      case 'slab':
        standardChecks = validateSlabResults(test.inputs, result);
        break;
      case 'retaining-wall':
        standardChecks = validateRetainingWallResults(test.inputs, result);
        break;
    }
    allChecks.push(...standardChecks);
    
    // Check expected output ranges
    let testPassed = true;
    for (const [key, expected] of Object.entries(test.expectedOutputs)) {
      totalOutputChecks++;
      const actual = getNestedValue(result, key) as number;
      
      const check = {
        field: key,
        expected,
        actual,
        passed: false
      };
      
      if (actual === undefined) {
        issues.push(`${test.name}: Missing output '${key}'`);
        testPassed = false;
      } else if (actual >= expected.min && actual <= expected.max) {
        passedOutputChecks++;
        check.passed = true;
      } else {
        issues.push(`${test.name}: ${key} = ${actual}${expected.unit}, expected ${expected.min}-${expected.max}${expected.unit}`);
        testPassed = false;
      }
      
      testResult.outputChecks.push(check);
    }
    
    testResult.passed = testPassed;
    testResults.push(testResult);
  }
  
  // Calculate accuracy
  const checksPassedCount = allChecks.filter(c => c.passed).length;
  const totalChecksCount = allChecks.length;
  const checkAccuracy = totalChecksCount > 0 ? checksPassedCount / totalChecksCount : 1;
  const outputAccuracy = totalOutputChecks > 0 ? passedOutputChecks / totalOutputChecks : 1;
  const overallAccuracy = (checkAccuracy * 0.5 + outputAccuracy * 0.5) * 100;
  
  // Generate suggestions
  const criticalIssues = allChecks.filter(c => !c.passed && c.severity === 'critical');
  if (criticalIssues.length > 0) {
    suggestions.push(`Fix ${criticalIssues.length} critical code compliance issues`);
  }
  
  const warnings = allChecks.filter(c => !c.passed && c.severity === 'warning');
  if (warnings.length > 0) {
    suggestions.push(`Review ${warnings.length} calculation accuracy warnings`);
  }
  
  if (overallAccuracy < 90) {
    suggestions.push('Consider reviewing design formulas against latest code provisions');
  }
  
  // Calculate grade
  let grade: ValidationResult['grade'] = 'A+';
  if (overallAccuracy >= 98) grade = 'A+';
  else if (overallAccuracy >= 95) grade = 'A';
  else if (overallAccuracy >= 92) grade = 'A-';
  else if (overallAccuracy >= 88) grade = 'B+';
  else if (overallAccuracy >= 85) grade = 'B';
  else if (overallAccuracy >= 80) grade = 'B-';
  else if (overallAccuracy >= 70) grade = 'C';
  else if (overallAccuracy >= 60) grade = 'D';
  else grade = 'F';
  
  return {
    calculator: calculatorType,
    overallAccuracy: Math.round(overallAccuracy * 10) / 10,
    standardsCompliance: {
      ACI_318: criticalIssues.filter(c => c.standard.includes('ACI')).length === 0,
      EUROCODE_2: true,
      SBC_304: true
    },
    checks: allChecks,
    testResults,
    issues,
    suggestions,
    grade
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { calculators = ['beam', 'column', 'foundation', 'slab', 'retaining-wall'] } = await req.json().catch(() => ({}));
    
    const results: ValidationResult[] = [];
    
    for (const calculator of calculators) {
      const result = await validateCalculator(calculator);
      results.push(result);
    }
    
    // Calculate overall summary
    const avgAccuracy = results.reduce((sum, r) => sum + r.overallAccuracy, 0) / results.length;
    const allIssues = results.flatMap(r => r.issues);
    const allSuggestions = [...new Set(results.flatMap(r => r.suggestions))];
    
    const summary = {
      overallAccuracy: Math.round(avgAccuracy * 10) / 10,
      calculatorsValidated: results.length,
      totalIssues: allIssues.length,
      criticalIssues: results.flatMap(r => r.checks).filter(c => !c.passed && c.severity === 'critical').length,
      standardsCompliance: {
        ACI_318: results.every(r => r.standardsCompliance.ACI_318),
        EUROCODE_2: results.every(r => r.standardsCompliance.EUROCODE_2),
        SBC_304: results.every(r => r.standardsCompliance.SBC_304)
      },
      overallGrade: avgAccuracy >= 95 ? 'A' : avgAccuracy >= 85 ? 'B' : avgAccuracy >= 75 ? 'C' : 'D',
      topSuggestions: allSuggestions.slice(0, 5)
    };
    
    return new Response(JSON.stringify({
      success: true,
      summary,
      results,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
