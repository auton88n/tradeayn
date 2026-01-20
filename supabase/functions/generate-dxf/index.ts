import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, inputs, outputs } = await req.json();

    let dxfContent = '';

    if (type === 'beam') {
      dxfContent = generateBeamDXF(inputs, outputs);
    } else if (type === 'foundation') {
      dxfContent = generateFoundationDXF(inputs, outputs);
    } else if (type === 'parking') {
      dxfContent = generateParkingDXF(inputs, outputs);
    }

    return new Response(JSON.stringify({ dxfContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('DXF generation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateBeamDXF(inputs: any, outputs: any): string {
  const width = outputs.beamWidth || 300;
  const depth = outputs.beamDepth || 500;
  const cover = 40;
  const mainBars = outputs.numberOfBars || 4;
  const barDia = outputs.barDiameter || 20;

  return `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
0
ENDSEC
0
SECTION
2
ENTITIES
0
LINE
8
BEAM_OUTLINE
10
0
20
0
11
${width}
21
0
0
LINE
8
BEAM_OUTLINE
10
${width}
20
0
11
${width}
21
${depth}
0
LINE
8
BEAM_OUTLINE
10
${width}
20
${depth}
11
0
21
${depth}
0
LINE
8
BEAM_OUTLINE
10
0
20
${depth}
11
0
21
0
0
TEXT
8
DIMENSIONS
10
${width / 2}
20
-20
40
12
1
${width} mm
0
TEXT
8
DIMENSIONS
10
${width + 20}
20
${depth / 2}
40
12
1
${depth} mm
0
TEXT
8
REINFORCEMENT
10
${width / 2}
20
${depth + 30}
40
10
1
Main: ${mainBars}Ø${barDia}
0
ENDSEC
0
EOF`;
}

function generateFoundationDXF(inputs: any, outputs: any): string {
  const length = (outputs.length || 2) * 1000;
  const width = (outputs.width || 2) * 1000;
  const colW = inputs.columnWidth || 400;
  const colD = inputs.columnDepth || 400;

  return `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
0
ENDSEC
0
SECTION
2
ENTITIES
0
LINE
8
FOUNDATION_OUTLINE
10
0
20
0
11
${length}
21
0
0
LINE
8
FOUNDATION_OUTLINE
10
${length}
20
0
11
${length}
21
${width}
0
LINE
8
FOUNDATION_OUTLINE
10
${length}
20
${width}
11
0
21
${width}
0
LINE
8
FOUNDATION_OUTLINE
10
0
20
${width}
11
0
21
0
0
LINE
8
COLUMN
10
${(length - colW) / 2}
20
${(width - colD) / 2}
11
${(length + colW) / 2}
21
${(width - colD) / 2}
0
LINE
8
COLUMN
10
${(length + colW) / 2}
20
${(width - colD) / 2}
11
${(length + colW) / 2}
21
${(width + colD) / 2}
0
LINE
8
COLUMN
10
${(length + colW) / 2}
20
${(width + colD) / 2}
11
${(length - colW) / 2}
21
${(width + colD) / 2}
0
LINE
8
COLUMN
10
${(length - colW) / 2}
20
${(width + colD) / 2}
11
${(length - colW) / 2}
21
${(width - colD) / 2}
0
TEXT
8
DIMENSIONS
10
${length / 2}
20
-50
40
20
1
${outputs.length}m x ${outputs.width}m
0
ENDSEC
0
EOF`;
}

function generateParkingDXF(inputs: any, outputs: any): string {
  const siteLength = (inputs.siteLength || 100) * 1000; // Convert to mm
  const siteWidth = (inputs.siteWidth || 60) * 1000;
  const layout = outputs.layout || { spaces: [], aisles: [], entries: [], exits: [] };
  
  let entities = '';
  
  // Site boundary
  entities += `0
LINE
8
SITE_BOUNDARY
10
0
20
0
11
${siteLength}
21
0
0
LINE
8
SITE_BOUNDARY
10
${siteLength}
20
0
11
${siteLength}
21
${siteWidth}
0
LINE
8
SITE_BOUNDARY
10
${siteLength}
20
${siteWidth}
11
0
21
${siteWidth}
0
LINE
8
SITE_BOUNDARY
10
0
20
${siteWidth}
11
0
21
0
`;

  // Parking spaces
  if (layout.spaces && Array.isArray(layout.spaces)) {
    layout.spaces.forEach((space: any, i: number) => {
      const x = (space.x || 0) * 1000;
      const y = (space.y || 0) * 1000;
      const w = (space.width || 2.5) * 1000;
      const l = (space.length || 5) * 1000;
      const layer = space.type === 'accessible' ? 'ACCESSIBLE_SPACE' : 
                    space.type === 'ev' ? 'EV_SPACE' : 
                    space.type === 'compact' ? 'COMPACT_SPACE' : 'PARKING_SPACE';
      
      entities += `0
LINE
8
${layer}
10
${x}
20
${y}
11
${x + w}
21
${y}
0
LINE
8
${layer}
10
${x + w}
20
${y}
11
${x + w}
21
${y + l}
0
LINE
8
${layer}
10
${x + w}
20
${y + l}
11
${x}
21
${y + l}
0
LINE
8
${layer}
10
${x}
20
${y + l}
11
${x}
21
${y}
`;
    });
  }

  // Aisles
  if (layout.aisles && Array.isArray(layout.aisles)) {
    layout.aisles.forEach((aisle: any, i: number) => {
      const x = (aisle.x || 0) * 1000;
      const y = (aisle.y || 0) * 1000;
      const w = (aisle.width || 6) * 1000;
      const h = (aisle.height || 6) * 1000;
      
      entities += `0
LINE
8
AISLE
10
${x}
20
${y}
11
${x + w}
21
${y}
0
LINE
8
AISLE
10
${x + w}
20
${y}
11
${x + w}
21
${y + h}
0
LINE
8
AISLE
10
${x + w}
20
${y + h}
11
${x}
21
${y + h}
0
LINE
8
AISLE
10
${x}
20
${y + h}
11
${x}
21
${y}
`;
    });
  }

  // Summary text
  const totalSpaces = layout.spaces?.length || outputs.totalSpaces || 0;
  const accessibleSpaces = outputs.accessibleSpaces || 0;
  const evSpaces = outputs.evSpaces || 0;
  
  entities += `0
TEXT
8
SUMMARY
10
${siteLength / 2}
20
-80
40
30
1
Parking Layout: ${totalSpaces} Total | ${accessibleSpaces} ADA | ${evSpaces} EV
`;

  return `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
0
ENDSEC
0
SECTION
2
ENTITIES
${entities}0
ENDSEC
0
EOF`;
}
