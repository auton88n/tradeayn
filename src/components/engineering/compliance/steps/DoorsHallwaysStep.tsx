import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';
import type { ComplianceInput } from '../utils/complianceEngine';

interface Props {
  doors: ComplianceInput[];
  onUpdate: (doors: ComplianceInput[]) => void;
  unitSystem: 'imperial' | 'metric';
}

export const DoorsHallwaysStep: React.FC<Props> = ({ doors, onUpdate, unitSystem }) => {
  const dimUnit = unitSystem === 'imperial' ? 'in' : 'mm';
  const heightUnit = unitSystem === 'imperial' ? 'ft' : 'm';

  const addDoor = (type: 'door' | 'hallway') => {
    onUpdate([...doors, {
      input_type: type,
      room_name: type === 'hallway' ? 'Hallway' : `Door ${doors.filter(d => d.input_type === 'door').length + 1}`,
      door_width: undefined,
      door_height: undefined,
      door_is_egress: type === 'door',
      unit_system: unitSystem,
    }]);
  };

  const updateDoor = (index: number, updates: Partial<ComplianceInput>) => {
    const updated = [...doors];
    updated[index] = { ...updated[index], ...updates };
    onUpdate(updated);
  };

  const removeDoor = (index: number) => onUpdate(doors.filter((_, i) => i !== index));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Doors & Hallways</h3>
          <p className="text-sm text-muted-foreground">Add egress doors and hallway widths</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => addDoor('door')} size="sm" variant="outline" className="gap-1">
            <Plus className="w-4 h-4" /> Door
          </Button>
          <Button onClick={() => addDoor('hallway')} size="sm" variant="outline" className="gap-1">
            <Plus className="w-4 h-4" /> Hallway
          </Button>
        </div>
      </div>

      {doors.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
          Add doors and hallways to check.
        </div>
      )}

      <div className="space-y-3">
        {doors.map((d, i) => (
          <div key={i} className="p-4 rounded-xl border border-border/50 bg-card/50">
            <div className="flex items-center justify-between mb-3">
              <Input value={d.room_name || ''} onChange={e => updateDoor(i, { room_name: e.target.value })} className="max-w-[200px] font-medium h-8" />
              <Button variant="ghost" size="icon" onClick={() => removeDoor(i)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Width ({d.input_type === 'hallway' ? dimUnit : dimUnit})</Label>
                <Input type="number" value={d.door_width ?? ''} onChange={e => updateDoor(i, { door_width: Number(e.target.value) || undefined })} className="h-9" />
              </div>
              {d.input_type === 'door' && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">Height ({heightUnit})</Label>
                    <Input type="number" value={d.door_height ?? ''} onChange={e => updateDoor(i, { door_height: Number(e.target.value) || undefined })} className="h-9" />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <Switch checked={d.door_is_egress || false} onCheckedChange={v => updateDoor(i, { door_is_egress: v })} />
                    <Label className="text-xs">Egress</Label>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
