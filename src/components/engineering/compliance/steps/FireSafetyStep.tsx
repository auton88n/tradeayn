import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface FireSafetyData {
  garageWallSeparation: boolean;
  garageCeilingSeparation: boolean;
  garageClosingDoor: boolean;
  smokeAlarmBedrooms: boolean;
  smokeAlarmHallway: boolean;
  smokeAlarmEveryStorey: boolean;
  smokeAlarmHardwired: boolean;
  coAlarmSleeping: boolean;
  coAlarmEveryStorey: boolean;
  radonStack: boolean;
}

interface Props {
  data: FireSafetyData;
  onUpdate: (data: FireSafetyData) => void;
  hasGarage: boolean;
  hasFuelBurning: boolean;
  isCanada: boolean;
}

export const FireSafetyStep: React.FC<Props> = ({ data, onUpdate, hasGarage, hasFuelBurning, isCanada }) => {
  const update = (field: keyof FireSafetyData, value: boolean) => onUpdate({ ...data, [field]: value });

  const Toggle = ({ field, label }: { field: keyof FireSafetyData; label: string }) => (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50">
      <Label className="cursor-pointer text-sm">{label}</Label>
      <Switch checked={data[field]} onCheckedChange={v => update(field, v)} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Fire Safety & Alarms</h3>
        <p className="text-sm text-muted-foreground">Confirm fire safety measures installed</p>
      </div>

      {hasGarage && (
        <div className="space-y-3">
          <Label className="text-base font-medium">Garage Separation</Label>
          <div className="space-y-2">
            <Toggle field="garageWallSeparation" label={isCanada ? 'Garage wall 45-min fire resistance' : 'Garage wall ½ in gypsum on garage side'} />
            <Toggle field="garageCeilingSeparation" label={isCanada ? 'Garage ceiling fire rated' : 'Garage ceiling ⅝ in Type X gypsum (if room above)'} />
            <Toggle field="garageClosingDoor" label="Self-closing door between garage and dwelling" />
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Label className="text-base font-medium">Smoke Alarms</Label>
        <div className="space-y-2">
          <Toggle field="smokeAlarmBedrooms" label="Smoke alarm inside each bedroom" />
          <Toggle field="smokeAlarmHallway" label={isCanada ? 'Smoke alarm within 5 m of each bedroom' : 'Smoke alarm outside each sleeping area'} />
          <Toggle field="smokeAlarmEveryStorey" label="Smoke alarm on each storey (incl. basement)" />
          <Toggle field="smokeAlarmHardwired" label={isCanada ? 'Hardwired + battery (or 10-yr sealed)' : 'Hardwired with battery backup'} />
        </div>
      </div>

      {(hasFuelBurning || hasGarage) && (
        <div className="space-y-3">
          <Label className="text-base font-medium">CO Alarms</Label>
          <div className="space-y-2">
            <Toggle field="coAlarmSleeping" label={isCanada ? 'CO alarm adjacent to sleeping area' : 'CO alarm outside each sleeping area'} />
            <Toggle field="coAlarmEveryStorey" label="CO alarm on each storey" />
          </div>
        </div>
      )}

      {isCanada && (
        <div className="space-y-3">
          <Label className="text-base font-medium">Radon Protection (NBC 2025)</Label>
          <Toggle field="radonStack" label="Passive radon stack installed (sub-slab to above roof)" />
        </div>
      )}
    </div>
  );
};
