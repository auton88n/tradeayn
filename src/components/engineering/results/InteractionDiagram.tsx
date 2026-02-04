import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type BuildingCodeId } from '@/lib/buildingCodes';

export interface InteractionPoint {
  P: number;  // Axial capacity (kN)
  M: number;  // Moment capacity (kN·m)
  type: 'compression' | 'balanced' | 'tension';
}

interface InteractionDiagramProps {
  curvePoints: InteractionPoint[];
  appliedP: number;
  appliedM: number;
  buildingCode: BuildingCodeId;
}

// Check if load point is inside capacity envelope using ray casting
function checkInsideEnvelope(
  points: InteractionPoint[],
  P: number,
  M: number
): boolean {
  if (points.length < 3) return false;
  
  // Sort points by angle from origin for proper polygon
  const sortedPoints = [...points].sort((a, b) => {
    const angleA = Math.atan2(a.P, a.M);
    const angleB = Math.atan2(b.P, b.M);
    return angleB - angleA;
  });
  
  // Add origin point to close the polygon properly
  const polygon = [...sortedPoints, { P: 0, M: 0, type: 'tension' as const }];
  
  // Ray casting algorithm
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].M, yi = polygon[i].P;
    const xj = polygon[j].M, yj = polygon[j].P;
    
    if (((yi > P) !== (yj > P)) && (M < (xj - xi) * (P - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

// Custom star shape for applied load point
const StarShape = (props: { cx: number; cy: number; fill: string }) => {
  const { cx, cy, fill } = props;
  const size = 8;
  const points = 5;
  const outerRadius = size;
  const innerRadius = size / 2;
  
  let pathData = '';
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    pathData += (i === 0 ? 'M' : 'L') + `${x},${y}`;
  }
  pathData += 'Z';
  
  return <path d={pathData} fill={fill} stroke="#fff" strokeWidth={1} />;
};

export const InteractionDiagram: React.FC<InteractionDiagramProps> = ({
  curvePoints,
  appliedP,
  appliedM,
  buildingCode,
}) => {
  const isAdequate = useMemo(
    () => checkInsideEnvelope(curvePoints, appliedP, appliedM),
    [curvePoints, appliedP, appliedM]
  );
  
  const balancedPoint = useMemo(
    () => curvePoints.find(p => p.type === 'balanced'),
    [curvePoints]
  );
  
  // Prepare chart data - sort by moment for proper line drawing
  const chartData = useMemo(() => {
    const sorted = [...curvePoints].sort((a, b) => a.M - b.M);
    return sorted.map(point => ({
      M: point.M,
      curveP: point.P,
      type: point.type,
    }));
  }, [curvePoints]);
  
  // Applied load as separate data point
  const appliedLoadData = [{ P: appliedP, M: appliedM }];
  
  // Calculate axis domains with padding
  const maxP = Math.max(...curvePoints.map(p => p.P), appliedP) * 1.1;
  const maxM = Math.max(...curvePoints.map(p => p.M), appliedM) * 1.1;
  
  const isCSA = buildingCode === 'CSA';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">
          M-N Interaction Diagram
        </h4>
        <span className="text-xs text-muted-foreground">
          {isCSA ? 'CSA A23.3' : 'ACI 318'}
        </span>
      </div>
      
      <div className="h-[280px] w-full bg-muted/20 rounded-lg p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, bottom: 25, left: 15 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              type="number"
              dataKey="M"
              name="Moment"
              domain={[0, maxM]}
              tickFormatter={(v) => v.toFixed(0)}
              label={{ 
                value: 'Mn (kN·m)', 
                position: 'bottom', 
                offset: 5,
                style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' }
              }}
              tick={{ fontSize: 10 }}
            />
            <YAxis
              type="number"
              dataKey="P"
              name="Axial"
              domain={[0, maxP]}
              tickFormatter={(v) => v.toFixed(0)}
              label={{ 
                value: 'Pn (kN)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' }
              }}
              tick={{ fontSize: 10 }}
            />
            
            {/* Capacity envelope curve */}
            <Line
              type="monotone"
              dataKey="curveP"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props;
                const color = payload.type === 'compression' 
                  ? 'hsl(210, 80%, 55%)' 
                  : payload.type === 'balanced' 
                    ? 'hsl(35, 90%, 55%)' 
                    : 'hsl(145, 65%, 45%)';
                return (
                  <circle
                    key={`dot-${payload.M}-${payload.curveP}`}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={color}
                    stroke="#fff"
                    strokeWidth={1}
                  />
                );
              }}
              name="Capacity Envelope"
              isAnimationActive={false}
            />
            
            {/* Applied load point */}
            <Scatter
              data={appliedLoadData}
              dataKey="P"
              name="Applied Load"
              fill={isAdequate ? 'hsl(145, 65%, 45%)' : 'hsl(0, 75%, 55%)'}
              shape={<StarShape cx={0} cy={0} fill={isAdequate ? 'hsl(145, 65%, 45%)' : 'hsl(0, 75%, 55%)'} />}
              isAnimationActive={false}
            />
            
            {/* Balanced point reference line */}
            {balancedPoint && (
              <ReferenceLine
                y={balancedPoint.P}
                stroke="hsl(35, 90%, 55%)"
                strokeDasharray="5 5"
                strokeWidth={1}
              />
            )}
            
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)} ${name === 'Pn (kN)' || name === 'curveP' ? 'kN' : 'kN·m'}`,
                name === 'curveP' ? 'Pn' : name
              ]}
              labelFormatter={(label) => `Mn: ${Number(label).toFixed(1)} kN·m`}
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '11px',
              }}
            />
            
            <Legend 
              verticalAlign="top" 
              height={30}
              wrapperStyle={{ fontSize: '11px' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend for zone colors */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(210, 80%, 55%)' }} />
          <span>Compression</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(35, 90%, 55%)' }} />
          <span>Balanced</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(145, 65%, 45%)' }} />
          <span>Tension</span>
        </div>
      </div>
      
      {/* Status indicator */}
      <div className={cn(
        "flex items-center gap-2 p-2 rounded-lg text-sm",
        isAdequate 
          ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
          : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
      )}>
        {isAdequate ? (
          <>
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>Load point INSIDE capacity envelope — <strong>ADEQUATE</strong></span>
          </>
        ) : (
          <>
            <XCircle className="w-4 h-4 flex-shrink-0" />
            <span>Load point OUTSIDE capacity envelope — <strong>INADEQUATE</strong></span>
          </>
        )}
      </div>
    </div>
  );
};

export default InteractionDiagram;
