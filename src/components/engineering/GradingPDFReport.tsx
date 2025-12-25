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

interface StationDataRow {
  station: string;
  stationNum: number;
  ngl: number;
  fgl: number;
  cutFill: number;
}

const ROWS_PER_PAGE = 35;

// Generate station data for PDF
function generateStationData(points: Point[], interval: number = 10): StationDataRow[] {
  if (points.length === 0) return [];

  const sortedPoints = [...points].sort((a, b) => a.x - b.x);
  const minX = sortedPoints[0].x;
  const maxX = sortedPoints[sortedPoints.length - 1].x;

  const data: StationDataRow[] = [];

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

  const width = 700;
  const height = 160;
  const padding = { top: 20, right: 40, bottom: 35, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const allElevations = chartData.flatMap(d => [d.ngl, d.fgl]);
  const minElev = Math.floor(Math.min(...allElevations) - 0.5);
  const maxElev = Math.ceil(Math.max(...allElevations) + 0.5);
  const minStation = chartData[0].station;
  const maxStation = chartData[chartData.length - 1].station;

  const xScale = (station: number) => 
    padding.left + ((station - minStation) / (maxStation - minStation)) * chartWidth;
  const yScale = (elev: number) => 
    padding.top + chartHeight - ((elev - minElev) / (maxElev - minElev)) * chartHeight;

  const nglPath = chartData.map((d, i) => 
    `${i === 0 ? 'M' : 'L'} ${xScale(d.station)} ${yScale(d.ngl)}`
  ).join(' ');

  const fglPath = chartData.map((d, i) => 
    `${i === 0 ? 'M' : 'L'} ${xScale(d.station)} ${yScale(d.fgl)}`
  ).join(' ');

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

  const stationLabelInterval = Math.max(1, Math.floor(chartData.length / 8));
  const stationLabels = chartData.filter((_, i) => i % stationLabelInterval === 0 || i === chartData.length - 1);

  return (
    <svg width={width} height={height} style={{ maxWidth: '100%' }}>
      <rect x={padding.left} y={padding.top} width={chartWidth} height={chartHeight} fill="#f8fafc" />
      {gridLines}
      {fillAreas}
      <path d={nglPath} fill="none" stroke="#f59e0b" strokeWidth={2} />
      <path d={fglPath} fill="none" stroke="#10b981" strokeWidth={2.5} />
      <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#94a3b8" strokeWidth={1} />
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#94a3b8" strokeWidth={1} />
      {stationLabels.map((d, i) => (
        <text key={i} x={xScale(d.station)} y={height - padding.bottom + 12} textAnchor="middle" fontSize={7} fill="#64748b">
          {d.stationLabel}
        </text>
      ))}
      <text x={width / 2} y={height - 5} textAnchor="middle" fontSize={9} fill="#475569">Station</text>
      <text x={12} y={height / 2} textAnchor="middle" fontSize={9} fill="#475569" transform={`rotate(-90, 12, ${height / 2})`}>Elevation (m)</text>
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

// Full-page Site Plan / Road Alignment Visualization - Clean, professional design
const SitePlanFullPageSVG: React.FC<{ points: Point[]; projectName: string }> = ({ points, projectName }) => {
  const sortedPoints = useMemo(() => [...points].sort((a, b) => a.x - b.x), [points]);

  if (sortedPoints.length < 2) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        Insufficient data for site plan
      </div>
    );
  }

  const width = 700;
  const height = 450;
  const padding = { top: 40, right: 50, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate bounds
  const xs = sortedPoints.map(p => p.x);
  const ys = sortedPoints.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  const xRange = maxX - minX || 1;
  const yRange = maxY - minY || 1;
  
  const paddedMinX = minX - xRange * 0.05;
  const paddedMaxX = maxX + xRange * 0.05;
  const paddedMinY = minY - yRange * 0.1;
  const paddedMaxY = maxY + yRange * 0.1;
  const paddedXRange = paddedMaxX - paddedMinX;
  const paddedYRange = paddedMaxY - paddedMinY || 1;

  const scaleX = chartWidth / paddedXRange;
  const scaleY = chartHeight / paddedYRange;
  const scale = Math.min(scaleX, scaleY);
  
  const offsetX = (chartWidth - paddedXRange * scale) / 2;
  const offsetY = (chartHeight - paddedYRange * scale) / 2;

  const xPos = (x: number) => padding.left + offsetX + (x - paddedMinX) * scale;
  const yPos = (y: number) => padding.top + chartHeight - offsetY - (y - paddedMinY) * scale;

  // Road alignment path - smoother
  const roadPath = sortedPoints.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${xPos(p.x)} ${yPos(p.y)}`
  ).join(' ');

  // Select only key points: start, end, and 3-4 intermediate evenly spaced
  const numIntermediateLabels = 4;
  const step = Math.max(1, Math.floor((sortedPoints.length - 1) / (numIntermediateLabels + 1)));
  const keyPointIndices: number[] = [0];
  for (let i = step; i < sortedPoints.length - 1; i += step) {
    if (keyPointIndices.length < numIntermediateLabels + 1) {
      keyPointIndices.push(i);
    }
  }
  keyPointIndices.push(sortedPoints.length - 1);
  const keyPoints = keyPointIndices.map(i => ({ ...sortedPoints[i], index: i }));

  // Format station label
  const formatStation = (x: number) => {
    const stationNum = Math.round(x);
    const major = Math.floor(stationNum / 1000);
    const minor = Math.abs(stationNum % 1000);
    return `${major}+${minor.toString().padStart(3, '0')}`;
  };

  // Calculate scale bar
  const scaleBarLength = 50; // meters
  const scaleBarPixels = scaleBarLength * scale;

  // Grid lines
  const gridLinesX: number[] = [];
  const gridLinesY: number[] = [];
  const xStep = Math.ceil(xRange / 5 / 50) * 50;
  const yStep = Math.ceil(yRange / 4 / 10) * 10 || 10;
  
  for (let x = Math.ceil(minX / xStep) * xStep; x <= maxX; x += xStep) {
    gridLinesX.push(x);
  }
  for (let y = Math.ceil(minY / yStep) * yStep; y <= maxY; y += yStep) {
    gridLinesY.push(y);
  }

  return (
    <svg width={width} height={height} style={{ maxWidth: '100%' }}>
      {/* Background with light grid */}
      <rect x={padding.left} y={padding.top} width={chartWidth} height={chartHeight} fill="#fafafa" />
      
      {/* Grid lines */}
      {gridLinesX.map(x => (
        <line key={`gx-${x}`} x1={xPos(x)} y1={padding.top} x2={xPos(x)} y2={padding.top + chartHeight} stroke="#e5e7eb" strokeWidth={0.5} strokeDasharray="4,4" />
      ))}
      {gridLinesY.map(y => (
        <line key={`gy-${y}`} x1={padding.left} y1={yPos(y)} x2={padding.left + chartWidth} y2={yPos(y)} stroke="#e5e7eb" strokeWidth={0.5} strokeDasharray="4,4" />
      ))}
      
      {/* Border */}
      <rect x={padding.left} y={padding.top} width={chartWidth} height={chartHeight} fill="none" stroke="#94a3b8" strokeWidth={1} />
      
      {/* Road alignment - main path with shadow for depth */}
      <path d={roadPath} fill="none" stroke="#94a3b8" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={0.3} />
      <path d={roadPath} fill="none" stroke="#1e40af" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Key station markers with labels */}
      {keyPoints.map((p, i) => {
        const x = xPos(p.x);
        const y = yPos(p.y);
        const isFirst = i === 0;
        const isLast = i === keyPoints.length - 1;
        const labelAbove = i % 2 === 0;
        
        return (
          <g key={`station-${i}`}>
            {/* Station marker dot */}
            <circle cx={x} cy={y} r={4} fill={isFirst ? '#22c55e' : isLast ? '#ef4444' : '#1e40af'} stroke="white" strokeWidth={1.5} />
            
            {/* Station label with background for readability */}
            <g transform={`translate(${x}, ${labelAbove ? y - 12 : y + 12})`}>
              <rect x={-24} y={labelAbove ? -14 : 2} width={48} height={14} fill="white" rx={2} opacity={0.9} />
              <text x={0} y={labelAbove ? -4 : 12} textAnchor="middle" fontSize={9} fill="#1e40af" fontWeight={isFirst || isLast ? 'bold' : 'normal'}>
                {formatStation(p.x)}
              </text>
            </g>
            
            {/* NGL elevation - small, subtle */}
            <text x={x + (labelAbove ? 28 : -28)} y={y + 4} textAnchor={labelAbove ? "start" : "end"} fontSize={7} fill="#6b7280">
              El: {p.z.toFixed(1)}m
            </text>
          </g>
        );
      })}

      {/* Legend box */}
      <g transform={`translate(${width - padding.right - 110}, ${padding.top + 10})`}>
        <rect x={0} y={0} width={100} height={65} fill="white" stroke="#d1d5db" rx={4} />
        <text x={50} y={14} textAnchor="middle" fontSize={9} fill="#374151" fontWeight="bold">LEGEND</text>
        <line x1={10} y1={28} x2={35} y2={28} stroke="#1e40af" strokeWidth={3} />
        <text x={42} y={31} fontSize={8} fill="#374151">Road Centerline</text>
        <circle cx={15} cy={42} r={4} fill="#22c55e" />
        <text x={42} y={45} fontSize={8} fill="#374151">Start Point</text>
        <circle cx={15} cy={56} r={4} fill="#ef4444" />
        <text x={42} y={59} fontSize={8} fill="#374151">End Point</text>
      </g>

      {/* North arrow */}
      <g transform={`translate(${padding.left + 25}, ${padding.top + 30})`}>
        <circle cx={0} cy={0} r={18} fill="white" stroke="#94a3b8" strokeWidth={1} />
        <polygon points="0,-12 4,4 0,0 -4,4" fill="#374151" />
        <text x={0} y={-14} textAnchor="middle" fontSize={8} fill="#374151" fontWeight="bold">N</text>
      </g>

      {/* Scale bar */}
      <g transform={`translate(${padding.left + 20}, ${height - 25})`}>
        <line x1={0} y1={0} x2={scaleBarPixels} y2={0} stroke="#374151" strokeWidth={2} />
        <line x1={0} y1={-4} x2={0} y2={4} stroke="#374151" strokeWidth={2} />
        <line x1={scaleBarPixels} y1={-4} x2={scaleBarPixels} y2={4} stroke="#374151" strokeWidth={2} />
        <text x={scaleBarPixels / 2} y={12} textAnchor="middle" fontSize={8} fill="#374151">{scaleBarLength}m</text>
        <text x={scaleBarPixels + 10} y={4} fontSize={7} fill="#6b7280">Scale</text>
      </g>

      {/* Axis labels */}
      <text x={padding.left + chartWidth / 2} y={height - 8} textAnchor="middle" fontSize={10} fill="#374151">Station (X-Coordinate)</text>
      <text x={15} y={padding.top + chartHeight / 2} textAnchor="middle" fontSize={10} fill="#374151" transform={`rotate(-90, 15, ${padding.top + chartHeight / 2})`}>Northing (Y-Coordinate)</text>

      {/* Title block */}
      <text x={width / 2} y={22} textAnchor="middle" fontSize={14} fill="#1e293b" fontWeight="bold">ROAD ALIGNMENT PLAN</text>
      <text x={width / 2} y={36} textAnchor="middle" fontSize={10} fill="#64748b">{projectName}</text>
    </svg>
  );
};

// Page Header Component
const PageHeader: React.FC<{ projectName: string; date: string; pageNum: number; totalPages: number }> = ({ 
  projectName, date, pageNum, totalPages 
}) => (
  <div className="border-b-2 border-slate-400 pb-2 mb-4 flex justify-between items-center">
    <div>
      <span className="text-sm font-bold text-slate-700">GRADING DESIGN REPORT</span>
      <span className="text-sm text-slate-500 ml-3">{projectName}</span>
    </div>
    <div className="text-xs text-slate-500">
      <span>Date: {date}</span>
      <span className="ml-4">Page {pageNum} of {totalPages}</span>
    </div>
  </div>
);

// Page Footer Component
const PageFooter: React.FC<{ pageNum: number; totalPages: number }> = ({ pageNum, totalPages }) => (
  <div className="border-t border-slate-300 pt-2 mt-auto">
    <div className="flex justify-between text-xs text-slate-500">
      <span>Generated by AYN</span>
      <span>Page {pageNum} of {totalPages}</span>
    </div>
  </div>
);

// Station Data Table Component for a page
const StationTablePage: React.FC<{ 
  data: StationDataRow[]; 
  startIndex: number;
  isFirstPage?: boolean;
}> = ({ data, startIndex, isFirstPage = false }) => (
  <table className="w-full text-xs border-collapse">
    <thead>
      <tr className="bg-slate-100">
        <th className="border border-slate-300 px-2 py-1 text-left font-semibold w-12">#</th>
        <th className="border border-slate-300 px-2 py-1 text-left font-semibold">Station</th>
        <th className="border border-slate-300 px-2 py-1 text-right font-semibold">NGL (m)</th>
        <th className="border border-slate-300 px-2 py-1 text-right font-semibold">DL/FGL (m)</th>
        <th className="border border-slate-300 px-2 py-1 text-right font-semibold">Cut/Fill (m)</th>
      </tr>
    </thead>
    <tbody>
      {data.map((row, i) => (
        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
          <td className="border border-slate-300 px-2 py-1 text-slate-500 text-center">{startIndex + i + 1}</td>
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
);

export const GradingPDFReport = forwardRef<HTMLDivElement, GradingPDFReportProps>(
  ({ design, costBreakdown, totalCost, fglPoints, projectName }, ref) => {
    const stationData = useMemo(() => generateStationData(fglPoints, 10), [fglPoints]);
    const netVolumeLabel = design.netVolume > 0 ? 'Excess Cut' : 'Import Required';
    const date = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    // Calculate pagination
    const stationPages = useMemo(() => {
      const pages: StationDataRow[][] = [];
      for (let i = 0; i < stationData.length; i += ROWS_PER_PAGE) {
        pages.push(stationData.slice(i, i + ROWS_PER_PAGE));
      }
      return pages.length > 0 ? pages : [[]];
    }, [stationData]);

    // Total pages: 1 (summary) + 1 (site plan) + station table pages
    const totalPages = 2 + stationPages.length;

    return (
      <div ref={ref} style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Page 1: Summary, Charts, Site Plan */}
        <div
          className="bg-white text-black p-8 relative"
          style={{ width: '210mm', height: '297mm', boxSizing: 'border-box' }}
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
          <div className="mb-4">
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
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-800 border-b-2 border-slate-300 pb-1 mb-2">
              ELEVATION PROFILE
            </h2>
            <div className="border border-slate-200 rounded p-2">
              <ElevationProfileSVG points={fglPoints} />
            </div>
          </div>


          {/* Design Parameters */}
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-800 border-b-2 border-slate-300 pb-1 mb-2">
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
                <p className="text-xs text-slate-500 uppercase">Total Stations</p>
                <p className="font-semibold">{stationData.length}</p>
              </div>
            </div>
          </div>

          {/* Cost Breakdown (compact) */}
          {costBreakdown && (
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-800 border-b-2 border-slate-300 pb-1 mb-2">
                COST ESTIMATE (SAR)
              </h2>
              <div className="grid grid-cols-3 gap-x-4 text-sm">
                {Object.entries(costBreakdown).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-1 border-b border-slate-200">
                    <span className="capitalize text-slate-600 text-xs">{key.replace(/_/g, ' ')}</span>
                    <span className="font-medium text-xs">{value.toLocaleString()}</span>
                  </div>
                ))}
                <div className="col-span-3 flex justify-between py-2 border-t-2 border-slate-800 mt-1">
                  <span className="font-bold">Total Estimated Cost</span>
                  <span className="font-bold text-lg">{totalCost.toLocaleString()} SAR</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="absolute bottom-6 left-8 right-8">
            <PageFooter pageNum={1} totalPages={totalPages} />
          </div>
        </div>

        {/* Page 2: Full-page Site Plan */}
        <div
          className="bg-white text-black p-8 relative"
          style={{ width: '210mm', height: '297mm', boxSizing: 'border-box' }}
        >
          <PageHeader 
            projectName={projectName} 
            date={date} 
            pageNum={2} 
            totalPages={totalPages} 
          />
          
          <div className="flex flex-col items-center justify-center" style={{ height: 'calc(100% - 100px)' }}>
            <SitePlanFullPageSVG points={fglPoints} projectName={projectName} />
          </div>

          <div className="absolute bottom-6 left-8 right-8">
            <PageFooter pageNum={2} totalPages={totalPages} />
          </div>
        </div>

        {/* Station Data Table Pages */}
        {stationPages.map((pageData, pageIndex) => (
          <div
            key={`station-page-${pageIndex}`}
            className="bg-white text-black p-8 relative"
            style={{ 
              width: '210mm', 
              height: '297mm',
              boxSizing: 'border-box'
            }}
          >
            {/* Page Header */}
            <PageHeader 
              projectName={projectName} 
              date={date} 
              pageNum={pageIndex + 3} 
              totalPages={totalPages} 
            />

            {/* Section Title (only on first table page) */}
            {pageIndex === 0 && (
              <h2 className="text-lg font-bold text-slate-800 border-b-2 border-slate-300 pb-1 mb-3">
                STATION-BY-STATION DATA ({stationData.length} Stations)
              </h2>
            )}

            {/* Station Table */}
            <StationTablePage 
              data={pageData} 
              startIndex={pageIndex * ROWS_PER_PAGE}
              isFirstPage={pageIndex === 0}
            />

            {/* Summary row on last page */}
            {pageIndex === stationPages.length - 1 && (
              <div className="mt-4 p-3 bg-slate-100 rounded border border-slate-300">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Total Stations:</span>
                    <span className="font-bold ml-2">{stationData.length}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Total Cut:</span>
                    <span className="font-bold ml-2 text-red-600">{design.totalCutVolume?.toLocaleString()} m³</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Total Fill:</span>
                    <span className="font-bold ml-2 text-blue-600">{design.totalFillVolume?.toLocaleString()} m³</span>
                  </div>
                </div>
              </div>
            )}

            {/* Design Notes on last station page */}
            {pageIndex === stationPages.length - 1 && design.designNotes && design.designNotes.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-300 pb-1 mb-2">
                  NOTES
                </h3>
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
            <div className="absolute bottom-6 left-8 right-8">
              <PageFooter pageNum={pageIndex + 3} totalPages={totalPages} />
            </div>
          </div>
        ))}
      </div>
    );
  }
);

GradingPDFReport.displayName = 'GradingPDFReport';
