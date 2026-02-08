import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';
import type { ComplianceInput } from '../utils/complianceEngine';

interface Props {
  windows: ComplianceInput[];
  rooms: ComplianceInput[];
  onUpdate: (windows: ComplianceInput[]) => void;
  unitSystem: 'imperial' | 'metric';
}

export const WindowEntryStep: React.FC<Props> = ({ windows, rooms, onUpdate, unitSystem }) => {
  const areaUnit = unitSystem === 'imperial' ? 'sq ft' : 'm²';
  const dimUnit = unitSystem === 'imperial' ? 'in' : 'mm';

  const addWindow = () => {
    const defaultRoom = rooms[0]?.room_name || 'Room';
    const isBedroom = rooms[0]?.room_type === 'bedroom';
    onUpdate([...windows, {
      input_type: 'window',
      room_name: defaultRoom,
      window_opening_area: undefined,
      window_opening_width: undefined,
      window_opening_height: undefined,
      window_sill_height: undefined,
      window_glazing_area: undefined,
      window_is_egress: isBedroom,
      unit_system: unitSystem,
    }]);
  };

  const updateWindow = (index: number, updates: Partial<ComplianceInput>) => {
    const updated = [...windows];
    updated[index] = { ...updated[index], ...updates };
    onUpdate(updated);
  };

  const removeWindow = (index: number) => onUpdate(windows.filter((_, i) => i !== index));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Windows</h3>
          <p className="text-sm text-muted-foreground">Add windows for each room — bedrooms auto-flagged as egress</p>
        </div>
        <Button onClick={addWindow} size="sm" variant="outline" className="gap-1">
          <Plus className="w-4 h-4" /> Add Window
        </Button>
      </div>

      {windows.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
          No windows added yet.
        </div>
      )}

      <div className="space-y-4">
        {windows.map((win, i) => (
          <div key={i} className="p-4 rounded-xl border border-border/50 bg-card/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{win.room_name || 'Window'} — Window {i + 1}</span>
              <Button variant="ghost" size="icon" onClick={() => removeWindow(i)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Glazing Area ({areaUnit})</Label>
                <Input type="number" value={win.window_glazing_area ?? ''} onChange={e => updateWindow(i, { window_glazing_area: Number(e.target.value) || undefined })} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Openable Area ({areaUnit})</Label>
                <Input type="number" value={win.window_opening_area ?? ''} onChange={e => updateWindow(i, { window_opening_area: Number(e.target.value) || undefined })} className="h-9" />
              </div>
              <div className="col-span-2 md:col-span-1 flex items-center gap-2 pt-5">
                <Switch checked={win.window_is_egress || false} onCheckedChange={v => updateWindow(i, { window_is_egress: v })} />
                <Label className="text-xs">Egress Window</Label>
              </div>
            </div>

            {win.window_is_egress && (
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/30">
                <div className="space-y-1">
                  <Label className="text-xs">Opening Width ({dimUnit})</Label>
                  <Input type="number" value={win.window_opening_width ?? ''} onChange={e => updateWindow(i, { window_opening_width: Number(e.target.value) || undefined })} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Opening Height ({dimUnit})</Label>
                  <Input type="number" value={win.window_opening_height ?? ''} onChange={e => updateWindow(i, { window_opening_height: Number(e.target.value) || undefined })} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sill Height ({dimUnit})</Label>
                  <Input type="number" value={win.window_sill_height ?? ''} onChange={e => updateWindow(i, { window_sill_height: Number(e.target.value) || undefined })} className="h-9" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
