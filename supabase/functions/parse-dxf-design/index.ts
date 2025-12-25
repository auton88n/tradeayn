import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedPoint {
  id: string;
  x: number;
  y: number;
  z: number;
  layer?: string;
}

interface TextAnnotation {
  content: string;
  x: number;
  y: number;
  layer?: string;
}

interface Polyline {
  points: Array<{ x: number; y: number; z: number }>;
  layer: string;
  closed: boolean;
}

interface ParsedDXF {
  nglPoints: ParsedPoint[];
  designPoints: ParsedPoint[];
  allPoints: ParsedPoint[];
  polylines: Polyline[];
  textAnnotations: TextAnnotation[];
  layers: string[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
}

function parseDXF(dxfContent: string): ParsedDXF {
  const lines = dxfContent.split(/\r?\n/);
  const points: ParsedPoint[] = [];
  const textAnnotations: TextAnnotation[] = [];
  const polylines: Polyline[] = [];
  const layersSet = new Set<string>();
  
  let i = 0;
  let pointCounter = 0;
  
  // Find ENTITIES section
  while (i < lines.length && !lines[i].includes('ENTITIES')) {
    i++;
  }
  
  // Parse entities
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Parse POINT entities
    if (line === 'POINT') {
      const point: ParsedPoint = { id: `P${++pointCounter}`, x: 0, y: 0, z: 0 };
      i++;
      
      while (i < lines.length && lines[i].trim() !== '0') {
        const code = parseInt(lines[i].trim());
        i++;
        if (i >= lines.length) break;
        const value = lines[i].trim();
        
        switch (code) {
          case 8: // Layer
            point.layer = value;
            layersSet.add(value);
            break;
          case 10: // X
            point.x = parseFloat(value);
            break;
          case 20: // Y
            point.y = parseFloat(value);
            break;
          case 30: // Z
            point.z = parseFloat(value);
            break;
        }
        i++;
      }
      
      if (!isNaN(point.x) && !isNaN(point.y)) {
        points.push(point);
      }
      continue;
    }
    
    // Parse TEXT and MTEXT entities
    if (line === 'TEXT' || line === 'MTEXT') {
      const text: TextAnnotation = { content: '', x: 0, y: 0 };
      i++;
      
      while (i < lines.length && lines[i].trim() !== '0') {
        const code = parseInt(lines[i].trim());
        i++;
        if (i >= lines.length) break;
        const value = lines[i].trim();
        
        switch (code) {
          case 1: // Text content
            text.content = value;
            break;
          case 8: // Layer
            text.layer = value;
            layersSet.add(value);
            break;
          case 10: // X
            text.x = parseFloat(value);
            break;
          case 20: // Y
            text.y = parseFloat(value);
            break;
        }
        i++;
      }
      
      if (text.content) {
        textAnnotations.push(text);
      }
      continue;
    }
    
    // Parse LWPOLYLINE entities
    if (line === 'LWPOLYLINE') {
      const polyline: Polyline = { points: [], layer: '', closed: false };
      let vertexCount = 0;
      const vertices: Array<{ x: number; y: number; z: number }> = [];
      let currentX = 0, currentY = 0, currentZ = 0;
      i++;
      
      while (i < lines.length && lines[i].trim() !== '0') {
        const code = parseInt(lines[i].trim());
        i++;
        if (i >= lines.length) break;
        const value = lines[i].trim();
        
        switch (code) {
          case 8: // Layer
            polyline.layer = value;
            layersSet.add(value);
            break;
          case 70: // Closed flag
            polyline.closed = (parseInt(value) & 1) === 1;
            break;
          case 90: // Vertex count
            vertexCount = parseInt(value);
            break;
          case 10: // X coordinate
            currentX = parseFloat(value);
            break;
          case 20: // Y coordinate
            currentY = parseFloat(value);
            vertices.push({ x: currentX, y: currentY, z: currentZ });
            break;
          case 38: // Elevation
            currentZ = parseFloat(value);
            break;
        }
        i++;
      }
      
      if (vertices.length > 0) {
        polyline.points = vertices;
        polylines.push(polyline);
      }
      continue;
    }
    
    // Parse LINE entities
    if (line === 'LINE') {
      const linePoints: Array<{ x: number; y: number; z: number }> = [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 }
      ];
      let layer = '';
      i++;
      
      while (i < lines.length && lines[i].trim() !== '0') {
        const code = parseInt(lines[i].trim());
        i++;
        if (i >= lines.length) break;
        const value = lines[i].trim();
        
        switch (code) {
          case 8: layer = value; layersSet.add(value); break;
          case 10: linePoints[0].x = parseFloat(value); break;
          case 20: linePoints[0].y = parseFloat(value); break;
          case 30: linePoints[0].z = parseFloat(value); break;
          case 11: linePoints[1].x = parseFloat(value); break;
          case 21: linePoints[1].y = parseFloat(value); break;
          case 31: linePoints[1].z = parseFloat(value); break;
        }
        i++;
      }
      
      polylines.push({ points: linePoints, layer, closed: false });
      continue;
    }
    
    // End of entities
    if (line === 'ENDSEC' || line === 'EOF') {
      break;
    }
    
    i++;
  }
  
  // Identify NGL and Design points based on layers or text annotations
  const nglPoints: ParsedPoint[] = [];
  const designPoints: ParsedPoint[] = [];
  
  // Keywords for identifying point types
  const nglKeywords = ['ngl', 'natural', 'existing', 'eg', 'ground', 'topo', 'survey'];
  const designKeywords = ['fgl', 'design', 'dl', 'proposed', 'finish', 'grade', 'fg'];
  
  points.forEach(point => {
    const layerLower = (point.layer || '').toLowerCase();
    
    const isNGL = nglKeywords.some(kw => layerLower.includes(kw));
    const isDesign = designKeywords.some(kw => layerLower.includes(kw));
    
    if (isNGL) {
      nglPoints.push(point);
    } else if (isDesign) {
      designPoints.push(point);
    }
    
    // Also check nearby text annotations
    const nearbyText = textAnnotations.find(t => 
      Math.abs(t.x - point.x) < 5 && Math.abs(t.y - point.y) < 5
    );
    
    if (nearbyText) {
      const textLower = nearbyText.content.toLowerCase();
      if (nglKeywords.some(kw => textLower.includes(kw)) && !nglPoints.includes(point)) {
        nglPoints.push(point);
      } else if (designKeywords.some(kw => textLower.includes(kw)) && !designPoints.includes(point)) {
        designPoints.push(point);
      }
    }
  });
  
  // Calculate bounds
  const allX = points.map(p => p.x);
  const allY = points.map(p => p.y);
  const allZ = points.map(p => p.z);
  
  const bounds = {
    minX: allX.length > 0 ? Math.min(...allX) : 0,
    maxX: allX.length > 0 ? Math.max(...allX) : 0,
    minY: allY.length > 0 ? Math.min(...allY) : 0,
    maxY: allY.length > 0 ? Math.max(...allY) : 0,
    minZ: allZ.length > 0 ? Math.min(...allZ) : 0,
    maxZ: allZ.length > 0 ? Math.max(...allZ) : 0,
  };
  
  return {
    nglPoints,
    designPoints,
    allPoints: points,
    polylines,
    textAnnotations,
    layers: Array.from(layersSet),
    bounds,
  };
}

// Try to extract elevation values from text annotations near points
function enrichPointsWithTextLabels(
  points: ParsedPoint[], 
  textAnnotations: TextAnnotation[]
): { nglPoints: ParsedPoint[]; designPoints: ParsedPoint[] } {
  const nglPoints: ParsedPoint[] = [];
  const designPoints: ParsedPoint[] = [];
  
  textAnnotations.forEach(text => {
    // Look for patterns like "NGL: 580.50" or "FGL=581.20"
    const nglMatch = text.content.match(/ngl[:\s=]*(\d+\.?\d*)/i);
    const fglMatch = text.content.match(/(fgl|dl|design)[:\s=]*(\d+\.?\d*)/i);
    
    if (nglMatch) {
      nglPoints.push({
        id: `NGL_${nglPoints.length + 1}`,
        x: text.x,
        y: text.y,
        z: parseFloat(nglMatch[1]),
        layer: 'NGL'
      });
    }
    
    if (fglMatch) {
      designPoints.push({
        id: `FGL_${designPoints.length + 1}`,
        x: text.x,
        y: text.y,
        z: parseFloat(fglMatch[2]),
        layer: 'FGL'
      });
    }
  });
  
  return { nglPoints, designPoints };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileContent, fileType } = await req.json();
    
    if (!fileContent) {
      throw new Error('No file content provided');
    }
    
    console.log(`Parsing ${fileType || 'DXF'} file, content length: ${fileContent.length}`);
    
    let parsedData: ParsedDXF;
    
    if (fileType === 'dwg') {
      // DWG is binary format - we can't parse it directly without specialized libraries
      // Return an error suggesting conversion to DXF
      return new Response(JSON.stringify({
        success: false,
        error: 'DWG files require conversion to DXF format. Please save as DXF (ASCII) in AutoCAD.',
        suggestion: 'Use AutoCAD command: SAVEAS → DXF → 2018 ASCII'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Parse DXF content
    parsedData = parseDXF(fileContent);
    
    // Enrich with text labels if no points were categorized
    if (parsedData.nglPoints.length === 0 && parsedData.designPoints.length === 0) {
      const enriched = enrichPointsWithTextLabels(parsedData.allPoints, parsedData.textAnnotations);
      
      // If still no categorized points, use all points as potential NGL
      if (enriched.nglPoints.length === 0 && enriched.designPoints.length === 0) {
        // Assume all points are survey/NGL points if no designation found
        parsedData.nglPoints = parsedData.allPoints;
      } else {
        parsedData.nglPoints = [...parsedData.nglPoints, ...enriched.nglPoints];
        parsedData.designPoints = [...parsedData.designPoints, ...enriched.designPoints];
      }
    }
    
    // Calculate terrain analysis from NGL points
    const nglElevations = parsedData.nglPoints.map(p => p.z).filter(z => !isNaN(z) && z !== 0);
    const terrainAnalysis = nglElevations.length > 0 ? {
      minElevation: Math.min(...nglElevations),
      maxElevation: Math.max(...nglElevations),
      avgElevation: nglElevations.reduce((a, b) => a + b, 0) / nglElevations.length,
      elevationRange: Math.max(...nglElevations) - Math.min(...nglElevations),
      pointCount: parsedData.nglPoints.length,
      estimatedArea: (parsedData.bounds.maxX - parsedData.bounds.minX) * 
                     (parsedData.bounds.maxY - parsedData.bounds.minY),
    } : null;
    
    console.log(`Parsed: ${parsedData.allPoints.length} points, ${parsedData.nglPoints.length} NGL, ${parsedData.designPoints.length} design`);
    
    return new Response(JSON.stringify({
      success: true,
      data: parsedData,
      terrainAnalysis,
      summary: {
        totalPoints: parsedData.allPoints.length,
        nglPointCount: parsedData.nglPoints.length,
        designPointCount: parsedData.designPoints.length,
        polylineCount: parsedData.polylines.length,
        textCount: parsedData.textAnnotations.length,
        layerCount: parsedData.layers.length,
        layers: parsedData.layers,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Parse error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse file'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
