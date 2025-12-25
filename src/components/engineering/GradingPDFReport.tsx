import React, { forwardRef, useMemo } from 'react';

interface Point {
  id: string;
  x: number;
  y: number;
  z: number;
  fgl?: number;
  cutFill?: number;
}

interface GradingDesign {
  designElevation: number;
  slopeDirection: string;
  slopePercentage: number;
  totalCutVolume: number;
  totalFillVolume: number;
  netVolume: number;
  designNotes: string[];
  drainageRecommendations: string;
  compactionRequirements: string;
}

interface CostBreakdown {
  excavation: number;
  fill: number;
  compaction: number;
  disposal: number;
  surveying: number;
}

interface GradingPDFReportProps {
  design: GradingDesign;
  costBreakdown: CostBreakdown | null;
  totalCost: number;
  fglPoints: Point[];
  projectName: string;
}

interface ChartDataPoint {
  station: number;
  stationLabel: string;
  ngl: number;
  fgl: number;
  cutFill: number;
}

// Generate station data for PDF
function generateStationData(points: Point[], interval: number = 10) {
  if (points.length === 0) return [];

  const sortedPoints = [...points].sort((a, b) => a.x - b.x);
  const minX = sortedPoints[0].x;
  const maxX = sortedPoints[sortedPoints.length - 1].x;

  const data: Array<{
    station: string;
    stationNum: number;
    ngl: number;
    fgl: number;
    cutFill: number;
  }> = [];

  for (let station = Math.floor(minX / interval) * interval; station <= maxX; station += interval) {
    const closestPoint = sortedPoints.reduce((closest, point) => {
      return Math.abs(point.x - station) < Math.abs(closest.x - station) ? point : closest;
    });

    if (Math.abs(closestPoint.x - station) <= interval * 0.6) {
      const ngl = closestPoint.z;
      const fgl = closestPoint.fgl ?? closestPoint.z;
      const cutFill = closestPoint.cutFill ?? (fgl - ngl);

      const major = Math.floor(Math.round(station) / 1000);
      const minor = Math.abs(Math.round(station) % 1000);

      data.push({
        station: `${major}+${minor.toString().padStart(3, '0')}`,
        stationNum: Math.round(station),
        ngl: Math.round(ngl * 1000) / 1000,
        fgl: Math.round(fgl * 1000) / 1000,
        cutFill: Math.round(cutFill * 1000) / 1000,
      });
    }
  }

  return data;
}

// Generate chart data for SVG elevation profile
function generateChartData(points: Point[], interval: number = 5): ChartDataPoint[] {
  if (points.length === 0) return [];

  const sortedPoints = [...points].sort((a, b) => a.x - b.x);
  const minX = sortedPoints[0].x;
  const maxX = sortedPoints[sortedPoints.length - 1].x;

  const data: ChartDataPoint[] = [];

  for (let station = Math.floor(minX / interval) * interval; station <= maxX; station += interval) {
    const closestPoint = sortedPoints.reduce((closest, point) => {
      return Math.abs(point.x - station) < Math.abs(closest.x - station) ? point : closest;
    });

    if (Math.abs(closestPoint.x - station) <= interval * 0.6) {
      const ngl = closestPoint.z;
      const fgl = closestPoint.fgl ?? closestPoint.z;
      const cutFill = fgl - ngl;

      const major = Math.floor(Math.round(station) / 1000);
      const minor = Math.abs(Math.round(station) % 1000);

      data.push({
        station: Math.round(station),
        stationLabel: `${major}+${minor.toString().padStart(3, '0')}`,
        ngl,
        fgl,
        cutFill,
      });
    }
  }

  return data;
}

// SVG Elevation Profile Component for PDF
const ElevationProfileSVG: React.FC<{ points: Point[] }> = ({ points }) => {
  const chartData = useMemo(() => generateChartData(points, 5), [points]);

  if (chartData.length < 2) {
    return (
      <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
        Insufficient data for elevation profile
      </div>
    );
  }

  // Chart dimensions
  const width = 700;
  const height = 180;
  const padding = { top: 20, right: 40, bottom: 35, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate bounds
  const allElevations = chartData.flatMap(d => [d.ngl, d.fgl]);
  const minElev = Math.floor(Math.min(...allElevations) - 0.5);
  const maxElev = Math.ceil(Math.max(...allElevations) + 0.5);
  const minStation = chartData[0].station;
  const maxStation = chartData[chartData.length - 1].station;

  // Scale functions
  const xScale = (station: number) => 
    padding.left + ((station - minStation) / (maxStation - minStation)) * chartWidth;
  const yScale = (elev: number) => 
    padding.top + chartHeight - ((elev - minElev) / (maxElev - minElev)) * chartHeight;

  // Generate paths
  const nglPath = chartData.map((d, i) => 
    `${i === 0 ? 'M' : 'L'} ${xScale(d.station)} ${yScale(d.ngl)}`
  ).join(' ');

  const fglPath = chartData.map((d, i) => 
    `${i === 0 ? 'M' : 'L'} ${xScale(d.station)} ${yScale(d.fgl)}`
  ).join(' ');

  // Generate fill areas for cut/fill visualization
  const fillAreas: JSX.Element[] = [];
  for (let i = 0; i < chartData.length - 1; i++) {
    const d1 = chartData[i];
    const d2 = chartData[i + 1];
    const x1 = xScale(d1.station);
    const x2 = xScale(d2.station);
    const ngl1 = yScale(d1.ngl);
    const ngl2 = yScale(d2.ngl);
    const fgl1 = yScale(d1.fgl);
    const fgl2 = yScale(d2.fgl);

    const isCut = (d1.cutFill + d2.cutFill) / 2 > 0;
    const color = isCut ? '#ef4444' : '#3b82f6';

    fillAreas.push(
      <path
        key={i}
        d={`M ${x1} ${ngl1} L ${x2} ${ngl2} L ${x2} ${fgl2} L ${x1} ${fgl1} Z`}
        fill={color}
        opacity={0.2}
      />
    );
  }

  // Generate grid lines
  const elevRange = maxElev - minElev;
  const elevStep = elevRange <= 2 ? 0.5 : elevRange <= 5 ? 1 : 2;
  const gridLines: JSX.Element[] = [];
  for (let elev = Math.ceil(minElev / elevStep) * elevStep; elev <= maxElev; elev += elevStep) {
    const y = yScale(elev);
    gridLines.push(
      <g key={`grid-${elev}`}>
        <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e2e8f0" strokeWidth={1} />
        <text x={padding.left - 5} y={y + 4} textAnchor="end" fontSize={8} fill="#64748b">
          {elev.toFixed(1)}
        </text>
      </g>
    );
  }

  // Station labels (show every few stations)
  const stationLabelInterval = Math.max(1, Math.floor(chartData.length / 8));
  const stationLabels = chartData.filter((_, i) => i % stationLabelInterval === 0 || i === chartData.length - 1);

  return (
    <svg width={width} height={height} style={{ maxWidth: '100%' }}>
      {/* Background */}
      <rect x={padding.left} y={padding.top} width={chartWidth} height={chartHeight} fill="#f8fafc" />
      
      {/* Grid lines */}
      {gridLines}
      
      {/* Fill areas */}
      {fillAreas}
      
      {/* NGL line */}
      <path d={nglPath} fill="none" stroke="#f59e0b" strokeWidth={2} />
      
      {/* FGL line */}
      <path d={fglPath} fill="none" stroke="#10b981" strokeWidth={2.5} />
      
      {/* X-axis */}
      <line 
        x1={padding.left} 
        y1={height - padding.bottom} 
        x2={width - padding.right} 
        y2={height - padding.bottom} 
        stroke="#94a3b8" 
        strokeWidth={1} 
      />
      
      {/* Y-axis */}
      <line 
        x1={padding.left} 
        y1={padding.top} 
        x2={padding.left} 
        y2={height - padding.bottom} 
        stroke="#94a3b8" 
        strokeWidth={1} 
      />
      
      {/* Station labels */}
      {stationLabels.map((d, i) => (
        <text 
          key={i} 
          x={xScale(d.station)} 
          y={height - padding.bottom + 12} 
          textAnchor="middle" 
          fontSize={7} 
          fill="#64748b"
        >
          {d.stationLabel}
        </text>
      ))}
      
      {/* Axis labels */}
      <text 
        x={width / 2} 
        y={height - 5} 
        textAnchor="middle" 
        fontSize={9} 
        fill="#475569"
      >
        Station
      </text>
      <text 
        x={12} 
        y={height / 2} 
        textAnchor="middle" 
        fontSize={9} 
        fill="#475569"
        transform={`rotate(-90, 12, ${height / 2})`}
      >
        Elevation (m)
      </text>
      
      {/* Legend */}
      <g transform={`translate(${width - padding.right - 120}, ${padding.top})`}>
        <rect x={0} y={0} width={115} height={50} fill="white" stroke="#e2e8f0" rx={3} />
        <line x1={8} y1={12} x2={28} y2={12} stroke="#f59e0b" strokeWidth={2} />
        <text x={32} y={15} fontSize={8} fill="#475569">NGL (Natural Ground)</text>
        <line x1={8} y1={27} x2={28} y2={27} stroke="#10b981" strokeWidth={2.5} />
        <text x={32} y={30} fontSize={8} fill="#475569">DL/FGL (Design Level)</text>
        <rect x={8} y={37} width={10} height={8} fill="#ef4444" opacity={0.3} />
        <text x={22} y={44} fontSize={7} fill="#ef4444">Cut</text>
        <rect x={50} y={37} width={10} height={8} fill="#3b82f6" opacity={0.3} />
        <text x={64} y={44} fontSize={7} fill="#3b82f6">Fill</text>
      </g>
    </svg>
  );
};

export const GradingPDFReport = forwardRef<HTMLDivElement, GradingPDFReportProps>(
  ({ design, costBreakdown, totalCost, fglPoints, projectName }, ref) => {
    const stationData = generateStationData(fglPoints, 10);
    const netVolumeLabel = design.netVolume > 0 ? 'Excess Cut' : 'Import Required';
    const date = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    return (
      <div
        ref={ref}
        className="bg-white text-black p-8"
        style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header */}
        <div className="border-b-4 border-slate-800 pb-4 mb-5">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">GRADING DESIGN REPORT</h1>
              <p className="text-lg font-semibold text-slate-600 mt-1">{projectName}</p>
            </div>
            <div className="text-right text-sm text-slate-600">
              <p>Date: {date}</p>
              <p>Rev. 0</p>
            </div>
          </div>
        </div>

        {/* Volume Summary */}
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-800 border-b-2 border-slate-300 pb-1 mb-3">
            EARTHWORK VOLUMES
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-red-300 bg-red-50 rounded p-3">
              <p className="text-xs font-semibold text-red-600 uppercase">Total Cut</p>
              <p className="text-xl font-bold text-red-700">{design.totalCutVolume?.toLocaleString()} m³</p>
            </div>
            <div className="border border-blue-300 bg-blue-50 rounded p-3">
              <p className="text-xs font-semibold text-blue-600 uppercase">Total Fill</p>
              <p className="text-xl font-bold text-blue-700">{design.totalFillVolume?.toLocaleString()} m³</p>
            </div>
            <div className="border border-slate-300 bg-slate-50 rounded p-3">
              <p className="text-xs font-semibold text-slate-600 uppercase">{netVolumeLabel}</p>
              <p className="text-xl font-bold text-slate-700">{Math.abs(design.netVolume)?.toLocaleString()} m³</p>
            </div>
          </div>
        </div>

        {/* Elevation Profile Chart */}
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-800 border-b-2 border-slate-300 pb-1 mb-3">
            ELEVATION PROFILE
          </h2>
          <div className="border border-slate-200 rounded p-2">
            <ElevationProfileSVG points={fglPoints} />
          </div>
        </div>

        {/* Design Parameters */}
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-800 border-b-2 border-slate-300 pb-1 mb-3">
            DESIGN PARAMETERS
          </h2>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500 uppercase">Design Elevation</p>
              <p className="font-semibold">{design.designElevation?.toFixed(2)} m</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">Slope Direction</p>
              <p className="font-semibold">{design.slopeDirection}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">Slope Percentage</p>
              <p className="font-semibold">{design.slopePercentage}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">Points Processed</p>
              <p className="font-semibold">{fglPoints.length}</p>
            </div>
          </div>
        </div>

        {/* Station Data Table */}
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-800 border-b-2 border-slate-300 pb-1 mb-3">
            STATION-BY-STATION DATA
          </h2>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-2 py-1 text-left font-semibold">Station</th>
                <th className="border border-slate-300 px-2 py-1 text-right font-semibold">NGL (m)</th>
                <th className="border border-slate-300 px-2 py-1 text-right font-semibold">DL/FGL (m)</th>
                <th className="border border-slate-300 px-2 py-1 text-right font-semibold">Cut/Fill (m)</th>
              </tr>
            </thead>
            <tbody>
              {stationData.slice(0, 20).map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="border border-slate-300 px-2 py-1 font-mono">{row.station}</td>
                  <td className="border border-slate-300 px-2 py-1 text-right font-mono">{row.ngl.toFixed(3)}</td>
                  <td className="border border-slate-300 px-2 py-1 text-right font-mono">{row.fgl.toFixed(3)}</td>
                  <td className={`border border-slate-300 px-2 py-1 text-right font-mono font-semibold ${
                    row.cutFill > 0 ? 'text-red-600' : row.cutFill < 0 ? 'text-blue-600' : ''
                  }`}>
                    {row.cutFill > 0 ? '+' : ''}{row.cutFill.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stationData.length > 20 && (
            <p className="text-xs text-slate-500 mt-1 italic">
              Showing first 20 of {stationData.length} stations. See digital data for complete list.
            </p>
          )}
        </div>

        {/* Cost Breakdown */}
        {costBreakdown && (
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-800 border-b-2 border-slate-300 pb-1 mb-3">
              COST ESTIMATE (SAR)
            </h2>
            <div className="grid grid-cols-2 gap-x-8 text-sm">
              {Object.entries(costBreakdown).map(([key, value]) => (
                <div key={key} className="flex justify-between py-1 border-b border-slate-200">
                  <span className="capitalize text-slate-600">{key.replace(/_/g, ' ')}</span>
                  <span className="font-medium">{value.toLocaleString()} SAR</span>
                </div>
              ))}
              <div className="col-span-2 flex justify-between py-2 border-t-2 border-slate-800 mt-2">
                <span className="font-bold">Total Estimated Cost</span>
                <span className="font-bold text-lg">{totalCost.toLocaleString()} SAR</span>
              </div>
            </div>
          </div>
        )}

        {/* Design Notes - Compact */}
        {design.designNotes && design.designNotes.length > 0 && (
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-800 border-b-2 border-slate-300 pb-1 mb-2">
              NOTES
            </h2>
            <ul className="text-xs space-y-0.5">
              {design.designNotes.slice(0, 5).map((note, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-slate-400">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="absolute bottom-8 left-8 right-8 border-t-2 border-slate-300 pt-3">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Generated by AI Grading Designer</span>
            <span>Page 1 of 1</span>
          </div>
        </div>
      </div>
    );
  }
);

GradingPDFReport.displayName = 'GradingPDFReport';
