import React, { forwardRef } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react';

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

// Generate station data for PDF
function generateStationData(points: Point[], interval: number = 10) {
  if (points.length === 0) return [];

  const sortedPoints = [...points].sort((a, b) => a.x - b.x);
  const minX = sortedPoints[0].x;
  const maxX = sortedPoints[sortedPoints.length - 1].x;

  const data: Array<{
    station: string;
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
        ngl: Math.round(ngl * 1000) / 1000,
        fgl: Math.round(fgl * 1000) / 1000,
        cutFill: Math.round(cutFill * 1000) / 1000,
      });
    }
  }

  return data;
}

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
        <div className="border-b-4 border-slate-800 pb-4 mb-6">
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
        <div className="mb-6">
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

        {/* Design Parameters */}
        <div className="mb-6">
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
        <div className="mb-6">
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
              {stationData.slice(0, 30).map((row, i) => (
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
          {stationData.length > 30 && (
            <p className="text-xs text-slate-500 mt-1 italic">
              Showing first 30 of {stationData.length} stations. See digital data for complete list.
            </p>
          )}
        </div>

        {/* Cost Breakdown */}
        {costBreakdown && (
          <div className="mb-6">
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

        {/* Design Notes */}
        {design.designNotes && design.designNotes.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800 border-b-2 border-slate-300 pb-1 mb-3">
              DESIGN NOTES & RECOMMENDATIONS
            </h2>
            <ul className="text-sm space-y-1">
              {design.designNotes.map((note, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-slate-400">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
            
            {design.drainageRecommendations && (
              <div className="mt-3 pt-2 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-600 uppercase">Drainage:</p>
                <p className="text-sm">{design.drainageRecommendations}</p>
              </div>
            )}
            
            {design.compactionRequirements && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-slate-600 uppercase">Compaction:</p>
                <p className="text-sm">{design.compactionRequirements}</p>
              </div>
            )}
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
