import React from 'react';
import { Car, Accessibility, Zap, RotateCw } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useParkingSite } from '../context/ParkingSiteContext';

const PARKING_ANGLES = [
  { value: 90, label: '90° (Perpendicular)', efficiency: 'Highest capacity' },
  { value: 60, label: '60° (Angled)', efficiency: 'Good flow' },
  { value: 45, label: '45° (Angled)', efficiency: 'Easy entry' },
  { value: 30, label: '30° (Angled)', efficiency: 'One-way only' },
  { value: 0, label: '0° (Parallel)', efficiency: 'Street parking' },
];

export function ParkingConfigPanel() {
  const { config, setConfig } = useParkingSite();

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Car className="w-4 h-4" />
        Parking Configuration
      </h3>

      {/* Parking Angle */}
      <div>
        <Label>Parking Angle</Label>
        <Select
          value={String(config.parkingAngle)}
          onValueChange={(v) => setConfig({ parkingAngle: Number(v) })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PARKING_ANGLES.map((angle) => (
              <SelectItem key={angle.value} value={String(angle.value)}>
                <div className="flex items-center justify-between w-full">
                  <span>{angle.label}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {angle.efficiency}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Space Dimensions */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="spaceWidth">Space Width (m)</Label>
          <Input
            id="spaceWidth"
            type="number"
            step="0.1"
            min="2.0"
            max="4.0"
            value={config.spaceWidth}
            onChange={(e) => setConfig({ spaceWidth: parseFloat(e.target.value) || 2.5 })}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="spaceLength">Space Length (m)</Label>
          <Input
            id="spaceLength"
            type="number"
            step="0.1"
            min="4.0"
            max="7.0"
            value={config.spaceLength}
            onChange={(e) => setConfig({ spaceLength: parseFloat(e.target.value) || 5.0 })}
            className="mt-1"
          />
        </div>
      </div>

      {/* Aisle Width */}
      <div>
        <Label htmlFor="aisleWidth">Aisle Width (m)</Label>
        <Input
          id="aisleWidth"
          type="number"
          step="0.5"
          min="3.0"
          max="10.0"
          value={config.aisleWidth}
          onChange={(e) => setConfig({ aisleWidth: parseFloat(e.target.value) || 6.0 })}
          className="mt-1"
        />
      </div>

      {/* Special Spaces */}
      <div className="pt-2 border-t space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Accessibility className="w-4 h-4" />
          Special Spaces
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="accessiblePercent" className="text-xs">Accessible (%)</Label>
            <Input
              id="accessiblePercent"
              type="number"
              min="2"
              max="20"
              value={config.accessiblePercent}
              onChange={(e) => setConfig({ accessiblePercent: parseFloat(e.target.value) || 2 })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="evPercent" className="text-xs flex items-center gap-1">
              <Zap className="w-3 h-3" /> EV Charging (%)
            </Label>
            <Input
              id="evPercent"
              type="number"
              min="0"
              max="50"
              value={config.evPercent}
              onChange={(e) => setConfig({ evPercent: parseFloat(e.target.value) || 5 })}
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
