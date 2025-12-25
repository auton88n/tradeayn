import React, { useMemo, useState } from 'react';
import { ArrowUpDown, Download, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Point {
  id: string;
  x: number;
  y: number;
  z: number;
  fgl?: number;
  cutFill?: number;
}

interface StationDataTableProps {
  points: Point[];
  interval?: number; // Station interval in meters
}

interface StationData {
  station: string;
  stationNumber: number;
  ngl: number;
  fgl: number;
  cutFill: number;
  slope: number;
}

export const StationDataTable: React.FC<StationDataTableProps> = ({
  points,
  interval = 5,
}) => {
  const [sortColumn, setSortColumn] = useState<keyof StationData>('stationNumber');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showOnlyCutFill, setShowOnlyCutFill] = useState<'all' | 'cut' | 'fill'>('all');

  const stationData = useMemo(() => {
    if (points.length === 0) return [];

    // Sort points by x (station)
    const sortedPoints = [...points].sort((a, b) => a.x - b.x);
    const minX = sortedPoints[0].x;
    const maxX = sortedPoints[sortedPoints.length - 1].x;

    const data: StationData[] = [];
    let prevFgl: number | null = null;
    let prevStation: number | null = null;

    // Generate station data at regular intervals
    for (let station = Math.floor(minX / interval) * interval; station <= maxX; station += interval) {
      // Find closest point to this station
      const closestPoint = sortedPoints.reduce((closest, point) => {
        const currentDist = Math.abs(point.x - station);
        const closestDist = Math.abs(closest.x - station);
        return currentDist < closestDist ? point : closest;
      });

      // Only include if close enough to actual data
      if (Math.abs(closestPoint.x - station) <= interval * 0.6) {
        const ngl = closestPoint.z;
        const fgl = closestPoint.fgl ?? closestPoint.z;
        const cutFill = closestPoint.cutFill ?? (fgl - ngl);

        // Calculate slope from previous station
        let slope = 0;
        if (prevFgl !== null && prevStation !== null) {
          const rise = fgl - prevFgl;
          const run = station - prevStation;
          slope = run !== 0 ? (rise / run) * 100 : 0;
        }

        const stationNumber = Math.round(station);
        data.push({
          station: formatStation(stationNumber),
          stationNumber,
          ngl: Math.round(ngl * 1000) / 1000,
          fgl: Math.round(fgl * 1000) / 1000,
          cutFill: Math.round(cutFill * 1000) / 1000,
          slope: Math.round(slope * 100) / 100,
        });

        prevFgl = fgl;
        prevStation = station;
      }
    }

    return data;
  }, [points, interval]);

  const filteredAndSortedData = useMemo(() => {
    let filtered = stationData;
    
    if (showOnlyCutFill === 'cut') {
      filtered = stationData.filter(d => d.cutFill > 0);
    } else if (showOnlyCutFill === 'fill') {
      filtered = stationData.filter(d => d.cutFill < 0);
    }

    return [...filtered].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      return (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) * multiplier;
    });
  }, [stationData, sortColumn, sortDirection, showOnlyCutFill]);

  const handleSort = (column: keyof StationData) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Station', 'NGL (m)', 'DL/FGL (m)', 'Cut/Fill (m)', 'Slope (%)'];
    const rows = filteredAndSortedData.map(d => [
      d.station,
      d.ngl.toFixed(3),
      d.fgl.toFixed(3),
      d.cutFill.toFixed(3),
      d.slope.toFixed(2),
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'station_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (points.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground py-8">
          <p>No station data available</p>
        </div>
      </Card>
    );
  }

  // Calculate totals
  const totalCut = stationData.filter(d => d.cutFill > 0).reduce((sum, d) => sum + d.cutFill, 0);
  const totalFill = stationData.filter(d => d.cutFill < 0).reduce((sum, d) => sum + Math.abs(d.cutFill), 0);

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-lg">Station-by-Station Data</h3>
          <p className="text-sm text-muted-foreground">
            {stationData.length} stations at {interval}m intervals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-background rounded-lg p-1">
            <Button
              variant={showOnlyCutFill === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShowOnlyCutFill('all')}
            >
              All
            </Button>
            <Button
              variant={showOnlyCutFill === 'cut' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShowOnlyCutFill('cut')}
              className="text-red-500"
            >
              Cut
            </Button>
            <Button
              variant={showOnlyCutFill === 'fill' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShowOnlyCutFill('fill')}
              className="text-blue-500"
            >
              Fill
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-muted/10 border-b text-sm">
        <div>
          <span className="text-muted-foreground">Total Stations:</span>{' '}
          <span className="font-semibold">{filteredAndSortedData.length}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Σ Cut:</span>{' '}
          <span className="font-semibold text-red-500">{totalCut.toFixed(2)}m</span>
        </div>
        <div>
          <span className="text-muted-foreground">Σ Fill:</span>{' '}
          <span className="font-semibold text-blue-500">{totalFill.toFixed(2)}m</span>
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="h-[400px]">
        <table className="w-full">
          <thead className="sticky top-0 bg-background border-b">
            <tr>
              <TableHeader 
                label="Station" 
                column="stationNumber" 
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <TableHeader 
                label="NGL (m)" 
                column="ngl" 
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <TableHeader 
                label="DL/FGL (m)" 
                column="fgl" 
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <TableHeader 
                label="Cut/Fill (m)" 
                column="cutFill" 
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <TableHeader 
                label="Slope (%)" 
                column="slope" 
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedData.map((row, i) => (
              <tr 
                key={row.station} 
                className={`border-b hover:bg-muted/30 transition-colors ${
                  i % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                }`}
              >
                <td className="px-4 py-2 font-mono text-sm font-medium">{row.station}</td>
                <td className="px-4 py-2 text-right font-mono text-sm">{row.ngl.toFixed(3)}</td>
                <td className="px-4 py-2 text-right font-mono text-sm">{row.fgl.toFixed(3)}</td>
                <td className={`px-4 py-2 text-right font-mono text-sm font-semibold ${
                  row.cutFill > 0 ? 'text-red-500' : row.cutFill < 0 ? 'text-blue-500' : ''
                }`}>
                  {row.cutFill > 0 ? '+' : ''}{row.cutFill.toFixed(3)}
                </td>
                <td className={`px-4 py-2 text-right font-mono text-sm ${
                  Math.abs(row.slope) > 5 ? 'text-amber-500 font-semibold' : ''
                }`}>
                  {row.slope > 0 ? '+' : ''}{row.slope.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </Card>
  );
};

// Helper components
const TableHeader: React.FC<{
  label: string;
  column: keyof StationData;
  sortColumn: keyof StationData;
  sortDirection: 'asc' | 'desc';
  onSort: (column: keyof StationData) => void;
}> = ({ label, column, sortColumn, sortDirection, onSort }) => (
  <th 
    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
    onClick={() => onSort(column)}
  >
    <div className="flex items-center gap-1">
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortColumn === column ? 'text-primary' : 'opacity-50'}`} />
    </div>
  </th>
);

// Format station number to engineering format (e.g., 0+000)
function formatStation(meters: number): string {
  const major = Math.floor(meters / 1000);
  const minor = Math.abs(meters % 1000);
  return `${major}+${minor.toString().padStart(3, '0')}`;
}
