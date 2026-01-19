/**
 * Comprehensive Engineering Calculations Test Suite
 * 25 Real-World Test Cases (5 per calculator)
 * Validates structural calculations against engineering principles
 */

import { describe, it, expect } from 'vitest';
import {
  calculateBeam,
  calculateSlab,
  calculateColumn,
  calculateFoundation,
  calculateRetainingWall,
} from '../engineeringCalculations';

// ============ BEAM CALCULATOR TESTS ============
describe('Beam Calculator - Real World Tests', () => {
  it('Test 1: Residential floor beam (6m span, moderate loads)', () => {
    const result = calculateBeam({
      span: 6,
      deadLoad: 15,
      liveLoad: 10,
      beamWidth: 300,
      concreteGrade: 'C30',
      steelGrade: 'Fy420',
      supportType: 'simply_supported',
    });

    // Validate outputs are reasonable
    expect(result.beamDepth).toBeGreaterThan(400);
    expect(result.beamDepth).toBeLessThan(800);
    expect(result.maxMoment).toBeGreaterThan(50);
    expect(result.requiredAs).toBeGreaterThan(0);
    expect(result.providedAs).toBeGreaterThanOrEqual(result.requiredAs);
    expect(result.numberOfBars).toBeGreaterThanOrEqual(2);
    expect(result.stirrupSpacing).toBeGreaterThan(50);
    expect(result.stirrupSpacing).toBeLessThanOrEqual(300);
    expect(result.concreteVolume).toBeGreaterThan(0);
    expect(result.steelWeight).toBeGreaterThan(0);
  });

  it('Test 2: Cantilever balcony beam (2m span, high moment)', () => {
    const result = calculateBeam({
      span: 2,
      deadLoad: 20,
      liveLoad: 5,
      beamWidth: 250,
      concreteGrade: 'C35',
      steelGrade: 'Fy500',
      supportType: 'cantilever',
    });

    // Cantilever has moment factor of 2 (higher moment)
    expect(result.maxMoment).toBeGreaterThan(10);
    expect(result.beamDepth).toBeGreaterThan(200);
    expect(result.requiredAs).toBeGreaterThan(0);
    expect(result.barDiameter).toBeGreaterThanOrEqual(12);
    expect(result.fck).toBe(35);
    expect(result.fy).toBe(500);
  });

  it('Test 3: Heavy industrial beam (10m span, heavy loads)', () => {
    const result = calculateBeam({
      span: 10,
      deadLoad: 40,
      liveLoad: 30,
      beamWidth: 400,
      concreteGrade: 'C40',
      steelGrade: 'Fy500',
      supportType: 'simply_supported',
    });

    // Large span with heavy load needs substantial depth
    expect(result.beamDepth).toBeGreaterThan(600);
    expect(result.maxMoment).toBeGreaterThan(500);
    expect(result.factoredLoad).toBeGreaterThan(100);
    expect(result.numberOfBars).toBeGreaterThanOrEqual(3);
    expect(result.stirrupDia).toBe(10); // Heavy load needs 10mm stirrups
  });

  it('Test 4: Short span beam (3m span, light loads)', () => {
    const result = calculateBeam({
      span: 3,
      deadLoad: 8,
      liveLoad: 5,
      beamWidth: 250,
      concreteGrade: 'C25',
      steelGrade: 'Fy420',
      supportType: 'continuous',
    });

    // Continuous beam has moment factor of 10 (lower moment)
    expect(result.beamDepth).toBeLessThan(500);
    expect(result.maxMoment).toBeLessThan(30);
    expect(result.barDiameter).toBeGreaterThanOrEqual(12);
    expect(result.fck).toBe(25);
  });

  it('Test 5: Medium span with minimum reinforcement check', () => {
    const result = calculateBeam({
      span: 4,
      deadLoad: 5,
      liveLoad: 3,
      beamWidth: 300,
      concreteGrade: 'C30',
      steelGrade: 'Fy420',
      supportType: 'simply_supported',
    });

    // Even light loads should provide minimum reinforcement
    expect(result.requiredAs).toBeGreaterThan(0);
    expect(result.providedAs).toBeGreaterThan(0);
    expect(result.numberOfBars).toBeGreaterThanOrEqual(2);
    // No NaN values
    expect(Number.isNaN(result.maxMoment)).toBe(false);
    expect(Number.isNaN(result.requiredAs)).toBe(false);
    expect(Number.isNaN(result.beamDepth)).toBe(false);
  });
});

// ============ SLAB CALCULATOR TESTS ============
describe('Slab Calculator - Real World Tests', () => {
  it('Test 1: Office two-way slab (6x4m, standard loads)', () => {
    const result = calculateSlab({
      longSpan: 6,
      shortSpan: 4,
      deadLoad: 5,
      liveLoad: 3,
      concreteGrade: 'C30',
      steelGrade: 'Fy420',
      slabType: 'two_way',
      supportCondition: 'simply_supported',
      cover: 25,
    });

    // Two-way slab properties (spread syntax merges inner results)
    expect(result.fck).toBe(30);
    expect(result.fy).toBe(420);
    expect(result.concreteVolume).toBeGreaterThan(0);
    expect(result.serviceabilityChecks).toBeDefined();
    expect(result.status).toBe('OK');
    expect(result.designCode).toBe('ACI 318 / Eurocode 2');
  });

  it('Test 2: Parking garage one-way slab (high live load)', () => {
    const result = calculateSlab({
      longSpan: 8,
      shortSpan: 3,
      deadLoad: 6,
      liveLoad: 5,
      concreteGrade: 'C35',
      steelGrade: 'Fy500',
      slabType: 'one_way',
      supportCondition: 'two_edges_continuous',
      cover: 30,
    });

    expect(result.fck).toBe(35);
    expect(result.fy).toBe(500);
    expect(result.concreteVolume).toBeGreaterThan(0);
    expect(result.steelWeight).toBeGreaterThan(0);
  });

  it('Test 3: Balcony cantilever slab (span ratio > 2)', () => {
    const result = calculateSlab({
      longSpan: 5,
      shortSpan: 2,
      deadLoad: 4,
      liveLoad: 4,
      concreteGrade: 'C30',
      steelGrade: 'Fy420',
      slabType: 'one_way',
      supportCondition: 'one_edge_continuous',
      cover: 25,
    });

    expect(result.concreteVolume).toBeGreaterThan(0);
    expect(result.steelWeight).toBeGreaterThan(0);
    expect(result.formworkArea).toBeGreaterThan(0);
  });

  it('Test 4: Two-way continuous slab (reduced moments)', () => {
    const result = calculateSlab({
      longSpan: 5,
      shortSpan: 4,
      deadLoad: 5,
      liveLoad: 2.5,
      concreteGrade: 'C30',
      steelGrade: 'Fy420',
      slabType: 'two_way',
      supportCondition: 'all_edges_continuous',
      cover: 25,
    });

    // Continuous edges allow thinner slab (higher deflection coefficient)
    expect(result.serviceabilityChecks).toBeDefined();
    expect(result.serviceabilityChecks.deflection).toBeDefined();
    expect(result.serviceabilityChecks.overallStatus).toBeDefined();
  });

  it('Test 5: Large span slab (deflection critical)', () => {
    const result = calculateSlab({
      longSpan: 8,
      shortSpan: 6,
      deadLoad: 6,
      liveLoad: 4,
      concreteGrade: 'C40',
      steelGrade: 'Fy500',
      slabType: 'two_way',
      supportCondition: 'simply_supported',
      cover: 30,
    });

    expect(result.serviceabilityChecks.deflection.total).toBeGreaterThan(0);
    expect(result.serviceabilityChecks.deflection.allowable).toBeGreaterThan(0);
    // Large spans may exceed deflection limits
    expect(result.serviceabilityChecks.overallStatus).toBeDefined();
  });
});

// ============ COLUMN CALCULATOR TESTS ============
describe('Column Calculator - Real World Tests', () => {
  it('Test 1: Interior column (standard biaxial)', () => {
    const result = calculateColumn({
      axialLoad: 1500,
      momentX: 80,
      momentY: 60,
      columnWidth: 400,
      columnDepth: 400,
      columnHeight: 3500,
      concreteGrade: 'C30',
      steelGrade: '420',
      coverThickness: 40,
      columnType: 'rectangular',
    });

    expect(result.grossArea).toBe(160000);
    expect(result.steelAreaRequired).toBeGreaterThan(0);
    expect(result.steelAreaProvided).toBeGreaterThanOrEqual(result.steelAreaRequired);
    expect(result.numberOfBars).toBeGreaterThanOrEqual(8);
    expect(parseFloat(result.reinforcementRatio)).toBeGreaterThanOrEqual(0.2);
    expect(parseFloat(result.reinforcementRatio)).toBeLessThanOrEqual(4);
    expect(result.tieDiameter).toBeGreaterThanOrEqual(6);
    expect(result.tieSpacing).toBeLessThanOrEqual(300);
  });

  it('Test 2: Corner column (high moments)', () => {
    const result = calculateColumn({
      axialLoad: 800,
      momentX: 150,
      momentY: 120,
      columnWidth: 450,
      columnDepth: 450,
      columnHeight: 3500,
      concreteGrade: 'C35',
      steelGrade: '500',
      coverThickness: 40,
      columnType: 'rectangular',
    });

    // High moments require more reinforcement
    expect(result.steelAreaRequired).toBeGreaterThan(1000);
    expect(parseFloat(result.designMomentX)).toBeGreaterThan(0);
    expect(parseFloat(result.designMomentY)).toBeGreaterThan(0);
    expect(result.isAdequate).toBeDefined();
  });

  it('Test 3: Slender column (P-delta effects)', () => {
    const result = calculateColumn({
      axialLoad: 1000,
      momentX: 50,
      momentY: 40,
      columnWidth: 300,
      columnDepth: 300,
      columnHeight: 6000, // Tall column
      concreteGrade: 'C30',
      steelGrade: '420',
      coverThickness: 40,
      columnType: 'rectangular',
    });

    expect(parseFloat(result.slendernessRatio)).toBeGreaterThan(20);
    expect(result.isSlender).toBe(true);
    expect(parseFloat(result.secondOrderEccentricityX)).toBeGreaterThan(0);
    expect(parseFloat(result.secondOrderEccentricityY)).toBeGreaterThan(0);
  });

  it('Test 4: Heavy load column (high capacity)', () => {
    const result = calculateColumn({
      axialLoad: 3000,
      momentX: 100,
      momentY: 80,
      columnWidth: 600,
      columnDepth: 600,
      columnHeight: 3500,
      concreteGrade: 'C40',
      steelGrade: '500',
      coverThickness: 45,
      columnType: 'rectangular',
    });

    expect(result.grossArea).toBe(360000);
    expect(parseFloat(result.axialCapacity)).toBeGreaterThan(3000);
    expect(result.barDiameter).toBeGreaterThanOrEqual(20);
    expect(parseFloat(result.utilizationRatio)).toBeLessThan(100);
  });

  it('Test 5: Short stocky column (no slenderness effects)', () => {
    const result = calculateColumn({
      axialLoad: 1200,
      momentX: 30,
      momentY: 25,
      columnWidth: 500,
      columnDepth: 500,
      columnHeight: 2800,
      concreteGrade: 'C30',
      steelGrade: '420',
      coverThickness: 40,
      columnType: 'rectangular',
    });

    expect(result.isSlender).toBe(false);
    expect(parseFloat(result.secondOrderEccentricityX)).toBe(0);
    expect(parseFloat(result.secondOrderEccentricityY)).toBe(0);
    expect(result.isAdequate).toBe(true);
  });
});

// ============ FOUNDATION CALCULATOR TESTS ============
describe('Foundation Calculator - Real World Tests', () => {
  it('Test 1: Standard isolated footing', () => {
    const result = calculateFoundation({
      columnLoad: 800,
      momentX: 0,
      momentY: 0,
      columnWidth: 400,
      columnDepth: 400,
      bearingCapacity: 150,
      concreteGrade: 'C30',
    });

    expect(result.length).toBeGreaterThan(1);
    expect(result.width).toBeGreaterThan(1);
    expect(result.depth).toBeGreaterThan(300);
    expect(result.actualPressure).toBeLessThanOrEqual(result.allowableBearing);
    expect(result.reinforcementX).toBeDefined();
    expect(result.concreteVolume).toBeGreaterThan(0);
  });

  it('Test 2: Heavy load industrial footing', () => {
    const result = calculateFoundation({
      columnLoad: 2500,
      momentX: 50,
      momentY: 50,
      columnWidth: 600,
      columnDepth: 600,
      bearingCapacity: 200,
      concreteGrade: 'C35',
    });

    expect(result.length).toBeGreaterThan(2);
    expect(result.actualPressure).toBeLessThanOrEqual(result.allowableBearing);
    expect(result.steelWeight).toBeGreaterThan(5);
  });

  it('Test 3: Weak soil condition', () => {
    const result = calculateFoundation({
      columnLoad: 500,
      momentX: 0,
      momentY: 0,
      columnWidth: 350,
      columnDepth: 350,
      bearingCapacity: 75, // Soft clay
      concreteGrade: 'C30',
    });

    // Weak soil requires larger footing
    expect(result.length).toBeGreaterThan(2);
    expect(result.actualPressure).toBeLessThanOrEqual(result.allowableBearing);
  });

  it('Test 4: Eccentric loading case', () => {
    const result = calculateFoundation({
      columnLoad: 1000,
      momentX: 100,
      momentY: 80,
      columnWidth: 450,
      columnDepth: 450,
      bearingCapacity: 150,
      concreteGrade: 'C30',
    });

    // Eccentric loading increases footing size
    expect(result.length).toBeGreaterThan(2);
    expect(result.width).toBeGreaterThan(1);
    expect(result.reinforcementY).toBeDefined();
  });

  it('Test 5: Minimum load case', () => {
    const result = calculateFoundation({
      columnLoad: 200,
      momentX: 0,
      momentY: 0,
      columnWidth: 300,
      columnDepth: 300,
      bearingCapacity: 200,
      concreteGrade: 'C25',
    });

    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.depth).toBeGreaterThanOrEqual(300);
    expect(result.concreteVolume).toBeGreaterThan(0);
    expect(Number.isNaN(result.actualPressure)).toBe(false);
  });
});

// ============ RETAINING WALL CALCULATOR TESTS ============
describe('Retaining Wall Calculator - Real World Tests', () => {
  it('Test 1: 3m cantilever wall (standard)', () => {
    const result = calculateRetainingWall({
      wallHeight: 3,
      stemThicknessTop: 250,
      stemThicknessBottom: 400,
      baseWidth: 1800,
      baseThickness: 400,
      toeWidth: 200,
      soilUnitWeight: 18,
      soilFrictionAngle: 32,
      surchargeLoad: 10,
      concreteGrade: 'C30',
      steelGrade: 'Fy420',
      allowableBearingPressure: 150,
      backfillSlope: 0,
    });

    expect(result.earthPressure.Pa_total).toBeGreaterThan(0);
    expect(result.stability.FOS_overturning).toBeGreaterThanOrEqual(1.5);
    expect(result.stability.FOS_sliding).toBeGreaterThanOrEqual(1.2);
    expect(result.stability.FOS_bearing).toBeGreaterThan(1);
    expect(result.reinforcement.stem).toBeDefined();
    expect(result.reinforcement.heel).toBeDefined();
  });

  it('Test 2: 6m tall wall (high earth pressures)', () => {
    const result = calculateRetainingWall({
      wallHeight: 6,
      stemThicknessTop: 300,
      stemThicknessBottom: 600,
      baseWidth: 3600,
      baseThickness: 500,
      toeWidth: 400,
      soilUnitWeight: 18,
      soilFrictionAngle: 30,
      surchargeLoad: 10,
      concreteGrade: 'C35',
      steelGrade: 'Fy500',
      allowableBearingPressure: 200,
      backfillSlope: 0,
    });

    expect(result.earthPressure.Pa_total).toBeGreaterThan(50);
    expect(result.stability.overturningMoment).toBeGreaterThan(100);
    expect(result.stability.FOS_overturning).toBeGreaterThanOrEqual(1.5);
    expect(result.concreteVolume).toBeGreaterThan(3);
  });

  it('Test 3: Highway retaining wall with traffic surcharge', () => {
    const result = calculateRetainingWall({
      wallHeight: 4,
      stemThicknessTop: 250,
      stemThicknessBottom: 450,
      baseWidth: 2400,
      baseThickness: 450,
      toeWidth: 250,
      soilUnitWeight: 19,
      soilFrictionAngle: 35,
      surchargeLoad: 20, // Highway traffic load
      concreteGrade: 'C35',
      steelGrade: 'Fy420',
      allowableBearingPressure: 200,
      backfillSlope: 0,
    });

    expect(result.earthPressure.Pa_surcharge).toBeGreaterThan(0);
    expect(result.earthPressure.Pa_total).toBeGreaterThan(0);
    expect(result.stability.FOS_overturning).toBeGreaterThanOrEqual(1.5);
    expect(result.stability.FOS_sliding).toBeGreaterThanOrEqual(1.2);
  });

  it('Test 4: Basement wall (residential)', () => {
    const result = calculateRetainingWall({
      wallHeight: 2.5,
      stemThicknessTop: 200,
      stemThicknessBottom: 300,
      baseWidth: 1500,
      baseThickness: 350,
      toeWidth: 150,
      soilUnitWeight: 17,
      soilFrictionAngle: 28,
      surchargeLoad: 5,
      concreteGrade: 'C30',
      steelGrade: 'Fy420',
      allowableBearingPressure: 150,
      backfillSlope: 0,
    });

    expect(result.wallHeight).toBe(2.5);
    expect(result.stability.FOS_overturning).toBeGreaterThanOrEqual(1.5);
    expect(result.concreteVolume).toBeGreaterThan(0);
    expect(result.steelWeight).toBeGreaterThan(0);
  });

  it('Test 5: Sloped backfill condition', () => {
    const result = calculateRetainingWall({
      wallHeight: 4,
      stemThicknessTop: 250,
      stemThicknessBottom: 450,
      baseWidth: 2800,
      baseThickness: 400,
      toeWidth: 300,
      soilUnitWeight: 18,
      soilFrictionAngle: 30,
      surchargeLoad: 10,
      concreteGrade: 'C30',
      steelGrade: 'Fy420',
      allowableBearingPressure: 150,
      backfillSlope: 15, // 15 degree slope
    });

    // Sloped backfill increases earth pressure coefficient
    expect(result.earthPressure.Ka).toBeGreaterThan(0.3);
    expect(result.stability.FOS_overturning).toBeGreaterThanOrEqual(1.5);
    expect(result.stability.FOS_sliding).toBeGreaterThanOrEqual(1.2);
    expect(Number.isNaN(result.earthPressure.Pa_total)).toBe(false);
  });
});

// ============ CROSS-CALCULATOR VALIDATION ============
describe('Cross-Calculator Validation', () => {
  it('All calculators return consistent units', () => {
    const beam = calculateBeam({
      span: 6, deadLoad: 15, liveLoad: 10, beamWidth: 300,
      concreteGrade: 'C30', steelGrade: 'Fy420', supportType: 'simply_supported'
    });
    
    const slab = calculateSlab({
      longSpan: 6, shortSpan: 4, deadLoad: 5, liveLoad: 3,
      concreteGrade: 'C30', steelGrade: 'Fy420', slabType: 'two_way',
      supportCondition: 'simply_supported', cover: 25
    });

    // Both should use same concrete/steel grades
    expect(beam.fck).toBe(30);
    expect(slab.fck).toBe(30);
    expect(beam.fy).toBe(420);
    expect(slab.fy).toBe(420);
  });

  it('No calculator returns NaN critical values', () => {
    const beam = calculateBeam({
      span: 5, deadLoad: 10, liveLoad: 8, beamWidth: 300,
      concreteGrade: 'C30', steelGrade: 'Fy420', supportType: 'simply_supported'
    });

    const column = calculateColumn({
      axialLoad: 1000, momentX: 50, momentY: 40,
      columnWidth: 400, columnDepth: 400, columnHeight: 3500,
      concreteGrade: 'C30', steelGrade: '420', coverThickness: 40, columnType: 'rectangular'
    });

    // Beam checks
    expect(Number.isFinite(beam.maxMoment)).toBe(true);
    expect(Number.isFinite(beam.requiredAs)).toBe(true);
    expect(Number.isFinite(beam.beamDepth)).toBe(true);

    // Column checks
    expect(Number.isFinite(parseFloat(column.slendernessRatio))).toBe(true);
    expect(Number.isFinite(column.steelAreaRequired)).toBe(true);
  });

  it('Higher loads result in more reinforcement', () => {
    const lightBeam = calculateBeam({
      span: 6, deadLoad: 10, liveLoad: 5, beamWidth: 300,
      concreteGrade: 'C30', steelGrade: 'Fy420', supportType: 'simply_supported'
    });

    const heavyBeam = calculateBeam({
      span: 6, deadLoad: 30, liveLoad: 20, beamWidth: 300,
      concreteGrade: 'C30', steelGrade: 'Fy420', supportType: 'simply_supported'
    });

    expect(heavyBeam.requiredAs).toBeGreaterThan(lightBeam.requiredAs);
    expect(heavyBeam.beamDepth).toBeGreaterThanOrEqual(lightBeam.beamDepth);
  });
});
