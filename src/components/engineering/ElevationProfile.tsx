import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine,
} from 'recharts';

interface Point {
  id: string;
  x: number;
  y: number;
  z: number;
  fgl?: number;
  cutFill?: number;
}

interface ElevationProfileProps {
  points: Point[];
  showGrid?: boolean;
  height?: number;
}

interface ChartData {
  station: string;
  stationNum: number;
  ngl: number;
  fgl: number;
  cutFill: number;
  isCut: boolean;
}

export const ElevationProfile: React.FC<ElevationProfileProps> = ({
  points,
  showGrid = true,
  height = 350,
}) => {
  const chartData = useMemo(() => {
    if (points.length === 0) return [];

    // Sort points by x (station) and sample at intervals
    const sortedPoints = [...points].sort((a, b) => a.x - b.x);
    const minX = sortedPoints[0].x;
    const maxX = sortedPoints[sortedPoints.length - 1].x;
    const range = maxX - minX;
    
    // Determine appropriate interval based on range
    const interval = range > 500 ? 20 : range > 200 ? 10 : range > 50 ? 5 : 2;
    
    const data: ChartData[] = [];

    for (let station = Math.floor(minX / interval) * interval; station <= maxX; station += interval) {
      // Find closest point
      const closestPoint = sortedPoints.reduce((closest, point) => {
        return Math.abs(point.x - station) < Math.abs(closest.x - station) ? point : closest;
      });

      if (Math.abs(closestPoint.x - station) <= interval * 0.6) {
        const ngl = closestPoint.z;
        const fgl = closestPoint.fgl ?? closestPoint.z;
        const cutFill = fgl - ngl;

        data.push({
          station: formatStation(Math.round(station)),
          stationNum: Math.round(station),
          ngl: Math.round(ngl * 100) / 100,
          fgl: Math.round(fgl * 100) / 100,
          cutFill: Math.round(cutFill * 100) / 100,
          isCut: cutFill > 0,
        });
      }
    }

    return data;
  }, [points]);

  const { minElevation, maxElevation, avgElevation } = useMemo(() => {
    if (chartData.length === 0) return { minElevation: 0, maxElevation: 0, avgElevation: 0 };
    
    const allElevations = chartData.flatMap(d => [d.ngl, d.fgl]);
    const min = Math.min(...allElevations);
    const max = Math.max(...allElevations);
    const avg = allElevations.reduce((a, b) => a + b, 0) / allElevations.length;
    
    return {
      minElevation: Math.floor(min - 1),
      maxElevation: Math.ceil(max + 1),
      avgElevation: Math.round(avg * 100) / 100,
    };
  }, [chartData]);

  if (points.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground py-8">
          <p>No elevation data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-semibold text-lg">Elevation Profile</h3>
            <p className="text-sm text-muted-foreground">
              NGL vs DL/FGL with Cut/Fill Visualization
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-amber-500 rounded" />
              <span className="text-muted-foreground">NGL (Natural Ground)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-emerald-500 rounded" />
              <span className="text-muted-foreground">DL/FGL (Design Level)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500/30 border border-red-500 rounded" />
              <span className="text-muted-foreground">Cut</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500/30 border border-blue-500 rounded" />
              <span className="text-muted-foreground">Fill</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="cutGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.4} />
              </linearGradient>
            </defs>

            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.5} 
              />
            )}

            <XAxis
              dataKey="station"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              label={{ 
                value: 'Station', 
                position: 'bottom', 
                offset: 0,
                style: { fontSize: 12, fill: 'hsl(var(--muted-foreground))' }
              }}
              interval="preserveStartEnd"
            />

            <YAxis
              domain={[minElevation, maxElevation]}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              label={{ 
                value: 'Elevation (m)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fontSize: 12, fill: 'hsl(var(--muted-foreground))' }
              }}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'hsl(var(--primary))', strokeDasharray: '5 5' }}
            />

            {/* Reference line for average elevation */}
            <ReferenceLine 
              y={avgElevation} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="8 4"
              opacity={0.3}
            />

            {/* NGL Line */}
            <Line
              type="monotone"
              dataKey="ngl"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 3, fill: '#f59e0b' }}
              activeDot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
              name="NGL"
            />

            {/* FGL Line */}
            <Line
              type="monotone"
              dataKey="fgl"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#10b981' }}
              activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              name="DL/FGL"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4 p-4 border-t bg-muted/10 text-sm">
        <div className="text-center">
          <p className="text-muted-foreground">Min Elevation</p>
          <p className="font-semibold">{minElevation.toFixed(2)}m</p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">Max Elevation</p>
          <p className="font-semibold">{maxElevation.toFixed(2)}m</p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">Avg Elevation</p>
          <p className="font-semibold">{avgElevation.toFixed(2)}m</p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">Data Points</p>
          <p className="font-semibold">{chartData.length}</p>
        </div>
      </div>
    </Card>
  );
};

// Custom tooltip component
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload as ChartData;
  if (!data) return null;

  return (
    <div className="bg-background/95 backdrop-blur border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold mb-2">Station {label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            NGL:
          </span>
          <span className="font-mono font-medium">{data.ngl.toFixed(3)}m</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            DL/FGL:
          </span>
          <span className="font-mono font-medium">{data.fgl.toFixed(3)}m</span>
        </div>
        <div className={`flex items-center justify-between gap-4 pt-1 border-t ${
          data.isCut ? 'text-red-500' : 'text-blue-500'
        }`}>
          <span>{data.isCut ? 'Cut:' : 'Fill:'}</span>
          <span className="font-mono font-semibold">
            {Math.abs(data.cutFill).toFixed(3)}m
          </span>
        </div>
      </div>
    </div>
  );
};

function formatStation(meters: number): string {
  const major = Math.floor(meters / 1000);
  const minor = Math.abs(meters % 1000);
  return `${major}+${minor.toString().padStart(3, '0')}`;
}
