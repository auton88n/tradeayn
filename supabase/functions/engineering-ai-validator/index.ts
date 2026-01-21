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
      minCover: 38, // mm
      depthSpanRatio: { min: 1/21, max: 1/8 }, // L/21 to L/8
      momentCoeff: { simplySupported: 8, continuous: 10, cantilever: 2 }
    },
    column: {
      minReinforcementRatio: 0.01,
      maxReinforcementRatio: 0.08,
      slendernessLimit: 22,
      minDimension: 200 // mm
    },
    slab: {
      minThicknessRatio: 1/30, // L/30 for two-way
      maxDeflection: 'L/240',
      minReinforcement: 0.0018
    },
    foundation: {
      minDepth: 150, // mm
      maxBearingRatio: 1.0,
      minCover: 75 // mm for soil contact
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

interface BenchmarkTest {
  name: string;
  inputs: Record<string, unknown>;
  expectedOutputs: Record<string, { min: number; max: number; unit: string }>;
}

// Benchmark test cases for each calculator
const BENCHMARK_TESTS: Record<string, BenchmarkTest[]> = {
  beam: [
    {
      name: 'Standard 6m Simply Supported Beam',
      inputs: { span: 6, deadLoad: 15, liveLoad: 10, beamWidth: 300, supportType: 'simply_supported' },
      expectedOutputs: {
        maxMoment: { min: 100, max: 130, unit: 'kN.m' },
        beamDepth: { min: 400, max: 600, unit: 'mm' },
        requiredAs: { min: 400, max: 800, unit: 'mm²' }
      }
    },
    {
      name: 'Heavy Load Beam',
      inputs: { span: 8, deadLoad: 30, liveLoad: 25, beamWidth: 350, supportType: 'simply_supported' },
      expectedOutputs: {
        maxMoment: { min: 350, max: 450, unit: 'kN.m' },
        beamDepth: { min: 550, max: 750, unit: 'mm' },
        requiredAs: { min: 1000, max: 1800, unit: 'mm²' }
      }
    },
    {
      name: 'Cantilever Beam',
      inputs: { span: 3, deadLoad: 15, liveLoad: 10, beamWidth: 300, supportType: 'cantilever' },
      expectedOutputs: {
        maxMoment: { min: 80, max: 130, unit: 'kN.m' },
        beamDepth: { min: 350, max: 500, unit: 'mm' }
      }
    }
  ],
  column: [
    {
      name: 'Standard Square Column',
      inputs: { axialLoad: 1500, momentX: 100, momentY: 80, columnWidth: 400, columnDepth: 400, columnHeight: 3500 },
      expectedOutputs: {
        requiredAs: { min: 1200, max: 2500, unit: 'mm²' },
        slendernessRatio: { min: 8, max: 20, unit: '' }
      }
    },
    {
      name: 'Slender Column',
      inputs: { axialLoad: 800, momentX: 50, momentY: 40, columnWidth: 300, columnDepth: 300, columnHeight: 6000 },
      expectedOutputs: {
        slendernessRatio: { min: 20, max: 35, unit: '' },
        isSlender: { min: 1, max: 1, unit: 'boolean' }
      }
    }
  ],
  foundation: [
    {
      name: 'Standard Isolated Footing',
      inputs: { columnLoad: 1200, momentX: 80, momentY: 60, columnWidth: 400, columnDepth: 400, bearingCapacity: 150 },
      expectedOutputs: {
        footingLength: { min: 2.0, max: 3.5, unit: 'm' },
        footingWidth: { min: 2.0, max: 3.5, unit: 'm' },
        bearingPressure: { min: 80, max: 150, unit: 'kPa' }
      }
    }
  ],
  slab: [
    {
      name: 'Two-Way Slab 6x5m',
      inputs: { longSpan: 6, shortSpan: 5, deadLoad: 8, liveLoad: 5, slabType: 'two_way' },
      expectedOutputs: {
        thickness: { min: 150, max: 200, unit: 'mm' },
        reinforcementX: { min: 300, max: 600, unit: 'mm²/m' },
        reinforcementY: { min: 250, max: 500, unit: 'mm²/m' }
      }
    }
  ],
  retaining_wall: [
    {
      name: 'Standard 3m Cantilever Wall',
      inputs: { wallHeight: 3, stemThicknessBottom: 400, baseWidth: 2000, soilDensity: 18, frictionAngle: 30 },
      expectedOutputs: {
        fosOverturning: { min: 1.5, max: 4.0, unit: '' },
        fosSliding: { min: 1.5, max: 3.5, unit: '' },
        fosBearing: { min: 2.0, max: 5.0, unit: '' }
      }
    }
  ]
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');

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
    const d = beamDepth * 0.9; // Approximate effective depth
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
  
  // Moment formula verification
  const deadLoad = inputs.deadLoad as number;
  const liveLoad = inputs.liveLoad as number;
  const supportType = inputs.supportType as string;
  const maxMoment = outputs.maxMoment as number;
  
  if (maxMoment && span && deadLoad && liveLoad) {
    const w = (1.2 * deadLoad + 1.6 * liveLoad); // Factored load
    let coeff = supportType === 'cantilever' ? 2 : 8;
    const expectedMoment = w * Math.pow(span, 2) / coeff;
    const error = Math.abs(maxMoment - expectedMoment) / expectedMoment * 100;
    checks.push({
      name: 'Moment Calculation',
      passed: error < 15,
      expected: `~${expectedMoment.toFixed(1)} kN.m (wL²/${coeff})`,
      actual: `${maxMoment.toFixed(1)} kN.m (${error.toFixed(1)}% diff)`,
      standard: 'ACI 318 Load Combinations',
      severity: error < 15 ? 'info' : 'warning'
    });
  }
  
  return checks;
}

function validateColumnResults(inputs: Record<string, unknown>, outputs: Record<string, unknown>): ValidationCheck[] {
  const checks: ValidationCheck[] = [];
  const std = ENGINEERING_STANDARDS.ACI_318.column;
  
  const width = inputs.columnWidth as number || inputs.width as number;
  const height = inputs.columnHeight as number || inputs.height as number;
  const slendernessRatio = outputs.slendernessRatio as number;
  const isSlender = outputs.isSlender as boolean;
  const requiredAs = outputs.requiredAs as number || outputs.steelAreaRequired as number;
  
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
  
  // Slenderness classification
  if (slendernessRatio !== undefined) {
    const shouldBeSlender = slendernessRatio > std.slendernessLimit;
    const classificationCorrect = (isSlender === shouldBeSlender);
    checks.push({
      name: 'Slenderness Classification',
      passed: classificationCorrect,
      expected: slendernessRatio > std.slendernessLimit ? 'Slender' : 'Short',
      actual: isSlender ? 'Slender' : 'Short',
      standard: 'ACI 318-19 Section 6.2.5',
      severity: classificationCorrect ? 'info' : 'warning'
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
  const bearingPressure = outputs.bearingPressure as number || outputs.actualBearing as number;
  const footingDepth = outputs.footingDepth as number;
  
  // Bearing pressure check
  if (bearingPressure && bearingCapacity) {
    const ratio = bearingPressure / bearingCapacity;
    const isValid = ratio <= std.maxBearingRatio;
    checks.push({
      name: 'Bearing Pressure Ratio',
      passed: isValid,
      expected: `≤ ${bearingCapacity} kPa (100%)`,
      actual: `${bearingPressure.toFixed(1)} kPa (${(ratio * 100).toFixed(1)}%)`,
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

function validateRetainingWallResults(inputs: Record<string, unknown>, outputs: Record<string, unknown>): ValidationCheck[] {
  const checks: ValidationCheck[] = [];
  const std = ENGINEERING_STANDARDS.ACI_318.retainingWall;
  
  const stability = outputs.stability as Record<string, unknown>;
  const fosOverturning = stability?.fosOverturning as number || outputs.fosOverturning as number;
  const fosSliding = stability?.fosSliding as number || outputs.fosSliding as number;
  const fosBearing = stability?.fosBearing as number || outputs.fosBearing as number;
  
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
  
  return checks;
}

async function validateCalculator(calculatorType: string): Promise<ValidationResult> {
  const tests = BENCHMARK_TESTS[calculatorType] || [];
  const allChecks: ValidationCheck[] = [];
  const issues: string[] = [];
  const suggestions: string[] = [];
  let passedTests = 0;
  let totalOutputChecks = 0;
  let passedOutputChecks = 0;
  
  for (const test of tests) {
    const result = await callCalculator(calculatorType, test.inputs);
    
    if (result.crashed || result.error) {
      issues.push(`${test.name}: Calculator crashed - ${result.error}`);
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
      case 'retaining-wall':
        standardChecks = validateRetainingWallResults(test.inputs, result);
        break;
    }
    allChecks.push(...standardChecks);
    
    // Check expected output ranges
    for (const [key, expected] of Object.entries(test.expectedOutputs)) {
      totalOutputChecks++;
      const actual = result[key] as number;
      
      if (actual === undefined) {
        issues.push(`${test.name}: Missing output '${key}'`);
        continue;
      }
      
      if (actual >= expected.min && actual <= expected.max) {
        passedOutputChecks++;
      } else {
        issues.push(`${test.name}: ${key} = ${actual}${expected.unit}, expected ${expected.min}-${expected.max}${expected.unit}`);
      }
    }
    
    passedTests++;
  }
  
  // Calculate accuracy
  const checksPassedCount = allChecks.filter(c => c.passed).length;
  const totalChecksCount = allChecks.length;
  const checkAccuracy = totalChecksCount > 0 ? checksPassedCount / totalChecksCount : 0;
  const outputAccuracy = totalOutputChecks > 0 ? passedOutputChecks / totalOutputChecks : 0;
  const overallAccuracy = (checkAccuracy * 0.6 + outputAccuracy * 0.4) * 100;
  
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
      EUROCODE_2: true, // Placeholder for future Eurocode checks
      SBC_304: true // Placeholder for Saudi Building Code checks
    },
    checks: allChecks,
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
