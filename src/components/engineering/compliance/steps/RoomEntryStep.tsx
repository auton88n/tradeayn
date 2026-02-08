import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';
import type { ComplianceInput } from '../utils/complianceEngine';

interface Props {
  rooms: ComplianceInput[];
  onUpdate: (rooms: ComplianceInput[]) => void;
  unitSystem: 'imperial' | 'metric';
}

const ROOM_TYPES = [
  { value: 'bedroom', label: 'Bedroom' },
  { value: 'living_room', label: 'Living Room' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'hallway', label: 'Hallway' },
  { value: 'basement', label: 'Basement' },
];

export const RoomEntryStep: React.FC<Props> = ({ rooms, onUpdate, unitSystem }) => {
  const areaUnit = unitSystem === 'imperial' ? 'sq ft' : 'm²';
  const dimUnit = unitSystem === 'imperial' ? 'ft' : 'm';
  const heightUnit = unitSystem === 'imperial' ? 'ft' : 'm';

  const addRoom = () => {
    onUpdate([...rooms, {
      input_type: 'room',
      room_name: `Room ${rooms.length + 1}`,
      room_type: 'bedroom',
      room_area: undefined,
      room_min_dimension: undefined,
      ceiling_height: undefined,
      has_sloped_ceiling: false,
      sloped_area_above_min_pct: undefined,
      unit_system: unitSystem,
    }]);
  };

  const updateRoom = (index: number, updates: Partial<ComplianceInput>) => {
    const updated = [...rooms];
    updated[index] = { ...updated[index], ...updates };
    onUpdate(updated);
  };

  const removeRoom = (index: number) => {
    onUpdate(rooms.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Rooms</h3>
          <p className="text-sm text-muted-foreground">Add each room with dimensions</p>
        </div>
        <Button onClick={addRoom} size="sm" variant="outline" className="gap-1">
          <Plus className="w-4 h-4" /> Add Room
        </Button>
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
          No rooms added. Click "Add Room" to start.
        </div>
      )}

      <div className="space-y-4">
        {rooms.map((room, i) => (
          <div key={i} className="p-4 rounded-xl border border-border/50 bg-card/50 space-y-4">
            <div className="flex items-center justify-between">
              <Input
                value={room.room_name || ''}
                onChange={e => updateRoom(i, { room_name: e.target.value })}
                className="max-w-[200px] font-medium"
                placeholder="Room name"
              />
              <Button variant="ghost" size="icon" onClick={() => removeRoom(i)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={room.room_type || 'bedroom'} onValueChange={v => updateRoom(i, { room_type: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{ROOM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Area ({areaUnit})</Label>
                <Input type="number" value={room.room_area ?? ''} onChange={e => updateRoom(i, { room_area: Number(e.target.value) || undefined })} placeholder="0" className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Shortest Wall ({dimUnit})</Label>
                <Input type="number" value={room.room_min_dimension ?? ''} onChange={e => updateRoom(i, { room_min_dimension: Number(e.target.value) || undefined })} placeholder="0" className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ceiling Height ({heightUnit})</Label>
                <Input type="number" value={room.ceiling_height ?? ''} onChange={e => updateRoom(i, { ceiling_height: Number(e.target.value) || undefined })} placeholder="0" className="h-9" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={room.has_sloped_ceiling || false} onCheckedChange={v => updateRoom(i, { has_sloped_ceiling: v })} />
                <Label className="text-xs">Sloped Ceiling</Label>
              </div>
              {room.has_sloped_ceiling && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs whitespace-nowrap">% above min height</Label>
                  <Input type="number" value={room.sloped_area_above_min_pct ?? ''} onChange={e => updateRoom(i, { sloped_area_above_min_pct: Number(e.target.value) || undefined })} className="h-8 w-20" placeholder="50" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
