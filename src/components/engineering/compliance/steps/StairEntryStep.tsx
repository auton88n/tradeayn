import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { ComplianceInput } from '../utils/complianceEngine';

interface Props {
  stair: ComplianceInput;
  onUpdate: (stair: ComplianceInput) => void;
  unitSystem: 'imperial' | 'metric';
}

export const StairEntryStep: React.FC<Props> = ({ stair, onUpdate, unitSystem }) => {
  const dimUnit = unitSystem === 'imperial' ? 'in' : 'mm';
  const heightUnit = unitSystem === 'imperial' ? 'ft' : 'm';

  const update = (field: string, value: any) => onUpdate({ ...stair, [field]: value });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Stairs</h3>
        <p className="text-sm text-muted-foreground">Enter stair measurements for each flight</p>
      </div>

      <div className="p-4 rounded-xl border border-border/50 bg-card/50 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Stair Width ({dimUnit})</Label>
            <Input type="number" value={stair.stair_width ?? ''} onChange={e => update('stair_width', Number(e.target.value) || undefined)} className="h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Riser Height ({dimUnit})</Label>
            <Input type="number" value={stair.stair_riser_height ?? ''} onChange={e => update('stair_riser_height', Number(e.target.value) || undefined)} className="h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tread Depth ({dimUnit})</Label>
            <Input type="number" value={stair.stair_tread_depth ?? ''} onChange={e => update('stair_tread_depth', Number(e.target.value) || undefined)} className="h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Headroom ({heightUnit})</Label>
            <Input type="number" value={stair.stair_headroom ?? ''} onChange={e => update('stair_headroom', Number(e.target.value) || undefined)} className="h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Number of Risers</Label>
            <Input type="number" value={stair.stair_num_risers ?? ''} onChange={e => update('stair_num_risers', Number(e.target.value) || undefined)} className="h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Flight Height ({heightUnit})</Label>
            <Input type="number" value={stair.stair_flight_height ?? ''} onChange={e => update('stair_flight_height', Number(e.target.value) || undefined)} className="h-9" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
            <Label className="text-xs">Handrail Installed</Label>
            <Switch checked={stair.stair_has_handrail || false} onCheckedChange={v => update('stair_has_handrail', v)} />
          </div>
          {stair.stair_has_handrail && (
            <div className="space-y-1">
              <Label className="text-xs">Handrail Height ({dimUnit})</Label>
              <Input type="number" value={stair.stair_handrail_height ?? ''} onChange={e => update('stair_handrail_height', Number(e.target.value) || undefined)} className="h-9" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
            <Label className="text-xs">Landing Present</Label>
            <Switch checked={stair.stair_has_landing || false} onCheckedChange={v => update('stair_has_landing', v)} />
          </div>
          {stair.stair_has_landing && (
            <div className="space-y-1">
              <Label className="text-xs">Landing Length ({dimUnit})</Label>
              <Input type="number" value={stair.stair_landing_length ?? ''} onChange={e => update('stair_landing_length', Number(e.target.value) || undefined)} className="h-9" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
