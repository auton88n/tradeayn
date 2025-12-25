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

interface Optimization {
  title: string;
  action: string;
  expectedResult: {
    newCutVolume: number;
    newFillVolume: number;
    newBalance: number;
  };
  costSavings: number;
}

// Parse elevation adjustment from AI action text
function parseElevationAdjustment(action: string): {
  adjustment: number;
  stationStart?: number;
  stationEnd?: number;
  affectedArea: 'all' | 'partial';
} {
  // Look for patterns like "raise by 0.3m" or "lower elevations by 0.25m"
  const raiseMatch = action.match(/raise.*?(\d+\.?\d*)\s*m/i);
  const lowerMatch = action.match(/lower.*?(\d+\.?\d*)\s*m/i);
  
  let adjustment = 0;
  if (raiseMatch) {
    adjustment = parseFloat(raiseMatch[1]);
  } else if (lowerMatch) {
    adjustment = -parseFloat(lowerMatch[1]);
  }
  
  // Look for station range
  const stationMatch = action.match(/station\s*(\d+)\s*(?:to|-)\s*(\d+)/i);
  
  if (stationMatch) {
    return {
      adjustment,
      stationStart: parseFloat(stationMatch[1]),
      stationEnd: parseFloat(stationMatch[2]),
      affectedArea: 'partial'
    };
  }
  
  return { adjustment, affectedArea: 'all' };
}

// Apply optimizations to design points
function applyOptimizations(
  designPoints: Point[], 
  nglPoints: Point[],
  optimizations: Optimization[]
): Point[] {
  const optimizedPoints = designPoints.map(p => ({ ...p }));
  
  // If no design points, create from NGL points
  if (optimizedPoints.length === 0 && nglPoints.length > 0) {
    nglPoints.forEach((p, i) => {
      optimizedPoints.push({
        id: `OPT_${i + 1}`,
        x: p.x,
        y: p.y,
        z: p.z,
        layer: 'OPTIMIZED_DESIGN'
      });
    });
  }
  
  // Apply each optimization
  optimizations.forEach(opt => {
    const parsed = parseElevationAdjustment(opt.action);
    
    if (parsed.adjustment !== 0) {
      optimizedPoints.forEach(point => {
        if (parsed.affectedArea === 'all') {
          point.z += parsed.adjustment;
        } else if (parsed.stationStart !== undefined && parsed.stationEnd !== undefined) {
          // Check if point is within station range
          if (point.x >= parsed.stationStart && point.x <= parsed.stationEnd) {
            point.z += parsed.adjustment;
          }
        }
      });
    }
  });
  
  return optimizedPoints;
}

// Calculate volumes for comparison
function calculateVolumes(nglPoints: Point[], designPoints: Point[]): {
  cutVolume: number;
  fillVolume: number;
  netVolume: number;
  balanceRatio: number;
} {
  let cutVolume = 0;
  let fillVolume = 0;
  
  // Simple grid-based calculation
  const avgSpacing = nglPoints.length > 1 
    ? Math.sqrt(
        Math.pow(nglPoints[1].x - nglPoints[0].x, 2) + 
        Math.pow(nglPoints[1].y - nglPoints[0].y, 2)
      )
    : 10;
  const cellArea = avgSpacing * avgSpacing;
  
  nglPoints.forEach(nglPt => {
    // Find nearest design point
    let nearest = designPoints[0];
    let minDist = Infinity;
    
    designPoints.forEach(dPt => {
      const dist = Math.sqrt(
        Math.pow(dPt.x - nglPt.x, 2) + 
        Math.pow(dPt.y - nglPt.y, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = dPt;
      }
    });
    
    if (nearest) {
      const diff = nglPt.z - nearest.z;
      const volume = Math.abs(diff) * cellArea;
      
      if (diff > 0) {
        cutVolume += volume;
      } else {
        fillVolume += volume;
      }
    }
  });
  
  const netVolume = cutVolume - fillVolume;
  const balanceRatio = Math.min(cutVolume, fillVolume) / Math.max(cutVolume, fillVolume) || 0;
  
  return { cutVolume, fillVolume, netVolume, balanceRatio };
}

// Generate DXF content for optimized design
function generateOptimizedDXF(
  optimizedPoints: Point[],
  originalNGL: Point[],
  projectName: string
): string {
  let dxf = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1024
9
$INSUNITS
70
6
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
3
0
LAYER
2
NGL_ORIGINAL
70
0
62
3
6
CONTINUOUS
0
LAYER
2
DESIGN_OPTIMIZED
70
0
62
5
6
CONTINUOUS
0
LAYER
2
ANNOTATIONS
70
0
62
7
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
`;

  // Add original NGL points (green layer)
  originalNGL.forEach(pt => {
    dxf += `0
POINT
8
NGL_ORIGINAL
10
${pt.x.toFixed(3)}
20
${pt.y.toFixed(3)}
30
${pt.z.toFixed(3)}
`;
    // Add elevation label
    dxf += `0
TEXT
8
ANNOTATIONS
10
${(pt.x + 1).toFixed(3)}
20
${(pt.y + 1).toFixed(3)}
30
0
40
1.0
1
NGL:${pt.z.toFixed(2)}
`;
  });

  // Add optimized design points (blue layer)
  optimizedPoints.forEach(pt => {
    dxf += `0
POINT
8
DESIGN_OPTIMIZED
10
${pt.x.toFixed(3)}
20
${pt.y.toFixed(3)}
30
${pt.z.toFixed(3)}
`;
    // Add elevation label
    dxf += `0
TEXT
8
ANNOTATIONS
10
${(pt.x + 1).toFixed(3)}
20
${(pt.y - 2).toFixed(3)}
30
0
40
1.0
1
FGL:${pt.z.toFixed(2)}
`;
  });

  // Add project title block
  const minX = Math.min(...optimizedPoints.map(p => p.x), ...originalNGL.map(p => p.x));
  const maxY = Math.max(...optimizedPoints.map(p => p.y), ...originalNGL.map(p => p.y));
  
  dxf += `0
TEXT
8
ANNOTATIONS
10
${minX.toFixed(3)}
20
${(maxY + 20).toFixed(3)}
30
0
40
3.0
1
OPTIMIZED GRADING DESIGN: ${projectName}
0
TEXT
8
ANNOTATIONS
10
${minX.toFixed(3)}
20
${(maxY + 15).toFixed(3)}
30
0
40
2.0
1
Generated by AI Grading Designer
`;

  dxf += `0
ENDSEC
0
EOF
`;

  return dxf;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      parsedData, 
      optimizations, 
      projectName = 'Optimized Design' 
    } = await req.json();
    
    console.log('Applying optimizations:', optimizations?.length || 0);
    
    const nglPoints: Point[] = parsedData.nglPoints || [];
    const designPoints: Point[] = parsedData.designPoints || [];
    
    if (nglPoints.length === 0) {
      throw new Error('No NGL points available for optimization');
    }
    
    // Apply optimizations
    const optimizedPoints = applyOptimizations(designPoints, nglPoints, optimizations || []);
    
    // Calculate before/after volumes
    const originalVolumes = designPoints.length > 0 
      ? calculateVolumes(nglPoints, designPoints)
      : { cutVolume: 0, fillVolume: 0, netVolume: 0, balanceRatio: 0 };
    
    const optimizedVolumes = calculateVolumes(nglPoints, optimizedPoints);
    
    // Generate DXF
    const dxfContent = generateOptimizedDXF(optimizedPoints, nglPoints, projectName);
    
    // Calculate savings
    const originalCost = 
      originalVolumes.cutVolume * 25 + 
      originalVolumes.fillVolume * 35 + 
      (originalVolumes.netVolume > 0 ? originalVolumes.netVolume * 15 : Math.abs(originalVolumes.netVolume) * 75);
    
    const optimizedCost = 
      optimizedVolumes.cutVolume * 25 + 
      optimizedVolumes.fillVolume * 35 + 
      (optimizedVolumes.netVolume > 0 ? optimizedVolumes.netVolume * 15 : Math.abs(optimizedVolumes.netVolume) * 75);
    
    const savings = originalCost - optimizedCost;
    
    return new Response(JSON.stringify({
      success: true,
      optimizedDesign: {
        points: optimizedPoints,
        pointCount: optimizedPoints.length,
      },
      comparison: {
        before: originalVolumes,
        after: optimizedVolumes,
        improvement: {
          balanceImprovement: ((optimizedVolumes.balanceRatio - originalVolumes.balanceRatio) * 100).toFixed(1),
          volumeReduction: (Math.abs(originalVolumes.netVolume) - Math.abs(optimizedVolumes.netVolume)).toFixed(1),
          costSavings: savings,
        }
      },
      dxfContent,
      fileName: `${projectName.replace(/\s+/g, '_')}_Optimized.dxf`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Optimization error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to apply optimizations'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
