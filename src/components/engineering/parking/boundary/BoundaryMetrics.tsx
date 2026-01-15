import React from 'react';
import { CheckCircle, AlertTriangle, Info, MapPin, Ruler, Box } from 'lucide-react';
import { useParkingSite } from '../context/ParkingSiteContext';
import { calculateBoundaryMetrics, roundTo } from '../utils/geometry';
import { Badge } from '@/components/ui/badge';

export function BoundaryMetrics() {
  const { boundaryPoints } = useParkingSite();
  const metrics = calculateBoundaryMetrics(boundaryPoints);

  const formatArea = (area: number): string => {
    if (area >= 10000) {
      return `${roundTo(area / 10000, 2)} ha`;
    }
    return `${roundTo(area, 1)} m²`;
  };

  const formatPerimeter = (perimeter: number): string => {
    if (perimeter >= 1000) {
      return `${roundTo(perimeter / 1000, 2)} km`;
    }
    return `${roundTo(perimeter, 1)} m`;
  };

  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-center justify-between">
        {/* Metrics Grid */}
        <div className="flex gap-6">
          {/* Points */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Points</p>
              <p className="font-semibold">{metrics.pointCount}</p>
            </div>
          </div>

          {/* Area */}
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Area</p>
              <p className="font-semibold">
                {metrics.pointCount >= 3 ? formatArea(metrics.area) : '—'}
              </p>
            </div>
          </div>

          {/* Perimeter */}
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Perimeter</p>
              <p className="font-semibold">
                {metrics.pointCount >= 2 ? formatPerimeter(metrics.perimeter) : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Validation Status */}
        <div>
          {metrics.pointCount < 3 ? (
            <Badge variant="secondary" className="gap-1">
              <Info className="w-3 h-3" />
              Need 3+ points
            </Badge>
          ) : metrics.isValid ? (
            <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-3 h-3" />
              Valid Polygon
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="w-3 h-3" />
              {metrics.validationError || 'Invalid'}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
