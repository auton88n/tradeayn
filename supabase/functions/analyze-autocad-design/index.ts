import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Point {
  id: string;
  x: number;
  y: number;
  z: number;
  layer?: string;
}

interface AnalysisOptions {
  calculateVolumes: boolean;
  findProblems: boolean;
  suggestOptimizations: boolean;
  checkDrainage: boolean;
  checkCompliance: boolean;
}

interface Problem {
  severity: 'critical' | 'warning' | 'info';
  type: string;
  message: string;
  impact: string;
  location?: string;
}

// Calculate cell area using simple grid estimation
function estimateCellArea(point: Point, allPoints: Point[]): number {
  // Find nearest neighbors and estimate cell area
  const distances = allPoints
    .filter(p => p.id !== point.id)
    .map(p => ({
      dist: Math.sqrt(Math.pow(p.x - point.x, 2) + Math.pow(p.y - point.y, 2)),
      point: p
    }))
    .sort((a, b) => a.dist - b.dist);
  
  if (distances.length < 2) return 100; // Default 10m x 10m cell
  
  // Use average of two nearest neighbor distances as cell size
  const avgDist = (distances[0].dist + distances[1].dist) / 2;
  return avgDist * avgDist;
}

// Find nearest design point for a given NGL point
function findNearestPoint(targetPoint: Point, points: Point[]): Point | null {
  if (points.length === 0) return null;
  
  let nearest = points[0];
  let minDist = Infinity;
  
  points.forEach(p => {
    const dist = Math.sqrt(
      Math.pow(p.x - targetPoint.x, 2) + 
      Math.pow(p.y - targetPoint.y, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = p;
    }
  });
  
  return nearest;
}

// Calculate cut/fill volumes
function calculateVolumes(nglPoints: Point[], designPoints: Point[]): {
  cutVolume: number;
  fillVolume: number;
  netVolume: number;
  balanceRatio: number;
  pointData: Array<{ x: number; y: number; ngl: number; design: number; diff: number; cellArea: number }>;
} {
  let cutVolume = 0;
  let fillVolume = 0;
  const pointData: Array<{ x: number; y: number; ngl: number; design: number; diff: number; cellArea: number }> = [];
  
  nglPoints.forEach(nglPt => {
    const designPt = findNearestPoint(nglPt, designPoints);
    if (!designPt) return;
    
    const diff = nglPt.z - designPt.z; // Positive = cut, Negative = fill
    const cellArea = estimateCellArea(nglPt, nglPoints);
    const volume = Math.abs(diff) * cellArea;
    
    if (diff > 0) {
      cutVolume += volume;
    } else {
      fillVolume += volume;
    }
    
    pointData.push({
      x: nglPt.x,
      y: nglPt.y,
      ngl: nglPt.z,
      design: designPt.z,
      diff,
      cellArea
    });
  });
  
  const netVolume = cutVolume - fillVolume;
  const balanceRatio = Math.min(cutVolume, fillVolume) / Math.max(cutVolume, fillVolume) || 0;
  
  return { cutVolume, fillVolume, netVolume, balanceRatio, pointData };
}

// Calculate slopes between points
function calculateSlopes(points: Point[]): Array<{ 
  from: Point; 
  to: Point; 
  percentage: number; 
  direction: string;
  station: string;
}> {
  const slopes: Array<{ from: Point; to: Point; percentage: number; direction: string; station: string }> = [];
  
  // Sort points by X coordinate to find sequential pairs
  const sortedPoints = [...points].sort((a, b) => a.x - b.x);
  
  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const from = sortedPoints[i];
    const to = sortedPoints[i + 1];
    
    const horizontalDist = Math.sqrt(
      Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)
    );
    
    if (horizontalDist > 0) {
      const verticalDiff = to.z - from.z;
      const percentage = Math.abs((verticalDiff / horizontalDist) * 100);
      
      const direction = verticalDiff > 0 ? 'uphill' : verticalDiff < 0 ? 'downhill' : 'flat';
      const station = `${from.x.toFixed(0)}-${to.x.toFixed(0)}`;
      
      slopes.push({ from, to, percentage, direction, station });
    }
  }
  
  return slopes;
}

// Analyze design for problems
function analyzeDesign(
  nglPoints: Point[], 
  designPoints: Point[], 
  volumes: { cutVolume: number; fillVolume: number; netVolume: number; balanceRatio: number },
  options: AnalysisOptions
): Problem[] {
  const problems: Problem[] = [];
  
  if (options.findProblems) {
    // Check earthwork balance
    if (volumes.balanceRatio < 0.7) {
      const excess = volumes.netVolume > 0 
        ? `${volumes.netVolume.toFixed(0)} m³ excess cut (requires disposal)`
        : `${Math.abs(volumes.netVolume).toFixed(0)} m³ fill needed (requires import)`;
      
      problems.push({
        severity: 'critical',
        type: 'unbalanced_earthwork',
        message: `Poor cut/fill balance (${(volumes.balanceRatio * 100).toFixed(0)}%). ${excess}`,
        impact: `Cost impact: ${Math.abs(volumes.netVolume) * 50} SAR for material transport`
      });
    } else if (volumes.balanceRatio < 0.85) {
      problems.push({
        severity: 'warning',
        type: 'unbalanced_earthwork',
        message: `Moderate earthwork imbalance (${(volumes.balanceRatio * 100).toFixed(0)}%)`,
        impact: 'Could be optimized to reduce costs'
      });
    }
  }
  
  if (options.checkDrainage) {
    // Check slopes
    const slopes = calculateSlopes(designPoints.length > 0 ? designPoints : nglPoints);
    
    // Find steep slopes
    const steepSlopes = slopes.filter(s => s.percentage > 6);
    steepSlopes.forEach(slope => {
      problems.push({
        severity: 'warning',
        type: 'steep_slope',
        message: `Slope ${slope.percentage.toFixed(1)}% exceeds 6% maximum`,
        impact: 'Construction difficulty, erosion risk, accessibility issues',
        location: `Station ${slope.station}`
      });
    });
    
    // Find flat areas (drainage issues)
    const flatSlopes = slopes.filter(s => s.percentage < 0.5 && s.percentage >= 0);
    flatSlopes.forEach(slope => {
      problems.push({
        severity: 'warning',
        type: 'poor_drainage',
        message: `Flat area (${slope.percentage.toFixed(2)}%) - insufficient drainage slope`,
        impact: 'Water may pond, drainage problems, foundation issues',
        location: `Station ${slope.station}`
      });
    });
    
    // Check for minimum drainage slope (1%)
    const insufficientDrainage = slopes.filter(s => s.percentage > 0 && s.percentage < 1);
    if (insufficientDrainage.length > slopes.length * 0.3) {
      problems.push({
        severity: 'warning',
        type: 'drainage_concern',
        message: 'Multiple areas have slopes below 1% minimum for drainage',
        impact: 'May cause ponding and drainage issues'
      });
    }
  }
  
  if (options.checkCompliance) {
    // Saudi code compliance checks
    const slopes = calculateSlopes(designPoints.length > 0 ? designPoints : nglPoints);
    
    // Road grade limits (MOT standards)
    const excessiveGrades = slopes.filter(s => s.percentage > 8);
    if (excessiveGrades.length > 0) {
      problems.push({
        severity: 'critical',
        type: 'code_violation',
        message: `${excessiveGrades.length} locations exceed 8% maximum road grade (Saudi MOT standard)`,
        impact: 'Non-compliant with Saudi transportation standards'
      });
    }
    
    // Check for adequate compaction zones
    if (volumes.fillVolume > 500) {
      problems.push({
        severity: 'info',
        type: 'compaction_note',
        message: `Large fill volume (${volumes.fillVolume.toFixed(0)} m³) requires 95% Proctor compaction`,
        impact: 'Ensure proper compaction testing is specified'
      });
    }
  }
  
  return problems;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      parsedData, 
      analysisOptions, 
      userRequirements 
    } = await req.json();
    
    console.log('Analyzing design with options:', analysisOptions);
    
    const nglPoints: Point[] = parsedData.nglPoints || [];
    const designPoints: Point[] = parsedData.designPoints || [];
    const allPoints: Point[] = parsedData.allPoints || [];
    
    // Calculate volumes if we have both NGL and design points
    let volumes = { cutVolume: 0, fillVolume: 0, netVolume: 0, balanceRatio: 0, pointData: [] as any[] };
    let hasVolumeData = false;
    
    if (analysisOptions.calculateVolumes && nglPoints.length > 0 && designPoints.length > 0) {
      volumes = calculateVolumes(nglPoints, designPoints);
      hasVolumeData = true;
      console.log(`Calculated volumes - Cut: ${volumes.cutVolume.toFixed(1)}, Fill: ${volumes.fillVolume.toFixed(1)}`);
    }
    
    // Analyze design for problems
    const problems = analyzeDesign(nglPoints, designPoints, volumes, analysisOptions);
    console.log(`Found ${problems.length} problems`);
    
    // Prepare AI optimization request
    let aiOptimizations = null;
    let designRating = 5;
    
    if (analysisOptions.suggestOptimizations && (nglPoints.length > 0 || designPoints.length > 0)) {
      const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
      
      if (openAIApiKey) {
        const avgNGL = nglPoints.length > 0 
          ? nglPoints.reduce((sum, p) => sum + p.z, 0) / nglPoints.length 
          : 0;
        const avgDesign = designPoints.length > 0 
          ? designPoints.reduce((sum, p) => sum + p.z, 0) / designPoints.length 
          : avgNGL;
        
        const aiPrompt = `You are a senior civil engineer reviewing a grading design for a Saudi Arabian project.

DESIGN DATA:
- Total NGL (existing ground) points: ${nglPoints.length}
- Total Design points: ${designPoints.length}
- Average NGL elevation: ${avgNGL.toFixed(2)}m
- Average Design elevation: ${avgDesign.toFixed(2)}m
- Current cut volume: ${volumes.cutVolume.toFixed(1)} m³
- Current fill volume: ${volumes.fillVolume.toFixed(1)} m³
- Net earthwork: ${volumes.netVolume.toFixed(1)} m³ (${volumes.netVolume > 0 ? 'excess cut - needs disposal' : 'fill needed - requires import'})
- Balance ratio: ${(volumes.balanceRatio * 100).toFixed(0)}%

PROBLEMS IDENTIFIED:
${problems.length > 0 ? problems.map(p => `- [${p.severity.toUpperCase()}] ${p.message}`).join('\n') : 'No major problems detected'}

USER REQUIREMENTS:
"${userRequirements || 'Standard site grading optimization'}"

Analyze this design and provide optimization suggestions.

Return ONLY valid JSON (no markdown) with this structure:
{
  "designRating": <1-10 rating>,
  "ratingExplanation": "<brief explanation of rating>",
  "optimizations": [
    {
      "title": "<short title>",
      "action": "<specific action to take, e.g., 'Raise design elevations by 0.25m from station 50 to 100'>",
      "expectedResult": {
        "newCutVolume": <estimated new cut volume>,
        "newFillVolume": <estimated new fill volume>,
        "newBalance": <new balance percentage>
      },
      "costSavings": <estimated SAR savings>,
      "savingsExplanation": "<why this saves money>",
      "implementationNotes": ["<note 1>", "<note 2>"]
    }
  ],
  "totalPotentialSavings": <total SAR>,
  "implementationTime": "<estimated time to implement changes>",
  "priorityActions": ["<action 1>", "<action 2>"]
}`;

        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: aiPrompt }],
              max_tokens: 2000,
              temperature: 0.3,
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            const content = data.choices[0]?.message?.content;
            
            if (content) {
              // Clean markdown if present
              const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              aiOptimizations = JSON.parse(cleanedContent);
              designRating = aiOptimizations.designRating || 5;
            }
          } else {
            console.error('OpenAI API error:', await response.text());
          }
        } catch (aiError) {
          console.error('AI analysis error:', aiError);
        }
      }
    }
    
    // Calculate cost estimates
    const costEstimates = {
      currentCosts: {
        excavation: volumes.cutVolume * 25,
        fill: volumes.fillVolume * 35,
        compaction: volumes.fillVolume * 8,
        disposal: volumes.netVolume > 0 ? volumes.netVolume * 15 : 0,
        import: volumes.netVolume < 0 ? Math.abs(volumes.netVolume) * 75 : 0,
      },
      totalCurrentCost: 0,
    };
    
    costEstimates.totalCurrentCost = Object.values(costEstimates.currentCosts).reduce((a, b) => a + b, 0);
    
    return new Response(JSON.stringify({
      success: true,
      analysis: {
        hasVolumeData,
        calculatedVolumes: hasVolumeData ? {
          cutVolume: volumes.cutVolume,
          fillVolume: volumes.fillVolume,
          netVolume: volumes.netVolume,
          balanceRatio: volumes.balanceRatio,
        } : null,
        problems,
        problemsSummary: {
          critical: problems.filter(p => p.severity === 'critical').length,
          warnings: problems.filter(p => p.severity === 'warning').length,
          info: problems.filter(p => p.severity === 'info').length,
        },
        designRating,
        costEstimates,
        aiOptimizations,
        pointCount: {
          ngl: nglPoints.length,
          design: designPoints.length,
          total: allPoints.length,
        },
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze design'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
