import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SurveyPoint {
  id: string;
  x: number;
  y: number;
  z: number;
}

interface TerrainAnalysis {
  minElevation: number;
  maxElevation: number;
  elevationRange: number;
  avgElevation: number;
  pointCount: number;
  estimatedArea: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function parseTabSeparated(content: string): SurveyPoint[] {
  const lines = content.trim().split('\n');
  const points: SurveyPoint[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.toLowerCase().startsWith('point')) continue;
    
    const parts = trimmed.split(/\t+/);
    if (parts.length >= 4) {
      const id = parts[0].trim();
      const x = parseFloat(parts[1]);
      const y = parseFloat(parts[2]);
      const z = parseFloat(parts[3]);
      
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        points.push({ id, x, y, z });
      }
    }
  }
  
  return points;
}

function parseCSV(content: string): SurveyPoint[] {
  const lines = content.trim().split('\n');
  const points: SurveyPoint[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.toLowerCase().startsWith('point')) continue;
    
    const parts = trimmed.split(',');
    if (parts.length >= 4) {
      const id = parts[0].trim();
      const x = parseFloat(parts[1]);
      const y = parseFloat(parts[2]);
      const z = parseFloat(parts[3]);
      
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        points.push({ id, x, y, z });
      }
    }
  }
  
  return points;
}

function analyzePoints(points: SurveyPoint[]): TerrainAnalysis {
  if (points.length === 0) {
    return {
      minElevation: 0,
      maxElevation: 0,
      elevationRange: 0,
      avgElevation: 0,
      pointCount: 0,
      estimatedArea: 0,
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
    };
  }

  const elevations = points.map(p => p.z);
  const xCoords = points.map(p => p.x);
  const yCoords = points.map(p => p.y);

  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);
  const minX = Math.min(...xCoords);
  const maxX = Math.max(...xCoords);
  const minY = Math.min(...yCoords);
  const maxY = Math.max(...yCoords);

  const avgElevation = elevations.reduce((a, b) => a + b, 0) / elevations.length;
  const estimatedArea = (maxX - minX) * (maxY - minY);

  return {
    minElevation: Math.round(minElevation * 100) / 100,
    maxElevation: Math.round(maxElevation * 100) / 100,
    elevationRange: Math.round((maxElevation - minElevation) * 100) / 100,
    avgElevation: Math.round(avgElevation * 100) / 100,
    pointCount: points.length,
    estimatedArea: Math.round(estimatedArea * 100) / 100,
    minX: Math.round(minX * 100) / 100,
    maxX: Math.round(maxX * 100) / 100,
    minY: Math.round(minY * 100) / 100,
    maxY: Math.round(maxY * 100) / 100,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, fileName } = await req.json();
    
    if (!content) {
      throw new Error('No file content provided');
    }

    console.log(`Parsing survey file: ${fileName}`);
    
    let points: SurveyPoint[] = [];
    const lowerFileName = fileName?.toLowerCase() || '';
    
    // Detect format and parse
    if (lowerFileName.endsWith('.csv') || content.includes(',')) {
      console.log('Detected CSV format');
      points = parseCSV(content);
    } else {
      console.log('Detected tab-separated format');
      points = parseTabSeparated(content);
    }
    
    // If tab parsing failed, try CSV
    if (points.length === 0 && !lowerFileName.endsWith('.csv')) {
      console.log('Tab parsing failed, trying CSV');
      points = parseCSV(content);
    }

    if (points.length === 0) {
      throw new Error('Could not parse any valid survey points from the file. Expected format: pointID, easting, northing, elevation');
    }

    console.log(`Successfully parsed ${points.length} points`);
    
    const terrainAnalysis = analyzePoints(points);
    
    return new Response(JSON.stringify({
      success: true,
      points,
      terrainAnalysis,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error parsing survey file:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
